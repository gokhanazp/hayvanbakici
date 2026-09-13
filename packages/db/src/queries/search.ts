/**
 * COGRAFI BAKICI ARAMASI — PostGIS (yol haritasi §6.4).
 *
 * Faz 1'de dis arama servisi YOK: PostGIS + Postgres yeterli ve veri Kanada'da
 * kaliyor. Algolia/Typesense ancak hacim gerektirdiginde (Faz 2) degerlendirilir.
 *
 * ST_DWithin geography uzerinde METRE calisir ve GIST indeksini kullanir.
 */
import { sql } from 'drizzle-orm';
import type { Database } from '../client.js';
import type { Locale } from './types.js';
import type { SitterSummary } from './landing.js';
import type { ServiceType } from '@havre/core';

export interface SearchParams {
  serviceType: ServiceType;
  lon: number;
  lat: number;
  radiusMeters?: number;
  startDate?: string;
  endDate?: string;
  petWeightKg?: number;
  needsCats?: boolean;
  maxPriceCents?: number;
  requireFencedYard?: boolean;
  minBadgeLevel?: number;
  limit?: number;
}

export interface SearchResult extends SitterSummary {
  distanceMeters: number;
}

export async function searchSitters(
  db: Database, params: SearchParams, locale: Locale,
): Promise<SearchResult[]> {
  const nameCol = locale === 'fr-CA' ? 'n.name_fr' : 'n.name_en';
  const radius = params.radiusMeters ?? 15000;
  const limit = params.limit ?? 30;
  const origin = sql`ST_SetSRID(ST_MakePoint(${params.lon}, ${params.lat}), 4326)::geography`;

  const rows = await db.execute(sql`
    SELECT
      st.user_id::text AS id,
      pr.first_name, pr.last_name_initial,
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
    WHERE ss.service_type = ${params.serviceType}::service_type
      AND ss.is_active
      AND st.status = 'active'
      AND ST_DWithin(pr.approx_location, ${origin}, ${radius})
      ${params.petWeightKg !== undefined
        ? sql`AND ${params.petWeightKg} BETWEEN ss.accepted_size_min_kg AND ss.accepted_size_max_kg`
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
    ORDER BY
      (st.average_rating / 5 * 0.30
       + (1 - LEAST(st.median_response_minutes::numeric / 1440, 1)) * 0.20
       + st.acceptance_rate * 0.20
       + (1 - LEAST(st.cancellation_rate * 5, 1)) * 0.15
       + st.profile_completeness * 0.10
       + (st.badge_level::numeric / 4) * 0.05) * 0.65
      + (1 - LEAST(ST_Distance(pr.approx_location, ${origin})::numeric / ${radius}, 1)) * 0.35
      DESC
    LIMIT ${limit}
  `);

  return (rows as unknown as Array<Record<string, unknown>>).map((row) => {
    const first = String(row.first_name);
    const initial = String(row.last_name_initial);
    const hood = String(row.neighbourhood);
    return {
      id: String(row.id),
      slug: `${first.toLowerCase()}-${initial.toLowerCase()}-${hood.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
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
      distanceMeters: Number(row.distance_meters),
    };
  });
}
