import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { SERVICES, primaryService, servicesForPhase, type ServiceType } from '@havre/core';
import {
  getMessages, interpolate, localeFromSegment, LOCALES, segmentFor, serviceSlug,
  type Locale, type Messages,
} from '@havre/i18n';
import {
  VerificationBadge, VerificationExplainer, ShieldIcon,
} from '@/components/VerificationBadge';
import { Avatar } from '@/components/Avatar';
import { SitterGallery } from '@/components/SitterGallery';
import { FavouriteScope, FavouriteHeart } from '@/components/FavouriteScope';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { RatingBreakdown } from '@/components/RatingBreakdown';
import { ServiceIcon } from '@/components/ServiceIcon';
import { HomeIcon, type HomeIconName } from '@/components/HomeIcon';
import { getCalendar, getSitterProfile, getSitterSlugsForBuild, type SitterProfile } from '@/lib/data';
import { sitterJsonLd, urlFor } from '@/lib/seo';
import { money, responseTime, dateFmt, numberFmt } from '@/lib/format';
import { resolvePhoto } from '@/lib/photos';

/*
  BU FAZDA REZERVASYONU ACIK HIZMETLER.
  Rezervasyon ekraniyla (book/page.tsx) AYNI kaynak: profil, formun
  reddettigi bir hizmeti fiyatiyla gostermesin.
*/
const V1_SERVICES = new Set(servicesForPhase('v1'));

/**
 * BAKICI PROFIL SAYFASI.
 *
 * ISR: fiyat, musaitlik ve yorumlar degisiyor; her saat tazeleniyor.
 * Tier-1 sehirlerin ust siradaki bakicilari build'de uretiliyor, geri kalani
 * talep uzerine — 144 bakicinin hepsini build'de uretmek bugun mumkun ama
 * bakici sayisi buyudugunde deploy suresini patlatirdi.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await getSitterSlugsForBuild();
  return rows.flatMap((r) => [
    { locale: 'en', city: r.citySlugEn, slug: r.slug },
    { locale: 'fr', city: r.citySlugFr, slug: r.slug },
  ]);
}

async function resolve(params: Promise<{ locale: string; city: string; slug: string }>) {
  const { locale: seg, city, slug } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return null;
  const sitter = await getSitterProfile(slug, locale);
  if (!sitter) return null;

  /*
    SEHIR SEGMENTI DOGRULANIYOR.
    /en/montreal/sitter/camille-b-7f3a adresi, Camille Toronto'daysa
    404 donmeli. Aksi halde ayni profil her sehrin altinda acilir ve
    yinelenen icerik uretiriz.
  */
  const expected = locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn;
  if (city !== expected) return null;

  return { locale, sitter };
}

function cityName(s: SitterProfile, locale: Locale): string {
  return locale === 'fr-CA' ? s.cityNameFr : s.cityNameEn;
}
function hoodName(s: SitterProfile, locale: Locale): string {
  return locale === 'fr-CA' ? s.neighbourhoodFr : s.neighbourhoodEn;
}
function profileUrl(s: SitterProfile, locale: Locale): string {
  const city = locale === 'fr-CA' ? s.citySlugFr : s.citySlugEn;
  return urlFor(locale, city, 'sitter', s.slug);
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; city: string; slug: string }> },
): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return {};
  const { locale, sitter } = found;
  const m = getMessages(locale);

  const name = `${sitter.firstName} ${sitter.lastNameInitial}.`;
  const where = [hoodName(sitter, locale), cityName(sitter, locale)].filter(Boolean).join(', ');
  /*
    YALNIZCA BOOKABLE HIZMETLER.
    Profil, rezervasyon ekraninin kabul etmedigi bir hizmeti fiyatiyla
    gosteriyordu (day_care v1.5'te): sahip fiyati goruyor, tikliyor ve
    listede bulamiyordu. Iki ekran ayni kaynaktan beslenmeli.
  */
  const bookable = sitter.services.filter((s) => V1_SERVICES.has(s.serviceType));
  const services = bookable.map((s) => m.service[s.serviceType]).join(' · ');

  return {
    title: `${name} — ${where}`,
    description: sitter.bio?.slice(0, 155) ?? `${services} — ${where}.`,
    alternates: {
      canonical: profileUrl(sitter, locale),
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, profileUrl(sitter, l)])),
        'x-default': profileUrl(sitter, 'en-CA'),
      },
    },
    openGraph: { title: `${name} — ${where}`, url: profileUrl(sitter, locale), type: 'profile' },
  };
}

export default async function SitterPage({
  params,
}: {
  params: Promise<{ locale: string; city: string; slug: string }>;
}) {
  const found = await resolve(params);
  if (!found) notFound();
  const { locale, sitter } = found;

  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const name = `${sitter.firstName} ${sitter.lastNameInitial}.`;
  const where = [hoodName(sitter, locale), cityName(sitter, locale)].filter(Boolean).join(', ');
  const bookable = sitter.services.filter((s) => V1_SERVICES.has(s.serviceType));
  /*
    VITRIN HIZMETI — "en ucuz" DEGIL.

    Eskiden bookable[0] (fiyata gore siralanmis listenin ilki) aliniyordu:
    liste sayfasinda "konaklama 62 $" gorup profile giren kisi 31 $
    (gezdirme) goruyordu. Simdi hizmet agirligina gore belirlenimci
    secim yapiliyor ve fiyatin YANINDA hangi hizmet oldugu yaziyor.
  */
  const primary = primaryService(bookable);

  /*
    TAKVIM: bugunden itibaren iki ay. Profil ISR ile uretildigi icin bu
    veri en fazla bir saat eski olabilir — bilincli, ekranda yaziyor ve
    istek gonderilirken sunucu araligi zaten yeniden dogruluyor.
  */
  const calFrom = new Date();
  const calTo = new Date(calFrom.getFullYear(), calFrom.getMonth() + 2, 0);
  const isoDay = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const calendarDays = await getCalendar(sitter.userId, isoDay(calFrom), isoDay(calTo));
  const citySlug = locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn;
  /** Rezervasyon adresi — hizmet verildiyse form o hizmetle aciliyor. */
  const bookHref = (svc?: ServiceType) =>
    `/${seg}/${citySlug}/sitter/${sitter.slug}/book/`
    + (svc ? `?service=${serviceSlug(svc, locale)}` : '');
  const askUrl = `/${seg}/${citySlug}/sitter/${sitter.slug}/ask/`;

  /*
    EV MADDELERI — TEK LISTE, HER BIRI KENDI IKONUYLA.

    Once ikiye bolunmustu: solda bizim kaydettigimiz olgular, sagda
    bakicinin kurallari. Ayirmanin sebebi onay isaretiydi — "hayvanlar
    yatakta yatmaz" cumlesinin yanindaki yesil tik bunu bir BASARI gibi
    okutuyordu. Her maddenin kendi resmi olunca o sorun ortadan kalkti
    ve iki ayri baslik gereksiz hale geldi: liste artik tek blok, iki
    sutuna AKIYOR (CSS kolonu), yani okuma sirasi bozulmuyor.

    UC DURUMLU ALANLAR: yalnizca CEVAPLANANLAR listeye giriyor.
    Cevaplanmamis bir soruyu "hayir" diye cizmek, bakicinin vermedigi
    bir sozu onun agzindan soylemek olurdu.
  */
  type HomeFact = { icon: HomeIconName; slashed?: boolean; text: string };
  const homeFacts: HomeFact[] = ([
    sitter.homeType && {
      icon: sitter.homeType as HomeIconName,
      text: m.onboarding[`home.${sitter.homeType}` as keyof Messages['onboarding']] as string,
    },
    sitter.hasYard && (sitter.yardFenced
      ? { icon: 'fence' as const, text: m.sitter['home.yardFenced'] }
      : { icon: 'tree' as const, text: m.sitter['home.yard'] }),
    /*
      EVDEKI HAYVAN — UC DURUM, IKI DEGIL.
      "Hayvanim var" deyip fotograf koymamis bakicida bu satir HIC
      cikmiyor: "hayvan yok" demiyoruz (yanlis olur), "hayvan var" da
      demiyoruz (dogrulanmamis).
    */
    !sitter.hasOwnPets && { icon: 'paw' as const, slashed: true, text: m.sitter['home.noOwnPets'] },
    sitter.showsOwnPets && { icon: 'paw' as const, text: m.sitter['home.ownPets'] },
    sitter.smokeFree && { icon: 'noSmoking' as const, text: m.sitter['home.smokeFree'] },
    {
      icon: 'pets' as const,
      text: sitter.maxConcurrentPets === 1
        ? m.sitter['home.maxPetsOne']
        : interpolate(m.sitter['home.maxPets'], { count: sitter.maxConcurrentPets }),
    },
    sitter.hasChildren !== null && {
      icon: 'person' as const,
      slashed: !sitter.hasChildren,
      text: sitter.hasChildren ? m.sitter['home.children'] : m.sitter['home.noChildren'],
    },
    sitter.petsOnBed !== null && {
      icon: 'bed' as const,
      slashed: !sitter.petsOnBed,
      text: sitter.petsOnBed ? m.sitter['home.petsOnBed'] : m.sitter['home.petsOffBed'],
    },
    sitter.petsOnFurniture !== null && {
      icon: 'sofa' as const,
      slashed: !sitter.petsOnFurniture,
      text: sitter.petsOnFurniture ? m.sitter['home.petsOnFurniture'] : m.sitter['home.petsOffFurniture'],
    },
    sitter.pottyBreakHours !== null && {
      icon: 'clock' as const,
      text: interpolate(m.sitter['home.pottyBreak'], { hours: sitter.pottyBreakHours }),
    },
  ] as Array<HomeFact | false | '' | null>).filter((x): x is HomeFact => Boolean(x));

  return (
    <>
      {/*
        KIMLIK BLOGU RENKLI BANTTA — ana sayfa ve sehir sayfasiyla ayni dil.
        Bant, "bu bir kisinin sayfasi" bilgisini sayfanin geri kalanindan
        (hizmetler, yorumlar) gorsel olarak ayiriyor.
      */}
      <section className="band band-blush band-round-b">
        <div className="container" style={{ paddingBlock: 'var(--space-6) var(--space-10)' }}>
          <Link href={`/${seg}/${locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn}/${serviceSlug('boarding', locale)}/`}
            className="text-body-sm muted">
            ← {interpolate(m.sitter.backToCity, { city: cityName(sitter, locale) })}
          </Link>

          <header className="sitter-head" style={{ marginTop: 'var(--space-6)' }}>
            {/* Fotograf varsa fotograf, yoksa bas harfler */}
            <Avatar src={sitter.avatarUrl} initials={sitter.photoInitials} size={92} className="sitter-avatar" />
            <div style={{ minWidth: 0 }}>
              <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
                <h1 className="text-h1" style={{ margin: 0 }}>{name}</h1>
                {/* Kalp basligin YANINDA: karar burada veriliyor. */}
                <FavouriteScope ids={[sitter.userId]} locale={locale} path={`/${seg}/favourites/`}>
                  <FavouriteHeart sitterId={sitter.userId} />
                </FavouriteScope>
              </div>
              <p className="muted" style={{ marginTop: 'var(--space-1)' }}>{where}</p>
              <div className="row" style={{ marginTop: 'var(--space-3)' }}>
                <VerificationBadge level={sitter.badgeLevel} locale={locale} />
                {sitter.reviewCount > 0 && (
                  <span className="text-body-sm tabular">
                    ★ {sitter.averageRating.toFixed(1)}{' '}
                    <span className="dim">({numberFmt(sitter.reviewCount, locale)})</span>
                  </span>
                )}
              </div>
            </div>
          </header>

          {/*
            Canli istatistikler — sayfanin benzersizligini tasiyan veri (§7.7).
            Etiketler AYRI anahtarlar: cumlelerden degeri cikarip kalanini
            etiket diye kullanmak ("Replies in about") Ingilizce'de yarim
            cumle, Fransizca'da ise dogrudan yanlis uretiyordu.
          */}
          <ul className="sitter-stats sitter-stats-on-band" style={{ marginTop: 'var(--space-8)' }}>
            <Stat value={numberFmt(sitter.completedBookings, locale)} label={m.sitter['stat.completed']} />
            <Stat value={numberFmt(sitter.repeatClients, locale)} label={m.sitter['stat.repeat']} />
            <Stat value={responseTime(sitter.medianResponseMinutes, locale)} label={m.sitter['stat.responds']} />
            <Stat value={`${Math.round(sitter.acceptanceRate * 100)}%`} label={m.sitter['stat.acceptance']} />
            {/*
              YANIT ORANI kabul oranindan AYRI bir sey: burada ret de
              cevaptir. "Bana doner mi" ile "beni kabul eder mi" iki
              ayri soru ve ikisi de sahibin sordugu sorular.
              Hic cevaplanabilir istek yoksa satir HIC cizilmiyor —
              "%0" yanlis olurdu.
            */}
            {sitter.responseRate !== null && (
              <Stat
                value={`${Math.round(sitter.responseRate * 100)}%`}
                label={m.sitter['stat.responseRate']}
              />
            )}
          </ul>
        </div>
      </section>

      <section className="container sitter-page has-book-bar">
        <div className="sitter-main">
          {/* Ev fotograflari — sahiplerin ilk sorusu "kopegim nerede kalacak" */}
          <SitterGallery locale={locale} photos={sitter.photos} name={sitter.firstName} />

          {sitter.bio && (
            <section className="card card-pad sitter-block">
              <h2 className="text-h2">{interpolate(m.sitter.aboutHeading, { name: sitter.firstName })}</h2>
              <p className="text-body-lg own-words-body" style={{ maxWidth: '40rem' }}>
                {sitter.bio}
              </p>
              <p className="field-hint">{m.sitter.privacyNote}</p>
            </section>
          )}

          {/*
            GUNLUK DUZEN — BAKICININ KENDI CUMLELERI.

            Sahibin "kopegim gun boyu yalniz mi kalacak" sorusu, bugune
            kadar mesajla soruluyordu. Rakipte (Rover) bu iki blok
            profilin en cok okunan yeri; bizde hic yoktu.

            DOGRULANMAMIS oldugu BIR KEZ, blogun basinda yaziyor —
            her paragrafin altina tekrar koymak uyariyi gorunmez yapar.
            Blok bos ise HIC cizilmiyor: bos baslik, doldurulmamis bir
            profili doldurulmus gibi gosterir.
          */}
          {(sitter.scheduleText || sitter.typicalDayText) && (
            <section className="card card-pad sitter-block">
              <h2 className="text-h2">
                {interpolate(m.sitter.routineHeading, { name: sitter.firstName })}
              </h2>
              <p className="field-hint own-words-note">
                {interpolate(m.sitter.ownWordsNote, { name: sitter.firstName })}
              </p>
              <div className="own-words-grid">
                {sitter.scheduleText && (
                  <div>
                    <h3 className="text-h4">{m.sitter.scheduleHeading}</h3>
                    <p className="own-words-body">{sitter.scheduleText}</p>
                  </div>
                )}
                {sitter.typicalDayText && (
                  <div>
                    <h3 className="text-h4">
                      {interpolate(m.sitter.typicalDayHeading, { name: sitter.firstName })}
                    </h3>
                    <p className="own-words-body">{sitter.typicalDayText}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* --- Hizmetler ve fiyatlar --- */}
          <section>
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-5)' }}>
              {interpolate(m.sitter.servicesHeading, { name: sitter.firstName })}
            </h2>
            <div className="grid" style={{ gap: 'var(--space-3)' }}>
              {bookable.map((s) => (
                <article key={s.serviceType} className="card card-pad sitter-service">
                  <div>
                    <h3 className="text-h4">{m.service[s.serviceType]}</h3>
                    <p className="text-body-sm muted" style={{ marginTop: 'var(--space-1)' }}>
                      {m.serviceDescription[s.serviceType]}
                    </p>
                    <div className="row" style={{ marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
                      {s.acceptsDogs && <span className="badge badge-outline">{m.onboarding['services.dogs']}</span>}
                      {s.acceptsCats && <span className="badge badge-outline">{m.onboarding['services.cats']}</span>}
                      {s.acceptsOther && <span className="badge badge-outline">{m.onboarding['services.other']}</span>}
                      <span className="badge badge-outline tabular">
                        {interpolate(m.sitter.sizeRange, {
                          min: Math.round(s.acceptedSizeMinKg),
                          max: Math.round(s.acceptedSizeMaxKg),
                        })}
                      </span>
                    </div>
                    {/*
                      IPTAL POLITIKASI SOZLESME KURULMADAN ONCE tam gosteriliyor
                      (Ontario/Quebec tuketici koruma mevzuati).
                    */}
                    {/*
                      EK UCRETLER ILANDA YAZIYOR.

                      Ikisi de KOSULLU ucret: herkes odemiyor, o yuzden
                      bas fiyata giremezler. Ama sahip bunlari rezervasyon
                      ekraninda ilk kez gormemeli — drip pricing'i
                      yasaklayan kuralin (Competition Act §8.6) ruhu bu.
                      Ucret YOKSA satir da yok: "0 $ ek hayvan" yazmak
                      gurultu.
                    */}
                    {(s.extraPetPriceCents > 0 || s.holidaySurchargePct > 0) && (
                      <p className="text-body-sm dim" style={{ marginTop: 'var(--space-3)' }}>
                        {[
                          s.extraPetPriceCents > 0 && interpolate(m.sitter.extraPetLine, {
                            amount: money(s.extraPetPriceCents, locale),
                            unit: m.unit[SERVICES[s.serviceType].unit],
                          }),
                          s.holidaySurchargePct > 0 && interpolate(m.sitter.holidayLine, {
                            pct: s.holidaySurchargePct,
                          }),
                        ].filter(Boolean).join(' · ')}
                      </p>
                    )}

                    <p className="text-body-sm dim" style={{ marginTop: 'var(--space-3)' }}>
                      {m.sitter.cancellationLabel}:{' '}
                      {m.onboarding[`cancellation.${s.cancellationPolicy}` as keyof Messages['onboarding']] as string}
                    </p>
                  </div>

                  {/* Drip pricing yasagi: gosterilen rakam bakicinin ucreti,
                      toplam ucret rezervasyon ekraninda kalem kalem acilir. */}
                  <div className="sitter-price">
                    <span className="text-h3 tabular">{money(s.priceCents, locale)}</span>
                    <span className="dim text-body-sm">/ {m.unit[SERVICES[s.serviceType].unit]}</span>
                    {/*
                      HER HIZMETIN KENDI REZERVASYON BAGLANTISI.

                      Tek bir "Rezervasyon iste" dugmesi varken form hep
                      ayni hizmetle aciliyordu; konaklama arayan kisi
                      gezdirme formunu buluyordu. Buradan gelince form
                      DOGRU hizmetle aciliyor.
                    */}
                    <Link
                      href={bookHref(s.serviceType)}
                      className="btn btn-secondary btn-sm"
                      aria-label={interpolate(m.sitter.bookServiceAria, {
                        service: m.service[s.serviceType], name: sitter.firstName,
                      })}
                    >
                      {m.sitter.bookCta}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* --- Ev, kurallar, guvenlik --- */}
          <section className="card card-pad sitter-block">
            <h2 className="text-h2">{m.sitter.homeHeading}</h2>

            <ul className="home-facts">
              {homeFacts.map((f) => (
                <li key={f.text}>
                  <HomeIcon name={f.icon} slashed={f.slashed ?? false} />
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>

            {/* Guvenlik — bakicinin kendi cumlesi, oyle etiketli */}
            {sitter.safetyText && (
              <div className="own-words-inset">
                <h3 className="text-h4">{m.sitter.safetyHeading}</h3>
                <p className="own-words-body">{sitter.safetyText}</p>
                <p className="field-hint">
                  {interpolate(m.sitter.ownWordsNote, { name: sitter.firstName })}
                </p>
              </div>
            )}

            {/*
              BAKICININ KENDI HAYVANLARI.

              Sahip icin bu bir yan detay degil: hayvanini baska bir
              hayvanla ayni eve koyuyor. Sayi degil YUZ gorsun — "bir
              kopegi var" cumlesi, kopegin fotografiyla ayni sey degil.
            */}
            {sitter.petPhotos.length > 0 && (
              <div className="pet-photos">
                <h3 className="text-h4">{m.sitter.ownPetsHeading}</h3>
                <p className="muted text-body-sm" style={{ marginTop: 'var(--space-2)' }}>
                  {m.sitter.ownPetsLead}
                </p>
                <ul className="pet-photo-grid">
                  {sitter.petPhotos.map((ph, i) => {
                    const src = resolvePhoto(ph.url);
                    if (!src) return null;
                    return (
                      <li key={ph.url + i}>
                        <span className="photo-thumb">
                          <Image
                            src={src} width={480} height={480} sizes="(min-width: 700px) 12rem, 45vw"
                            alt={ph.alt ?? interpolate(m.sitter.ownPetsAlt, { name })}
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </section>

          {/*
            TAKVIM — ev bolumunden sonra, yorumlardan once.
            Sira sahibin sorularinin sirasi: kim, nerede, NE ZAMAN
            musait, baskalari ne demis.
          */}
          <AvailabilityCalendar locale={locale} name={sitter.firstName} days={calendarDays} />

          {/*
            "BENIM BILMEK ISTEDIKLERIM" — takvimden hemen sonra, cunku
            sirada mesaj yazmak var.

            Kart DEGIL, renkli bir kutu: sayfadaki tek dogrudan "simdi
            sunu yap" isareti. Bakici sorusunu bir kez yaziyor; sahip
            ilk mesajinda cevapliyor ve iki taraf da uc mesajlik bir
            tanisma turundan kurtuluyor.
          */}
          {sitter.ownerPrefsText && (
            <section className="sitter-ask">
              <h2 className="text-h3" style={{ margin: 0 }}>
                {interpolate(m.sitter.ownerPrefsHeading, { name: sitter.firstName })}
              </h2>
              <p className="own-words-body">{sitter.ownerPrefsText}</p>
              <p className="text-body-sm">{m.sitter.ownerPrefsLead}</p>
              <Link href={askUrl} className="btn btn-ink btn-sm">{m.sitter.messageCta}</Link>
            </section>
          )}

          {/* --- Yorumlar --- */}
          <section>
            {sitter.reviews.length === 0 ? (
              <>
                <h2 className="text-h2">{m.sitter.reviewsHeading}</h2>
                <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{m.sitter.noReviews}</p>
              </>
            ) : (
              <>
                {/*
                  BASLIK SOLDA, DAGILIM SAGDA — AYNI SATIRDA.

                  Dagilim basligin altinda, sayfanin sol kenarinda
                  duruyordu: cubuklar ana sutunun ucte birini kapliyor
                  ve sagindaki bosluk yuzunden "yarim kalmis" gibi
                  gorunuyordu. Sag kenara alininca hem bosluk kapandi
                  hem de ortalama ile dagilim goz hizasinda yan yana —
                  "4,9" ile "11 kisi 5 verdi" birlikte okunuyor.

                  Dar ekranda alt alta dusuyor (flex-wrap); orada
                  yan yana koymak cubuklari okunmaz ediyordu.
                */}
                <div className="reviews-head">
                  <div>
                    <h2 className="text-h2" style={{ margin: 0 }}>{m.sitter.reviewsHeading}</h2>
                    <p className="muted tabular" style={{ marginTop: 'var(--space-2)' }}>
                      {interpolate(m.sitter.reviewCount, {
                        count: numberFmt(sitter.reviewCount, locale),
                        rating: sitter.averageRating.toFixed(1),
                      })}
                    </p>
                  </div>

                  {/*
                    PUAN DAGILIMI. Ortalama tek basina "kac kisi kac verdi"
                    sorusunu cevaplamiyor: 4.6, "hepsi 4-5 verdi" de olabilir
                    "cogu 5, biri 1 verdi" de. Ikisi ayni bakici degil.
                  */}
                  <RatingBreakdown
                    counts={sitter.ratingCounts}
                    total={sitter.reviewCount}
                    locale={locale}
                  />
                </div>

                <div className="grid" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                  {sitter.reviews.map((r) => (
                    <article key={r.id} className="card card-pad">
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span className="row" style={{ gap: 'var(--space-3)' }}>
                          <Avatar
                            src={r.authorAvatarUrl}
                            initials={`${r.authorFirstName.slice(0, 1)}${r.authorInitial}`}
                            size={36}
                          />
                          <span style={{ fontWeight: 600 }}>
                            {r.authorFirstName} {r.authorInitial}.
                          </span>
                        </span>
                        <span className="tabular text-body-sm">
                          {'★'.repeat(r.rating)}
                          <span className="dim">{'☆'.repeat(5 - r.rating)}</span>
                        </span>
                      </div>
                      {/*
                        HANGI HIZMET ICIN. Bes yildizli bir gezdirme
                        yorumu, konaklama arayan birine ayni seyi
                        soylemiyor. Rezervasyona bagli degilse cizilmiyor.
                      */}
                      {r.serviceType && (
                        <p className="review-service">
                          <ServiceIcon service={r.serviceType} size={15} />
                          {m.service[r.serviceType]}
                        </p>
                      )}
                      {r.body && <p style={{ marginTop: 'var(--space-3)' }}>{r.body}</p>}
                      <p className="dim text-body-sm" style={{ marginTop: 'var(--space-3)' }}>
                        {dateFmt(r.publishedAt, locale)}
                      </p>
                      {r.responseBody && (
                        <div className="sitter-review-reply">
                          <p className="text-body-sm" style={{ fontWeight: 600 }}>
                            {interpolate(m.sitter.response, { name: sitter.firstName })}
                          </p>
                          <p className="text-body-sm" style={{ marginTop: 'var(--space-1)' }}>{r.responseBody}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <p className="field-hint tabular">
            {interpolate(m.sitter.dataAsOf, { date: dateFmt(sitter.dataAsOf, locale) })}
          </p>
        </div>

        {/* --- Rezervasyon kutusu --- */}
        <aside className="sitter-aside">
          <div className="card card-pad sitter-book">
            {primary && (
              <div>
                <p className="tabular" style={{ margin: 0 }}>
                  <span className="text-h2">{money(primary.priceCents, locale)}</span>
                  <span className="dim"> / {m.unit[SERVICES[primary.serviceType].unit]}</span>
                </p>
                {/*
                  HANGI HIZMETIN fiyati oldugu YAZIYOR. Rakamin tek basina
                  durmasi, birden fazla hizmeti olan bakicida "her sey bu
                  fiyata" gibi okunuyordu.
                */}
                <p className="text-body-sm dim" style={{ marginTop: 'var(--space-1)' }}>
                  {m.service[primary.serviceType]}
                  {bookable.length > 1 && ` · ${interpolate(
                    bookable.length === 2 ? m.sitter.moreServices : m.sitter.moreServicesPlural,
                    { count: bookable.length - 1 },
                  )}`}
                </p>
              </div>
            )}

            <p className="text-body-sm muted">{m.sitter.feeNote}</p>

            {/*
              Rezervasyon: giris gerekiyorsa book sayfasi kendisi giris
              ekranina yonlendiriyor ve donusu hatirliyor. Dugmenin
              dogrudan giris sayfasina gitmesi, giris yapmis kullaniciyi da
              bos yere oraya gonderiyordu.
            */}
            <Link href={bookHref(primary?.serviceType)} className="btn btn-primary btn-block">
              {m.sitter.bookCta}
            </Link>
            {/*
              SORU SOR. Mesajlasma gelene kadar bu dugme kaldirilmisti;
              geri geldi. Rezervasyondan ONCE soru sorabilmek, donusumu
              artiran ana akis: bakiciyi tanimadan uc gecelik bir
              konaklama ayirtmak cogu insan icin buyuk bir adim.
            */}
            <Link href={askUrl} className="btn btn-secondary btn-block">
              {m.sitter.messageCta}
            </Link>

            <ul className="sitter-facts" style={{ marginTop: 'var(--space-2)' }}>
              <Fact>{interpolate(m.sitter.openDays, { count: sitter.openDays })}</Fact>
              <Fact>{interpolate(m.sitter.memberSince, { date: dateFmt(sitter.memberSince, locale) })}</Fact>
            </ul>

            {/*
              ROZET BURADA ACIKLANIYOR. Kimlik blogundaki rozet tek
              basina "Certified Pro" diyor; ne kapsadigini — ve neyi
              KAPSAMADIGINI — soyleyen satir rezervasyon kutusunda,
              karar verilen yerde.
            */}
            <div>
              <p className="field-hint" style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-primary)', flex: '0 0 auto' }}><ShieldIcon size={13} /></span>
                {m.verification.disclaimer}
              </p>
              <VerificationExplainer level={sitter.badgeLevel} locale={locale} />
              <Link href={`/${seg}/protection/`} className="field-hint" style={{ textDecoration: 'underline' }}>
                {m.verification.whatTheseMean}
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {/*
        TELEFONDA ALT CUBUK.

        Sag sutun 1000px altinda sayfanin en dibine dusuyor: fiyat ve
        "Rezervasyon iste" ekranlarca asagida kaliyordu. Cubuk yalnizca
        kucuk ekranda cizilir (CSS), fiyat sag sutundaki ile AYNI
        kaynaktan (cheapest) geliyor — iki yerde iki rakam gorunmesin.

        aria-label ile ayirt ediliyor: ayni sayfada iki tane
        "Rezervasyon iste" baglantisi var ve ekran okuyucu kullanan biri
        hangisinin ne oldugunu bilmeli.
      */}
      {primary && (
        <div className="book-bar">
          {/*
            Fiyat ve birim AYRI satirlarda: tek satirda "31,00 $ / promenade"
            390px'de sariyor ve bolu isareti satir sonunda tek basina
            kaliyordu. Birim kendi icinde bolunmuyor (nowrap).
          */}
          <p className="book-bar-price">
            <span className="text-h4">{money(primary.priceCents, locale)}</span>
            <span className="dim text-body-sm">
              / {m.unit[SERVICES[primary.serviceType].unit]}
            </span>
          </p>
          <Link
            href={bookHref(primary?.serviceType)}
            className="btn btn-primary"
            aria-label={interpolate(m.sitter.bookAria, { name: sitter.firstName })}
          >
            {m.sitter.bookCta}
          </Link>
        </div>
      )}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sitterJsonLd({
            name: `${name} — Havre`,
            url: profileUrl(sitter, locale),
            cityName: cityName(sitter, locale),
            province: sitter.province,
            description: sitter.bio,
            rating: sitter.averageRating,
            reviewCount: sitter.reviewCount,
            services: bookable.map((s) => ({
              name: m.service[s.serviceType],
              priceCents: s.priceCents,
            })),
          })),
        }}
      />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <li>
      <span className="text-numeral">{value}</span>
      <span className="text-body-sm muted">{label}</span>
    </li>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m3 8.5 3 3 7-7" />
      </svg>
      {children}
    </li>
  );
}
