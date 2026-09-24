import {
  pgTable, uuid, integer, boolean, date, timestamp, real, index, uniqueIndex, text,
} from 'drizzle-orm/pg-core';
import { sitters } from './identity.js';
import type { PetSizeKey } from '@havre/core';
import { serviceTypeEnum, priceUnitEnum, cancellationPolicyEnum, verificationTypeEnum, verificationStatusEnum } from './enums.js';

export const sitterServices = pgTable(
  'sitter_services',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId, { onDelete: 'cascade' }),
    serviceType: serviceTypeEnum('service_type').notNull(),
    /** SINIFLANDIRMA RISKI: fiyati BAKICI belirler, platform yalnizca aralik onerir (§8.4) */
    priceCents: integer('price_cents').notNull(),
    priceUnit: priceUnitEnum('price_unit').notNull(),
    extraPetPriceCents: integer('extra_pet_price_cents').notNull().default(0),
    holidaySurchargePct: real('holiday_surcharge_pct').notNull().default(0),
    cancellationPolicy: cancellationPolicyEnum('cancellation_policy').notNull().default('moderate'),
    /*
      KABUL EDILEN BOYUTLAR — KUME.

      Once `accepted_size_min_kg` / `accepted_size_max_kg` vardi. Alt
      sinir hicbir zaman kullanilmadi (kimse "en az 5 kilo" demiyor) ve
      tek bir tavan, bakiciyi sifirdan baslayan kesintisiz bir aralik
      soylemeye zorluyordu. Kademeler artik bagimsiz: bkz.
      PET_SIZE_STEPS ve normalizePetSizes (packages/core/services.ts).

      Varsayilan YOK ve bos dizi gecerli bir cevap degil: sihirbaz en az
      bir kademe istiyor. Sutun varsayilaniyla dolan bir satir,
      bakicinin vermedigi bir soz olurdu.
    */
    acceptedSizes: text('accepted_sizes').array().$type<PetSizeKey[]>().notNull(),
    acceptsDogs: boolean('accepts_dogs').notNull().default(true),
    acceptsCats: boolean('accepts_cats').notNull().default(false),
    acceptsOther: boolean('accepts_other').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('sitter_service_uq').on(t.sitterId, t.serviceType),
    index('sitter_services_lookup').on(t.serviceType, t.isActive),
  ],
);

export const sitterAvailability = pgTable(
  'sitter_availability',
  {
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    /** open | blocked | booked */
    status: text('status').notNull().default('open'),
    bookedCount: integer('booked_count').notNull().default(0),
  },
  (t) => [
    uniqueIndex('availability_uq').on(t.sitterId, t.date),
    index('availability_lookup').on(t.sitterId, t.date),
  ],
);

/**
 * DOGRULAMA KAYITLARI.
 * GIZLILIK: Ham adli sicil raporu ASLA saklanmaz — yalnizca karar, tarih ve
 * saglayici referansi tutulur (PIPEDA/Law 25 hassas veri kurali, §8.5).
 *
 * QUEBEC: Otomatik red YOK. Charter s.18.2 geregi suc-is baglanti matrisi +
 * insan incelemesi zorunlu (ayrica Law 25 s.12.1 otomatik karar yukumlulugu).
 */
export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId, { onDelete: 'cascade' }),
    type: verificationTypeEnum('type').notNull(),
    status: verificationStatusEnum('status').notNull().default('not_started'),
    provider: text('provider'),
    providerRef: text('provider_ref'),
    /** Yalnizca karar — ham rapor degil */
    decision: text('decision'),
    decidedBy: uuid('decided_by'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    /** Law 25 s.12.1: otomatik karar verildiyse bildirim yapildi mi */
    automatedDecision: boolean('automated_decision').notNull().default(false),
    humanReviewRequestedAt: timestamp('human_review_requested_at', { withTimezone: true }),
    /** Belediye izni / sigorta poliçesi gibi belgeler */
    documentUrl: text('document_url'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('verifications_sitter_idx').on(t.sitterId, t.type)],
);
