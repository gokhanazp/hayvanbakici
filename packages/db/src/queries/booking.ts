import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import type { Locale } from './types.js';
import {
  SERVICES, calculateQuote, resolveAttribution, assertTransition,
  REQUEST_EXPIRY_HOURS,
  type ServiceType, type BookingStatus, type Quote,
} from '@havre/core';

/**
 * REZERVASYON — talep, onay, iptal ve musaitlik.
 *
 * ODEME BU KATMANDA YOK. Stripe sozlesmesi henuz yapilmadi; akis
 * `requested` -> `confirmed` ile duruyor ve arayuz "henuz odeme
 * alinmiyor" diyor. Odeme geldiginde eklenecek tek gecis
 * `confirmed -> paid`; durum makinesi (packages/core/booking-state.ts)
 * bunu zaten taniyor, yani buraya sonradan bir sey "sikistirmak"
 * gerekmeyecek.
 *
 * FIYAT BURADA HESAPLANMAZ, packages/core'daki calculateQuote yapar ve
 * sonucu rezervasyona KALEM KALEM yazariz. Gerekce: bakici yarin fiyatini
 * degistirirse dun onaylanmis rezervasyonun tutari degismemeli. Tutar,
 * hesaplandigi anda dondurulur.
 */

/* ------------------------------------------------------------- musaitlik */

export interface CalendarDay {
  date: string;
  status: 'open' | 'blocked' | 'booked';
}

/**
 * Kayitli olmayan gun ACIK sayilir. Bakiciyi 365 gun satir yazmaya
 * zorlamiyoruz; yalnizca kapattigi gunler tabloda duruyor.
 */
export async function getCalendar(
  db: Database, sitterId: string, from: string, to: string,
): Promise<CalendarDay[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT d::date::text AS date,
             COALESCE(a.status, 'open') AS status
      FROM generate_series(${from}::date, ${to}::date, interval '1 day') d
      LEFT JOIN sitter_availability a
        ON a.sitter_id = ${sitterId} AND a.date = d::date
      ORDER BY d
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      date: String(r.date),
      status: String(r.status) as CalendarDay['status'],
    }));
  });
}

/** Bakicinin kendi takvimi — yalnizca 'open' ve 'blocked' yazilabilir. */
export async function setAvailability(
  db: Database, sitterId: string, dates: string[], status: 'open' | 'blocked',
): Promise<number> {
  if (dates.length === 0) return 0;
  return withDbErrors(async () => {
    /*
      'booked' gunlere DOKUNULMAZ. Onaylanmis bir rezervasyonun gununu
      bakici takvimden "acarak" iptal edemez; iptal kendi akisindan gecer,
      cunku iptal politikasi ve bildirim oraya bagli.
    */
    const values = sql.join(
      dates.map((d) => sql`(${sitterId}::uuid, ${d}::date, ${status})`),
      sql`, `,
    );
    const res = await db.execute(sql`
      INSERT INTO sitter_availability (sitter_id, date, status)
      VALUES ${values}
      ON CONFLICT (sitter_id, date) DO UPDATE
        SET status = EXCLUDED.status
        WHERE sitter_availability.status <> 'booked'
    `);
    return (res as unknown as { count?: number }).count ?? dates.length;
  });
}

/* ------------------------------------------------------------ rezervasyon */

export interface BookingDraft {
  ownerId: string;
  sitterId: string;
  serviceType: ServiceType;
  /** ISO tarih (YYYY-MM-DD) */
  startDate: string;
  endDate: string;
  petIds: string[];
  specialInstructions?: string | undefined;
  /** Bakicinin davet koduyla gelindi mi (komisyon %0) */
  viaSitterReferral?: boolean | undefined;
}

export type BookingError =
  | 'service_unavailable'
  | 'dates_invalid'
  | 'dates_unavailable'
  | 'pets_missing'
  | 'sitter_inactive'
  | 'own_booking';

export interface BookingCreated {
  ok: true;
  bookingId: string;
  quote: Quote;
}
export interface BookingFailed {
  ok: false;
  error: BookingError;
}

/** Gece/ziyaret sayisi — hizmetin birimine gore. */
export function unitsBetween(serviceType: ServiceType, start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  const days = Math.round((b - a) / 86400000);
  // Konaklama GECE sayar: 20->22 iki gece. Ziyaret/gezdirme GUN sayar.
  return SERVICES[serviceType].unit === 'night' ? days : days + 1;
}

export async function createBookingRequest(
  db: Database, draft: BookingDraft,
): Promise<BookingCreated | BookingFailed> {
  if (draft.ownerId === draft.sitterId) return { ok: false, error: 'own_booking' };
  if (draft.petIds.length === 0) return { ok: false, error: 'pets_missing' };

  const units = unitsBetween(draft.serviceType, draft.startDate, draft.endDate);
  if (!Number.isFinite(units) || units < 1) return { ok: false, error: 'dates_invalid' };

  return withDbErrors(async () => {
    // --- Bakici ve hizmet ---
    const svcRows = await db.execute(sql`
      SELECT ss.price_cents, ss.extra_pet_price_cents, ss.holiday_surcharge_pct,
             ss.cancellation_policy, st.status AS sitter_status, st.gst_registered,
             st.promo_ends_at, p.province
      FROM sitter_services ss
      JOIN sitters st ON st.user_id = ss.sitter_id
      JOIN profiles p ON p.user_id = ss.sitter_id
      WHERE ss.sitter_id = ${draft.sitterId} AND ss.service_type = ${draft.serviceType}::service_type
        AND ss.is_active
      LIMIT 1
    `);
    const svc = (svcRows as unknown as Array<Record<string, unknown>>)[0];
    if (!svc) return { ok: false, error: 'service_unavailable' as const };
    if (String(svc.sitter_status) !== 'active') return { ok: false, error: 'sitter_inactive' as const };

    // --- Musaitlik: araligin TAMAMI acik olmali ---
    const busy = await db.execute(sql`
      SELECT count(*)::int AS n FROM sitter_availability
      WHERE sitter_id = ${draft.sitterId}
        AND date >= ${draft.startDate}::date AND date <= ${draft.endDate}::date
        AND status <> 'open'
    `);
    if (Number((busy as unknown as Array<{ n: number }>)[0]?.n ?? 0) > 0) {
      return { ok: false, error: 'dates_unavailable' as const };
    }

    /*
      ATIF (komisyon orani) SUNUCUDA belirlenir, istemciden gelmez.
      Istemci "ben tekrar musteriyim" diyebilseydi komisyonu kendi
      secebilirdi. Gecmis rezervasyon sayisi burada sayiliyor.
    */
    const pairRows = await db.execute(sql`
      SELECT count(*)::int AS n FROM bookings
      WHERE owner_id = ${draft.ownerId} AND sitter_id = ${draft.sitterId}
        AND status IN ('completed','payout_released')
    `);
    const attribution = resolveAttribution({
      viaSitterReferral: draft.viaSitterReferral ?? false,
      previousCompletedBookings: Number((pairRows as unknown as Array<{ n: number }>)[0]?.n ?? 0),
    });

    const promoEndsAt = svc.promo_ends_at ? new Date(svc.promo_ends_at as string) : null;
    const quote = calculateQuote({
      serviceType: draft.serviceType,
      unitPriceCents: Number(svc.price_cents),
      units,
      petCount: draft.petIds.length,
      extraPetPriceCents: Number(svc.extra_pet_price_cents ?? 0),
      holidaySurchargePct: Number(svc.holiday_surcharge_pct ?? 0),
      attribution,
      province: String(svc.province) as never,
      promoActive: promoEndsAt !== null && promoEndsAt.getTime() > Date.now(),
      sitterGstRegistered: Boolean(svc.gst_registered),
    });

    const expires = new Date(Date.now() + REQUEST_EXPIRY_HOURS * 3600_000);
    const inserted = await db.execute(sql`
      INSERT INTO bookings (
        owner_id, sitter_id, service_type, status,
        start_at, end_at, units, pet_ids,
        unit_price_cents, base_cents, extra_pet_cents, holiday_cents, add_ons_cents,
        subtotal_cents, owner_fee_cents, owner_tax_cents, owner_total_cents,
        attribution, sitter_commission_pct, sitter_commission_cents,
        sitter_commission_tax_cents, sitter_payout_cents, promo_applied, province,
        cancellation_policy, special_instructions, expires_at
      ) VALUES (
        ${draft.ownerId}, ${draft.sitterId}, ${draft.serviceType}::service_type, 'requested',
        ${draft.startDate}::date, ${draft.endDate}::date, ${units}, ${JSON.stringify(draft.petIds)}::jsonb,
        ${Number(svc.price_cents)}, ${line(quote, 'base')}, ${line(quote, 'extraPets')},
        ${line(quote, 'holidaySurcharge')}, ${line(quote, 'addOns')},
        ${quote.subtotalCents}, ${quote.ownerFeeCents}, ${quote.ownerTaxCents}, ${quote.ownerTotalCents},
        ${attribution}::attribution, ${quote.commission.sitterPct}, ${quote.sitterCommissionCents},
        ${quote.sitterCommissionTaxCents}, ${quote.sitterPayoutCents}, ${quote.commission.promoApplied},
        ${String(svc.province)}::province,
        ${String(svc.cancellation_policy)}::cancellation_policy,
        ${draft.specialInstructions ?? null}, ${expires.toISOString()}
      )
      RETURNING id
    `);
    const bookingId = String((inserted as unknown as Array<{ id: string }>)[0]!.id);

    await logStatus(db, bookingId, draft.ownerId, null, 'requested');
    return { ok: true as const, bookingId, quote };
  });
}

/**
 * Quote satirlarindan bir kalemi cikarir — yoksa 0.
 * Anahtarlar `quote.*` (packages/core/pricing.ts). Once `line.*` araniyordu
 * ve HICBIRI eslesmiyordu: rezervasyona base/extraPet/holiday sifir
 * yaziliyordu. Toplam dogruydu, dokum bostu — tarayicida yakalandi.
 */
function line(q: Quote, key: string): number {
  return q.lines.find((l) => l.key === `quote.${key}`)?.amountCents ?? 0;
}

async function logStatus(
  db: Database, bookingId: string, actorId: string,
  from: BookingStatus | null, to: BookingStatus,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO booking_events (booking_id, type, payload, created_by)
    VALUES (${bookingId}, 'status_change',
            ${JSON.stringify({ from, to })}::jsonb, ${actorId})
  `);
}

/* ------------------------------------------------------------------ liste */

export interface BookingSummary {
  id: string;
  status: BookingStatus;
  serviceType: ServiceType;
  startAt: string;
  endAt: string;
  units: number;
  ownerTotalCents: number;
  sitterPayoutCents: number;
  /** Karsi tarafin adi — sahip icin bakici, bakici icin sahip */
  counterpartFirstName: string;
  counterpartInitial: string;
  counterpartAvatarUrl: string | null;
  sitterSlug: string | null;
  citySlugEn: string | null;
  citySlugFr: string | null;
  expiresAt: string | null;
  createdAt: string;
}

const SUMMARY_COLUMNS = sql`
  b.id, b.status, b.service_type, b.start_at, b.end_at, b.units,
  b.owner_total_cents, b.sitter_payout_cents, b.expires_at, b.created_at
`;

function toSummary(r: Record<string, unknown>): BookingSummary {
  return {
    id: String(r.id),
    status: String(r.status) as BookingStatus,
    serviceType: String(r.service_type) as ServiceType,
    startAt: new Date(r.start_at as Date).toISOString(),
    endAt: new Date(r.end_at as Date).toISOString(),
    units: Number(r.units),
    ownerTotalCents: Number(r.owner_total_cents),
    sitterPayoutCents: Number(r.sitter_payout_cents),
    counterpartFirstName: String(r.first_name ?? ''),
    counterpartInitial: String(r.last_name_initial ?? ''),
    counterpartAvatarUrl: (r.avatar_url as string | null) ?? null,
    sitterSlug: (r.sitter_slug as string | null) ?? null,
    citySlugEn: (r.city_slug_en as string | null) ?? null,
    citySlugFr: (r.city_slug_fr as string | null) ?? null,
    expiresAt: r.expires_at ? new Date(r.expires_at as Date).toISOString() : null,
    createdAt: new Date(r.created_at as Date).toISOString(),
  };
}

/** Sahibin rezervasyonlari — karsi taraf bakicidir. */
export async function listOwnerBookings(db: Database, ownerId: string): Promise<BookingSummary[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT ${SUMMARY_COLUMNS},
             p.first_name, p.last_name_initial, p.avatar_url,
             st.slug AS sitter_slug, c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr
      FROM bookings b
      JOIN sitters st ON st.user_id = b.sitter_id
      JOIN profiles p ON p.user_id = b.sitter_id
      LEFT JOIN cities c ON c.id = p.city_id
      WHERE b.owner_id = ${ownerId}
      ORDER BY b.start_at DESC
      LIMIT 50
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map(toSummary);
  });
}

/** Bakiciya gelen rezervasyonlar — karsi taraf sahiptir. */
export async function listSitterBookings(db: Database, sitterId: string): Promise<BookingSummary[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT ${SUMMARY_COLUMNS},
             p.first_name, p.last_name_initial, p.avatar_url,
             NULL::text AS sitter_slug, NULL::text AS city_slug_en, NULL::text AS city_slug_fr
      FROM bookings b
      LEFT JOIN profiles p ON p.user_id = b.owner_id
      WHERE b.sitter_id = ${sitterId}
      ORDER BY
        -- Bekleyen talepler EN USTTE: bakicinin 36 saati var
        CASE WHEN b.status = 'requested' THEN 0 ELSE 1 END,
        b.start_at DESC
      LIMIT 50
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map(toSummary);
  });
}

/* ----------------------------------------------------------------- detay */

export interface BookingDetail extends BookingSummary {
  /** Bakan kisi bu rezervasyonda hangi taraf */
  viewerRole: 'owner' | 'sitter';
  ownerId: string;
  sitterId: string;
  unitPriceCents: number;
  baseCents: number;
  extraPetCents: number;
  holidayCents: number;
  ownerFeeCents: number;
  ownerTaxCents: number;
  subtotalCents: number;
  sitterCommissionPct: number;
  sitterCommissionCents: number;
  attribution: string;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  specialInstructions: string | null;
  pets: Array<{ id: string; name: string; species: string; weightKg: number | null }>;
  timeline: Array<{ at: string; from: string | null; to: string }>;
}

/**
 * Yalnizca TARAFLAR gorebilir. Kimlik kontrolu sorgunun WHERE'inde —
 * sayfada degil: sayfa unutabilir, sorgu unutmaz.
 */
export async function getBookingForViewer(
  db: Database, bookingId: string, viewerId: string, locale: Locale,
): Promise<BookingDetail | null> {
  void locale;
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT ${SUMMARY_COLUMNS},
             b.owner_id, b.sitter_id, b.unit_price_cents, b.base_cents, b.extra_pet_cents,
             b.holiday_cents, b.owner_fee_cents, b.owner_tax_cents, b.subtotal_cents,
             b.sitter_commission_pct, b.sitter_commission_cents, b.attribution,
             b.cancellation_policy, b.special_instructions, b.pet_ids,
             CASE WHEN b.owner_id = ${viewerId} THEN 'owner' ELSE 'sitter' END AS viewer_role,
             cp.first_name, cp.last_name_initial, cp.avatar_url,
             st.slug AS sitter_slug, c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr
      FROM bookings b
      JOIN sitters st ON st.user_id = b.sitter_id
      LEFT JOIN profiles sp ON sp.user_id = b.sitter_id
      LEFT JOIN cities c ON c.id = sp.city_id
      -- Karsi tarafin profili: bakan kisi sahipse bakiciyi, degilse sahibi goster
      LEFT JOIN profiles cp ON cp.user_id =
        CASE WHEN b.owner_id = ${viewerId} THEN b.sitter_id ELSE b.owner_id END
      WHERE b.id = ${bookingId}
        AND (b.owner_id = ${viewerId} OR b.sitter_id = ${viewerId})
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;

    const petIds = (r.pet_ids as string[] | null) ?? [];
    const pets = petIds.length === 0 ? [] : await db.execute(sql`
      SELECT id::text, name, species::text, weight_kg FROM pets
      WHERE id = ANY(${sql`ARRAY[${sql.join(petIds.map((p) => sql`${p}::uuid`), sql`, `)}]`})
    `);

    const events = await db.execute(sql`
      SELECT created_at, payload FROM booking_events
      WHERE booking_id = ${bookingId} AND type = 'status_change'
      ORDER BY created_at ASC
    `);

    return {
      ...toSummary(r),
      viewerRole: String(r.viewer_role) as 'owner' | 'sitter',
      ownerId: String(r.owner_id),
      sitterId: String(r.sitter_id),
      unitPriceCents: Number(r.unit_price_cents),
      baseCents: Number(r.base_cents),
      extraPetCents: Number(r.extra_pet_cents),
      holidayCents: Number(r.holiday_cents),
      ownerFeeCents: Number(r.owner_fee_cents),
      ownerTaxCents: Number(r.owner_tax_cents),
      subtotalCents: Number(r.subtotal_cents),
      sitterCommissionPct: Number(r.sitter_commission_pct),
      sitterCommissionCents: Number(r.sitter_commission_cents),
      attribution: String(r.attribution),
      cancellationPolicy: String(r.cancellation_policy) as 'flexible' | 'moderate' | 'strict',
      specialInstructions: (r.special_instructions as string | null) ?? null,
      pets: (pets as unknown as Array<Record<string, unknown>>).map((p) => ({
        id: String(p.id), name: String(p.name), species: String(p.species),
        weightKg: p.weight_kg === null ? null : Number(p.weight_kg),
      })),
      timeline: (events as unknown as Array<Record<string, unknown>>).map((e) => {
        const payload = (e.payload ?? {}) as { from?: string | null; to?: string };
        return {
          at: new Date(e.created_at as Date).toISOString(),
          from: payload.from ?? null,
          to: String(payload.to ?? ''),
        };
      }),
    } satisfies BookingDetail;
  });
}

/* ------------------------------------------------------------- gecisler */

export type TransitionResult = { ok: true } | { ok: false; error: 'not_found' | 'not_allowed' | 'invalid' };

/**
 * Bakicinin yaniti: onayla ya da reddet.
 * Gecis packages/core'daki durum makinesinden gecirilir — "requested
 * olmayan bir rezervasyonu onaylama" gibi bir hata veriye yazilamaz.
 */
export async function respondToRequest(
  db: Database, bookingId: string, sitterId: string, to: 'confirmed' | 'declined',
): Promise<TransitionResult> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT status, start_at::date::text AS start_date, end_at::date::text AS end_date
      FROM bookings WHERE id = ${bookingId} AND sitter_id = ${sitterId} LIMIT 1
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };

    const from = String(row.status) as BookingStatus;
    try {
      assertTransition(from, to);
    } catch {
      return { ok: false as const, error: 'invalid' as const };
    }

    await db.execute(sql`UPDATE bookings SET status = ${to}::booking_status, updated_at = now() WHERE id = ${bookingId}`);

    if (to === 'confirmed') {
      /*
        Onaylanan gunler takvimde 'booked' olur. Bunu yapmazsak ayni gune
        ikinci bir talep gelebilir ve bakici iki rezervasyonu birden
        onaylayabilirdi.
      */
      await db.execute(sql`
        INSERT INTO sitter_availability (sitter_id, date, status, booked_count)
        SELECT ${sitterId}::uuid, d::date, 'booked', 1
        FROM generate_series(${String(row.start_date)}::date, ${String(row.end_date)}::date, interval '1 day') d
        ON CONFLICT (sitter_id, date) DO UPDATE
          SET status = 'booked', booked_count = sitter_availability.booked_count + 1
      `);
    }

    await logStatus(db, bookingId, sitterId, from, to);
    return { ok: true as const };
  });
}

/** Iki taraf da iptal edebilir; iptal eden kaydediliyor. */
export async function cancelBooking(
  db: Database, bookingId: string, userId: string,
): Promise<TransitionResult> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT status, owner_id, sitter_id,
             start_at::date::text AS start_date, end_at::date::text AS end_date
      FROM bookings
      WHERE id = ${bookingId} AND (owner_id = ${userId} OR sitter_id = ${userId})
      LIMIT 1
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };

    const from = String(row.status) as BookingStatus;
    try {
      assertTransition(from, 'cancelled');
    } catch {
      return { ok: false as const, error: 'invalid' as const };
    }

    const by = String(row.owner_id) === userId ? 'owner' : 'sitter';
    await db.execute(sql`
      UPDATE bookings
      SET status = 'cancelled', cancelled_at = now(), cancelled_by = ${by}, updated_at = now()
      WHERE id = ${bookingId}
    `);

    // Tutulan gunler serbest birakilir
    if (from === 'confirmed') {
      await db.execute(sql`
        UPDATE sitter_availability
        SET status = 'open', booked_count = GREATEST(booked_count - 1, 0)
        WHERE sitter_id = ${String(row.sitter_id)}
          AND date >= ${String(row.start_date)}::date AND date <= ${String(row.end_date)}::date
      `);
    }

    await logStatus(db, bookingId, userId, from, 'cancelled');
    return { ok: true as const };
  });
}

/* --------------------------------------------------------------- hayvan */

export interface PetDraft {
  ownerId: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  weightKg?: number | undefined;
  notes?: string | undefined;
}

export async function createPet(db: Database, pet: PetDraft): Promise<string> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      INSERT INTO pets (owner_id, name, species, weight_kg, temperament_notes)
      VALUES (${pet.ownerId}, ${pet.name}, ${pet.species}::species,
              ${pet.weightKg ?? null}, ${pet.notes ?? null})
      RETURNING id::text
    `);
    return String((rows as unknown as Array<{ id: string }>)[0]!.id);
  });
}

export async function listPets(db: Database, ownerId: string): Promise<
  Array<{ id: string; name: string; species: string; weightKg: number | null }>
> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT id::text, name, species::text, weight_kg FROM pets
      WHERE owner_id = ${ownerId} AND deleted_at IS NULL
      ORDER BY created_at ASC
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((p) => ({
      id: String(p.id), name: String(p.name), species: String(p.species),
      weightKg: p.weight_kg === null ? null : Number(p.weight_kg),
    }));
  });
}

/** Bu kullanici bir bakici mi — hesap menusunde bakici bolumu cizilsin mi. */
export async function isSitter(db: Database, userId: string): Promise<boolean> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`SELECT 1 FROM sitters WHERE user_id = ${userId} LIMIT 1`);
    return (rows as unknown as unknown[]).length > 0;
  });
}
