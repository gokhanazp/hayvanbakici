import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { sitters, users } from './identity.js';
import { bookings } from './bookings.js';
import { claimTypeEnum, claimStatusEnum } from './enums.js';

export const payouts = pgTable(
  'payouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId),
    stripeTransferId: text('stripe_transfer_id'),
    amountCents: integer('amount_cents').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('pending'),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
  },
  (t) => [index('payouts_sitter_idx').on(t.sitterId, t.createdAt)],
);

export const disputes = pgTable(
  'disputes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id').notNull().references(() => bookings.id),
    openedBy: uuid('opened_by').notNull().references(() => users.id),
    type: text('type').notNull(),
    description: text('description'),
    status: text('status').notNull().default('open'),
    resolution: text('resolution'),
    /** 48 saat SLA — rakiplerden farklilasma noktasi */
    slaDueAt: timestamp('sla_due_at', { withTimezone: true }).notNull(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('disputes_sla_idx').on(t.slaDueAt, t.status)],
);

/**
 * TAZMINAT TALEPLERI (koruma programi).
 *
 * ⚠️ HUKUKI UYARI (§5.4, §8.8 madde 1): Bu program SIGORTA DEGILDIR, sozlesmesel
 * bir tazmin programidir. Sartlarda EN+FR buyuk harfle belirtilmelidir.
 * "Sigorta isi yapma" tanimina girmemek icin Kanadali sigorta duzenleme
 * avukatina MUTLAKA dogrulatilmalidir. Raporun en riskli maddesi budur.
 *
 * FARKLILASMA: sitter_property turu hicbir rakipte yok.
 */
export const claims = pgTable(
  'claims',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookingId: uuid('booking_id').notNull().references(() => bookings.id),
    claimantId: uuid('claimant_id').notNull().references(() => users.id),
    type: claimTypeEnum('type').notNull(),
    status: claimStatusEnum('status').notNull().default('submitted'),
    amountRequestedCents: integer('amount_requested_cents').notNull(),
    amountApprovedCents: integer('amount_approved_cents'),
    /** Muafiyet 250 CAD */
    deductibleCents: integer('deductible_cents').notNull().default(25000),
    description: text('description').notNull(),
    /** 48 saat karar SLA-si */
    decisionDueAt: timestamp('decision_due_at', { withTimezone: true }).notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    /** Red halinde YAZILI gerekce zorunlu */
    decisionReason: text('decision_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('claims_sla_idx').on(t.decisionDueAt, t.status)],
);
