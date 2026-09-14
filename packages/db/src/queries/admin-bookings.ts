import { sql } from 'drizzle-orm';
import { canTransition, type BookingStatus } from '@havre/core';
import { withDbErrors, type Database } from '../client.js';
import { recordAudit } from './admin.js';
import type { AdminActionResult } from './admin-users.js';

/**
 * REZERVASYON DETAYI VE MUDAHALE (yonetici paneli).
 *
 * Destek ekibi bir rezervasyonu iki taraftan biri adina duzeltmek zorunda
 * kalabilir: bakici hastalandi ve iptal edemiyor, sahip yanlis tarihle
 * onay verdi... Bu ekran onun icin.
 *
 * UC KURAL:
 *  1. Yonetici de DURUM MAKINESININ disina cikamaz. `canTransition`
 *     kontrolu burada da calisiyor — "yonetici her seyi yapabilir" demek,
 *     odenmis bir rezervasyonu talebe geri dondurup muhasebeyi bozmak
 *     demektir.
 *  2. Her mudahalenin GEREKCESI zorunlu; gerekce hem rezervasyonun
 *     zaman cizelgesine hem audit_log'a yaziliyor.
 *  3. Ozel talimat metni (`special_instructions`) ve mesajlar bu ekranda
 *     GORUNMEZ: destek isini gormek icin tarih, tutar ve durum yeter.
 */

export interface AdminBookingDetail {
  id: string;
  status: string;
  serviceType: string;
  startAt: string;
  endAt: string;
  units: number;
  createdAt: string;
  expiresAt: string | null;

  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  sitterId: string;
  sitterName: string;
  sitterEmail: string;
  sitterSlug: string | null;

  unitPriceCents: number;
  baseCents: number;
  extraPetCents: number;
  holidayCents: number;
  subtotalCents: number;
  ownerFeeCents: number;
  ownerTaxCents: number;
  ownerTotalCents: number;
  sitterCommissionPct: number;
  sitterCommissionCents: number;
  sitterPayoutCents: number;
  attribution: string;
  province: string;
  cancellationPolicy: string;
  cancelledBy: string | null;

  timeline: Array<{ at: string; from: string | null; to: string; actorName: string | null }>;
  petCount: number;
}

export async function getBookingAdmin(
  db: Database, bookingId: string,
): Promise<AdminBookingDetail | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT b.id::text, b.status::text, b.service_type::text, b.start_at, b.end_at, b.units,
             b.created_at, b.expires_at, b.pet_ids,
             b.owner_id::text, b.sitter_id::text,
             b.unit_price_cents, b.base_cents, b.extra_pet_cents, b.holiday_cents,
             b.subtotal_cents, b.owner_fee_cents, b.owner_tax_cents, b.owner_total_cents,
             b.sitter_commission_pct, b.sitter_commission_cents, b.sitter_payout_cents,
             b.attribution::text, b.province::text, b.cancellation_policy::text, b.cancelled_by,
             COALESCE(op.first_name, '—') AS owner_name, ou.email AS owner_email,
             COALESCE(sp.first_name, '—') AS sitter_name, su.email AS sitter_email,
             st.slug AS sitter_slug
      FROM bookings b
      JOIN users ou ON ou.id = b.owner_id
      JOIN users su ON su.id = b.sitter_id
      LEFT JOIN profiles op ON op.user_id = b.owner_id
      LEFT JOIN profiles sp ON sp.user_id = b.sitter_id
      LEFT JOIN sitters st ON st.user_id = b.sitter_id
      WHERE b.id = ${bookingId}
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;

    const events = await db.execute(sql`
      SELECT e.created_at, e.payload,
             COALESCE(p.first_name, u.email) AS actor_name
      FROM booking_events e
      LEFT JOIN users u ON u.id = e.created_by
      LEFT JOIN profiles p ON p.user_id = e.created_by
      WHERE e.booking_id = ${bookingId} AND e.type = 'status_change'
      ORDER BY e.created_at ASC
    `);

    return {
      id: String(r.id),
      status: String(r.status),
      serviceType: String(r.service_type),
      startAt: new Date(r.start_at as Date).toISOString(),
      endAt: new Date(r.end_at as Date).toISOString(),
      units: Number(r.units),
      createdAt: new Date(r.created_at as Date).toISOString(),
      expiresAt: r.expires_at ? new Date(r.expires_at as Date).toISOString() : null,
      ownerId: String(r.owner_id),
      ownerName: String(r.owner_name),
      ownerEmail: String(r.owner_email),
      sitterId: String(r.sitter_id),
      sitterName: String(r.sitter_name),
      sitterEmail: String(r.sitter_email),
      sitterSlug: (r.sitter_slug as string | null) ?? null,
      unitPriceCents: Number(r.unit_price_cents),
      baseCents: Number(r.base_cents),
      extraPetCents: Number(r.extra_pet_cents),
      holidayCents: Number(r.holiday_cents),
      subtotalCents: Number(r.subtotal_cents),
      ownerFeeCents: Number(r.owner_fee_cents),
      ownerTaxCents: Number(r.owner_tax_cents),
      ownerTotalCents: Number(r.owner_total_cents),
      sitterCommissionPct: Number(r.sitter_commission_pct),
      sitterCommissionCents: Number(r.sitter_commission_cents),
      sitterPayoutCents: Number(r.sitter_payout_cents),
      attribution: String(r.attribution),
      province: String(r.province),
      cancellationPolicy: String(r.cancellation_policy),
      cancelledBy: (r.cancelled_by as string | null) ?? null,
      petCount: ((r.pet_ids as string[] | null) ?? []).length,
      timeline: (events as unknown as Array<Record<string, unknown>>).map((e) => {
        const payload = (e.payload ?? {}) as { from?: string | null; to?: string };
        return {
          at: new Date(e.created_at as Date).toISOString(),
          from: payload.from ?? null,
          to: String(payload.to ?? '?'),
          actorName: (e.actor_name as string | null) ?? null,
        };
      }),
    };
  });
}

/** Yoneticinin elle verebilecegi durumlar — tam liste bilerek kisa. */
export const ADMIN_TRANSITIONS = ['confirmed', 'cancelled', 'completed', 'declined'] as const;
export type AdminTransition = (typeof ADMIN_TRANSITIONS)[number];

export async function adminSetBookingStatus(
  db: Database,
  input: {
    bookingId: string; adminId: string; to: AdminTransition;
    reason: string; ip?: string | undefined;
  },
): Promise<AdminActionResult> {
  const reason = input.reason.trim();
  if (reason.length < 10) return { ok: false, error: 'reason_required' };

  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT status::text, sitter_id::text,
             start_at::date::text AS start_date, end_at::date::text AS end_date
      FROM bookings WHERE id = ${input.bookingId} LIMIT 1
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };

    const from = String(row.status) as BookingStatus;
    // Yonetici de durum makinesinin disina cikamaz
    if (!canTransition(from, input.to)) {
      return { ok: false as const, error: 'invalid_state' as const };
    }

    if (input.to === 'cancelled') {
      await db.execute(sql`
        UPDATE bookings
        SET status = 'cancelled', cancelled_at = now(), cancelled_by = 'admin', updated_at = now()
        WHERE id = ${input.bookingId}
      `);
      if (from === 'confirmed') {
        await db.execute(sql`
          UPDATE sitter_availability
          SET status = 'open', booked_count = GREATEST(booked_count - 1, 0)
          WHERE sitter_id = ${String(row.sitter_id)}
            AND date >= ${String(row.start_date)}::date
            AND date <= ${String(row.end_date)}::date
        `);
      }
    } else if (input.to === 'completed') {
      await db.execute(sql`
        UPDATE bookings SET status = 'completed', completed_at = now(), updated_at = now()
        WHERE id = ${input.bookingId}
      `);
    } else {
      await db.execute(sql`
        UPDATE bookings SET status = ${input.to}::booking_status, updated_at = now()
        WHERE id = ${input.bookingId}
      `);
    }

    // Zaman cizelgesine yoneticinin kimligiyle yaziliyor — "sistem" degil,
    // bir insan yapti ve kim oldugu belli.
    await db.execute(sql`
      INSERT INTO booking_events (booking_id, type, payload, created_by)
      VALUES (${input.bookingId}, 'status_change',
              ${JSON.stringify({ from, to: input.to, by: 'admin', reason })}::jsonb,
              ${input.adminId})
    `);

    await recordAudit(db, {
      actorId: input.adminId,
      action: 'booking.override',
      entity: 'booking',
      entityId: input.bookingId,
      before: { status: from },
      after: { status: input.to, reason },
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return { ok: true as const };
  });
}
