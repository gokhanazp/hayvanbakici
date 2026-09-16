import {
  pgTable, uuid, text, timestamp, integer, real, boolean, index, check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './identity.js';

/**
 * PLATFORM AYARLARI — KOMISYON ORANLARI.
 *
 * NEDEN VERITABANINDA: oranlar `DEFAULT_COMMISSION` sabitinde duruyordu
 * ve degistirmek kod degisikligi + dagitim demekti. Bir kampanya acmak
 * icin surum cikarmak zorunda kalmak, kampanyayi KAPATMAYI da ayni
 * zincire bagliyor.
 *
 * TEK SATIR. `id` her zaman 1 (CHECK ile zorlanmis): "hangi ayar
 * satiri gecerli" diye bir soru olmasin. Ikinci bir satir eklenebilse,
 * bir gun biri onu ekler ve uygulamanin hangisini okudugu tesadufe
 * kalir.
 *
 * DEGISIKLIK GECMISI BURADA DEGIL, audit_log'da: kim, ne zaman, oncesi
 * ve sonrasi. Ayar satiri "su an ne gecerli" sorusunu cevapliyor,
 * "ne zaman degisti" sorusunu denetim kaydi.
 */
export const commissionSettings = pgTable(
  'commission_settings',
  {
    id: integer('id').primaryKey().default(1),

    /** Aramadan/kesiften gelen yeni musteri */
    sitterPctPlatform: real('sitter_pct_platform').notNull().default(18),
    /** Ayni bakici x ayni musteri, 2.+ rezervasyon */
    sitterPctRepeat: real('sitter_pct_repeat').notNull().default(10),
    /** Bakicinin kendi getirdigi musteri — stratejinin kalbi */
    sitterPctReferral: real('sitter_pct_referral').notNull().default(0),

    ownerPct: real('owner_pct').notNull().default(7),
    ownerFeeCapCents: integer('owner_fee_cap_cents').notNull().default(4500),
    /** Lansman promosyonu: ilk N ay bakici komisyonu %0 */
    launchPromoMonths: integer('launch_promo_months').notNull().default(12),

    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [check('commission_settings_single_row', sql`${t.id} = 1`)],
);

/**
 * KOMISYON KAMPANYASI — DONEMSEL INDIRIM.
 *
 * NEDEN AYRI TABLO, ayar satirinda birkac sutun degil:
 *
 *  1. Kampanyanin BITIS TARIHI var. Ayar satirina yazilsaydi "geri
 *     almayi unutmak" mumkun olurdu; ayri satirda pencere kapaninca
 *     kampanya kendiliginden etkisiz kaliyor.
 *  2. Yonetici gelecege kampanya kurabiliyor.
 *  3. Gecmis kampanyalar duruyor: "gecen kis ne yapmistik" sorusunun
 *     cevabi kayitta kaliyor.
 *
 * GECMISE DONUK DEGIL. Bir rezervasyonun komisyonu istegin
 * olusturuldugu anda hesaplanip rezervasyon satirina yaziliyor
 * (bookings.sitter_commission_pct / _cents). Kampanya acmak ya da
 * kapatmak gecmisteki hicbir rezervasyonu ve hicbir odemeyi
 * degistirmez.
 *
 * KAMPANYA YALNIZCA BAKICI KOMISYONUNU indirir; musteri hizmet bedeli
 * kapsam disi (bkz. packages/core/src/commission.ts).
 */
export const commissionCampaigns = pgTable(
  'commission_campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),

    /**
     * NULL = "bu attribution icin indirim yok, taban gecerli".
     * Sifir ile null ayni sey DEGIL: sifir "komisyon almiyoruz" demek.
     */
    sitterPctPlatform: real('sitter_pct_platform'),
    sitterPctRepeat: real('sitter_pct_repeat'),
    sitterPctReferral: real('sitter_pct_referral'),

    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),

    /**
     * ERKEN BITIRME — SATIR SILINMIYOR.
     * Kampanyayi silmek, o pencerede yapilmis rezervasyonlarin neden
     * indirimli oldugunu aciklayan kaydi da silerdi.
     */
    endedEarlyAt: timestamp('ended_early_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [
    index('commission_campaigns_window_idx').on(t.startsAt, t.endsAt),
    check('commission_campaigns_window', sql`${t.endsAt} > ${t.startsAt}`),
  ],
);
