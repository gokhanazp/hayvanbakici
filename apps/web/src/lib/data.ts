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
  getSitterProfile as dbGetSitterProfile, listSitterSlugsForBuild, listFeaturedReviews,
  resolvePlace as dbResolvePlace,
  getCalendar as dbGetCalendar, setAvailability as dbSetAvailability,
  createBookingRequest as dbCreateBookingRequest, createPet as dbCreatePet,
  listPets as dbListPets, listOwnerBookings as dbListOwnerBookings,
  listSitterBookings as dbListSitterBookings, getBookingForViewer as dbGetBooking,
  respondToRequest as dbRespond, cancelBooking as dbCancel, isSitter as dbIsSitter,
  isAdmin as dbIsAdmin, getOverview as dbGetOverview, listApplications as dbListApplications,
  getApplication as dbGetApplication, decideApplication as dbDecideApplication,
  listAudit as dbListAudit, listAllBookings as dbListAllBookings, recordAudit as dbRecordAudit,
  getLandingData as dbGetLandingData, searchSitters as dbSearchSitters,
  cityName, citySlug,
  type CityRecord, type LandingData, type SitterSummary, type SearchParams, type SearchResult,
  type SitterProfile, type FeaturedReview, type PlaceMatch,
  type BookingSummary, type BookingDetail, type BookingDraft, type CalendarDay,
  type AdminOverview, type ApplicationRow, type ApplicationDetail, type AuditRow,
  type AdminBookingRow, type AuditEntry,
} from '@havre/db';
import type { ServiceType } from '@havre/core';
import type { Locale } from '@havre/i18n';

export type {
  CityRecord, LandingData, SitterSummary, SearchResult, SitterProfile, FeaturedReview,
  PlaceMatch, BookingSummary, BookingDetail, CalendarDay,
  AdminOverview, ApplicationRow, ApplicationDetail, AuditRow, AdminBookingRow,
};
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

/**
 * Ana sayfadaki referanslar — sitede yazilmis gercek yorumlardan.
 * Elle yazilmis "musteri yorumu" metni YOK; bkz. listFeaturedReviews.
 */
export const getFeaturedReviews = cache(
  async (limit = 3): Promise<FeaturedReview[]> => listFeaturedReviews(db(), limit),
);

/** Arama kutusundaki metni haritada bir noktaya cevirir (bkz. queries/place.ts) */
export const resolvePlace = cache(
  async (query: string, locale: Locale): Promise<PlaceMatch | null> =>
    dbResolvePlace(db(), query, locale),
);

/* ---------------------------------------------------------- rezervasyon */
/*
  Bu sarmalayicilarin hicbiri cache() ile sarili DEGIL: rezervasyon ve
  takvim verisi istek aninda taze olmali. cache() yalnizca ayni istek
  icinde tekrarlanan OKUMA sorgulari icin var (sehir, landing); burada
  yazma ve kisiye ozel okuma soz konusu.
*/
export const getCalendar = (sitterId: string, from: string, to: string) =>
  dbGetCalendar(db(), sitterId, from, to);

export const setAvailability = (sitterId: string, dates: string[], status: 'open' | 'blocked') =>
  dbSetAvailability(db(), sitterId, dates, status);

export const createBookingRequest = (draft: BookingDraft) => dbCreateBookingRequest(db(), draft);

export const createPet = (pet: Parameters<typeof dbCreatePet>[1]) => dbCreatePet(db(), pet);
export const listPets = (ownerId: string) => dbListPets(db(), ownerId);

export const listOwnerBookings = (ownerId: string) => dbListOwnerBookings(db(), ownerId);
export const listSitterBookings = (sitterId: string) => dbListSitterBookings(db(), sitterId);

export const getBooking = (id: string, viewerId: string, locale: Locale) =>
  dbGetBooking(db(), id, viewerId, locale);

export const respondToRequest = (id: string, sitterId: string, to: 'confirmed' | 'declined') =>
  dbRespond(db(), id, sitterId, to);

export const cancelBooking = (id: string, userId: string) => dbCancel(db(), id, userId);

export const isSitter = (userId: string) => dbIsSitter(db(), userId);

/* --------------------------------------------------------------- admin */
export const isAdmin = (userId: string) => dbIsAdmin(db(), userId);
export const getAdminOverview = () => dbGetOverview(db());
export const listApplications = (filter?: 'pending' | 'all') => dbListApplications(db(), filter);
export const getApplication = (userId: string) => dbGetApplication(db(), userId);
export const decideApplication = (input: Parameters<typeof dbDecideApplication>[1]) =>
  dbDecideApplication(db(), input);
export const listAudit = (limit?: number, kind?: 'all' | 'decisions') =>
  dbListAudit(db(), limit, kind);
export const listAllBookings = (status?: string) => dbListAllBookings(db(), status);
export const recordAudit = (entry: AuditEntry) => dbRecordAudit(db(), entry);
