import {
  pgTable, uuid, text, timestamp, integer, boolean, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users, sitters } from './identity.js';
import { consentTypeEnum, localeEnum } from './enums.js';

/**
 * RIZA KAYITLARI.
 * Law 25: takip teknolojileri icin OPT-IN zorunlu (K. Amerika'nin tek acik opt-in rejimi).
 * CASL: on isaretli kutu YASAK; ispat yuku bizde.
 * Bill 96 s.55: FR sozlesme once sunuldu + taraf acikca EN sectiyse kaydedilmeli.
 */
export const consentRecords = pgTable(
  'consent_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    /** Giris yapmamis ziyaretciler icin anonim tanimlayici */
    anonymousId: text('anonymous_id'),
    type: consentTypeEnum('type').notNull(),
    granted: boolean('granted').notNull(),
    /** Bill 96: rizanin hangi dilde SUNULDUGU kaydedilmeli */
    localeShown: localeEnum('locale_shown').notNull(),
    /** Gosterilen metnin surumu — sonradan degisirse yeniden riza gerekir */
    version: text('version').notNull(),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('consent_user_idx').on(t.userId, t.type, t.createdAt)],
);

/**
 * CRA PART XX RAPORLAMA (§8.4).
 * Her yil 31 Ocak'a kadar CRA'ya + bakiciya kopya.
 * DIKKAT: "2.800 CAD / 30 islem" muafiyeti YALNIZCA mal satanlar icindir.
 * Hizmet saglayicilarda esik YOKTUR — tek bir gezdirme bile raporlanir.
 */
export const taxReports = pgTable(
  'tax_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId),
    year: integer('year').notNull(),
    /** 1-4 ceyreklik kirilim zorunlu */
    quarter: integer('quarter').notNull(),
    grossCents: integer('gross_cents').notNull(),
    commissionCents: integer('commission_cents').notNull(),
    taxWithheldCents: integer('tax_withheld_cents').notNull().default(0),
    transactionCount: integer('transaction_count').notNull(),
    reportedToCraAt: timestamp('reported_to_cra_at', { withTimezone: true }),
    copySentToSitterAt: timestamp('copy_sent_to_sitter_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('tax_report_uq').on(t.sitterId, t.year, t.quarter)],
);

/**
 * IHLAL KAYIT DEFTERI.
 * PIPEDA: TUM ihlaller (RROSH esigini gecmeyenler dahil) 2 YIL saklanmali.
 * Law 25: CAI'ye bildirim + olay mudahale plani zorunlu.
 */
export const incidentRegister = pgTable(
  'incident_register',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(),
    severity: text('severity').notNull(),
    description: text('description').notNull(),
    affectedUserCount: integer('affected_user_count'),
    affectedUserIds: jsonb('affected_user_ids').$type<string[]>(),
    /** "Real Risk Of Significant Harm" degerlendirmesi */
    rroshAssessment: text('rrosh_assessment'),
    rroshMet: boolean('rrosh_met'),
    reportedToOpcAt: timestamp('reported_to_opc_at', { withTimezone: true }),
    reportedToCaiAt: timestamp('reported_to_cai_at', { withTimezone: true }),
    notifiedIndividualsAt: timestamp('notified_individuals_at', { withTimezone: true }),
    detectedAt: timestamp('detected_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    /** PIPEDA: 2 yil saklama */
    retainUntil: timestamp('retain_until', { withTimezone: true }).notNull(),
  },
  (t) => [index('incident_detected_idx').on(t.detectedAt)],
);

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorId: uuid('actor_id'),
    action: text('action').notNull(),
    entity: text('entity').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ip: text('ip'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('audit_entity_idx').on(t.entity, t.entityId, t.createdAt)],
);

/**
 * OTOMATIK KARAR ENVANTERI — Law 25 s.12.1.
 * Karar MUNHASIRAN otomatik islemeye dayaniyorsa: (a) karar aninda bildir,
 * (b) talep uzerine kullanilan veriyi ve ana faktorleri acikla,
 * (c) kararı gozden gecirebilecek bir INSANA gorus sunma kanali ac.
 */
export const automatedDecisions = pgTable(
  'automated_decisions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    decisionType: text('decision_type').notNull(),
    outcome: text('outcome').notNull(),
    /** Kullanilan kisisel veri ve ana faktorler — talep uzerine aciklanir */
    factors: jsonb('factors').$type<Record<string, unknown>>().notNull(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    humanReviewRequestedAt: timestamp('human_review_requested_at', { withTimezone: true }),
    humanReviewedAt: timestamp('human_reviewed_at', { withTimezone: true }),
    humanReviewerId: uuid('human_reviewer_id'),
    humanReviewOutcome: text('human_review_outcome'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('automated_decisions_user_idx').on(t.userId, t.createdAt)],
);
