/**
 * COGRAFI BAKICI ARAMASI — PostGIS (yol haritasi §6.4).
 *
 * Faz 1'de dis arama servisi YOK: PostGIS + Postgres yeterli ve veri Kanada'da
 * kaliyor. Algolia/Typesense ancak hacim gerektirdiginde (Faz 2) degerlendirilir.
 *
 * ST_DWithin geography uzerinde METRE calisir ve GIST indeksini kullanir.
 */
import { sql, type SQL } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import type { Locale } from './types.js';
import type { SitterSummary } from './landing.js';
import { petSizeForKg } from '@havre/core';
import type { ServiceType } from '@havre/core';

export interface SearchParams {
  serviceType: ServiceType;
  lon: number;
  lat: number;
  radiusMeters?: number;
  startDate?: string;
  endDate?: string;
  /**
   * SIRALAMA — varsayilan 'best'.
   *
   * Kullaniciya kontrol vermek, kendi siralamamizin iyi olmadigi
   * anlamina gelmiyor: sahip "en ucuzu kim" diye bakmak istedigine
   * karar verebilmeli. Siralama secenegi SATILIK DEGIL ve olmayacak
   * (Competition Act §8.6 ve sayfadaki "yerlesim satin alinamaz"
   * cumlesi); yalnizca kullanicinin kendi olcusu.
   */
  sort?: SearchSort;
  petWeightKg?: number;
  needsCats?: boolean;
  maxPriceCents?: number;
  requireFencedYard?: boolean;
  minBadgeLevel?: number;
  limit?: number;
  offset?: number;
}

export interface SearchResult extends SitterSummary {
  distanceMeters: number;
}

/**
 * ARAMA SAYFA BOYU.
 *
 * Eskiden sorgu sessizce ilk 30 kaydi donuyordu ve ekran bunu
 * SOYLEMIYORDU: 43 bakicisi olan bir sehirde kullanici 30 gorup
 * "hepsi bu" saniyordu. Artik sayfa boyu burada, toplam ayri
 * sayiliyor ve ekran "43 icinden 1-24" diyor.
 */
/**
 * ARAMA KOSULLARI — TEK YERDE.
 *
 * Hem listeleme hem sayim sorgusu bunu kullaniyor. Kosullari iki kez
 * yazmak, bir filtre eklendiginde birinde unutmak ve ekranin "43 sonuc"
 * deyip 12 tane gostermesi demekti.
 *
 * Kullanici girdisi HER ZAMAN bagli parametre — ham SQL'e hicbir deger
 * gomulmuyor (enjeksiyon testleri place.test.ts icinde).
 */
function filters(params: SearchParams, origin: SQL, radius: number): SQL {
  return sql`
    ss.service_type = ${params.serviceType}::service_type
    AND ss.is_active
    AND st.status = 'active'
    AND st.slug IS NOT NULL
    AND ST_DWithin(pr.approx_location, ${origin}, ${radius})
    ${params.petWeightKg !== undefined
      /*
        Kilo once KADEMEYE cevriliyor, sonra bakicinin isaretledigi
        kumede araniyor. Eskiden bir BETWEEN vardi ve bu, kabul edilen
        boyutun sifirdan baslayan kesintisiz bir aralik olmasini
        varsayiyordu; artik oyle degil (bkz. 0018 gocu).
      */
      ? sql`AND ${petSizeForKg(params.petWeightKg)} = ANY(ss.accepted_sizes)`
      : sql``}
    ${params.needsCats ? sql`AND ss.accepts_cats` : sql``}
    ${params.maxPriceCents !== undefined ? sql`AND ss.price_cents <= ${params.maxPriceCents}` : sql``}
    ${params.requireFencedYard ? sql`AND st.yard_fenced` : sql``}
    ${params.minBadgeLevel !== undefined ? sql`AND st.badge_level >= ${params.minBadgeLevel}` : sql``}
    ${params.startDate && params.endDate
      ? sql`AND NOT EXISTS (
            SELECT 1 FROM sitter_availability a
            WHERE a.sitter_id = st.user_id
              AND a.date BETWEEN ${params.startDate}::date AND ${params.endDate}::date
              AND a.status <> 'open')`
      : sql``}
  `;
}

/** Siralama secenekleri — adres parametresi olarak da bunlar kullaniliyor. */
/**
 * SIRALAMA CUMLESI.
 *
 * 'best' bizim skorumuz: puan, yanit suresi, kabul orani, iptal orani,
 * profil doluluk ve rozet — %65; mesafe %35. YERLESIM SATIN ALINAMAZ,
 * bu formulde odemeye bagli hicbir terim yok ve olmayacak.
 *
 * Digerleri kullanicinin kendi olcusu. Puan siralamasinda yorum SAYISI
 * da devrede: tek bir 5 yildiz, otuz yorumla 4,8 tutturan bir bakicinin
 * onune gecmemeli — "en iyi puanli" listesinin basi tek yorumlu
 * hesaplarla dolarsa siralama bilgi tasimaz.
 */
function orderBy(sort: SearchSort, origin: SQL, radius: number): SQL {
  switch (sort) {
    case 'price':
      return sql`ss.price_cents ASC`;
    case 'rating':
      return sql`(st.average_rating * LEAST(st.review_count::numeric / 5, 1)) DESC, st.review_count DESC`;
    case 'distance':
      return sql`ST_Distance(pr.approx_location, ${origin}) ASC`;
    case 'best':
    default:
      return sql`
        (st.average_rating / 5 * 0.30
         + (1 - LEAST(st.median_response_minutes::numeric / 1440, 1)) * 0.20
         + st.acceptance_rate * 0.20
         + (1 - LEAST(st.cancellation_rate * 5, 1)) * 0.15
         + st.profile_completeness * 0.10
         + (st.badge_level::numeric / 4) * 0.05) * 0.65
        + (1 - LEAST(ST_Distance(pr.approx_location, ${origin})::numeric / ${radius}, 1)) * 0.35
        DESC`;
  }
}

export const SEARCH_SORTS = ['best', 'price', 'rating', 'distance'] as const;
export type SearchSort = (typeof SEARCH_SORTS)[number];

export function isSearchSort(v: string): v is SearchSort {
  return (SEARCH_SORTS as readonly string[]).includes(v);
}

export const SEARCH_PAGE_SIZE = 24;

/**
 * Filtrelere uyan TOPLAM bakici sayisi.
 *
 * Listeleme sorgusuyla ayni WHERE — ikisi ayri yazilirsa bir gun
 * birbirinden farkli sayilar gosterirler. Bu yuzden kosullar tek bir
 * yardimci fonksiyondan (`filters`) geliyor.
 */
export async function countSitters(
  db: Database, params: SearchParams,
): Promise<number> {
  const radius = params.radiusMeters ?? 15000;
  const origin = sql`ST_SetSRID(ST_MakePoint(${params.lon}, ${params.lat}), 4326)::geography`;
  const rows = await withDbErrors(() => db.execute(sql`
    SELECT count(*)::int AS n
    FROM sitter_services ss
    JOIN sitters  st ON st.user_id = ss.sitter_id
    JOIN profiles pr ON pr.user_id = ss.sitter_id
    JOIN neighbourhoods n ON n.id = pr.neighbourhood_id
    WHERE ${filters(params, origin, radius)}
  `));
  return Number((rows as unknown as Array<{ n: number }>)[0]?.n ?? 0);
}

export async function searchSitters(
  db: Database, params: SearchParams, locale: Locale,
): Promise<SearchResult[]> {
  const nameCol = locale === 'fr-CA' ? 'n.name_fr' : 'n.name_en';
  const radius = params.radiusMeters ?? 15000;
  const limit = params.limit ?? SEARCH_PAGE_SIZE;
  const offset = params.offset ?? 0;
  const origin = sql`ST_SetSRID(ST_MakePoint(${params.lon}, ${params.lat}), 4326)::geography`;

  const rows = await withDbErrors(() => db.execute(sql`
    SELECT
      st.slug,
      st.user_id::text AS id,
      pr.first_name, pr.last_name_initial,
      pr.avatar_url,
      ${sql.raw(nameCol)} AS neighbourhood,
      ss.price_cents::int, st.average_rating::float8 AS rating, st.review_count::int,
      st.median_response_minutes::int AS response_minutes,
      st.badge_level::int, st.has_yard, st.yard_fenced, ss.accepts_cats,
      COALESCE(st.home_type::text, 'house') AS home_type,
      ST_Distance(pr.approx_location, ${origin})::int AS distance_meters,
      (SELECT count(*)::int FROM bookings b
        WHERE b.sitter_id = st.user_id AND b.attribution IN ('repeat','sitter_referral')
      ) AS repeat_clients
    FROM sitter_services ss
    JOIN sitters  st ON st.user_id = ss.sitter_id
    JOIN profiles pr ON pr.user_id = ss.sitter_id
    JOIN neighbourhoods n ON n.id = pr.neighbourhood_id
    WHERE ${filters(params, origin, radius)}
    ORDER BY ${orderBy(params.sort ?? 'best', origin, radius)},
      /*
        ESITLIK BOZUCU — SAYFALAMANIN SARTI.
        Skorlar esit oldugunda Postgres siralamayi GARANTI ETMIYOR: ayni
        bakici hem 1. hem 2. sayfada cikabilir, bir baskasi hic cikmayabilir.
        Kimlik ile ikincil siralama, iki ayri sorgunun ayni sirayi
        uretmesini saglar. Fiyat/puan siralamasinda bu daha da onemli:
        esit fiyat cok daha sik gorulur.
      */
      st.user_id
    LIMIT ${limit} OFFSET ${offset}
  `));

  return (rows as unknown as Array<Record<string, unknown>>).map((row) => {
    const first = String(row.first_name);
    const initial = String(row.last_name_initial);
    const hood = String(row.neighbourhood);
    return {
      id: String(row.id),
    /*
      SLUG VERITABANINDAN GELIR, burada TURETILMEZ.
      Onceden ad+bas harf+mahalleden uretiliyordu; bakici karti bu turetilmis
      adrese baglaniyor, profil sayfasi ise sitters.slug ile cozuyordu — iki
      farkli deger, dolayisiyla her kart baglantisi 404 veriyordu. Tarayicida
      yakalandi. Tek kaynak: sitters.slug (packages/db/queries/onboarding.ts).
    */
      slug: String(row.slug ?? ''),
      firstName: first,
      lastNameInitial: initial,
      neighbourhood: hood,
      priceCents: Number(row.price_cents),
      rating: Math.round(Number(row.rating) * 10) / 10,
      reviewCount: Number(row.review_count),
      repeatClients: Number(row.repeat_clients),
      responseMinutes: Number(row.response_minutes),
      badgeLevel: Number(row.badge_level) as 0 | 1 | 2 | 3 | 4,
      hasYard: Boolean(row.has_yard),
      yardFenced: Boolean(row.yard_fenced),
      acceptsCats: Boolean(row.accepts_cats),
      homeType: String(row.home_type),
      photoInitials: `${first[0] ?? 'A'}${initial}`,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      distanceMeters: Number(row.distance_meters),
    };
  });
}
