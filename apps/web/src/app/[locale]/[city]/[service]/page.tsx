import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  evaluateIndexability, servicesForPhase, SERVICES, type ServiceType,
} from '@havre/core';
import {
  getMessages, interpolate, localeFromSegment, segmentFor, serviceFromSlug, serviceSlug,
  type Locale,
} from '@havre/i18n';
import { SitterCard } from '@/components/SitterCard';
import { FavouriteScope } from '@/components/FavouriteScope';
import { TrustStrip } from '@/components/TrustStrip';
import { Photo } from '@/components/Photo';
import { Faq } from '@/components/Faq';
import { ServiceTiles } from '@/components/ServiceTiles';
import { ServiceIcon } from '@/components/ServiceIcon';
import { StSearch } from '@/components/StSearch';
import { Sym } from '@/components/Sym';
import { WaitlistForm } from '@/components/WaitlistForm';
import { ComingSoon } from '@/components/ComingSoon';
import { PHOTOS, type PhotoId } from '@/lib/photos';
import { isDemo } from '@/lib/demo';
import { cityName, citySlug, findCityBySlug, getLandingData, getLiveCities, getTier1Cities, type CityRecord, type LandingData } from '@/lib/data';
import { alternatesFor, landingJsonLd, landingUrl, robotsFor, urlFor } from '@/lib/seo';
import { joinWaitlistAction } from './actions';
import { money, numberFmt, dateFmt, responseTime } from '@/lib/format';

/** ISR — fiyat/bakici sayisi taze olmali (yol haritasi §7.3) */
export const revalidate = 3600;
/** Tier-2/3 sehirler build'de degil, talep uzerine uretilir */
export const dynamicParams = true;

/**
 * SADECE Tier-1 build'de uretilir.
 * 10.000 sayfayi build'de uretmek deploy suresini dakikalardan saatlere cikarir.
 */
export async function generateStaticParams() {
  /*
    DEMO YAYININDA ONCEDEN URETIM YOK.

    Bu sayfalari build'de uretmenin tek sebebi SEO ve ilk ziyaretteki
    hiz. Demo yayini arama motorlarina TAMAMEN KAPALI (noindex +
    robots.txt), yani onceden uretmek hicbir sey kazandirmiyor —
    buna karsilik build makinesi (us-east) ile veritabani (Montreal)
    arasinda yuzlerce sorgu turu atiyor ve ilk dagitim tam da bu
    yuzden zaman asimina dustu.

    Sayfalar KAYBOLMUYOR: dynamicParams varsayilan olarak acik, her
    adres ilk istekte uretilip `revalidate = 3600` ile onbellege
    aliniyor. Gercek yayinda (DEMO_MODE yok) eski davranis aynen
    geri geliyor.
  */
  if (isDemo()) return [];

  const services = servicesForPhase('v1');
  const tier1 = await getTier1Cities();
  const params: Array<{ locale: string; city: string; service: string }> = [];
  for (const locale of ['en-CA', 'fr-CA'] as const) {
    for (const city of tier1) {
      for (const service of services) {
        params.push({
          locale: segmentFor(locale),
          city: citySlug(city, locale),
          service: serviceSlug(service, locale),
        });
      }
    }
  }
  return params;
}

async function resolve(params: Promise<{ locale: string; city: string; service: string }>) {
  const { locale: seg, city: citySlugParam, service: serviceSlugParam } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return null;
  const city = await findCityBySlug(citySlugParam, locale);
  if (!city) return null;
  const service = serviceFromSlug(serviceSlugParam, locale);
  if (!service) return null;
  return { locale, city, service };
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; city: string; service: string }> },
): Promise<Metadata> {
  const r = await resolve(params);
  if (!r) return { robots: { index: false, follow: false } };

  const m = getMessages(r.locale);
  const name = cityName(r.city, r.locale);
  const svc = m.service[r.service];

  /*
    HENUZ ACILMAMIS SEHIR — NOINDEX, FOLLOW.

    Sayfa duruyor (bekleme listesi) ama Google'a sunulmuyor: hizmet
    vermedigimiz bir sehrin arama sayfasini indekslettirmek, tiklayan
    herkese tutamadigimiz bir soz vermek olurdu. follow acik kaliyor
    ki sayfadaki ACIK sehir baglantilari izlensin.
  */
  if (!r.city.isLive) {
    return {
      title: interpolate(m.coverage.metaTitle, { city: name, service: svc }),
      description: interpolate(m.coverage.metaDescription, { city: name }),
      robots: { index: false, follow: true },
    };
  }

  const data = await getLandingData(r.city, r.service, r.locale);

  // ARZ ESIGI KURALI — sayfanin indekslenip indekslenmeyecegini belirler
  if (data.sitterCount === 0) return { robots: { index: false, follow: false } };

  return {
    title: r.locale === 'fr-CA'
      ? `${svc} à ${name} — ${data.sitterCount} gardiens vérifiés`
      : `${svc} in ${name} — ${data.sitterCount} verified sitters`,
    description: r.locale === 'fr-CA'
      ? `${data.sitterCount} gardiens vérifiés à ${name}. Prix médian de ${(data.medianPriceCents / 100).toFixed(0)} $ par ${m.unit[SERVICES[r.service].unit]}. ${data.reviewCount} avis vérifiés.`
      : `${data.sitterCount} verified sitters in ${name}. Median $${(data.medianPriceCents / 100).toFixed(0)} per ${m.unit[SERVICES[r.service].unit]}. ${data.reviewCount} verified reviews.`,
    alternates: alternatesFor(r.city, r.service, r.locale),
    robots: robotsFor(data.sitterCount),
  };
}

function buildFaqs(data: LandingData, locale: Locale, name: string, svc: string) {
  const m = getMessages(locale);
  const unit = m.unit[SERVICES[data.serviceType].unit];
  const asOf = dateFmt(data.dataAsOf, locale);

  // Somut sayi + tarih + kaynak = AI Overviews'in alintiladigi format (§7.10)
  if (locale === 'fr-CA') {
    return [
      {
        q: `Quel est le prix d'un service de ${svc.toLowerCase()} à ${name} ?`,
        a: `En ${asOf}, le prix médian est de ${money(data.medianPriceCents, locale)} par ${unit}, la plupart des gardiens demandant entre ${money(data.p25PriceCents, locale)} et ${money(data.p75PriceCents, locale)}. Basé sur ${numberFmt(data.bookingCount, locale)} réservations complétées.`,
      },
      {
        q: `Combien de gardiens sont disponibles à ${name} ?`,
        a: `${numberFmt(data.sitterCount, locale)} gardiens vérifiés acceptent actuellement des réservations à ${name}, surtout dans ${data.topNeighbourhoods.join(', ')}.`,
      },
      {
        q: `Les gardiens de ${name} sont-ils vérifiés ?`,
        a: m.verification.disclaimer,
      },
      {
        q: `En combien de temps les gardiens répondent-ils ?`,
        a: `Le délai de réponse médian à ${name} est de ${responseTime(data.medianResponseMinutes, locale)}.`,
      },
    ];
  }

  return [
    {
      q: `How much does ${svc.toLowerCase()} cost in ${name}?`,
      a: `As of ${asOf}, the median rate is ${money(data.medianPriceCents, locale)} per ${unit}, with most sitters charging between ${money(data.p25PriceCents, locale)} and ${money(data.p75PriceCents, locale)}. Based on ${numberFmt(data.bookingCount, locale)} completed bookings.`,
    },
    {
      q: `How many sitters are available in ${name}?`,
      a: `${numberFmt(data.sitterCount, locale)} verified sitters are currently accepting bookings in ${name}, with the highest concentration in ${data.topNeighbourhoods.join(', ')}.`,
    },
    { q: `Are sitters in ${name} background checked?`, a: m.verification.disclaimer },
    {
      q: `How quickly do sitters reply?`,
      a: `The median response time in ${name} is ${responseTime(data.medianResponseMinutes, locale)}.`,
    },
  ];
}

/**
 * Sehrin kendi fotografi varsa onu kullan.
 * Kayitta olmayan bir sehir icin genel bir sahne donuyoruz — eksik gorsel
 * yerine dogru ORANDA bir gorsel, yerlesimin bozulmamasi demek.
 */
function cityPhotoId(slugEn: string): PhotoId {
  const key = `city-${slugEn}`;
  return (key in PHOTOS ? key : 'sitter-banner') as PhotoId;
}

export default async function LandingPage(
  { params }: { params: Promise<{ locale: string; city: string; service: string }> },
) {
  const r = await resolve(params);
  if (!r) notFound();

  /*
    SEHIR HENUZ ACIK DEGILSE BURADA BITIYOR.

    404 DEGIL: "Ottawa'da kopek pansiyonu" arayan biri bizim icin bir
    bilgi ve bekleme listesi tam olarak bunu topluyor. Ama sayfa bakici
    karti, fiyat araligi ya da "rezervasyon iste" dugmesi GOSTERMIYOR --
    hicbiri dogru olmazdi.

    Dal getLandingData'dan ONCE: kapali bir sehir icin fiyat/bakici
    toplami hesaplamak hem gereksiz hem de o sayilarin bir yerde
    ekrana sizma ihtimali.
  */
  if (!r.city.isLive) {
    const liveCities = await getLiveCities();
    return (
      <ComingSoon
        locale={r.locale}
        city={r.city}
        service={r.service}
        liveCities={liveCities}
        action={joinWaitlistAction as never}
      />
    );
  }

  const data = await getLandingData(r.city, r.service, r.locale);
  const rule = evaluateIndexability({ sitterCount: data.sitterCount });

  // ARZ ESIGI: 0 bakici -> sayfa HIC URETILMEZ (404). Doorway cezasina karsi savunma.
  if (!rule.shouldRender) notFound();

  const m = getMessages(r.locale);
  const name = cityName(r.city, r.locale);
  const svc = m.service[r.service];
  const faqs = buildFaqs(data, r.locale, name, svc);
  const seg = segmentFor(r.locale);

  /*
    YAKINDAKI SEHIRLER — YALNIZCA ACIK OLANLAR.

    Once tum sehirler listeleniyordu. Bugun bunun anlami, hizmet
    vermedigimiz bir sehrin bekleme listesi sayfasina "yakininizdaki
    sehirler" basligi altinda baglanti vermek olurdu: tiklayan kisi
    bakici bekliyor, bekleme listesi buluyor.
  */
  const allCities = await getLiveCities();
  const nearby: CityRecord[] = allCities
    .filter((c) => c.id !== r.city.id && c.province === r.city.province)
    .concat(allCities.filter((c) => c.id !== r.city.id && c.province !== r.city.province))
    .slice(0, rule.expandNearbyModule ? 5 : 3);
  const otherServices = servicesForPhase('v1').filter((s) => s !== r.service);

  const jsonLd = landingJsonLd({
    city: r.city, service: r.service, locale: r.locale,
    serviceName: svc, cityName: name, provinceName: r.city.province,
    sitterCount: data.sitterCount, p25: data.p25PriceCents, p75: data.p75PriceCents,
    faqs, homeLabel: m.brand.name,
    sitterUrls: data.sitters.map((s) => urlFor(r.locale, 'sitters', s.slug)),
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/*
        KAHRAMAN — ANA SAYFAYLA AYNI DIL.

        Burasi `band band-blush` + karalamalar + duz bir fotograf
        cercevesiydi; hemen altinda da ESKI arama kutusu duruyordu.
        Yani sitenin en cok ziyaret edilecek sayfasi (SEO tasiyicisi)
        iki farkli tasarim dilini ayni ekranda gosteriyordu.

        Ana sayfadan FARKLI olan tek sey icerik: buraya gelen kisi
        hizmeti ve sehri secmis durumda, o yuzden baslikta sehir
        vurgulu, arama kutusunda hizmet sekmesi onceden isaretli ve
        konum alani dolu geliyor.
      */}
      <section className="st-hero">
        <div className="st-blobs" aria-hidden="true">
          <div className="st-blob st-blob-a"></div>
          <div className="st-blob st-blob-b"></div>
        </div>

        <div className="st-wrap st-hero-inner">
          <nav aria-label="Breadcrumb" className="lp-crumbs">
            <ol>
              <li><Link href={`/${seg}`}>{m.brand.name}</Link></li>
              <li aria-hidden="true">/</li>
              <li>{r.city.province}</li>
              <li aria-hidden="true">/</li>
              <li aria-current="page">{name}</li>
            </ol>
          </nav>

          <div className="st-hero-grid">
            <div className="st-hero-copy">
              <span className="st-eyebrow-pill">
                <ServiceIcon service={r.service} size={16} />
                {svc}
              </span>

              {/*
                SEHIR VURGULU. Ana sayfada vurgulanan kelime sehir
                adi; burada da oyle olmali — kullanici "Toronto"
                aradi, basligin ona ait oldugunu bir bakista
                gormeli.
              */}
              <h1 className="st-h1">
                {r.locale === 'fr-CA' ? `${svc} à ` : `${svc} in `}
                <span className="st-h1-accent">{name}</span>
              </h1>

              {/* Cevap-once paragrafi: ilk 40-60 kelimede tam cevap (§7.10) */}
              <p className="st-hero-lead">{m.serviceDescription[r.service]}</p>

              <div className="st-hero-pills">
                {/* Puan rozeti YALNIZCA gercek yorum varsa. */}
                {data.reviewCount > 0 && (
                  <span className="st-stat-pill">
                    <span className="st-stars" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Sym key={i} name="star" size={17} filled />
                      ))}
                    </span>
                    <strong className="tabular">{data.avgRating.toFixed(2)}</strong>
                    <span className="st-stat-sub">
                      {interpolate(m.home.reviewsFrom, {
                        count: numberFmt(data.reviewCount, r.locale),
                      })}
                    </span>
                  </span>
                )}
                <span className="st-stat-pill st-stat-pill-sage">
                  <Sym name="verified" size={17} />
                  {m.home.heroPillChecks}
                </span>
              </div>
            </div>

            <div className="st-hero-art">
              <div className="st-hero-photo">
                <Photo id={cityPhotoId(r.city.slugEn)} locale={r.locale}
                       sizes="(min-width: 900px) 26rem, 100vw" priority />
              </div>

              <div className="st-badge-float">
                <span className="st-badge-tile" aria-hidden="true">
                  <Sym name="pets" size={26} />
                </span>
                <span>
                  <strong className="st-badge-value">
                    {interpolate(m.home.heroSitterCount, {
                      city: name, count: numberFmt(data.sitterCount, r.locale),
                    })}
                  </strong>
                  <span className="st-badge-sub">{m.home.heroBadgeSub}</span>
                </span>
              </div>

              {data.medianPriceCents > 0 && (
                <span className="st-badge-chip">
                  <Sym name="verified" size={16} />
                  {interpolate(m.home.heroMedian, {
                    price: money(data.medianPriceCents, r.locale),
                    unit: m.unit[SERVICES[r.service].unit],
                  })}
                </span>
              )}
            </div>
          </div>

          {/*
            Hizmet ve konum ONCEDEN DOLU: sifirdan bir arama degil,
            buradaki aramanin devami.
          */}
          <StSearch
            locale={r.locale}
            cityLabel={name}
            selected={r.service}
            defaultLocation={name}
          />
        </div>
      </section>

      {/*
        UC SAYI KENDI SERIDINDE.

        Kahramanda duruyorlardi ve yeni kahramanda yerleri yok (sayi
        rozetleri fotografin uzerinde). Ama bu sayfanin TEK somut
        kaniti o uc sayi; kaldirmak degil, kendi seridine almak
        gerekiyordu. Tamamlanmis rezervasyon sayisi ustelik rozetlerde
        hic gecmiyor.
      */}
      <div className="st-wrap lp-stats">
        <TrustStrip
          variant="stats"
          locale={r.locale}
          cityName={name}
          sitterCount={data.sitterCount}
          medianPriceCents={data.medianPriceCents}
          bookingCount={data.bookingCount}
          unit={SERVICES[r.service].unit}
        />
      </div>

      <div className="container section">

        {/* Arz yetersizse bekleme listesi — sayfa noindex olur ama kullaniciya deger sunar */}
        {rule.showWaitlist && (
          <div
            className="card card-pad"
            style={{ marginTop: 'var(--space-6)', background: 'var(--color-accent-subtle)', borderColor: 'transparent' }}
          >
            <h2 className="text-h4" style={{ marginBottom: 'var(--space-2)' }}>{m.seo[rule.reasonKey.split('.')[1] as keyof typeof m.seo]}</h2>
            {/*
              AZ BAKICI, HIC BAKICI DEGIL — DUZELTILEN CELISKI.

              Burada `m.search.noResults` yaziyordu: ekranda "No sitters
              here yet" ve HEMEN ALTINDA "2 sitters available" ile iki
              bakici karti. Sayfa kendi kendisiyle celisiyordu. Bu kutu
              zaten yalnizca 1-2 bakici varken ciziliyor (sifirda sayfa
              404); yani o metin burada HICBIR ZAMAN dogru degildi.
            */}
            <p className="muted text-body-sm" style={{ marginBottom: 'var(--space-4)' }}>
              {interpolate(m.search.thinBody, { city: name })}
            </p>
            {/*
              Dugme artik gercekten kaydediyor. Onceden sunucu bileseninde
              olay isleyicisi olmayan bos bir `<button>`'di.
            */}
            <WaitlistForm
              locale={r.locale}
              citySlug={citySlug(r.city, r.locale)}
              cityName={name}
              serviceType={r.service}
              action={joinWaitlistAction}
            />
          </div>
        )}

        {data.sitters.length > 0 && (
          <section style={{ marginTop: 'var(--space-12)' }}>
            <h2 className="text-h3" style={{ marginBottom: 'var(--space-5)' }}>
              {interpolate(m.search.resultsCount, { count: numberFmt(data.sitterCount, r.locale) })}
              {/*
                EKRAN KACINI GOSTERDIGINI SOYLUYOR.
                Once yalnizca toplam yaziyordu ("43 bakici") ama liste ilk
                12'yi cizip duruyordu; kullanici eksik sonuc sandi ve hakliydi
                (bizzat bildirildi). Tamami arama sayfasinda, sayfalamasiyla.
              */}
              {data.sitterCount > data.sitters.length && (
                <span className="text-body-lg muted" style={{ fontWeight: 400 }}>
                  {' · '}
                  {interpolate(m.searchPage.showingRange, {
                    first: '1',
                    last: numberFmt(data.sitters.length, r.locale),
                    total: numberFmt(data.sitterCount, r.locale),
                  })}
                </span>
              )}
            </h2>
            {/*
              Kalpler KAPSAM icinde: sayfa ISR ile onbellege aliniyor,
              dolayisiyla durum sunucuda bilinemiyor. Kapsam on iki
              kimligi TEK istekte soruyor (bkz. FavouriteScope).
            */}
            <FavouriteScope
              ids={data.sitters.map((s) => s.id)}
              locale={r.locale}
              path={`/${segmentFor(r.locale)}/favourites/`}
            >
              <div className="grid grid-cards">
                {data.sitters.map((s) => (
                  <SitterCard
                    key={s.id} sitter={s} serviceType={r.service} locale={r.locale}
                    citySlug={citySlug(r.city, r.locale)}
                    favourite={{ path: `/${segmentFor(r.locale)}/favourites/` }}
                  />
                ))}
              </div>
            </FavouriteScope>

            {data.sitterCount > data.sitters.length && (
              <p style={{ marginTop: 'var(--space-6)' }}>
                <Link
                  href={`/${segmentFor(r.locale)}/search/?location=${encodeURIComponent(name)}&service=${serviceSlug(r.service, r.locale)}`}
                  className="btn btn-secondary"
                >
                  {interpolate(m.search.seeAll, {
                    count: numberFmt(data.sitterCount, r.locale),
                  })}
                </Link>
              </p>
            )}
          </section>
        )}

      </div>

      {/*
        ---- SSS ----
        Kendi bandinda. Onceden sayfanin sonunda, krem zeminde havada duran
        hap seklinde kutulardi; bolum bittigi belli olmuyordu. Iki sutun:
        solda baslik ve "hala sorunuz mu var", sagda liste.
      */}
      <section className="band band-surface band-round-t band-round-b">
        <div className="container section">
          <div className="content-grid faq-grid">
            <div className="faq-aside">
              <h2 className="text-h1">
                {r.locale === 'fr-CA' ? 'Questions fréquentes' : 'Frequently asked questions'}
              </h2>
              <p className="muted" style={{ marginTop: 'var(--space-4)' }}>
                {r.locale === 'fr-CA'
                  ? `Les réponses viennent des données de ${name} : prix réels, délais de réponse réels.`
                  : `The answers come from live ${name} data — real prices, real response times.`}
              </p>
              <div className="card card-pad" style={{ marginTop: 'var(--space-6)' }}>
                <h3 className="text-h4">
                  {r.locale === 'fr-CA' ? 'Autre chose?' : 'Something else?'}
                </h3>
                <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
                  {r.locale === 'fr-CA'
                    ? 'Écrivez à un gardien avant de réserver — c’est gratuit et sans engagement.'
                    : 'Message a sitter before booking — it is free and commits you to nothing.'}
                </p>
                <Link href={`/${seg}/help/`} className="btn btn-secondary btn-block"
                      style={{ marginTop: 'var(--space-4)' }}>
                  {m.footer.help}
                </Link>
              </div>
            </div>

            <Faq items={faqs} locale={r.locale} />
          </div>
        </div>
      </section>

      {/* ---- Kesfet: diger hizmetler ve yakin sehirler ---- */}
      <div className="container section">
        <div className="section-head">
          <h2 className="text-h2">
            {r.locale === 'fr-CA' ? `Autres services à ${name}` : `Other services in ${name}`}
          </h2>
        </div>
        {/* Cip yerine kart: ayni bilesen ana sayfada da kullaniliyor */}
        <ServiceTiles
          locale={r.locale}
          services={otherServices}
          citySlug={citySlug(r.city, r.locale)}
        />

        <div className="section-head" style={{ marginTop: 'calc(var(--section-y) * 0.8)' }}>
          <h2 className="text-h2">
            {r.locale === 'fr-CA' ? 'Villes à proximité' : 'Nearby cities'}
          </h2>
        </div>
        <div className="grid grid-3">
          {nearby.map((c) => (
            <Link
              key={c.id}
              href={`/${seg}/${citySlug(c, r.locale)}/${serviceSlug(r.service, r.locale)}/`}
              className="card card-hover city-card"
            >
              <span>
                <span style={{ display: 'block', fontWeight: 600 }}>{cityName(c, r.locale)}</span>
                <span className="text-body-sm dim">{svc}</span>
              </span>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Veri tarihi ve dil — cizgiyle ayrilmis dipnot */}
        <div className="page-footnote">
          {/*
            `tabular` YALNIZCA tarihin uzerinde: paragrafin tamamina
            verildiginde degisken font noktalama isaretlerini de sabit
            genislikte cizyor ve cumle sonundaki nokta bosluklu gorunuyor
            ("bookings ."). Tabular rakamlar icindir, cumle icin degil.
          */}
          <p className="dim text-body-sm">
            {r.locale === 'fr-CA' ? 'Données à jour au ' : 'Data as of '}
            <time className="tabular" dateTime={data.dataAsOf}>{dateFmt(data.dataAsOf, r.locale)}</time>
            {r.locale === 'fr-CA'
              ? ' — calculées à partir des réservations terminées.'
              : ' — calculated from completed bookings.'}
          </p>
          <a className="text-body-sm"
             href={landingUrl(r.city, r.service, r.locale === 'en-CA' ? 'fr-CA' : 'en-CA')}
             hrefLang={r.locale === 'en-CA' ? 'fr-CA' : 'en-CA'}
             style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}>
            {r.locale === 'en-CA' ? 'Voir en français' : 'View in English'}
          </a>
        </div>
      </div>
    </>
  );
}

void (undefined as unknown as ServiceType);
