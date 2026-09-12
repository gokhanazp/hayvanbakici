/**
 * VERI KATMANI — su anda tohum (seed) verisiyle calisir.
 *
 * Bu modulun IMZALARI kalicidir; govdeleri Faz 1'de @havre/db sorgulariyla
 * degistirilecek. Sayfalar bu arayuze bagli oldugu icin gecis sirasinda
 * UI'da hicbir degisiklik gerekmez.
 */
import type { ServiceType } from '@havre/core';
import type { Locale } from '@havre/i18n';

export interface CityRecord {
  id: string;
  slugEn: string;
  slugFr: string;
  nameEn: string;
  nameFr: string;
  province: 'ON' | 'QC' | 'BC' | 'AB';
  tier: 1 | 2 | 3;
}

export const CITIES: CityRecord[] = [
  { id: 'c-toronto',   slugEn: 'toronto',   slugFr: 'toronto',   nameEn: 'Toronto',   nameFr: 'Toronto',   province: 'ON', tier: 1 },
  { id: 'c-montreal',  slugEn: 'montreal',  slugFr: 'montreal',  nameEn: 'Montreal',  nameFr: 'Montréal', province: 'QC', tier: 1 },
  { id: 'c-vancouver', slugEn: 'vancouver', slugFr: 'vancouver', nameEn: 'Vancouver', nameFr: 'Vancouver', province: 'BC', tier: 1 },
  { id: 'c-calgary',   slugEn: 'calgary',   slugFr: 'calgary',   nameEn: 'Calgary',   nameFr: 'Calgary',   province: 'AB', tier: 1 },
  { id: 'c-ottawa',    slugEn: 'ottawa',    slugFr: 'ottawa',    nameEn: 'Ottawa',    nameFr: 'Ottawa',    province: 'ON', tier: 1 },
  { id: 'c-hamilton',  slugEn: 'hamilton',  slugFr: 'hamilton',  nameEn: 'Hamilton',  nameFr: 'Hamilton',  province: 'ON', tier: 2 },
];

export function cityName(city: CityRecord, locale: Locale): string {
  return locale === 'fr-CA' ? city.nameFr : city.nameEn;
}

export function citySlug(city: CityRecord, locale: Locale): string {
  return locale === 'fr-CA' ? city.slugFr : city.slugEn;
}

export function findCityBySlug(slug: string, locale: Locale): CityRecord | null {
  return CITIES.find((c) => (locale === 'fr-CA' ? c.slugFr : c.slugEn) === slug) ?? null;
}

export interface SitterSummary {
  id: string;
  slug: string;
  firstName: string;
  lastNameInitial: string;
  neighbourhood: string;
  priceCents: number;
  rating: number;
  reviewCount: number;
  repeatClients: number;
  responseMinutes: number;
  badgeLevel: 0 | 1 | 2 | 3 | 4;
  hasYard: boolean;
  yardFenced: boolean;
  acceptsCats: boolean;
  homeType: string;
  photoInitials: string;
}

/** Sehir x hizmet landing sayfasinin canli verisi — sayfanin %40'ini benzersiz kilan sey */
export interface LandingData {
  city: CityRecord;
  serviceType: ServiceType;
  locale: Locale;
  sitterCount: number;
  medianPriceCents: number;
  p25PriceCents: number;
  p75PriceCents: number;
  bookingCount: number;
  reviewCount: number;
  avgRating: number;
  medianResponseMinutes: number;
  repeatClientAvg: number;
  topNeighbourhoods: string[];
  sitters: SitterSummary[];
  dataAsOf: string;
}

/** Deterministik sozde-rastgele — ayni girdide ayni cikti (build tutarliligi) */
function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NEIGHBOURHOODS: Record<string, string[]> = {
  'c-toronto': ['Leslieville', 'Liberty Village', 'The Annex', 'The Junction', 'Riverside', 'Roncesvalles'],
  'c-montreal': ['Le Plateau', 'Rosemont', 'Verdun', 'Mile End', 'Outremont', 'Villeray'],
  'c-vancouver': ['Kitsilano', 'Mount Pleasant', 'Yaletown', 'Commercial Drive', 'West End'],
  'c-calgary': ['Kensington', 'Inglewood', 'Bridgeland', 'Marda Loop'],
  'c-ottawa': ['The Glebe', 'Westboro', 'Hintonburg', 'Old Ottawa South'],
  'c-hamilton': ['Westdale', 'Durand', 'Locke Street'],
};

const FIRST_NAMES = ['Sarah', 'David', 'Marie', 'Ahmed', 'Priya', 'Jean', 'Emma', 'Lucas', 'Chloe', 'Noah', 'Fatima', 'Liam'];

const BASE_PRICE: Record<ServiceType, number> = {
  boarding: 5000, house_sitting: 6000, drop_in: 2400,
  dog_walking: 2500, day_care: 4000, training: 9000, grooming: 7500,
};

/** Tier'a gore arz yogunlugu — arz esigi kuralini gercekci sekilde test eder */
const SUPPLY_BY_TIER: Record<1 | 2 | 3, number> = { 1: 40, 2: 6, 3: 1 };

export async function getLandingData(
  city: CityRecord,
  serviceType: ServiceType,
  locale: Locale,
): Promise<LandingData> {
  const rand = seededRandom(`${city.id}:${serviceType}`);
  const sitterCount = Math.max(0, Math.round(SUPPLY_BY_TIER[city.tier] * (0.6 + rand() * 0.8)));
  const base = BASE_PRICE[serviceType];
  const median = Math.round((base * (0.9 + rand() * 0.3)) / 50) * 50;
  const hoods = NEIGHBOURHOODS[city.id] ?? ['Downtown'];

  const sitters: SitterSummary[] = Array.from({ length: Math.min(sitterCount, 9) }, (_, i) => {
    const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)] ?? 'Alex';
    const initial = String.fromCharCode(65 + Math.floor(rand() * 26));
    const hood = hoods[i % hoods.length] ?? 'Downtown';
    return {
      id: `s-${city.id}-${serviceType}-${i}`,
      slug: `${first.toLowerCase()}-${initial.toLowerCase()}-${hood.toLowerCase().replace(/\s+/g, '-')}`,
      firstName: first,
      lastNameInitial: initial,
      neighbourhood: hood,
      priceCents: Math.round((median * (0.8 + rand() * 0.5)) / 100) * 100,
      rating: Math.round((4.6 + rand() * 0.4) * 10) / 10,
      reviewCount: Math.floor(8 + rand() * 180),
      repeatClients: Math.floor(1 + rand() * 12),
      responseMinutes: Math.floor(10 + rand() * 180),
      badgeLevel: Math.min(4, Math.floor(1 + rand() * 4)) as 1 | 2 | 3 | 4,
      hasYard: rand() > 0.4,
      yardFenced: rand() > 0.5,
      acceptsCats: rand() > 0.35,
      homeType: rand() > 0.5 ? 'house' : 'condo',
      photoInitials: `${first[0] ?? 'A'}${initial}`,
    };
  });

  return {
    city, serviceType, locale, sitterCount,
    medianPriceCents: median,
    p25PriceCents: Math.round((median * 0.84) / 50) * 50,
    p75PriceCents: Math.round((median * 1.28) / 50) * 50,
    bookingCount: Math.floor(sitterCount * (30 + rand() * 90)),
    reviewCount: Math.floor(sitterCount * (12 + rand() * 40)),
    avgRating: Math.round((4.7 + rand() * 0.2) * 10) / 10,
    medianResponseMinutes: Math.floor(25 + rand() * 90),
    repeatClientAvg: Math.round((3 + rand() * 6) * 10) / 10,
    topNeighbourhoods: hoods.slice(0, 3),
    sitters,
    dataAsOf: '2026-09-12',
  };
}
