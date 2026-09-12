import {
  pgTable, uuid, text, timestamp, integer, real, jsonb, index, boolean,
} from 'drizzle-orm/pg-core';
import { users, sitters } from './identity.js';
import {
  serviceTypeEnum, bookingStatusEnum, attributionEnum,
  cancellationPolicyEnum, provinceEnum, bookingEventTypeEnum,
} from './enums.js';

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull().references(() => users.id),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId),
    serviceType: serviceTypeEnum('service_type').notNull(),
    status: bookingStatusEnum('status').notNull().default('draft'),

    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }).notNull(),
    units: integer('units').notNull(),
    petIds: jsonb('pet_ids').$type<string[]>().notNull(),

    // --- Fiyat dokumu (drip pricing yasagi: her kalem ayri saklanir) ---
    unitPriceCents: integer('unit_price_cents').notNull(),
    baseCents: integer('base_cents').notNull(),
    extraPetCents: integer('extra_pet_cents').notNull().default(0),
    holidayCents: integer('holiday_cents').notNull().default(0),
    addOnsCents: integer('add_ons_cents').notNull().default(0),
    subtotalCents: integer('subtotal_cents').notNull(),
    ownerFeeCents: integer('owner_fee_cents').notNull(),
    ownerTaxCents: integer('owner_tax_cents').notNull(),
    ownerTotalCents: integer('owner_total_cents').notNull(),

    // --- Komisyon (yol haritasi §2.2) ---
    /** Rezervasyonun nasil dogdugu — komisyon oranini belirleyen tek alan */
    attribution: attributionEnum('attribution').notNull(),
    sitterCommissionPct: real('sitter_commission_pct').notNull(),
    sitterCommissionCents: integer('sitter_commission_cents').notNull(),
    sitterCommissionTaxCents: integer('sitter_commission_tax_cents').notNull().default(0),
    sitterPayoutCents: integer('sitter_payout_cents').notNull(),
    promoApplied: boolean('promo_applied').notNull().default(false),
    province: provinceEnum('province').notNull(),

    cancellationPolicy: cancellationPolicyEnum('cancellation_policy').notNull(),
    specialInstructions: text('special_instructions'),

    // --- Odeme ---
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeTransferId: text('stripe_transfer_id'),
    /** Hizmet bitimi + 48 saat (Stripe CA azami tutma suresi 90 gun) */
    payoutReleaseAt: timestamp('payout_release_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: text('cancelled_by'),
    refundCents: integer('refund_cents'),

    /** Bakici yanit suresi 36 saat */
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('bookings_sitter_time_idx').on(t.sitterId, t.startAt, t.endAt),
    index('bookings_owner_idx').on(t.ownerId, t.startAt),
    index('bookings_status_idx').on(t.status),
    index('bookings_payout_idx').on(t.payoutReleaseAt),
    /** Attribution cozumu icin: bu cift daha once rezervasyon yapti mi */
    index('bookings_pair_idx').on(t.ownerId, t.sitterId, t.status),
  ],
);

/**
 * REZERVASYON OLAYLARI — check-in/out, foto, GPS.
 * Cift amacli: (1) musteri guveni, (2) CHARGEBACK KANITI.
 * Kart itirazlarinda tek savunmamiz budur (§6.5).
 */
export const bookingEvents = pgTable(
  'booking_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
    type: bookingEventTypeEnum('type').notNull(),
    payload: jsonb('payload').$type<Record<string, unknown>>(),
    mediaUrl: text('media_url'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('booking_events_booking_idx').on(t.bookingId, t.createdAt)],
);

/** Ucretsiz on tanisma — Rover'da zayif, bizde birinci sinif ozellik */
export const meetAndGreets = pgTable(
  'meet_and_greets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id').references(() => bookings.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id').notNull().references(() => users.id),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    /** sitter_home | owner_home | neutral | video */
    locationType: text('location_type').notNull().default('sitter_home'),
    status: text('status').notNull().default('proposed'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('mng_sitter_idx').on(t.sitterId, t.scheduledAt)],
);
