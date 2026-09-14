import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getMessages, interpolate, localeFromSegment, segmentFor, serviceFromSlug, serviceSlug,
  type Locale,
} from '@havre/i18n';
import { SERVICES, servicesForPhase, type ServiceType } from '@havre/core';
import { SearchBar } from '@/components/SearchBar';
import { SitterCard } from '@/components/SitterCard';
import { Select } from '@/components/ui/Select';
import {
  cityName, citySlug, getLinkableCities, resolvePlace, searchSitters,
  type PlaceMatch, type SearchResult,
} from '@/lib/data';
import { money, numberFmt } from '@/lib/format';

/**
 * ARAMA SONUCLARI.
 *
 * NOINDEX ve DINAMIK — bilincli:
 *  - Arama sonucu sayfalari sonsuz sayidadir (her filtre kombinasyonu bir
 *    adres). Indekslenirlerse Google'in gozunde site, aralarinda cok az fark
 *    olan on binlerce sayfaya doner; sehir/hizmet sayfalarinin degeri duser.
 *  - ISR de anlamsiz: musaitlik ve fiyat her istekte taze olmali.
 * Indekslenmesini istedigimiz sayfalar /[sehir]/[hizmet] adresleridir ve
 * onlar ISR ile uretiliyor.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

type Params = Promise<{ locale: string }>;
type Query = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v)?.trim() ?? '';

/** "15" -> 15000 m. Izinli degerler disi girdi varsayilana duser. */
const RADIUS_KM = [5, 10, 15, 30, 50] as const;
const readRadius = (v: string): number => {
  const n = Number(v);
  return (RADIUS_KM as readonly number[]).includes(n) ? n : 15;
};

const BADGES = [0, 1, 2, 3, 4] as const;
const readBadge = (v: string): 0 | 1 | 2 | 3 | 4 => {
  const n = Number(v);
  return (BADGES as readonly number[]).includes(n) ? (n as 0 | 1 | 2 | 3 | 4) : 0;
};

export default async function SearchPage({
  params, searchParams,
}: {
  params: Params;
  searchParams: Query;
}) {
  const [{ locale: seg }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);
  const t = m.searchPage;

  const serviceParam = one(sp.service);
  const service: ServiceType = serviceFromSlug(serviceParam, locale) ?? 'boarding';
  const location = one(sp.location);
  const start = one(sp.start);
  const end = one(sp.end);
  const radiusKm = readRadius(one(sp.radius));
  const maxPrice = Number(one(sp.price)) || 0;
  const needsCats = one(sp.cats) === '1';
  const requireFencedYard = one(sp.yard) === '1';
  const minBadge = readBadge(one(sp.badge));

  const place: PlaceMatch | null = location ? await resolvePlace(location, locale) : null;

  let results: SearchResult[] = [];
  if (place) {
    results = await searchSitters(
      {
        serviceType: service,
        lon: place.lon,
        lat: place.lat,
        radiusMeters: radiusKm * 1000,
        ...(start && end ? { startDate: start, endDate: end } : {}),
        ...(needsCats ? { needsCats: true } : {}),
        ...(requireFencedYard ? { requireFencedYard: true } : {}),
        ...(maxPrice > 0 ? { maxPriceCents: maxPrice * 100 } : {}),
        ...(minBadge > 0 ? { minBadgeLevel: minBadge } : {}),
        limit: 48,
      },
      locale,
    );
  }

  const cities = await getLinkableCities();
  const placeLabel = place?.label ?? location;

  return (
    <>
      {/* ---- Arama bandi: kullanicinin yazdiklari geri gosterilir ---- */}
      <section className="band band-blush band-round-b">
        <div className="container" style={{ paddingBlock: 'var(--space-8) var(--space-10)' }}>
          <h1 className="text-h1" style={{ marginBottom: 'var(--space-5)' }}>
            {place
              ? interpolate(t.title, { place: placeLabel })
              : t.titleEmpty}
          </h1>

          <SearchBar
            locale={locale}
            defaults={{
              service: serviceSlug(service, locale),
              location,
              start,
              end,
            }}
          />
        </div>
      </section>

      {/* Ust bosluk .section'dan daha kucuk: arama bandi zaten bir ayirici,
          uzerine tam bolum boslugu koyunca sonuclar sayfadan kopuyordu. */}
      <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
        {/* ---- Konum cozulemedi ---- */}
        {location && !place && (
          <div className="notice notice-warning" style={{ marginBottom: 'var(--space-8)' }}>
            <p>{interpolate(t.notFound, { query: location })}</p>
          </div>
        )}

        {/* ---- Posta kodu: sehir kesinligi ----
            Kullaniciya neyin eslestigini SOYLEMEK zorundayiz; sessizce
            sehir merkezine dusurmek, yanlis mesafeler gostermek olurdu. */}
        {place?.approximate && (
          <p className="field-hint" style={{ marginBottom: 'var(--space-6)' }}>
            {interpolate(t.approximate, { place: placeLabel })}
          </p>
        )}

        {!location && (
          <p className="text-body-lg muted" style={{ marginBottom: 'var(--space-8)' }}>
            {t.empty}
          </p>
        )}

        {place && (
          <>
            <Filters
              locale={locale}
              service={serviceSlug(service, locale)}
              location={location}
              start={start}
              end={end}
              radiusKm={radiusKm}
              maxPrice={maxPrice}
              needsCats={needsCats}
              requireFencedYard={requireFencedYard}
              minBadge={minBadge}
            />

            <p className="muted" style={{ margin: 'var(--space-8) 0 var(--space-5)' }}>
              {results.length === 1
                ? t.introOne
                : interpolate(t.intro, { count: numberFmt(results.length, locale) })}
            </p>

            {results.length === 0 ? (
              <div className="card card-pad" style={{ maxWidth: '42rem' }}>
                <h2 className="text-h4">
                  {interpolate(t.noMatches, { radius: String(radiusKm), place: placeLabel })}
                </h2>
                <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{t.noMatchesHint}</p>
                <p style={{ marginTop: 'var(--space-5)' }}>
                  <Link
                    href={`/${segmentFor(locale)}/${place.citySlugEn === '' ? '' : (locale === 'fr-CA' ? place.citySlugFr : place.citySlugEn)}/${serviceSlug(service, locale)}/`}
                    className="btn btn-secondary"
                  >
                    {interpolate(t.resultsFor, {
                      service: m.service[service],
                      place: locale === 'fr-CA' ? place.cityNameFr : place.cityNameEn,
                    })}
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid grid-cards">
                {results.map((s) => (
                  <SitterCard
                    key={s.id}
                    sitter={s}
                    serviceType={service}
                    locale={locale}
                    citySlug={locale === 'fr-CA' ? place.citySlugFr : place.citySlugEn}
                    distanceLabel={interpolate(t.distance, {
                      km: (Math.round(s.distanceMeters / 100) / 10).toFixed(1),
                    })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- Sehir listesi: hem bos durum hem de yonlendirme ---- */}
        {(!place || results.length === 0) && cities.length > 0 && (
          <section style={{ marginTop: 'calc(var(--section-y) * 0.8)' }}>
            <h2 className="text-h3" style={{ marginBottom: 'var(--space-4)' }}>{t.browseCities}</h2>
            <div className="row">
              {cities.map((c) => (
                <Link
                  key={c.id}
                  href={`/${segmentFor(locale)}/${citySlug(c, locale)}/${serviceSlug(service, locale)}/`}
                  className="chip"
                >
                  {cityName(c, locale)}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/**
 * FILTRELER — JS'siz calisan bir GET formu.
 *
 * Her filtre adresin bir parcasi: sonuc paylasilabilir ve geri tusu
 * beklendigi gibi calisir. Gizli alanlar hizmet/konum/tarihi tasir,
 * aksi halde filtre uygulandiginda arama sifirlanirdi.
 */
function Filters({
  locale, service, location, start, end, radiusKm, maxPrice, needsCats, requireFencedYard, minBadge,
}: {
  locale: Locale;
  service: string;
  location: string;
  start: string;
  end: string;
  radiusKm: number;
  maxPrice: number;
  needsCats: boolean;
  requireFencedYard: boolean;
  minBadge: 0 | 1 | 2 | 3 | 4;
}) {
  const m = getMessages(locale);
  const t = m.searchPage;
  const seg = segmentFor(locale);

  const priceOptions = [0, 30, 45, 60, 80, 120].map((v) => ({
    value: String(v),
    label: v === 0 ? t.anyPrice : money(v * 100, locale),
  }));

  return (
    <form method="get" action={`/${seg}/search/`} className="filters">
      <input type="hidden" name="service" value={service} />
      <input type="hidden" name="location" value={location} />
      {start && <input type="hidden" name="start" value={start} />}
      {end && <input type="hidden" name="end" value={end} />}

      <div className="field" style={{ flex: '0 1 11rem' }}>
        <label htmlFor="radius">{t.radius}</label>
        <Select
          id="radius" name="radius" value={String(radiusKm)}
          options={RADIUS_KM.map((km) => ({ value: String(km), label: `${km} km` }))}
        />
      </div>

      <div className="field" style={{ flex: '0 1 11rem' }}>
        <label htmlFor="price">{t.maxPrice}</label>
        <Select id="price" name="price" value={String(maxPrice)} options={priceOptions} />
      </div>

      <div className="field" style={{ flex: '0 1 12rem' }}>
        <label htmlFor="badge">{t.badge}</label>
        <Select
          id="badge" name="badge" value={String(minBadge)}
          options={[
            { value: '0', label: t.anyBadge },
            { value: '1', label: m.verification.identity },
            { value: '2', label: m.verification.criminal },
            { value: '3', label: m.verification.licence },
            { value: '4', label: m.verification.certification },
          ]}
        />
      </div>

      <label className="filter-check">
        <input type="checkbox" name="cats" value="1" defaultChecked={needsCats} />
        {t.cats}
      </label>

      <label className="filter-check">
        <input type="checkbox" name="yard" value="1" defaultChecked={requireFencedYard} />
        {t.yard}
      </label>

      <button type="submit" className="btn btn-secondary">{t.apply}</button>

      {(maxPrice > 0 || needsCats || requireFencedYard || minBadge > 0 || radiusKm !== 15) && (
        <Link
          className="btn btn-ghost"
          href={`/${seg}/search/?service=${encodeURIComponent(service)}&location=${encodeURIComponent(location)}${start ? `&start=${start}` : ''}${end ? `&end=${end}` : ''}`}
        >
          {t.clear}
        </Link>
      )}
    </form>
  );
}

void (undefined as unknown as typeof SERVICES);
void servicesForPhase;
