import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getMessages, interpolate, localeFromSegment, segmentFor, serviceFromSlug, serviceSlug,
  type Locale, type Messages,
} from '@havre/i18n';
import {
  SERVICES, servicesForPhase, PET_SIZE_STEPS, petSizeForKg,
  type ServiceType, type PetSizeKey,
} from '@havre/core';
import { SearchBar } from '@/components/SearchBar';
import { SEARCH_PAGE_SIZE } from '@havre/db';
import { SitterCard } from '@/components/SitterCard';
import { Sym } from '@/components/Sym';
import { SERVICE_SYM } from '@/components/ServiceIcon';
import {
  cityName, citySlug, countSitters, getLinkableCities, resolvePlace, searchSitters,
  isSearchSort, SEARCH_SORTS, favouriteIds,
  type PlaceMatch, type SearchResult, type SearchSort,
} from '@/lib/data';
import { money, numberFmt } from '@/lib/format';
import { getSession } from '@/lib/auth';
import { readAnonFavourites } from '@/lib/favourites';

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

/**
 * Sayfa numarasi. UST SINIR VAR: adres cubuguna `?page=999999` yazan bir
 * istek, kocaman bir OFFSET ile veritabanini bosuna calistirirdi.
 */
const MAX_PAGE = 100;
const readPage = (v: string): number => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= MAX_PAGE ? n : 1;
};

/**
 * EVCIL HAYVAN AGIRLIGI — ARAMA SAYFASI BUNU OKUMUYORDU.
 *
 * Anasayfadaki arama kutusunda "Evcil hayvaniniz / kg" alani var ve
 * formu `weight` olarak gonderiyordu; bu sayfa parametreyi hic
 * okumuyordu. Yani kullanici kilo yaziyor, hicbir sey degismiyordu —
 * ustelik arka uc (`petWeightKg`) bastan beri destekliyor ve bakicinin
 * kabul ettigi boyutlara gore suzuyor. Simdi okunuyor.
 */
const MAX_PET_KG = 100;
const readWeight = (v: string): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n <= MAX_PET_KG ? n : 0;
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
  const petWeightKg = readWeight(one(sp.weight));
  const needsCats = one(sp.cats) === '1';
  const requireFencedYard = one(sp.yard) === '1';
  const minBadge = readBadge(one(sp.badge));
  /* Siralama da adreste: paylasilan bag ayni sirayi acar */
  const sortParam = one(sp.sort);
  const sort: SearchSort = isSearchSort(sortParam) ? sortParam : 'best';
  /* Sayfa adresten: geri tusu calissin, bag paylasilabilsin, JS'siz gezilsin */
  let page = readPage(one(sp.page));

  const place: PlaceMatch | null = location ? await resolvePlace(location, locale) : null;

  let results: SearchResult[] = [];
  let total = 0;
  if (place) {
    const criteria = {
      serviceType: service,
      lon: place.lon,
      lat: place.lat,
      radiusMeters: radiusKm * 1000,
      ...(start && end ? { startDate: start, endDate: end } : {}),
      ...(needsCats ? { needsCats: true } : {}),
      ...(requireFencedYard ? { requireFencedYard: true } : {}),
      ...(maxPrice > 0 ? { maxPriceCents: maxPrice * 100 } : {}),
      ...(petWeightKg > 0 ? { petWeightKg } : {}),
      ...(minBadge > 0 ? { minBadgeLevel: minBadge } : {}),
      sort,
    };
    /*
      ONCE SAYIM, SONRA LISTE.
      Ikisini paralel calistirmak bir istek tasarruf ediyordu ama adres
      cubuguna var olmayan bir sayfa numarasi yazildiginda ekran BOS bir
      izgara ve "Sayfa 50 / 2" gosteriyordu. Sayimi once yapip sayfayi son
      sayfaya kirpmak, bir sorgu daha calistirmaya deger.
    */
    total = await countSitters(criteria);
    const pages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
    page = Math.min(page, pages);

    results = await searchSitters(
      { ...criteria, limit: SEARCH_PAGE_SIZE, offset: (page - 1) * SEARCH_PAGE_SIZE },
      locale,
    );
  }

  /*
    KALPLERIN DURUMU — SAYFA BASINA TEK SORGU.

    Kart basina "bu favori mi" diye sormak 24 sorgu demekti. Giris
    yapmis kullanicida tek sorgu tum kimlikleri getiriyor, giris
    yapmamista liste zaten cerezde ve istekle birlikte gelmis oluyor.
  */
  /*
    HIZMET BASINA SAYI. Tasarimda hizmet secimindeki her satirin
    yaninda bir rakam duruyor ("Dog Walking (48)"). Sahibin bilmesi
    gereken sey bu: baska bir hizmete gecerse kac bakici bulacak.
    Dort sayim PARALEL ve ayni kriterlerle — yalnizca hizmet degisiyor.
    Sayfa zaten dinamik (force-dynamic), ISR'yi bozmuyor.
  */
  const serviceCounts = new Map<ServiceType, number>();
  if (place) {
    const base = {
      lon: place.lon,
      lat: place.lat,
      radiusMeters: radiusKm * 1000,
      ...(start && end ? { startDate: start, endDate: end } : {}),
      ...(petWeightKg > 0 ? { petWeightKg } : {}),
    };
    const counts = await Promise.all(
      LIVE_SERVICES.map((sv) => countSitters({ ...base, serviceType: sv })),
    );
    LIVE_SERVICES.forEach((sv, i) => serviceCounts.set(sv, counts[i] ?? 0));
  }

  const session = await getSession();
  const favIds = session
    ? await favouriteIds(session.user.id)
    : new Set(await readAnonFavourites());

  const pageCount = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  const first = total === 0 ? 0 : (page - 1) * SEARCH_PAGE_SIZE + 1;
  const last = Math.min(page * SEARCH_PAGE_SIZE, total);

  /**
   * MEVCUT ARAMANIN ADRESI, bir iki parametresi degistirilmis hali.
   *
   * Sayfalama ve siralama ayni yerden ureliyor: iki ayri kurucu olsa,
   * birine eklenen bir filtre digerinde unutulur ve "siralamayi
   * degistirince filtrelerim ucuyor" hatasi cikardi. Bos deger
   * parametreyi KALDIRIR (varsayilana donus).
   */
  const queryWith = (overrides: Record<string, string> = {}) => {
    const q = new URLSearchParams();
    if (serviceParam) q.set('service', serviceParam);
    if (location) q.set('location', location);
    if (start) q.set('start', start);
    if (end) q.set('end', end);
    if (radiusKm !== 15) q.set('radius', String(radiusKm));
    if (maxPrice > 0) q.set('price', String(maxPrice));
    if (petWeightKg > 0) q.set('weight', String(petWeightKg));
    if (needsCats) q.set('cats', '1');
    if (requireFencedYard) q.set('yard', '1');
    if (minBadge > 0) q.set('badge', String(minBadge));
    if (sort !== 'best') q.set('sort', sort);

    for (const [key, value] of Object.entries(overrides)) {
      if (value === '') q.delete(key);
      else q.set(key, value);
    }
    return `/${segmentFor(locale)}/search/?${q.toString()}`;
  };

  /* Sayfa degisirken siralama ve filtreler korunuyor. */
  const pageHref = (n: number) => queryWith({ page: n > 1 ? String(n) : '' });

  const cities = await getLinkableCities();
  const placeLabel = place?.label ?? location;

  /*
    MAHALLE OZETI — sag sutun.

    Tasarimda sagda Toronto haritasi ve uzerinde fiyat igneleri var.
    Harita henuz yok (MapLibre + kendi karo dosyamiz planlandi), ama o
    panelin SOYLEDIGI sey haritasiz da verilebilir: sonuclar hangi
    mahallelerde ve orada fiyat ne. Ikisi de zaten elimizdeki
    sonuclardan cikiyor, yeni sorgu yok ve uydurma sayi yok.
  */
  const hoods = (() => {
    const by = new Map<string, { count: number; prices: number[] }>();
    for (const r of results) {
      const k = r.neighbourhood || placeLabel;
      const e = by.get(k) ?? { count: 0, prices: [] };
      e.count += 1;
      e.prices.push(r.priceCents);
      by.set(k, e);
    }
    return [...by.entries()]
      .map(([name, e]) => {
        const sorted = [...e.prices].sort((x, y) => x - y);
        return { name, count: e.count, median: sorted[Math.floor(sorted.length / 2)] ?? 0 };
      })
      .sort((a, b) => b.count - a.count);
  })();

  const unit = m.unit[SERVICES[service].unit];

  const summary = [
    { key: 'service', tone: 'sage', sym: SERVICE_SYM[service], label: t.summaryService, value: m.service[service] },
    { key: 'place', tone: 'coral', sym: 'location' as const, label: t.summaryLocation, value: placeLabel || t.titleEmpty },
    { key: 'dates', tone: 'gold', sym: 'calendar' as const, label: t.summaryDates, value: start && end ? dateRange(start, end, locale) : t.summaryAnyDates },
    { key: 'pet', tone: 'sage', sym: 'rabbit' as const, label: t.summaryPet, value: petWeightKg > 0 ? `${petWeightKg} kg` : t.summaryAnyPet },
  ] as const;

  return (
    <>
      {/* ================= UST OZET CUBUGU ================= */}
      <section className="sr-top">
        <div className="st-wrap">
          <div className="sr-summary">
            <div className="sr-summary-grid">
              {summary.map((item) => (
                <div key={item.key} className="sr-sum">
                  <span className={`sr-sum-ic sr-sum-${item.tone}`} aria-hidden="true">
                    <Sym name={item.sym} size={20} />
                  </span>
                  <span className="sr-sum-text">
                    <span className="sr-sum-label">{item.label}</span>
                    <span className="sr-sum-value">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>

            {/*
              Tasarimda ozet kutulari tiklanabilir ve sagda "Update
              Filters" dugmesi var; neyi actigi cizilmemis. Bizde aciklik
              olmali: dugme arama kutusunu aciyor ve o kutu zaten var
              (SearchBar). <details>, yani JavaScript'siz calisiyor.
            */}
            <details className="sr-edit">
              <summary className="sr-edit-btn">
                <Sym name="tune" size={18} />
                {t.editSearch}
              </summary>
              <div className="sr-edit-body">
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
            </details>
          </div>
        </div>
      </section>

      <div className="st-wrap sr-body">
        <h1 className="sr-h1">
          {place ? interpolate(t.title, { place: placeLabel }) : t.titleEmpty}
        </h1>

        {location && !place && (
          <div className="notice notice-warning" style={{ marginBottom: 'var(--space-6)' }}>
            <p>{interpolate(t.notFound, { query: location })}</p>
          </div>
        )}

        {place?.approximate && (
          <p className="field-hint" style={{ marginBottom: 'var(--space-5)' }}>
            {interpolate(t.approximate, { place: placeLabel })}
          </p>
        )}

        {!location && <p className="text-body-lg muted">{t.empty}</p>}

        {place && (
          <div className="sr-grid">
            {/* ---------------- SOL: filtreler + liste ---------------- */}
            <div className="sr-main">
              <Filters
                locale={locale}
                service={serviceSlug(service, locale)}
                location={location}
                start={start}
                end={end}
                radiusKm={radiusKm}
                maxPrice={maxPrice}
                petWeightKg={petWeightKg}
                needsCats={needsCats}
                requireFencedYard={requireFencedYard}
                minBadge={minBadge}
                unit={unit}
                counts={serviceCounts}
              />

              <div className="sr-head">
                <div className="sr-head-left">
                  <h2 className="sr-h2">
                    {total === 1
                      ? t.resultsHeadingOne
                      : interpolate(t.resultsHeading, { count: numberFmt(total, locale) })}
                  </h2>
                  <span className="sr-head-sub">{placeLabel}</span>
                </div>
                {/*
                  SIRALAMA — JS'siz, her secenek bir BAGLANTI. Tasarimda
                  bir <select> var; o JavaScript olmadan secim yapsa bile
                  sayfayi degistiremez. Baglanti ayni isi goruyor,
                  ustelik paylasilan bag ayni sirayi aciyor.

                  SIRALAMA SATILIK DEGIL ve olmayacak.
                */}
                <nav className="sr-sort" aria-label={t.sortLabel}>
                  <span className="sr-sort-label">{t.sortLabel}</span>
                  {SEARCH_SORTS.map((option) => (
                    <Link
                      key={option}
                      href={queryWith({ sort: option === 'best' ? '' : option, page: '' })}
                      className={`sr-sort-opt${option === sort ? ' is-on' : ''}`}
                      aria-current={option === sort ? 'true' : undefined}
                    >
                      {t[`sort.${option}` as keyof typeof t]}
                    </Link>
                  ))}
                </nav>
              </div>

              {start && end && (
                <p className="sr-note">
                  {interpolate(t.openOnDates, { dates: dateRange(start, end, locale) })}
                  {' · '}
                  <Link href={`/${segmentFor(locale)}/protection/`}>{m.verification.whatTheseMean}</Link>
                </p>
              )}

              {results.length === 0 ? (
                <div className="sr-empty">
                  {/*
                    BOS SONUCUN IKI AYRI SEBEBI VAR VE AYNI CUMLE OLAMAZ.
                    Kapali bir sehirde "bu filtrelere uyan bakici yok"
                    demek yanlis yone gonderir: kullanici yaricapi
                    buyutur, fiyati acar, hicbiri degismez -- cunku sorun
                    filtreler degil, orada hic olmayisimiz.
                  */}
                  <h3 className="sr-h3">
                    {place.cityIsLive
                      ? interpolate(t.noMatches, { radius: String(radiusKm), place: placeLabel })
                      : interpolate(m.coverage.heading, {
                        city: locale === 'fr-CA' ? place.cityNameFr : place.cityNameEn,
                      })}
                  </h3>
                  <p className="muted">
                    {place.cityIsLive
                      ? t.noMatchesHint
                      : interpolate(m.coverage.lead, {
                        city: locale === 'fr-CA' ? place.cityNameFr : place.cityNameEn,
                      })}
                  </p>
                  <p style={{ marginTop: 'var(--space-5)' }}>
                    <Link
                      href={`/${segmentFor(locale)}/${locale === 'fr-CA' ? place.citySlugFr : place.citySlugEn}/${serviceSlug(service, locale)}/`}
                      className="st-ghost-btn"
                    >
                      {interpolate(t.resultsFor, {
                        service: m.service[service],
                        place: locale === 'fr-CA' ? place.cityNameFr : place.cityNameEn,
                      })}
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="sr-list">
                  {results.map((r) => (
                    <SitterCard
                      key={r.id}
                      sitter={r}
                      serviceType={service}
                      locale={locale}
                      layout="row"
                      citySlug={locale === 'fr-CA' ? place.citySlugFr : place.citySlugEn}
                      distanceLabel={interpolate(t.distance, {
                        km: (Math.round(r.distanceMeters / 100) / 10).toFixed(1),
                      })}
                      favourite={{ isFavourite: favIds.has(r.id), path: `/${seg}/search/` }}
                    />
                  ))}
                </div>
              )}

              {pageCount > 1 && (
                <>
                  {/*
                    NUMARALI SAYFALAMA — tasarimdaki yuvarlak dugmeler.
                    Her numara bir BAGLANTI: JavaScript'siz calisiyor,
                    paylasilabiliyor ve geri tusu dogru davraniyor.
                    Cok sayfada hepsi cizilmiyor; ilk, son ve gecerli
                    sayfanin iki komsusu kaliyor, arasi "…" oluyor.
                  */}
                  <nav className="sr-pages" aria-label={t.pagination}>
                    {page > 1 ? (
                      <Link href={pageHref(page - 1)} className="sr-pg sr-pg-arrow" rel="prev" aria-label={t.previous}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m14 6-6 6 6 6" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="sr-pg sr-pg-arrow is-off" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m14 6-6 6 6 6" /></svg>
                      </span>
                    )}

                    {pageWindow(page, pageCount).map((n, i) => (
                      n === 0
                        ? <span key={`gap-${i}`} className="sr-pg-gap" aria-hidden="true">…</span>
                        : (
                          <Link
                            key={n}
                            href={pageHref(n)}
                            className={`sr-pg${n === page ? ' is-on' : ''}`}
                            aria-current={n === page ? 'page' : undefined}
                          >
                            <span className="tabular">{numberFmt(n, locale)}</span>
                          </Link>
                        )
                    ))}

                    {page < pageCount ? (
                      <Link href={pageHref(page + 1)} className="sr-pg sr-pg-arrow" rel="next" aria-label={t.next}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m10 6 6 6-6 6" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="sr-pg sr-pg-arrow is-off" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10 6 6 6-6 6" /></svg>
                      </span>
                    )}
                  </nav>
                  <p className="sr-pager-at tabular">
                    {interpolate(t.showingRange, {
                      first: numberFmt(first, locale),
                      last: numberFmt(last, locale),
                      total: numberFmt(total, locale),
                    })}
                  </p>
                </>
              )}
            </div>

            {/* ---------------- SAG: mahalle paneli ---------------- */}
            <aside className="sr-aside" aria-labelledby="sr-aside-h">
              <div className="sr-aside-card">
                <h2 className="sr-aside-h" id="sr-aside-h">{t.asideHeading}</h2>
                <p className="sr-aside-lead">{t.asideLead}</p>
                {hoods.length > 0 ? (
                  <ul className="sr-hoods">
                    {hoods.map((h) => (
                      <li key={h.name} className="sr-hood">
                        <span className="sr-hood-ic" aria-hidden="true"><Sym name="location" size={16} /></span>
                        <span className="sr-hood-text">
                          <span className="sr-hood-name">{h.name}</span>
                          <span className="sr-hood-sub">
                            {h.count === 1
                              ? t.asideSittersOne
                              : interpolate(t.asideSitters, { count: numberFmt(h.count, locale) })}
                            {h.median > 0 && (
                              <> · {interpolate(t.asidePrice, { price: money(h.median, locale), unit })}</>
                            )}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="sr-aside-lead">{t.noMatchesHint}</p>
                )}
                <p className="sr-aside-note">{t.asideMapNote}</p>
              </div>

              <ul className="sr-trust">
                <li><Sym name="verified" size={18} />{m.home.ribbonChecks}</li>
                <li><Sym name="shield" size={18} />{m.home.ribbonFees}</li>
                <li><Sym name="calendar" size={18} />{m.home.ribbonExpiry}</li>
                <li><Sym name="globe" size={18} />{m.home.ribbonCanada}</li>
              </ul>
            </aside>
          </div>
        )}

        {(!place || results.length === 0) && cities.length > 0 && (
          <section className="sr-cities">
            <h2 className="sr-h3">{t.browseCities}</h2>
            <div className="row">
              {cities.map((c) => (
                <Link
                  key={c.id}
                  href={`/${segmentFor(locale)}/${citySlug(c, locale)}/${serviceSlug(service, locale)}/`}
                  className="st-ghost-btn"
                >
                  {cityName(c, locale)}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/*
        ALT GUVEN BANDI — tasarimda koyu yesil, tam genislikte.

        Tasarimdaki metin "$2.000.000 CAD veteriner ve sorumluluk
        teminati" ve "7/24 Kanada destegi" diyor. IKISI DE BIZDE YOK ve
        yazilmadi: bir teminat tutari uydurmak, sahibin bir sorun
        aninda guvenecegi seyi uydurmak demek. Bandin metni sayfanin
        geri kalaninda da gecen gercek sozler.
      */}
      <section className="sr-band">
        <div className="st-wrap sr-band-in">
          <div className="sr-band-left">
            <span className="sr-band-ic" aria-hidden="true"><Sym name="shield" size={30} /></span>
            <div>
              <p className="sr-band-h">{m.home.shieldHeading}</p>
              <p className="sr-band-p">{m.footer.trustGuarantee}</p>
            </div>
          </div>
          <Link href={`/${seg}/protection/`} className="sr-band-btn">{m.verification.whatTheseMean}</Link>
        </div>
      </section>
    </>
  );
}

/**
 * Sayfalama penceresi: ilk, son, gecerli sayfa ve iki komsusu.
 * 0 degeri "…" demek. Sekiz sayfaya kadar hepsi cizilir — kirpmak
 * yalnizca uzun listelerde anlamli.
 */
function pageWindow(page: number, pages: number): number[] {
  if (pages <= 8) return Array.from({ length: pages }, (_, i) => i + 1);
  const out = new Set<number>([1, pages, page]);
  if (page - 1 > 1) out.add(page - 1);
  if (page + 1 < pages) out.add(page + 1);
  const sorted = [...out].sort((a, b) => a - b);
  const withGaps: number[] = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - (sorted[i - 1] ?? 0) > 1) withGaps.push(0);
    withGaps.push(n);
  });
  return withGaps;
}

/** "12 – 15 Eki 2026" — arama ozetinde ve sonuc satirinda ayni bicim. */
function dateRange(start: string, end: string, locale: Locale): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
  const a = new Date(`${start}T00:00:00Z`);
  const b = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';
  return a.getTime() === b.getTime() ? fmt.format(a) : `${fmt.format(a)} – ${fmt.format(b)}`;
}

/**
 * FILTRE TEPSISI — tasarimdaki "Refine Sitter Search" karti.
 *
 * JS'siz calisan bir GET formu: her filtre adresin bir parcasi, sonuc
 * paylasilabilir ve geri tusu beklendigi gibi calisir. Gizli alanlar
 * konum ve tarihi tasiyor, aksi halde filtre uygulandiginda arama
 * sifirlanirdi.
 *
 * FIYAT KAYDIRICI DEGIL, HAP. Tasarimda `<input type="range">` var ve
 * yaninda "$25 - $45 CAD/hr" yaziyor. O yazi JavaScript'le guncelleniyor;
 * JavaScript gelmeden kaydiricinin nerede durdugunu kullanici GOREMEZ
 * (CSS bir range degerini okuyamaz). Haplar ayni araligi veriyor ve
 * secilen deger her zaman ekranda yaziyor.
 *
 * TELEFONDA KATLANIYOR. 390px'de arama kutusu ve filtre karti ust uste
 * duruyordu: tek bir bakici gormeden iki ekran kaydirmak gerekiyordu.
 * Acma/kapama JS'siz: gorunmeyen ama odaklanabilir bir onay kutusu ve
 * ona bagli etiket. Kutunun `name`i yok, yani forma dahil olmuyor.
 * <details> kullanmadik: genis ekranda KAPALI bir <details>'i CSS ile
 * acik gostermek tarayicilar arasinda guvenilir degil.
 *
 * FILTRE UYGULANMISSA ACIK BASLIYOR.
 */
function Filters({
  locale, service, location, start, end, radiusKm, maxPrice, petWeightKg,
  needsCats, requireFencedYard, minBadge, unit, counts,
}: {
  locale: Locale;
  service: string;
  location: string;
  start: string;
  end: string;
  radiusKm: number;
  maxPrice: number;
  petWeightKg: number;
  needsCats: boolean;
  requireFencedYard: boolean;
  minBadge: 0 | 1 | 2 | 3 | 4;
  unit: string;
  counts: Map<ServiceType, number>;
}) {
  const m = getMessages(locale);
  const t = m.searchPage;
  const seg = segmentFor(locale);

  const activeCount = [
    radiusKm !== 15, maxPrice > 0, petWeightKg > 0, needsCats, requireFencedYard, minBadge > 0,
  ].filter(Boolean).length;

  /* Secili kilo hangi kademeye dusuyor — hapin isaretli gorunmesi icin */
  const activeSize = petWeightKg > 0 ? petSizeForKg(petWeightKg) : null;

  return (
    <form method="get" action={`/${seg}/search/`} className="sr-filters">
      <input type="hidden" name="location" value={location} />
      {start && <input type="hidden" name="start" value={start} />}
      {end && <input type="hidden" name="end" value={end} />}

      <input
        type="checkbox" id="filters-open" className="sr-filters-toggle"
        defaultChecked={activeCount > 0}
      />
      {/* Tasarimda baslik solda, "Reset All" ayni satirin saginda */}
      <div className="sr-filters-head">
        <label htmlFor="filters-open" className="sr-filters-summary">
          <Sym name="tune" size={22} />
          <span className="sr-filters-title">{t.refine}</span>
          {activeCount > 0 && <span className="sr-filters-count tabular">{activeCount}</span>}
        </label>
        {activeCount > 0 && (
          <Link
            className="sr-reset"
            href={`/${seg}/search/?service=${encodeURIComponent(service)}&location=${encodeURIComponent(location)}${start ? `&start=${start}` : ''}${end ? `&end=${end}` : ''}`}
          >
            {t.resetAll}
          </Link>
        )}
      </div>

      <div className="sr-filters-body">
        {/*
          HIZMET SECIMI — tasarimda iki sutunlu bir izgara, her satirda
          bir kutu ve sagda o hizmette kac bakici oldugu. Sayilar
          GERCEK: ayni konum, yaricap ve tarihlerle sayiliyor.
        */}
        <fieldset className="sr-fset">
          <legend className="sr-leg">{t.serviceHeading}</legend>
          <div className="sr-svc-grid">
            {LIVE_SERVICES.map((sv) => {
              const slug = serviceSlug(sv, locale);
              const n = counts.get(sv);
              return (
                <label key={sv} className="sr-svc">
                  <input type="radio" name="service" value={slug} defaultChecked={slug === service} />
                  <span className="sr-svc-box" aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                      strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 8.4 3.2 3.2L13 4.8" />
                    </svg>
                  </span>
                  <span className="sr-svc-name">{m.service[sv]}</span>
                  {n !== undefined && <span className="sr-svc-n tabular">({numberFmt(n, locale)})</span>}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="sr-fset">
          <legend className="sr-leg">{interpolate(t.priceHeading, { unit })}</legend>
          <div className="sr-pills">
            {[0, 30, 45, 60, 80, 120].map((v) => (
              <label key={v} className="sr-pill">
                <input type="radio" name="price" value={String(v)} defaultChecked={maxPrice === v} />
                <span>{v === 0 ? t.anyPrice : `≤ ${money(v * 100, locale)}`}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/*
          BOYUT HAPLARI KILO GONDERIYOR. Arka uc kiloyu kademeye cevirip
          bakicinin KABUL ETTIGI boyutlar kumesinde ariyor; gonderilen
          deger kademenin orta noktasi.
        */}
        {/*
          BOYUT — tasarimda dort kutucuk: ustte ad, altinda kilo araligi.
          Haplar kilo gonderiyor; arka uc kiloyu kademeye cevirip
          bakicinin KABUL ETTIGI boyutlar kumesinde ariyor.
        */}
        <fieldset className="sr-fset">
          <legend className="sr-leg">{t.sizeHeading}</legend>
          <div className="sr-size-grid">
            <label className="sr-size">
              <input type="radio" name="weight" value="" defaultChecked={activeSize === null} />
              <span className="sr-size-name">{t.anySize}</span>
              <span className="sr-size-range">—</span>
            </label>
            {PET_SIZE_STEPS.map((step) => (
              <label key={step.key} className="sr-size">
                <input
                  type="radio" name="weight"
                  value={String(Math.round((step.minKg + step.maxKg) / 2))}
                  defaultChecked={activeSize === step.key}
                />
                <span className="sr-size-name">
                  {m.onboarding[`services.size.${step.key}` as keyof typeof m.onboarding] as string}
                </span>
                <span className="sr-size-range tabular">{sizeLabel(m, step.key, step)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="sr-fset">
          <legend className="sr-leg">{t.radiusHeading}</legend>
          <div className="sr-pills">
            {RADIUS_KM.map((km) => (
              <label key={km} className="sr-pill">
                <input type="radio" name="radius" value={String(km)} defaultChecked={radiusKm === km} />
                <span className="tabular">{km} km</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="sr-fset">
          <legend className="sr-leg">{t.environmentHeading}</legend>
          <div className="sr-pills">
            <label className="sr-pill">
              <input type="checkbox" name="yard" value="1" defaultChecked={requireFencedYard} />
              <span>{t.yard}</span>
            </label>
            <label className="sr-pill">
              <input type="checkbox" name="cats" value="1" defaultChecked={needsCats} />
              <span>{t.cats}</span>
            </label>
          </div>
          <div className="sr-pills">
            <label className="sr-pill">
              <input type="radio" name="badge" value="0" defaultChecked={minBadge === 0} />
              <span>{t.anyBadge}</span>
            </label>
            {([
              [1, m.verification.identity], [2, m.verification.criminal],
              [3, m.verification.licence], [4, m.verification.certification],
            ] as const).map(([lvl, label]) => (
              <label key={lvl} className="sr-pill">
                <input type="radio" name="badge" value={String(lvl)} defaultChecked={minBadge === lvl} />
                <Sym name="verified" size={16} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="sr-filters-foot">
          <button type="submit" className="sr-apply">{t.apply}</button>
        </div>
      </div>
    </form>
  );
}

/** V1 hizmetleri — filtre tepsisindeki hap grubu */
const LIVE_SERVICES = servicesForPhase('v1');

/** Bakici profilindeki ile AYNI metin: "7 kg'a kadar", "18-45 kg" */
function sizeLabel(
  m: Messages,
  key: PetSizeKey,
  step: { minKg: number; maxKg: number },
): string {
  if (key === 'small') return interpolate(m.sitter['pets.sizeSmall'], { max: step.maxKg });
  if (key === 'giant') return interpolate(m.sitter['pets.sizeGiant'], { min: step.minKg });
  return interpolate(m.sitter['pets.sizeBand'], { min: step.minKg, max: step.maxKg });
}
