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
  listAudit as dbListAudit, countAudit as dbCountAudit, listAllBookings as dbListAllBookings,
  countAllBookings as dbCountAllBookings, countReviews as dbCountReviews,
  listManualReviews as dbListManualReviews, recordAudit as dbRecordAudit,
  getCounts as dbGetCounts,
  listUsers as dbListUsers, getUser as dbGetUser, setSuspension as dbSetSuspension,
  setRole as dbSetRole, listNotes as dbListNotes, addNote as dbAddNote,
  listReviews as dbListReviews, setReviewHidden as dbSetReviewHidden,
  listReports as dbListReports, getReport as dbGetReport, createReport as dbCreateReport, resolveReport as dbResolveReport,
  getBookingAdmin as dbGetBookingAdmin, adminSetBookingStatus as dbAdminSetBookingStatus,
  getMetrics as dbGetMetrics,
  openConversation as dbOpenConversation, sendMessage as dbSendMessage,
  listConversations as dbListConversations, getThread as dbGetThread,
  markRead as dbMarkRead, unreadCount as dbUnreadCount, getRawMessage as dbGetRawMessage,
  reportableMessage as dbReportableMessage, conversationPing as dbConversationPing,
  setMessageEmails as dbSetMessageEmails,
  getAccountSummary as dbGetAccountSummary,
  getSitterStatus as dbGetSitterStatus, setAvatar as dbSetAvatar,
  getSitterDashboard as dbGetSitterDashboard,
  listSitterPhotos as dbListSitterPhotos, addSitterPhoto as dbAddSitterPhoto,
  deleteSitterPhoto as dbDeleteSitterPhoto, updateProfile as dbUpdateProfile,
  currentSlugFor as dbCurrentSlugFor, joinWaitlist as dbJoinWaitlist,
  listOwnerPets as dbListOwnerPets, getOwnerPet as dbGetOwnerPet,
  createOwnerPet as dbCreateOwnerPet, updateOwnerPet as dbUpdateOwnerPet,
  setPetPhoto as dbSetPetPhoto, deleteOwnerPet as dbDeleteOwnerPet,
  addFavourite as dbAddFavourite, removeFavourite as dbRemoveFavourite,
  favouriteIds as dbFavouriteIds, favouriteIdsOrdered as dbFavouriteIdsOrdered,
  favouriteSitters as dbFavouriteSitters, claimFavourites as dbClaimFavourites,
  existingSitterIds as dbExistingSitterIds,
  getCommissionSettings as dbGetCommissionSettings,
  saveCommissionSettings as dbSaveCommissionSettings,
  getResolvedCommission as dbGetResolvedCommission,
  getActiveCampaign as dbGetActiveCampaign, listCampaigns as dbListCampaigns,
  createCampaign as dbCreateCampaign, endCampaign as dbEndCampaign,
  listCommissionAudit as dbListCommissionAudit,
  type CommissionSettingsRow, type CampaignRow,
  type SaveSettingsInput, type CreateCampaignInput,
  getLandingData as dbGetLandingData, searchSitters as dbSearchSitters,
  countSitters as dbCountSitters, isSearchSort, SEARCH_SORTS,
  cityName, citySlug,
  type CityRecord, type LandingData, type SitterSummary, type SearchParams, type SearchResult,
  type SitterProfile, type SitterDashboard, type FeaturedReview, type PlaceMatch,
  type SearchSort,
  type BookingSummary, type BookingDetail, type BookingDraft, type CalendarDay,
  type AdminOverview, type ApplicationRow, type ApplicationDetail, type AuditRow,
  type AdminBookingRow, type AuditEntry, type AdminCounts,
  type AdminUserRow, type AdminUserDetail, type UserPage, type UserFilter, type AdminNote,
  type ModerationReview, type ReviewFilter, type ReportRow,
  type AdminBookingDetail, type AdminTransition, type AdminMetrics,
  type ConversationSummary, type Thread, type ThreadMessage, type RawMessage,
  type FavouriteSitter, type OwnerPet, type PetInput, type Species,
} from '@havre/db';
import type { ServiceType } from '@havre/core';
import type { Locale } from '@havre/i18n';

export type {
  CityRecord, LandingData, SitterSummary, SearchResult, SitterProfile, SitterDashboard, FeaturedReview,
  PlaceMatch, BookingSummary, BookingDetail, CalendarDay,
  AdminOverview, ApplicationRow, ApplicationDetail, AuditRow, AdminBookingRow, AdminCounts,
  AdminUserRow, AdminUserDetail, UserPage, UserFilter, AdminNote,
  ModerationReview, ReviewFilter, ReportRow, AdminBookingDetail, AdminTransition, AdminMetrics,
  ConversationSummary, Thread, ThreadMessage, RawMessage, SearchSort, FavouriteSitter,
  OwnerPet, PetInput, Species,
};
export { cityName, citySlug, isSearchSort, SEARCH_SORTS };

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

/** Filtrelere uyan toplam sayi — listeleme sorgusuyla ayni kosullar. */
export async function countSitters(params: SearchParams): Promise<number> {
  return dbCountSitters(db(), params);
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
export const listManualReviews = () => dbListManualReviews(db());
export const listAudit = (limit?: number, kind?: 'all' | 'decisions', offset?: number) =>
  dbListAudit(db(), limit, kind, offset);
export const countAudit = (kind?: 'all' | 'decisions') => dbCountAudit(db(), kind);
export const listAllBookings = (
  status?: string, q?: string, limit?: number, offset?: number,
) => dbListAllBookings(db(), status, q, limit, offset);
export const countAllBookings = (status?: string, q?: string) =>
  dbCountAllBookings(db(), status, q);
export const recordAudit = (entry: AuditEntry) => dbRecordAudit(db(), entry);
export const getAdminCounts = () => dbGetCounts(db());

export const listUsers = (opts?: Parameters<typeof dbListUsers>[1]) => dbListUsers(db(), opts);
export const getAdminUser = (userId: string) => dbGetUser(db(), userId);
export const setSuspension = (input: Parameters<typeof dbSetSuspension>[1]) =>
  dbSetSuspension(db(), input);
export const setRole = (input: Parameters<typeof dbSetRole>[1]) => dbSetRole(db(), input);
export const listNotes = (entityType: string, entityId: string) =>
  dbListNotes(db(), entityType, entityId);
export const addNote = (input: Parameters<typeof dbAddNote>[1]) => dbAddNote(db(), input);

export const listReviews = (
  filter?: ReviewFilter, limit?: number, q?: string, offset?: number,
) => dbListReviews(db(), filter, limit, q, offset);
export const countReviews = (filter?: ReviewFilter, q?: string) =>
  dbCountReviews(db(), filter, q);
export const setReviewHidden = (input: Parameters<typeof dbSetReviewHidden>[1]) =>
  dbSetReviewHidden(db(), input);
export const listReports = (status?: 'open' | 'all') => dbListReports(db(), status);
export const getReport = (reportId: string) => dbGetReport(db(), reportId);
export const createReport = (input: Parameters<typeof dbCreateReport>[1]) =>
  dbCreateReport(db(), input);
export const resolveReport = (input: Parameters<typeof dbResolveReport>[1]) =>
  dbResolveReport(db(), input);

export const getBookingAdmin = (bookingId: string) => dbGetBookingAdmin(db(), bookingId);
export const adminSetBookingStatus = (input: Parameters<typeof dbAdminSetBookingStatus>[1]) =>
  dbAdminSetBookingStatus(db(), input);

export const getMetrics = (days?: number) => dbGetMetrics(db(), days);

/* ---------------------------------------------------------- mesajlasma */
export const openConversation = (input: Parameters<typeof dbOpenConversation>[1]) =>
  dbOpenConversation(db(), input);
export const sendMessage = (input: Parameters<typeof dbSendMessage>[1]) =>
  dbSendMessage(db(), input);
export const listConversations = (viewerId: string) => dbListConversations(db(), viewerId);
export const getThread = (conversationId: string, viewerId: string) =>
  dbGetThread(db(), conversationId, viewerId);
export const markRead = (conversationId: string, viewerId: string) =>
  dbMarkRead(db(), conversationId, viewerId);
export const unreadCount = (viewerId: string) => dbUnreadCount(db(), viewerId);
export const getRawMessage = (messageId: string) => dbGetRawMessage(db(), messageId);

/* ------------------------------------------------------------ hesap */
export const getAccountSummary = (userId: string) => dbGetAccountSummary(db(), userId);
export const getSitterStatus = (userId: string) => dbGetSitterStatus(db(), userId);
/** Hesap ayari: yeni mesaj e-postalarini ac/kapat. */
export const setMessageEmails = (userId: string, on: boolean) => dbSetMessageEmails(db(), userId, on);
/** Bakici panosu: durum, profil gucu, acik gun, anlasilan tutarlar. */
export const getSitterDashboard = (userId: string) => dbGetSitterDashboard(db(), userId);
export const setAvatar = (userId: string, url: string | null) => dbSetAvatar(db(), userId, url);
export const listSitterPhotos = (sitterId: string) => dbListSitterPhotos(db(), sitterId);
export const addSitterPhoto = (input: Parameters<typeof dbAddSitterPhoto>[1]) =>
  dbAddSitterPhoto(db(), input);
export const deleteSitterPhoto = (photoId: string, sitterId: string) =>
  dbDeleteSitterPhoto(db(), photoId, sitterId);
export const updateProfile = (input: Parameters<typeof dbUpdateProfile>[1]) =>
  dbUpdateProfile(db(), input);
/** Bekleme listesi kaydi — oturum gerekmiyor, kayit e-postaya bagli. */
export const joinWaitlist = (input: Parameters<typeof dbJoinWaitlist>[1]) =>
  dbJoinWaitlist(db(), input);

/** Eski profil adresi -> bugunku adres (bakici adini degistirdiginde). */
export const currentSlugFor = cache(
  async (oldSlug: string): Promise<string | null> => dbCurrentSlugFor(db(), oldSlug),
);
export const conversationPing = (viewerId: string, conversationId?: string) =>
  dbConversationPing(db(), viewerId, conversationId);
export const reportableMessage = (messageId: string, viewerId: string) =>
  dbReportableMessage(db(), messageId, viewerId);

/* ------------------------------------------------------ favoriler */
export const addFavourite = (userId: string, sitterId: string) =>
  dbAddFavourite(db(), userId, sitterId);
export const removeFavourite = (userId: string, sitterId: string) =>
  dbRemoveFavourite(db(), userId, sitterId);
/** Kalbin dolu cizilecegi kimlikler — arama sayfasi icin TEK sorgu. */
export const favouriteIds = (userId: string) => dbFavouriteIds(db(), userId);
export const favouriteIdsOrdered = (userId: string) => dbFavouriteIdsOrdered(db(), userId);
export const favouriteSitters = (ids: readonly string[], locale: Locale) =>
  dbFavouriteSitters(db(), ids, locale);
/** Tarayicidaki favorileri hesaba tasir; eklenen kayit sayisini doner. */
export const claimFavourites = (userId: string, ids: readonly string[]) =>
  dbClaimFavourites(db(), userId, ids);
export const existingSitterIds = (ids: readonly string[]) => dbExistingSitterIds(db(), ids);

/* ------------------------------------------------- sahibin hayvanlari */
export const listOwnerPets = (ownerId: string) => dbListOwnerPets(db(), ownerId);
export const getOwnerPet = (petId: string, ownerId: string) => dbGetOwnerPet(db(), petId, ownerId);
export const createOwnerPet = (ownerId: string, input: PetInput) =>
  dbCreateOwnerPet(db(), ownerId, input);
export const updateOwnerPet = (petId: string, ownerId: string, input: PetInput) =>
  dbUpdateOwnerPet(db(), petId, ownerId, input);
/** Fotograf kaydeder ve ONCEKI adresi doner — eski dosya depodan silinebilsin. */
export const setPetPhoto = (petId: string, ownerId: string, url: string | null) =>
  dbSetPetPhoto(db(), petId, ownerId, url);
export const deleteOwnerPet = (petId: string, ownerId: string) =>
  dbDeleteOwnerPet(db(), petId, ownerId);


/* --------------------------------------------------- komisyon ayarlari */
/**
 * O AN GECERLI KOMISYON — taban oranlar + varsa yururlukteki kampanya.
 *
 * `cache()` ILE SARILI: ayni istek icinde onlarca yerden okunuyor
 * (ucret sayfasi, rezervasyon ekrani, sihirbazdaki net kazanc satiri)
 * ve hepsinin AYNI rakami gormesi sart. Sarmalanmasaydi, bir kampanya
 * tam sayfa cizilirken baslarsa ayni sayfanin ust yarisi %18, alt
 * yarisi %10 yazabilirdi.
 *
 * Istekler arasi onbellek YOK: kampanya acildiginda site en gec bir
 * sonraki istekte dogru rakami gosteriyor.
 */
export const getCommission = cache(() => dbGetResolvedCommission(db()));

export const getCommissionSettings = () => dbGetCommissionSettings(db());
export const saveCommissionSettings = (input: SaveSettingsInput) =>
  dbSaveCommissionSettings(db(), input);
export const getActiveCampaign = () => dbGetActiveCampaign(db());
export const listCampaigns = (limit?: number) => dbListCampaigns(db(), limit);
export const createCampaign = (input: CreateCampaignInput) => dbCreateCampaign(db(), input);
export const endCampaign = (input: { adminId: string; campaignId: string; ip?: string | undefined }) =>
  dbEndCampaign(db(), input);
export const listCommissionAudit = (limit?: number) => dbListCommissionAudit(db(), limit);
export type { CommissionSettingsRow, CampaignRow };
