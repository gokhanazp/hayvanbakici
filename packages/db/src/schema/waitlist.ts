import { pgTable, uuid, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { cities } from './geo.js';
import { localeEnum, serviceTypeEnum } from './enums.js';

/**
 * BEKLEME LISTESI.
 *
 * NEDEN BU TABLO VAR: sayfada zaten bir "Bekleme listesine katil" dugmesi
 * vardi ama sunucu bileseninde, olay isleyicisi olmayan bos bir
 * `<button>`'di. Tikliyordunuz, hicbir sey olmuyordu. Kaydoldugunu
 * saniyordunuz. Calismayan bir soz, verilmemis bir sozden kotudur — ya
 * gercekten kaydedecektik ya dugmeyi kaldiracaktik. Kaydediyoruz.
 *
 * TOPLANAN TEK SEY E-POSTA. Ad, telefon, konum yok: amac tek bir cumle
 * — "bu sehirde bakici cogaldiginda haber ver" (Law 25 md. 5, veri
 * minimizasyonu). Ekranda da bu yaziyor.
 *
 * `notifiedAt` bos: haber verildiginde damgalanacak. Bugun e-posta
 * gonderemiyoruz (saglayici karari bekliyor) — o yuzden bu tablo simdilik
 * yalnizca BIRIKTIRIYOR. Ekranda verilen soz de bu: "cogaldiginda yazariz".
 */
export const waitlistSignups = pgTable(
  'waitlist_signups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    cityId: uuid('city_id').notNull().references(() => cities.id, { onDelete: 'cascade' }),
    serviceType: serviceTypeEnum('service_type').notNull(),
    /** Haberi hangi dilde bekliyor — Bill 96. */
    locale: localeEnum('locale').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
  },
  (t) => [
    /* Ayni kisi ayni sehir+hizmet icin bir kez. Iki kez basmak hata
       degil, sessizce ayni kayda dusuyor. */
    uniqueIndex('waitlist_unique').on(t.email, t.cityId, t.serviceType),
  ],
);
