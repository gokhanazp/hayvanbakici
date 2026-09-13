import { eq, and, asc } from 'drizzle-orm';
import type { Locale } from './types.js';
import { cities, provinceEnum } from '../schema/index.js';
import type { Database } from '../client.js';

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
  const rows = await db.select(SELECT).from(cities).orderBy(asc(cities.tier), asc(cities.slugEn));
  return rows.map(cast);
}

/** Yalnizca Tier-1 — build'de statik uretilecek sayfalar (yol haritasi §7.3) */
export async function listTier1Cities(db: Database): Promise<CityRecord[]> {
  const rows = await db.select(SELECT).from(cities).where(eq(cities.tier, 1)).orderBy(asc(cities.slugEn));
  return rows.map(cast);
}

export async function findCityBySlug(
  db: Database, slug: string, locale: Locale,
): Promise<CityRecord | null> {
  const col = locale === 'fr-CA' ? cities.slugFr : cities.slugEn;
  const rows = await db.select(SELECT).from(cities).where(and(eq(col, slug))).limit(1);
  return rows[0] ? cast(rows[0]) : null;
}

export function cityName(city: CityRecord, locale: Locale): string {
  return locale === 'fr-CA' ? city.nameFr : city.nameEn;
}

export function citySlug(city: CityRecord, locale: Locale): string {
  return locale === 'fr-CA' ? city.slugFr : city.slugEn;
}
