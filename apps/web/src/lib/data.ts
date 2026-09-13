/**
 * VERI KATMANI — @havre/db sorgularinin ince sarmalayicisi.
 *
 * Bu dosya daha once tohum veri uretiyordu; imzalar bilerek kalici tutulmustu,
 * bu yuzden gercek sorgulara gecerken sayfalarda HICBIR degisiklik gerekmedi.
 * Tek fark: sehir listesi artik senkron bir sabit degil, async sorgu.
 */
import { cache } from 'react';
import {
  getDb, listCities, listTier1Cities, listCitiesWithSupply, findCityBySlug as dbFindCityBySlug,
  getSitterProfile as dbGetSitterProfile, listSitterSlugsForBuild,
  getLandingData as dbGetLandingData, searchSitters as dbSearchSitters,
  cityName, citySlug,
  type CityRecord, type LandingData, type SitterSummary, type SearchParams, type SearchResult,
  type SitterProfile,
} from '@havre/db';
import type { ServiceType } from '@havre/core';
import type { Locale } from '@havre/i18n';

export type { CityRecord, LandingData, SitterSummary, SearchResult, SitterProfile };
export { cityName, citySlug };

const db = () => getDb();

/**
 * React cache: ayni istek icinde tekrarlanan sorgular tek kez calisir.
 * Bir landing sayfasi hem generateMetadata hem page govdesinden ayni veriyi ister.
 */
export const getCities = cache(async (): Promise<CityRecord[]> => listCities(db()));

export const getTier1Cities = cache(async (): Promise<CityRecord[]> => listTier1Cities(db()));

export const findCityBySlug = cache(
  async (slug: string, locale: Locale): Promise<CityRecord | null> =>
    dbFindCityBySlug(db(), slug, locale),
);

export const getLandingData = cache(
  async (city: CityRecord, serviceType: ServiceType, locale: Locale): Promise<LandingData> =>
    dbGetLandingData(db(), city, serviceType, locale),
);

export async function searchSitters(params: SearchParams, locale: Locale): Promise<SearchResult[]> {
  return dbSearchSitters(db(), params, locale);
}

/** Ana sayfanin ornek sehri — en buyuk Tier-1 */
export const getDefaultCity = cache(async (): Promise<CityRecord> => {
  const cities = await getTier1Cities();
  const toronto = cities.find((c) => c.slugEn === 'toronto');
  const first = toronto ?? cities[0];
  if (!first) throw new Error('Veritabaninda sehir yok — once `npm run seed -w @havre/db` calistirin');
  return first;
});

/**
 * Alt bilgide ve gezinmede listelenecek sehirler.
 *
 * Arz esigini gecmeyen sehir LISTELENMEZ: London'da iki bakici var, sayfa
 * noindex; Victoria'da hic yok, sayfa 404. Ikisine de baglanti vermek
 * Google'a yanlis sinyal gonderir.
 */
export const getLinkableCities = cache(
  async (): Promise<CityRecord[]> => listCitiesWithSupply(db(), 'boarding', 3),
);

export const getSitterProfile = cache(
  async (slug: string, locale: Locale): Promise<SitterProfile | null> =>
    dbGetSitterProfile(db(), slug, locale),
);

/** Build'de uretilecek profiller — Tier-1 sehirlerin en ust siradaki bakicilari */
export const getSitterSlugsForBuild = cache(
  async () => listSitterSlugsForBuild(db(), 40),
);
