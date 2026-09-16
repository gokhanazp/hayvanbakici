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
import { SearchBar } from '@/components/SearchBar';
import { SectionDoodles } from '@/components/Doodles';
import { PHOTOS, type PhotoId } from '@/lib/photos';
import { cityName, citySlug, findCityBySlug, getCities, getLandingData, getTier1Cities, type CityRecord, type LandingData } from '@/lib/data';
import { alternatesFor, landingJsonLd, landingUrl, robotsFor, urlFor } from '@/lib/seo';
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

  const data = await getLandingData(r.city, r.service, r.locale);
  const m = getMessages(r.locale);
  const name = cityName(r.city, r.locale);
  const svc = m.service[r.service];

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

  const data = await getLandingData(r.city, r.service, r.locale);
  const rule = evaluateIndexability({ sitterCount: data.sitterCount });

  // ARZ ESIGI: 0 bakici -> sayfa HIC URETILMEZ (404). Doorway cezasina karsi savunma.
  if (!rule.shouldRender) notFound();

  const m = getMessages(r.locale);
  const name = cityName(r.city, r.locale);
  const svc = m.service[r.service];
  const faqs = buildFaqs(data, r.locale, name, svc);
  const seg = segmentFor(r.locale);

  const allCities = await getCities();
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
        SAYFA BASLIGI RENKLI BANTTA.
        Ana sayfayla ayni dil: ilk ekran sicak bir bant, govde krem. Fotograf
        basligin YANINDA, altinda degil — metin fotografin uzerine binmedigi
        icin hangi fotograf gelirse gelsin kontrast garantisi bozulmuyor.
      */}
      <section className="band band-blush band-round-b has-doodles">
        <SectionDoodles set="pageHead" />
        <div className="container page-head page-head-with-search">
          <nav aria-label="Breadcrumb" className="text-body-sm" style={{ marginBottom: 'var(--space-5)' }}>
            <ol className="row" style={{ gap: 'var(--space-2)', listStyle: 'none', padding: 0 }}>
              <li><Link href={`/${seg}`} className="muted">{m.brand.name.toLowerCase()}</Link></li>
              <li aria-hidden="true" className="dim">/</li>
              <li className="dim">{r.city.province}</li>
              <li aria-hidden="true" className="dim">/</li>
              <li>{name}</li>
            </ol>
          </nav>

          <div className="page-head-grid">
            <div>
              {/*
                HANGI HIZMET — IKONLA. Baslikta hizmetin adi zaten
                geciyor ama sayfa "Toronto" ile basliyordu; rozet, ana
                sayfadaki kartla AYNI ikonu kullanarak nereye gelindigini
                bir bakista soyluyor.
              */}
              <p className="hero-eyebrow">
                <ServiceIcon service={r.service} size={17} />
                {m.service[r.service]}
              </p>

              <h1 className="text-h1" style={{ marginBottom: 'var(--space-3)' }}>
                {r.locale === 'fr-CA' ? `${svc} à ${name}` : `${svc} in ${name}`}
              </h1>
              {/* Cevap-once paragrafi: ilk 40-60 kelimede tam cevap (§7.10) */}
              <p className="text-body-lg muted" style={{ maxWidth: '38rem', marginBottom: 'var(--space-7)' }}>
                {m.serviceDescription[r.service]}
              </p>

              {/*
                Sayilar HAP degil BLOK. Ayni veri ana sayfada tek satirlik
                bir hapta duruyor; burada sayfanin tek somut kaniti o uc
                sayi ve kahramanin yarisi bos kaliyordu.
              */}
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

            <div className="photo-frame page-head-photo">
              <Photo id={cityPhotoId(r.city.slugEn)} locale={r.locale}
                     sizes="(min-width: 900px) 26rem, 100vw" priority />
            </div>
          </div>
        </div>
      </section>

      {/*
        ARAMA KARTI BANDIN ALTINA BINIYOR — ana sayfayla ayni hareket.
        Bu sayfaya gelen kisi hizmeti ve sehri SECMIS durumda; eksik olan
        mahalle ve tarih. Kutu o ikisiyle ilgilendigi icin hizmet ve
        konum onceden dolu geliyor: sifirdan bir arama degil, buradaki
        aramanin devami.
      */}
      <section className="container hero-search">
        <SearchBar
          locale={r.locale}
          defaults={{ service: serviceSlug(r.service, r.locale), location: name }}
        />
      </section>

      <div className="container section">

        {/* Arz yetersizse bekleme listesi — sayfa noindex olur ama kullaniciya deger sunar */}
        {rule.showWaitlist && (
          <div
            className="card card-pad"
            style={{ marginTop: 'var(--space-6)', background: 'var(--color-accent-subtle)', borderColor: 'transparent' }}
          >
            <h2 className="text-h4" style={{ marginBottom: 'var(--space-2)' }}>{m.seo[rule.reasonKey.split('.')[1] as keyof typeof m.seo]}</h2>
            <p className="muted text-body-sm" style={{ marginBottom: 'var(--space-4)' }}>
              {m.search.noResults}
            </p>
            <button className="btn btn-primary" type="button">{m.search.joinWaitlist}</button>
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
