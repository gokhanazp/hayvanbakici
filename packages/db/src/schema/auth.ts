import {
  pgTable, uuid, text, timestamp, boolean, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './identity.js';

/**
 * BETTER AUTH TABLOLARI.
 *
 * NEDEN AYRI DOSYA: bu uc tablonun SEKLI kutuphane tarafindan dayatiliyor.
 * Alan adlari degistirilirse adapter esleme yapilandirmasi gerekir ve
 * kutuphane surum atladiginda sessizce kirilir. Ayri dosyada durmalari
 * "buraya kendi alanlarini ekleme" uyarisi gorevi goruyor — domain verisi
 * identity.ts'teki profiles/sitters tablolarina yazilir.
 *
 * TABLO ADI CAKISMASI: kutuphanenin varsayilan "verification" tablosu bizim
 * adli sicil dogrulama tablomuzla (services.ts icindeki `verifications`)
 * karisirdi. Bu yuzden fiziksel ad `auth_verification` yapildi ve adapter'a
 * schema esleme nesnesiyle taniticaz (packages/auth/src/server.ts).
 *
 * ID TIPI: kutuphane varsayilan olarak kendi string id'sini uretir. Biz
 * advanced.database.generateId ile crypto.randomUUID() veriyoruz, boylece
 * tum tablolarda tek tip birincil anahtar (uuid) kaliyor ve users.id'ye
 * yabanci anahtar kurulabiliyor.
 */

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Cerezde tasinan deger — tahmin edilemez, tekil */
    token: text('token').notNull(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    /**
     * PIPEDA/Law 25: oturum meta verisi kisisel veridir. "Cihazlarim" ekraninda
     * kullaniciya gosterilip tek tek iptal edilebilmesi icin tutuluyor,
     * profilleme icin DEGIL. Saklama: oturumla birlikte silinir.
     */
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('sessions_token_uq').on(t.token),
    index('sessions_user_idx').on(t.userId),
    index('sessions_expires_idx').on(t.expiresAt),
  ],
);

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    /** 'credential' | 'google' | 'apple' */
    providerId: text('provider_id').notNull(),
    /** Saglayicidaki kullanici kimligi; credential icin users.id */
    accountId: text('account_id').notNull(),

    /**
     * SIFRE HASH'I.
     * Argon2id ile uretiliyor (packages/auth/src/password.ts). Duz metin sifre
     * hicbir yerde loglanmaz, hicbir yerde saklanmaz.
     */
    password: text('password'),

    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('accounts_provider_uq').on(t.providerId, t.accountId),
    index('accounts_user_idx').on(t.userId),
  ],
);

/**
 * TEK KULLANIMLIK JETONLAR: e-posta dogrulama, sihirli baglanti, sifre sifirlama.
 * Kisa omurlu; suresi gecenler temizlik isiyle silinir.
 */
export const authVerifications = pgTable(
  'auth_verification',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Ornegin "sign-in:e-posta" ya da "reset-password:kullanici-id" */
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('auth_verification_identifier_idx').on(t.identifier),
    index('auth_verification_expires_idx').on(t.expiresAt),
  ],
);

/**
 * SIFRE SIFIRLAMA / GIRIS DENEME SAYACI.
 * Better Auth'un kendi rate limit'i bellekte calisir; birden fazla sunucu
 * ornegi oldugunda ise yaramaz. Bu tablo kalici sayac: ayni e-postaya ya da
 * ayni IP'ye yapilan basarisiz denemeler burada birikir.
 */
export const authAttempts = pgTable(
  'auth_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 'email:<adres>' veya 'ip:<adres>' */
    key: text('key').notNull(),
    action: text('action').notNull(),
    succeeded: boolean('succeeded').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('auth_attempts_key_idx').on(t.key, t.action, t.createdAt)],
);
