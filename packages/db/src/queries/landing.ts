/**
 * LANDING SAYFASI VERISI — programatik SEO'nun kalbi (yol haritasi §7.7).
 *
 * Sayfanin en az %40'i bu sorgudan gelen GERCEK veridir: aktif bakici sayisi,
 * medyan/p25/p75 fiyat, tamamlanmis rezervasyon sayisi, yorum sayisi, ortalama
 * puan, medyan yanit suresi, tekrar musteri ortalamasi, en yogun mahalleler.
 * Thin content / doorway cezasina karsi savunmamiz bu veridir.
 */
import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import type { Locale } from './types.js';
import type { CityRecord } from './cities.js';
import type { PriceRange, ServiceType } from '@havre/core';

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
  avatarUrl: string | null;
}

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

interface StatsRow {
  sitter_count: number;
  median_price: number | null;
  p25_price: number | null;
  p75_price: number | null;
  avg_rating: number | null;
  review_count: number;
  median_response: number | null;
}

/**
 * Sehir sayfasinda gosterilen bakici sayisi.
 *
 * Sayfa TOPLAM sayiyi da yaziyor ("43 bakici") — dolayisiyla ekran kac
 * tanesini gosterdigini de soylemek zorunda; aksi halde "43" diyip 9 kart
 * cizen bir sayfa cikiyor (bizzat bildirildi). Tamami icin arama
 * sayfasina baglaniyoruz: sayfalama orada.
 *
 * Neden burada sayfalama yok: bu sayfa bir SEO acilis sayfasi; ikinci,
 * ucuncu sayfalari ayni kahraman/istatistik/SSS icerigini tekrarlayan
 * ince kopyalar olurdu.
 */
export const LANDING_SITTERS = 12;

export async function getLandingData(
  db: Database, city: CityRecord, serviceType: ServiceType, locale: Locale,
): Promise<LandingData> {
  const nameCol = locale === 'fr-CA' ? 'n.name_fr' : 'n.name_en';

  // Tek turda toplu istatistik — percentile_cont ile gercek medyan/ceyreklikler
  const statsRes = await withDbErrors(() => db.execute(sql`
    SELECT
      count(*)::int                                                        AS sitter_count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY ss.price_cents)::int     AS median_price,
      percentile_cont(0.25) WITHIN GROUP (ORDER BY ss.price_cents)::int    AS p25_price,
      percentile_cont(0.75) WITHIN GROUP (ORDER BY ss.price_cents)::int    AS p75_price,
      avg(st.average_rating)::numeric(3,2)                                 AS avg_rating,
      sum(st.review_count)::int                                           AS review_count,
      percentile_cont(0.5) WITHIN GROUP (ORDER BY st.median_response_minutes)::int AS median_response
    FROM sitter_services ss
    JOIN sitters  st ON st.user_id = ss.sitter_id
    JOIN profiles p  ON p.user_id  = ss.sitter_id
    WHERE ss.service_type = ${serviceType}::service_type
      AND ss.is_active
      AND st.status = 'active'
      AND p.city_id = ${city.id}
  `));
  const stats = (statsRes as unknown as StatsRow[])[0] ?? {
    sitter_count: 0, median_price: null, p25_price: null, p75_price: null,
    avg_rating: null, review_count: 0, median_response: null,
  };

  // Tamamlanmis rezervasyon sayisi ve tekrar musteri ortalamasi
  const bookingRes = await withDbErrors(() => db.execute(sql`
    SELECT
      count(*)::int AS booking_count,
      COALESCE(
        avg(CASE WHEN b.attribution IN ('repeat','sitter_referral') THEN 1 ELSE 0 END)
        * count(*)::numeric / NULLIF(count(DISTINCT b.sitter_id), 0), 0
      )::numeric(4,1) AS repeat_avg
    FROM bookings b
    JOIN profiles p ON p.user_id = b.sitter_id
    WHERE b.service_type = ${serviceType}::service_type
      AND b.status IN ('completed','payout_released')
      AND p.city_id = ${city.id}
  `));
  const bk = (bookingRes as unknown as Array<{ booking_count: number; repeat_avg: string }>)[0];

  // En yogun mahalleler — sayfaya yerel baglam katan alan
  const hoodRes = await withDbErrors(() => db.execute(sql`
    SELECT ${sql.raw(nameCol)} AS name, count(*)::int AS c
    FROM profiles p
    JOIN neighbourhoods n ON n.id = p.neighbourhood_id
    JOIN sitter_services ss ON ss.sitter_id = p.user_id
    JOIN sitters st ON st.user_id = p.user_id
    WHERE p.city_id = ${city.id}
      AND ss.service_type = ${serviceType}::service_type
      AND ss.is_active AND st.status = 'active'
    GROUP BY 1 ORDER BY c DESC LIMIT 3
  `));
  const hoods = (hoodRes as unknown as Array<{ name: string }>).map((h) => h.name);

  // Listelenecek bakicilar — seffaf siralama skoruna gore
  const sitterRes = await withDbErrors(() => db.execute(sql`
    SELECT
      st.user_id::text AS id,
      pr.first_name, pr.last_name_initial,
      pr.avatar_url,
      ${sql.raw(nameCol)} AS neighbourhood,
      ss.price_cents::int, st.average_rating::float8 AS rating, st.review_count::int,
      st.median_response_minutes::int AS response_minutes,
      st.slug,
      st.badge_level::int, st.has_yard, st.yard_fenced, ss.accepts_cats,
      COALESCE(st.home_type::text, 'house') AS home_type,
      (SELECT count(*)::int FROM bookings b
        WHERE b.sitter_id = st.user_id AND b.attribution IN ('repeat','sitter_referral')
      ) AS repeat_clients
    FROM sitter_services ss
    JOIN sitters  st ON st.user_id = ss.sitter_id
    JOIN profiles pr ON pr.user_id = ss.sitter_id
    JOIN neighbourhoods n ON n.id = pr.neighbourhood_id
    WHERE ss.service_type = ${serviceType}::service_type
      AND ss.is_active AND st.status = 'active' AND pr.city_id = ${city.id}
      AND st.slug IS NOT NULL
    ORDER BY
      (st.average_rating * 0.30
       + (1 - LEAST(st.median_response_minutes::numeric / 1440, 1)) * 0.20
       + st.acceptance_rate * 0.20
       + (1 - LEAST(st.cancellation_rate * 5, 1)) * 0.15
       + st.profile_completeness * 0.10
       + (st.badge_level::numeric / 4) * 0.05) DESC,
      st.user_id            -- esitlikte sira sabit kalsin
    LIMIT ${LANDING_SITTERS}
  `));

  const sitters: SitterSummary[] = (sitterRes as unknown as Array<Record<string, never>>).map(
    (row: Record<string, unknown>) => {
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
      };
    },
  );

  return {
    city, serviceType, locale,
    sitterCount: Number(stats.sitter_count ?? 0),
    medianPriceCents: Number(stats.median_price ?? 0),
    p25PriceCents: Number(stats.p25_price ?? 0),
    p75PriceCents: Number(stats.p75_price ?? 0),
    bookingCount: Number(bk?.booking_count ?? 0),
    reviewCount: Number(stats.review_count ?? 0),
    avgRating: Math.round(Number(stats.avg_rating ?? 0) * 10) / 10,
    medianResponseMinutes: Number(stats.median_response ?? 0),
    repeatClientAvg: Number(bk?.repeat_avg ?? 0),
    topNeighbourhoods: hoods,
    sitters,
    dataAsOf: new Date().toISOString().slice(0, 10),
  };
}

/* ------------------------------------------------- fiyat onerisi */

/*
  PriceRange ve MIN_RANGE_SAMPLE @havre/core'da.

  Esik hem burada (sorgu) hem de tarayicidaki basvuru formunda gerekiyor;
  form istemci bileseni oldugu icin @havre/db'yi ithal EDEMEZ (paket
  sunucuya ozgu). Tek kaynak core, iki taraf da oradan okuyor.
*/
export type { PriceRange } from '@havre/core';
export { MIN_RANGE_SAMPLE } from '@havre/core';

/**
 * Bir sehirdeki HER hizmet icin fiyat araligi.
 *
 * Basvurudaki fiyat adimi icin: bakicinin en cok zorlandigi karar fiyat
 * ve ekran "cevrenize gore bir aralik oneriyoruz" diyordu ama hicbir
 * aralik gostermiyordu. Veri zaten burada.
 *
 * Tek sorgu: dort hizmet icin dort ayri istek acmanin anlami yok.
 */
export async function servicePriceRanges(
  db: Database, cityId: string,
): Promise<Record<string, PriceRange>> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT ss.service_type::text AS service,
             count(*)::int AS n,
             percentile_cont(0.25) WITHIN GROUP (ORDER BY ss.price_cents)::int AS p25,
             percentile_cont(0.50) WITHIN GROUP (ORDER BY ss.price_cents)::int AS med,
             percentile_cont(0.75) WITHIN GROUP (ORDER BY ss.price_cents)::int AS p75
      FROM sitter_services ss
      JOIN sitters  st ON st.user_id = ss.sitter_id
      JOIN profiles pr ON pr.user_id = ss.sitter_id
      WHERE pr.city_id = ${cityId} AND ss.is_active AND st.status = 'active'
      GROUP BY 1
    `);
    const out: Record<string, PriceRange> = {};
    for (const r of rows as unknown as Array<Record<string, unknown>>) {
      out[String(r.service)] = {
        count: Number(r.n),
        p25Cents: Number(r.p25),
        medianCents: Number(r.med),
        p75Cents: Number(r.p75),
      };
    }
    return out;
  });
}
