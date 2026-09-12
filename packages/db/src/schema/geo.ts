import {
  pgTable, uuid, text, integer, real, boolean, timestamp, index, uniqueIndex, customType,
} from 'drizzle-orm/pg-core';
import { provinceEnum, serviceTypeEnum, localeEnum } from './enums.js';
import { geography } from './identity.js';

const geographyPolygon = customType<{ data: string; driverData: string }>({
  dataType: () => 'geography(MultiPolygon, 4326)',
});

export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slugEn: text('slug_en').notNull(),
    slugFr: text('slug_fr').notNull(),
    nameEn: text('name_en').notNull(),
    nameFr: text('name_fr').notNull(),
    province: provinceEnum('province').notNull(),
    centroid: geography('centroid'),
    /** 1 = lansman sehri, 2 = faz 1, 3 = faz 2 */
    tier: integer('tier').notNull().default(3),
    population: integer('population'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('cities_slug_en_uq').on(t.slugEn, t.province),
    uniqueIndex('cities_slug_fr_uq').on(t.slugFr, t.province),
    index('cities_tier_idx').on(t.tier),
  ],
);

export const neighbourhoods = pgTable(
  'neighbourhoods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cityId: uuid('city_id').notNull().references(() => cities.id, { onDelete: 'cascade' }),
    slugEn: text('slug_en').notNull(),
    slugFr: text('slug_fr').notNull(),
    nameEn: text('name_en').notNull(),
    nameFr: text('name_fr').notNull(),
    boundary: geographyPolygon('boundary'),
    centroid: geography('centroid'),
  },
  (t) => [uniqueIndex('neighbourhoods_slug_uq').on(t.cityId, t.slugEn)],
);

/**
 * LANDING SAYFALARI — programatik SEO'nun veri katmani (§7.3).
 *
 * ARZ ESIGI KURALI burada yasar:
 *   sitterCount >= 8 -> index, follow
 *   sitterCount 3-7  -> index, follow + yakin sehir modulu genisletilir
 *   sitterCount 1-2  -> noindex, follow + bekleme listesi
 *   sitterCount = 0  -> sayfa hic uretilmez (404)
 *
 * Sayfanin en az %40'i buradaki CANLI VERIDEN gelir — thin content/doorway
 * cezasina karsi tek gercek savunmamiz budur.
 */
export const landingPages = pgTable(
  'landing_pages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cityId: uuid('city_id').references(() => cities.id, { onDelete: 'cascade' }),
    neighbourhoodId: uuid('neighbourhood_id').references(() => neighbourhoods.id, { onDelete: 'cascade' }),
    serviceType: serviceTypeEnum('service_type').notNull(),
    locale: localeEnum('locale').notNull(),

    // --- Benzersizligi saglayan canli veri ---
    sitterCount: integer('sitter_count').notNull().default(0),
    medianPriceCents: integer('median_price_cents'),
    p25PriceCents: integer('p25_price_cents'),
    p75PriceCents: integer('p75_price_cents'),
    bookingCount: integer('booking_count').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    avgRating: real('avg_rating'),
    medianResponseMinutes: integer('median_response_minutes'),
    repeatClientAvg: real('repeat_client_avg'),

    /** evaluateIndexability() sonucu — her yeniden hesaplamada guncellenir */
    isIndexable: boolean('is_indexable').notNull().default(false),
    lastComputedAt: timestamp('last_computed_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('landing_uq').on(t.cityId, t.neighbourhoodId, t.serviceType, t.locale),
    index('landing_indexable_idx').on(t.isIndexable, t.locale),
  ],
);
