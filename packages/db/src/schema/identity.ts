import {
  pgTable, uuid, text, timestamp, boolean, integer, index, uniqueIndex,
  customType, real,
} from 'drizzle-orm/pg-core';
import { localeEnum, userRoleEnum, provinceEnum, sitterStatusEnum, homeTypeEnum } from './enums.js';

/**
 * PostGIS geography — cografi arama icin zorunlu.
 *
 * NEDEN TYPMOD YOK: drizzle-kit customType adini TIRNAKLAR. "geography" gecerli
 * bir tip adi ama "geography(Point,4326)" gecersiz bir tanimlayici olur ve
 * migration cokerdi. Tipmodsuz geography = geography(Geometry, 4326):
 * SRID 4326 varsayilan, ST_DWithin/ST_Distance METRE dondurur, GIST indeksi calisir.
 * Nokta kisiti uygulama katmaninda; gerekirse CHECK constraint ile eklenebilir.
 */
export const geography = customType<{ data: string; driverData: string }>({
  dataType: () => 'geography',
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    phone: text('phone'),
    phoneVerifiedAt: timestamp('phone_verified_at', { withTimezone: true }),
    locale: localeEnum('locale').notNull().default('en-CA'),
    role: userRoleEnum('role').notNull().default('owner'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    /** Law 25 veri silme hakki — soft delete + anonimlestirme takvimi */
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('users_email_uq').on(t.email)],
);

export const profiles = pgTable(
  'profiles',
  {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    firstName: text('first_name').notNull(),
    /** Gizlilik: profillerde yalnizca soyadi bas harfi gosterilir */
    lastNameInitial: text('last_name_initial').notNull(),
    lastNameEnc: text('last_name_enc'),
    avatarUrl: text('avatar_url'),
    bio: text('bio'),
    cityId: uuid('city_id'),
    neighbourhoodId: uuid('neighbourhood_id'),
    province: provinceEnum('province'),
    postalCode: text('postal_code'),
    /** Haritada gosterilen yaklasik konum (~300m kaydirilmis) */
    approxLocation: geography('approx_location'),
    /** Tam adres yalnizca rezervasyon onaylandiktan sonra acilir — sifreli saklanir */
    exactAddressEnc: text('exact_address_enc'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('profiles_geo_idx').using('gist', t.approxLocation),
    index('profiles_city_idx').on(t.cityId),
  ],
);

export const sitters = pgTable(
  'sitters',
  {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    status: sitterStatusEnum('status').notNull().default('draft'),
    /** 0=yok, 1=kimlik, 2=adli sicil, 3=lisansli/sigortali, 4=sertifikali pro */
    badgeLevel: integer('badge_level').notNull().default(0),

    // --- Siralama girdileri (seffaf skor — yol haritasi §6.4) ---
    medianResponseMinutes: integer('median_response_minutes'),
    acceptanceRate: real('acceptance_rate').notNull().default(0),
    cancellationRate: real('cancellation_rate').notNull().default(0),
    profileCompleteness: real('profile_completeness').notNull().default(0),
    averageRating: real('average_rating').notNull().default(0),
    reviewCount: integer('review_count').notNull().default(0),
    rankingScore: real('ranking_score').notNull().default(0),

    // --- Ortam ---
    homeType: homeTypeEnum('home_type'),
    hasYard: boolean('has_yard').notNull().default(false),
    yardFenced: boolean('yard_fenced').notNull().default(false),
    hasOwnPets: boolean('has_own_pets').notNull().default(false),
    smokeFree: boolean('smoke_free').notNull().default(true),
    maxConcurrentPets: integer('max_concurrent_pets').notNull().default(1),

    // --- Mali / uyum ---
    /** CRA Part XX: her bakici icin SIN zorunlu. Sifreli, erisimi kisitli. */
    sinEncrypted: text('sin_encrypted'),
    tinVerifiedAt: timestamp('tin_verified_at', { withTimezone: true }),
    dateOfBirth: text('date_of_birth'),
    gstRegistered: boolean('gst_registered').notNull().default(false),
    gstNumber: text('gst_number'),
    stripeAccountId: text('stripe_account_id'),
    stripeOnboardedAt: timestamp('stripe_onboarded_at', { withTimezone: true }),

    // --- Lansman promosyonu: ilk 12 ay %0 komisyon ---
    promoEndsAt: timestamp('promo_ends_at', { withTimezone: true }),
    /** Bakicinin kendi musterilerini davet ettigi kalici kod */
    referralCode: text('referral_code'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    activatedAt: timestamp('activated_at', { withTimezone: true }),
    /** DPWRA standardi gonullu uygulama: cikarma yazili gerekce + 2 hafta bildirim */
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivationReason: text('deactivation_reason'),
  },
  (t) => [
    index('sitters_status_idx').on(t.status),
    index('sitters_ranking_idx').on(t.rankingScore),
    uniqueIndex('sitters_referral_code_uq').on(t.referralCode),
  ],
);
