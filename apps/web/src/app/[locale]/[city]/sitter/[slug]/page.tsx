import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound, permanentRedirect } from 'next/navigation';
import {
  SERVICES, primaryService, servicesForPhase, normalizePetSizes, PET_SIZE_STEPS, type PetSizeKey,
  type ServiceType,
} from '@havre/core';
import {
  getMessages, interpolate, localeFromSegment, LOCALES, segmentFor, serviceSlug,
  type Locale, type Messages,
} from '@havre/i18n';
import {
  VerificationBadge, ShieldIcon,
} from '@/components/VerificationBadge';
import { isDemo } from '@/lib/demo';
import { Avatar } from '@/components/Avatar';
import { SitterGallery } from '@/components/SitterGallery';
import { FavouriteScope, FavouriteHeart } from '@/components/FavouriteScope';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { RatingBreakdown } from '@/components/RatingBreakdown';
import { ServiceIcon } from '@/components/ServiceIcon';
import { Sym, type SymName } from '@/components/Sym';
import { HomeIcon, DogSilhouette, VetIcon, type HomeIconName } from '@/components/HomeIcon';
import { NoIcon } from '@/components/InfoIcons';
import { AskInChat } from '@/components/chat/AskInChat';
import {
  currentSlugFor, getCalendar, getSitterProfile, getSitterSlugsForBuild, type SitterProfile,
} from '@/lib/data';
import { sitterJsonLd, urlFor } from '@/lib/seo';
import { money, responseTime, dateFmt, numberFmt } from '@/lib/format';
import { resolvePhoto } from '@/lib/photos';

/*
  BU FAZDA REZERVASYONU ACIK HIZMETLER.
  Rezervasyon ekraniyla (book/page.tsx) AYNI kaynak: profil, formun
  reddettigi bir hizmeti fiyatiyla gostermesin.
*/
const V1_SERVICES = new Set(servicesForPhase('v1'));

/*
  BOYUT ETIKETI TEK YERDE.

  Ayni kademe ucretlendirme kartinda da, ustteki siluet listesinde de
  yaziliyor. Iki ayri yerde kurulan cumleler kaymisti: biri "0-18 kg"
  derken digeri "18 kg'a kadar" diyordu. Ayni veri, ayni cumle.
*/
/**
 * BOLUM BASLIGI — tasarimda her bolum bir ikon + kalin baslikla
 * basliyor. Ikon DEKORATIF: basligin kendisi zaten ne oldugunu
 * soyluyor, bu yuzden Sym aria-hidden ciziyor.
 */
function SecHead({ icon, children }: { icon: SymName; children: React.ReactNode }) {
  return (
    <div className="sp-sec-h">
      <Sym name={icon} size={22} />
      <h2>{children}</h2>
    </div>
  );
}

function sizeLabel(
  m: Messages,
  key: PetSizeKey,
  step: { minKg: number; maxKg: number },
): string {
  if (key === 'small') return interpolate(m.sitter['pets.sizeSmall'], { max: step.maxKg });
  if (key === 'giant') return interpolate(m.sitter['pets.sizeGiant'], { min: step.minKg });
  return interpolate(m.sitter['pets.sizeBand'], { min: step.minKg, max: step.maxKg });
}

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
  // Demo yayini noindex — onceden uretmek hicbir sey kazandirmiyor,
  // build'i uzatiyor. Sayfalar ilk istekte uretiliyor (ISR).
  if (isDemo()) return [];

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
  if (!sitter) {
    /*
      ESKI ADRES MI? Bakici adini duzelttiginde profil adresi yenileniyor
      ve eskisi `sitter_slug_history` tablosuna yaziliyor. Paylasilmis
      baglantiyi 404'e dusurmek yerine kalici olarak yenisine
      gonderiyoruz — hem ziyaretci kaybolmuyor hem arama motoru sayfayi
      yeni adresle esliyor. `permanentRedirect` 308 donduruyor.
    */
    const moved = await currentSlugFor(slug);
    if (moved) permanentRedirect(`/${seg}/${city}/sitter/${moved}/`);
    return null;
  }

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
    SAYFA STATIK KALIYOR. Bu nesne oturumla ilgili hicbir sey
    icermiyor — yalnizca zaten ekranda olan genel profil bilgisi.
    Kimin giris yaptigina paneldeki istemci bileseni bakiyor; sunucuda
    oturum okumak bu sayfayi dinamik yapar ve ISR biterdi.
  */
  const askDetail = {
    sitterId: sitter.userId,
    firstName: sitter.firstName,
    initials: sitter.photoInitials,
    avatarUrl: sitter.avatarUrl,
  };

  /*
    KABUL EDILEN BOYUT — HIZMETLERIN BIRLESIMI.

    Bakicinin her hizmeti icin ayri bir ust sinir var (arama da
    oradan filtreliyor). Profildeki ozet, EN GENIS olani gosteriyor:
    "bu bakici en fazla bu boyutta bir hayvan aliyor". Hangi hizmette
    hangi sinir oldugu zaten hizmet kartinda yaziyor.

    Hicbir sey TURETILMIYOR: bakicinin sihirbazda isaretledigi
    kademelerin birlesimi yaziliyor. Isaretlenmeyen bir kademe burada
    da yok — bakicinin vermedigi bir soz profilde gorunmuyor.
  */
  const sizeSteps = normalizePetSizes(bookable.flatMap((svc) => svc.acceptedSizes));
  const sizeIconPx: Record<string, number> = { small: 20, medium: 26, large: 32, giant: 38 };

  /*
    KABUL KOSULLARI — "hangi hayvana BAKMAM".

    Yalnizca ISARETLENENLER listeye giriyor. Isaretsiz bir kutu
    "boyle bir sartim yok" demek ve hicbir satir cizilmiyor; yani
    varsayilan hicbir iddia uretmiyor.
  */
  type PetRule = { icon: 'vet' | 'no' | 'home' | 'clock' | 'pets' | 'paw'; text: string };
  const petRules: PetRule[] = ([
    sitter.spayedNeuteredOnly && { icon: 'vet' as const, text: m.sitter['pets.spayedOnly'] },
    sitter.noFemalesInHeat && { icon: 'no' as const, text: m.sitter['pets.noHeat'] },
    sitter.houseTrainedOnly && { icon: 'home' as const, text: m.sitter['pets.houseTrained'] },
    sitter.minPetAgeMonths !== null && {
      icon: 'clock' as const,
      text: sitter.minPetAgeMonths % 12 === 0
        ? (sitter.minPetAgeMonths === 12
            ? m.sitter['pets.minAgeYear']
            : interpolate(m.sitter['pets.minAgeYears'], { years: sitter.minPetAgeMonths / 12 }))
        : interpolate(m.sitter['pets.minAgeMonths'], { months: sitter.minPetAgeMonths }),
    },
    {
      /* Tek hayvan alan bakicida IKI pati cizmek cumlenin tersini
         soyluyordu — tek pati. */
      icon: sitter.maxConcurrentPets === 1 ? ('paw' as const) : ('pets' as const),
      text: sitter.maxConcurrentPets === 1
        ? m.sitter['home.maxPetsOne']
        : interpolate(m.sitter['home.maxPets'], { count: sitter.maxConcurrentPets }),
    },
  ] as Array<PetRule | false>).filter((x): x is PetRule => Boolean(x));

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
        KIRINTI SERIDI — tasarimda sayfanin en ustunde ince bir serit:
        solda yol (Ana sayfa / Il / Sehir / Mahalle / Isim), sagda
        bakicinin hizmet verdigi alan. Bir profil sayfasinda "bu kisi
        nerede" sorusunun cevabi baslikla ayni yukseklikte olmali.
      */}
      <div className="sp-crumbs">
        <div className="st-wrap sp-crumbs-in">
          <nav aria-label="Breadcrumb">
            <ol className="sp-crumb-list">
              <li><Link href={`/${seg}`}>{m.brand.name}</Link></li>
              <li aria-hidden="true" className="sp-crumb-sep">/</li>
              <li>
                <Link href={`/${seg}/${locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn}/${serviceSlug('boarding', locale)}/`}>
                  {cityName(sitter, locale)}
                </Link>
              </li>
              {hoodName(sitter, locale) && (
                <>
                  <li aria-hidden="true" className="sp-crumb-sep">/</li>
                  <li className="sp-crumb-hood">{hoodName(sitter, locale)}</li>
                </>
              )}
              <li aria-hidden="true" className="sp-crumb-sep">/</li>
              <li className="sp-crumb-on">{name}</li>
            </ol>
          </nav>
          {/* Tasarimda burada "su mahallelere hizmet veriyor" cipi var.
              Bizde mahalle listesi yok; olan sey bakicinin KENDI mahallesi. */}
          {where && (
            <span className="sp-area">
              <Sym name="location" size={15} />
              {where}
            </span>
          )}
        </div>
      </div>

      {/*
        KIMLIK KARTI. Tasarimda kimlik, acik zeminin uzerinde duran
        BEYAZ bir kart: solda fotograf ve ad, sagda baslangic fiyati.
        Onceki surumde pembe bir banttaydi ve fiyat sayfanin cok
        asagisindaki rezervasyon kutusuna kadar gorunmuyordu.
      */}
      <div className="sp-band">
        <div className="st-wrap">
          <div className="sp-hero">
            <div className="sp-ident">
              <span className="sp-avatar">
                <Avatar src={sitter.avatarUrl} initials={sitter.photoInitials} size={104} />
              </span>

              <div className="sp-ident-text">
                <div className="sp-chips">
                  <VerificationBadge level={sitter.badgeLevel} locale={locale} />
                  {sitter.smokeFree && (
                    <span className="sp-chip sp-chip-sage">
                      <Sym name="verified" size={14} />
                      {m.sitter['home.smokeFree']}
                    </span>
                  )}
                  {sitter.yardFenced && (
                    <span className="sp-chip">
                      <Sym name="home-pin" size={14} />
                      {m.sitter['home.yardFenced']}
                    </span>
                  )}
                </div>

                <div className="sp-name-row">
                  <h1 className="sp-name">{name}</h1>
                  {/* Tasarimda konum adin YANINDA, altinda degil */}
                  {where && (
                    <span className="sp-where">
                      <Sym name="location" size={16} />
                      {where}
                    </span>
                  )}
                  {/* Kalp basligin YANINDA: karar burada veriliyor. */}
                  <FavouriteScope ids={[sitter.userId]} locale={locale} path={`/${seg}/favourites/`}>
                    <FavouriteHeart sitterId={sitter.userId} />
                  </FavouriteScope>
                </div>

                <ul className="sp-meta">
                  {sitter.reviewCount > 0 && (
                    <li className="sp-meta-star">
                      <Sym name="star" size={17} filled />
                      <strong className="tabular">{sitter.averageRating.toFixed(1)}</strong>
                      <span className="sp-meta-dim tabular">
                        ({numberFmt(sitter.reviewCount, locale)})
                      </span>
                    </li>
                  )}
                  <li>
                    <Sym name="bolt" size={15} />
                    {responseTime(sitter.medianResponseMinutes, locale)}
                  </li>
                  {sitter.repeatClients > 0 && (
                    <li className="sp-meta-key">
                      <Sym name="heart" size={15} />
                      <span className="tabular">
                        {interpolate(m.searchPage.repeatClients, {
                          count: numberFmt(sitter.repeatClients, locale),
                        })}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/*
              BASLANGIC FIYATI. Tasarimda "Starting rate" kutusu.
              HANGI hizmetin fiyati oldugu yaziyor: rakamin tek basina
              durmasi, birden fazla hizmeti olan bakicida "her sey bu
              fiyata" gibi okunuyor.
            */}
            {primary && (
              <div className="sp-rate">
                <span className="sp-rate-label">{m.sitter.rateLabel}</span>
                <span className="sp-rate-value">
                  <strong className="tabular">{money(primary.priceCents, locale)}</strong>
                  <span className="sp-rate-unit">/ {m.unit[SERVICES[primary.serviceType].unit]}</span>
                </span>
                <span className="sp-rate-note">{m.service[primary.serviceType]}</span>
              </div>
            )}
          </div>

        </div>
      </div>

      <section className="container sitter-page has-book-bar">
        <div className="sitter-main">
          {/* Ev fotograflari — sahiplerin ilk sorusu "kopegim nerede kalacak" */}
          <SitterGallery locale={locale} photos={sitter.photos} name={sitter.firstName} />

          {/*
            GUVEN VE GUVENLIK LISTESI.

            Tasarimda dort maddelik bir izgara var ve her maddenin
            altinda ne kapsadigi yaziyor. Bizde bu metinler ZATEN
            yazilmisti (verification.explain.*) ama yalnizca
            rezervasyon kutusunda, tek satir halinde duruyordu.

            YALNIZCA GECILEN ADIMLAR cizili: bakicinin almadigi bir
            dogrulamayi listeye koyup "yok" demek, listeyi bir eksikler
            tablosuna cevirir ve rozetin anlamini bulandirir. Hicbiri
            yoksa bolum HIC cizilmiyor.
          */}
          {sitter.badgeLevel > 0 && (
            <section className="card card-pad sitter-block">
              <SecHead icon="shield">{m.verification.heading}</SecHead>
              <ul className="sp-vet">
                {([
                  [1, m.verification.identity, m.verification['explain.identity']],
                  [2, m.verification.criminal, m.verification['explain.criminal']],
                  [3, m.verification.licence, m.verification['explain.licence']],
                  [4, m.verification.certification, m.verification['explain.certification']],
                ] as const)
                  .filter(([lvl]) => sitter.badgeLevel >= lvl)
                  .map(([lvl, title, body]) => (
                    <li key={lvl}>
                      <span className="sp-vet-ic" aria-hidden="true"><Sym name="verified" size={20} /></span>
                      <span className="sp-vet-text">
                        <strong>{title}</strong>
                        <span>{body}</span>
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          )}

          {/*
            SAYILAR VE PUAN DAGILIMI.

            Referansta boyle bir blok YOK; bizde var ve sahibin
            sordugu seyi cevapliyor. Ama tam genislikte bir satir
            olarak kimlik kartiyla icerik arasinda duruyordu: hem
            rezervasyon kutusunu bir ekran asagi itiyor hem de
            izgaranin iki sutununu bozuyordu. Artik SOL SUTUNDA,
            diger bloklarla ayni kartta.

            Dagilim yorum yoksa HIC cizilmiyor — bos cubuklar "kimse
            puan vermemis" yerine "puanlar dusuk" gibi okunuyordu.
          */}
          <section className="card card-pad sitter-block">
            <SecHead icon="bolt">{m.sitter.ratingBreakdown}</SecHead>
            <div className="sp-facts">
              <ul className="sitter-stats">
                <Stat value={numberFmt(sitter.completedBookings, locale)} label={m.sitter['stat.completed']} />
                <Stat value={numberFmt(sitter.repeatClients, locale)} label={m.sitter['stat.repeat']} />
                <Stat value={responseTime(sitter.medianResponseMinutes, locale)} label={m.sitter['stat.responds']} />
                <Stat value={`${Math.round(sitter.acceptanceRate * 100)}%`} label={m.sitter['stat.acceptance']} />
                {/*
                  YANIT ORANI kabul oranindan AYRI bir sey: burada ret
                  de cevaptir. Hic cevaplanabilir istek yoksa satir HIC
                  cizilmiyor — "%0" yanlis olurdu.
                */}
                {sitter.responseRate !== null && (
                  <Stat
                    value={`${Math.round(sitter.responseRate * 100)}%`}
                    label={m.sitter['stat.responseRate']}
                  />
                )}
              </ul>
              {sitter.reviewCount > 0 && (
                <RatingBreakdown
                  counts={sitter.ratingCounts}
                  total={sitter.reviewCount}
                  locale={locale}
                />
              )}
            </div>
          </section>

          {sitter.bio && (
            <section className="card card-pad sitter-block">
              <SecHead icon="heart">{interpolate(m.sitter.aboutHeading, { name: sitter.firstName })}</SecHead>
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
              <SecHead icon="calendar">
                {interpolate(m.sitter.routineHeading, { name: sitter.firstName })}
              </SecHead>
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
          <section className="card card-pad sitter-block">
            <div className="sp-sec-top">
              <SecHead icon="verified">
                {interpolate(m.sitter.servicesHeading, { name: sitter.firstName })}
              </SecHead>
              <span className="sp-sec-note">{m.sitter.feeNote}</span>
            </div>
            <div className="sp-svc-grid">
              {bookable.map((s) => (
                <article key={s.serviceType} className="sp-svc">
                  <div>
                    {/* Tasarimda ad solda, fiyat AYNI SATIRDA sagda ve yesil */}
                    <div className="sp-svc-top">
                      <h3 className="sp-svc-name">{m.service[s.serviceType]}</h3>
                      <span className="sp-svc-price tabular">
                        {money(s.priceCents, locale)}
                        <span className="sp-svc-unit"> / {m.unit[SERVICES[s.serviceType].unit]}</span>
                      </span>
                    </div>
                    <p className="text-body-sm muted" style={{ marginTop: 'var(--space-1)' }}>
                      {m.serviceDescription[s.serviceType]}
                    </p>
                    <div className="row" style={{ marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
                      {s.acceptsDogs && <span className="badge badge-outline">{m.onboarding['services.dogs']}</span>}
                      {s.acceptsCats && <span className="badge badge-outline">{m.onboarding['services.cats']}</span>}
                      {s.acceptsOther && <span className="badge badge-outline">{m.onboarding['services.other']}</span>}
                      {/*
                        HIZMETIN KENDI kademeleri. Ustteki ozet tum
                        hizmetlerin birlesimi; burada hangi hizmette
                        hangi boyutun kabul edildigi ayri ayri yaziyor
                        cunku bakici konaklamada kucuk, yurutmede her
                        boyutu alabiliyor.
                      */}
                      {normalizePetSizes(s.acceptedSizes).map((key) => {
                        const step = PET_SIZE_STEPS.find((x) => x.key === key)!;
                        return (
                          <span key={key} className="badge badge-outline tabular">
                            {sizeLabel(m, key, step)}
                          </span>
                        );
                      })}
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
                  <div className="sp-svc-foot">
                    {/*
                      HER HIZMETIN KENDI REZERVASYON BAGLANTISI.

                      Tek bir "Rezervasyon iste" dugmesi varken form hep
                      ayni hizmetle aciliyordu; konaklama arayan kisi
                      gezdirme formunu buluyordu. Buradan gelince form
                      DOGRU hizmetle aciliyor.
                    */}
                    <Link
                      href={bookHref(s.serviceType)}
                      className="sp-svc-btn"
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

          {/*
            BAKABILECEGI HAYVANLAR.

            Sahibin ilk eledigi sey bu: kopegim bu bakiciya sigar mi.
            Bugune kadar cevap yalnizca hizmet kartinin icinde kucuk
            bir "0-40 kg" rozetiydi ve birden fazla hizmeti olan
            bakicida hangisinin gecerli oldugu belirsizdi. Simdi tek
            bir bolum: boyut kademeleri ve bakicinin kosullari.

            Kosullar da burada, cunku "kisirlastirilmamis kopegimi
            alir mi" sorusu boyut sorusuyla ayni anda soruluyor ve
            bugune kadar ikisi de mesajla — cogu zaman istek
            reddedildikten SONRA — ogreniliyordu.
          */}
          <section className="card card-pad sitter-block">
            <SecHead icon="pets">
              {interpolate(m.sitter.petsHeading, { name: sitter.firstName })}
            </SecHead>

            {sizeSteps.length > 0 ? (
              <>
                <ul className="size-steps">
                  {sizeSteps.map((key) => {
                    const step = PET_SIZE_STEPS.find((x) => x.key === key)!;
                    const label = sizeLabel(m, key, step);
                    return (
                      <li key={key}>
                        {/* Siluet kademeye gore buyuyor: fark BOYUTUN kendisi */}
                        <span className="size-step-art">
                          <DogSilhouette size={sizeIconPx[key] ?? 24} />
                        </span>
                        <span className="size-step-label">{label}</span>
                      </li>
                    );
                  })}
                </ul>
                {bookable.length > 1 && (
                  <p className="field-hint">
                    {interpolate(m.sitter['pets.sizeNote'], { name: sitter.firstName })}
                  </p>
                )}
              </>
            ) : (
              /* Boyut secilmemis bir profilde SUSUYORUZ: "0-100 kg"
                 varsayilani bakicinin vermedigi bir sozdu. */
              <p className="muted text-body-sm">
                {interpolate(m.sitter['pets.noSizes'], { name: sitter.firstName })}
              </p>
            )}

            <ul className="home-facts">
              {petRules.map((r) => (
                <li key={r.text}>
                  {/* Ucu de 24: cember konturlu ikonlar ayni kutuda
                      ev/pati siluetinden buyuk gorunuyor. */}
                  {r.icon === 'vet' ? <VetIcon size={24} />
                    : r.icon === 'no' ? <NoIcon size={24} />
                    : <HomeIcon name={r.icon === 'home' ? 'house' : r.icon} size={26} />}
                  <span>{r.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* --- Ev, kurallar, guvenlik --- */}
          <section className="card card-pad sitter-block">
            <SecHead icon="house">{m.sitter.homeHeading}</SecHead>

            {/*
              EV OZELLIKLERI KUTUCUK IZGARASI. Tasarimda bu bolum dort
              sutunluk bir "bento": her ozellik kendi kutusunda, ikon
              ustte. Duz bir liste olarak sekiz madde okunmuyordu.
            */}
            <ul className="sp-bento">
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
              <AskInChat href={askUrl} className="btn btn-ink btn-sm" detail={askDetail}>
                {m.sitter.messageCta}
              </AskInChat>
            </section>
          )}

          {/* --- Yorumlar --- */}
          <section>
            <h2 className="text-h2">{m.sitter.reviewsHeading}</h2>
            {sitter.reviews.length === 0 ? (
              <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{m.sitter.noReviews}</p>
            ) : (
              <>
                {/*
                  Dagilim ARTIK BURADA DEGIL, sayfanin basinda — yildizin
                  yaninda duruyor. Burada tekrar cizmek ayni bilgiyi iki
                  kez gostermek olurdu; kalan satir yalnizca kac yorum ve
                  ortalama kac.
                */}
                <p className="muted tabular" style={{ marginTop: 'var(--space-2)' }}>
                  {interpolate(m.sitter.reviewCount, {
                    count: numberFmt(sitter.reviewCount, locale),
                    rating: sitter.averageRating.toFixed(1),
                  })}
                </p>

                <div className="grid" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
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
          <div className="card card-pad sitter-book sp-book">
            {/*
              KUTUNUN BASLIGI. Tasarimda ustte kucuk bir ust baslik ve
              "Book with <ad>" var. Yanindaki "Instant Confirm" rozeti
              ALINMADI: aninda onay diye bir seyimiz yok, istekler
              bakicinin cevabini bekliyor. Olmayan bir hiz sozu,
              rezervasyon ekranindaki ilk hayal kirikligi olurdu.
            */}
            <div className="sp-book-head">
              <span className="sp-book-eyebrow">{m.sitter.bookEyebrow}</span>
              <h2 className="sp-book-title">
                {interpolate(m.sitter.bookWith, { name: sitter.firstName })}
              </h2>
            </div>

            {/*
              HIZMET SECICI. Tasarimda bir <select> var ve secim fiyati
              degistiriyor. Bizde sayfa STATIK (ISR) ve JavaScript'siz
              calismasi gerekiyor, o yuzden secici bir GET FORMU:
              secilen hizmet rezervasyon sayfasina parametre olarak
              gidiyor ve form ORADA dogru hizmetle aciliyor. Secim
              degisince buradaki rakamin degismemesi bilincli — yanlis
              rakam gostermektense, rakami hizmetin yaninda yazmak.
            */}
            {bookable.length > 0 && (
              <form method="get" action={`/${seg}/${citySlug}/sitter/${sitter.slug}/book/`} className="sp-book-form">
                <label className="sp-book-label" htmlFor="book-service">{m.sitter.selectService}</label>
                <div className="sp-book-select">
                  <select id="book-service" name="service" defaultValue={primary ? serviceSlug(primary.serviceType, locale) : undefined}>
                    {bookable.map((sv) => (
                      <option key={sv.serviceType} value={serviceSlug(sv.serviceType, locale)}>
                        {m.service[sv.serviceType]} — {money(sv.priceCents, locale)} / {m.unit[SERVICES[sv.serviceType].unit]}
                      </option>
                    ))}
                  </select>
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                    strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
                </div>

                {/*
                  FIYAT KUTUSU. Tasarimda uc kalem var: hizmet, veteriner
                  teminati, platform ucreti. Bizde ayri bir ucret kalemi
                  YOK — gosterilen rakam odenecek rakam ve bunu soyleyen
                  cumle altinda. Uc satirlik bir dokum uydurmak, olmayan
                  bir ucret yapisini varmis gibi gostermek olurdu.
                */}
                {primary && (
                  <div className="sp-book-price">
                    <div className="sp-book-row">
                      <span>{m.service[primary.serviceType]}</span>
                      <strong className="tabular">{money(primary.priceCents, locale)}</strong>
                    </div>
                    <div className="sp-book-total">
                      <span>{m.sitter.youPayLabel}</span>
                      <strong className="tabular">
                        {money(primary.priceCents, locale)}
                        <span className="sp-book-unit"> / {m.unit[SERVICES[primary.serviceType].unit]}</span>
                      </strong>
                    </div>
                    <p className="sp-book-note">{m.sitter.feeNote}</p>
                  </div>
                )}

                <button type="submit" className="sp-book-cta">
                  <Sym name="calendar" size={18} />
                  {m.sitter.bookCta}
                </button>
              </form>
            )}

            {/*
              SORU SOR. Rezervasyondan ONCE soru sorabilmek, donusumu
              artiran ana akis: bakiciyi tanimadan uc gecelik bir
              konaklama ayirtmak cogu insan icin buyuk bir adim.
            */}
            <AskInChat href={askUrl} className="sp-book-second" detail={askDetail}>
              {m.sitter.messageCta}
            </AskInChat>

            {/*
              GUVENCE SATIRLARI. Tasarimda uc satir var: para iade
              garantisi, Stripe ile guvenli odeme, 7/24 destek. Ilki ve
              sonuncusu bizde YOK ve yazilmadi. Yerlerinde duran uc satir
              gercek: musaitlik, uyelik tarihi ve dogrulama notu.
            */}
            <ul className="sp-book-assure">
              <li><Sym name="calendar" size={16} />{interpolate(m.sitter.openDays, { count: sitter.openDays })}</li>
              <li><Sym name="verified" size={16} />{interpolate(m.sitter.memberSince, { date: dateFmt(sitter.memberSince, locale) })}</li>
              <li><Sym name="shield" size={16} />{m.verification.disclaimer}</li>
            </ul>

            <Link href={`/${seg}/protection/`} className="sp-book-link">
              {m.verification.whatTheseMean}
            </Link>
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
