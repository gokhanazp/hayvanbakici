import { eq, and, asc, sql } from 'drizzle-orm';
import type { Locale } from './types.js';
import { cities, provinceEnum } from '../schema/index.js';
import { withDbErrors, type Database } from '../client.js';

export interface CityRecord {
  id: string;
  slugEn: string;
  slugFr: string;
  nameEn: string;
  nameFr: string;
  province: (typeof provinceEnum.enumValues)[number];
  tier: 1 | 2 | 3;
}

const SELECT = {
  id: cities.id, slugEn: cities.slugEn, slugFr: cities.slugFr,
  nameEn: cities.nameEn, nameFr: cities.nameFr,
  province: cities.province, tier: cities.tier,
} as const;

const cast = (r: { tier: number } & Omit<CityRecord, 'tier'>): CityRecord =>
  ({ ...r, tier: r.tier as 1 | 2 | 3 });

export async function listCities(db: Database): Promise<CityRecord[]> {
  const rows = await withDbErrors(() =>
    db.select(SELECT).from(cities).orderBy(asc(cities.tier), asc(cities.slugEn)));
  return rows.map(cast);
}

/** Yalnizca Tier-1 — build'de statik uretilecek sayfalar (yol haritasi §7.3) */
export async function listTier1Cities(db: Database): Promise<CityRecord[]> {
  const rows = await withDbErrors(() =>
    db.select(SELECT).from(cities).where(eq(cities.tier, 1)).orderBy(asc(cities.slugEn)));
  return rows.map(cast);
}

export async function findCityBySlug(
  db: Database, slug: string, locale: Locale,
): Promise<CityRecord | null> {
  const col = locale === 'fr-CA' ? cities.slugFr : cities.slugEn;
  const rows = await withDbErrors(() =>
    db.select(SELECT).from(cities).where(and(eq(col, slug))).limit(1));
  return rows[0] ? cast(rows[0]) : null;
}

export function cityName(city: CityRecord, locale: Locale): string {
  return locale === 'fr-CA' ? city.nameFr : city.nameEn;
}

export function citySlug(city: CityRecord, locale: Locale): string {
  return locale === 'fr-CA' ? city.slugFr : city.slugEn;
}


/**
 * ARZ ESIGINI GECEN SEHIRLER — alt bilgi ve gezinme baglantilari icin.
 *
 * NEDEN AYRI VE TEK SORGU: alt bilgi HER sayfada ciziliyor. Sehir basina
 * getLandingData() cagirmak, her sayfa yuklemesinde bes ayri percentile
 * agregasyonu demekti — oysa burada tek ihtiyacimiz bakici SAYISI.
 *
 * NEDEN ESIK: bos ya da ince bir sehir sayfasina baglanti vermek Google'a
 * "bu sayfa degerli" demektir. Degilse tum sitenin guveni zarar gorur
 * (yol haritasi §7.3 arz esigi kurali).
 */
export async function listCitiesWithSupply(
  db: Database,
  serviceType: string,
  minSitters = 3,
  tier?: 1 | 2 | 3,
): Promise<CityRecord[]> {
  const rows = await withDbErrors(() => db.execute(sql`
    SELECT c.id, c.slug_en, c.slug_fr, c.name_en, c.name_fr, c.province, c.tier,
           count(*)::int AS sitter_count
    FROM cities c
    JOIN profiles p       ON p.city_id = c.id
    JOIN sitters st       ON st.user_id = p.user_id AND st.status = 'active'
    JOIN sitter_services s ON s.sitter_id = st.user_id
                          AND s.is_active
                          AND s.service_type = ${serviceType}::service_type
    ${tier ? sql`WHERE c.tier = ${tier}` : sql``}
    GROUP BY c.id
    HAVING count(*) >= ${minSitters}
    ORDER BY c.tier ASC, count(*) DESC
  `));

  return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    slugEn: String(r.slug_en),
    slugFr: String(r.slug_fr),
    nameEn: String(r.name_en),
    nameFr: String(r.name_fr),
    province: r.province as CityRecord['province'],
    tier: Number(r.tier) as 1 | 2 | 3,
  }));
}
