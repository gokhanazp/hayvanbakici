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
import { TrustStrip } from '@/components/TrustStrip';
import { CITIES, cityName, citySlug, findCityBySlug, getLandingData, type CityRecord, type LandingData } from '@/lib/data';
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
export function generateStaticParams() {
  const services = servicesForPhase('v1');
  const params: Array<{ locale: string; city: string; service: string }> = [];
  for (const locale of ['en-CA', 'fr-CA'] as const) {
    for (const city of CITIES.filter((c) => c.tier === 1)) {
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
  const city = findCityBySlug(citySlugParam, locale);
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

  const nearby: CityRecord[] = CITIES.filter((c) => c.id !== r.city.id)
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

      <div className="container" style={{ paddingBlock: 'var(--space-10)' }}>
        <nav aria-label="Breadcrumb" style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-5)' }}>
          <ol className="row" style={{ gap: 'var(--space-2)', listStyle: 'none', padding: 0 }}>
            <li><Link href={`/${seg}`} className="muted">{m.brand.name}</Link></li>
            <li aria-hidden="true" className="muted">/</li>
            <li className="muted">{r.city.province}</li>
            <li aria-hidden="true" className="muted">/</li>
            <li>{name}</li>
          </ol>
        </nav>

        <h1 className="text-h1" style={{ marginBottom: 'var(--space-3)' }}>
          {r.locale === 'fr-CA' ? `${svc} à ${name}` : `${svc} in ${name}`}
        </h1>
        {/* Cevap-once paragrafi: ilk 40-60 kelimede tam cevap (§7.10) */}
        <p className="text-body-lg muted" style={{ maxWidth: '44rem', marginBottom: 'var(--space-6)' }}>
          {m.serviceDescription[r.service]}
        </p>

        <TrustStrip
          locale={r.locale}
          cityName={name}
          sitterCount={data.sitterCount}
          medianPriceCents={data.medianPriceCents}
          bookingCount={data.bookingCount}
        />

        {/* Arz yetersizse bekleme listesi — sayfa noindex olur ama kullaniciya deger sunar */}
        {rule.showWaitlist && (
          <div
            className="card"
            style={{ padding: 'var(--space-5)', marginTop: 'var(--space-6)', background: 'var(--color-accent-subtle)' }}
          >
            <h2 className="text-h4" style={{ marginBottom: 'var(--space-2)' }}>{m.seo[rule.reasonKey.split('.')[1] as keyof typeof m.seo]}</h2>
            <p className="muted" style={{ marginBottom: 'var(--space-4)', fontSize: '0.875rem' }}>
              {m.search.noResults}
            </p>
            <button className="btn btn-primary" type="button">{m.search.joinWaitlist}</button>
          </div>
        )}

        {data.sitters.length > 0 && (
          <section style={{ marginTop: 'var(--space-10)' }}>
            <h2 className="text-h3" style={{ marginBottom: 'var(--space-5)' }}>
              {interpolate(m.search.resultsCount, { count: numberFmt(data.sitterCount, r.locale) })}
            </h2>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
              {data.sitters.map((s) => (
                <SitterCard key={s.id} sitter={s} serviceType={r.service} locale={r.locale} />
              ))}
            </div>
          </section>
        )}

        {/* SSS — hem kullanici hem FAQPage semasi hem AI alinti kaynagi */}
        <section style={{ marginTop: 'var(--space-16)', maxWidth: '48rem' }}>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>
            {r.locale === 'fr-CA' ? 'Questions fréquentes' : 'Frequently asked questions'}
          </h2>
          <div className="stack">
            {faqs.map((f) => (
              <details key={f.q} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
                <summary style={{ fontWeight: 600, cursor: 'pointer', minHeight: '24px' }}>{f.q}</summary>
                <p className="muted" style={{ marginTop: 'var(--space-3)', fontSize: '0.9375rem' }}>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 'var(--space-16)' }}>
          <h2 className="text-h3" style={{ marginBottom: 'var(--space-4)' }}>
            {r.locale === 'fr-CA' ? 'Autres services à ' + name : 'Other services in ' + name}
          </h2>
          <div className="row">
            {otherServices.map((s) => (
              <Link
                key={s}
                href={`/${seg}/${citySlug(r.city, r.locale)}/${serviceSlug(s, r.locale)}`}
                className="btn btn-secondary"
              >
                {m.service[s]}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 'var(--space-10)' }}>
          <h2 className="text-h3" style={{ marginBottom: 'var(--space-4)' }}>
            {r.locale === 'fr-CA' ? 'Villes à proximité' : 'Nearby cities'}
          </h2>
          <div className="row">
            {nearby.map((c) => (
              <Link
                key={c.id}
                href={`/${seg}/${citySlug(c, r.locale)}/${serviceSlug(r.service, r.locale)}`}
                className="btn btn-ghost"
              >
                {svc} — {cityName(c, r.locale)}
              </Link>
            ))}
          </div>
        </section>

        <p className="muted" style={{ marginTop: 'var(--space-10)', fontSize: '0.75rem' }}>
          {r.locale === 'fr-CA' ? 'Données à jour au ' : 'Data as of '}
          <time dateTime={data.dataAsOf}>{dateFmt(data.dataAsOf, r.locale)}</time>
          {' · '}
          <a href={landingUrl(r.city, r.service, r.locale === 'en-CA' ? 'fr-CA' : 'en-CA')}
             hrefLang={r.locale === 'en-CA' ? 'fr-CA' : 'en-CA'}>
            {r.locale === 'en-CA' ? 'Voir en français' : 'View in English'}
          </a>
        </p>
      </div>
    </>
  );
}

void (undefined as unknown as ServiceType);
