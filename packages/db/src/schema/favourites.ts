import { pgTable, uuid, timestamp, index, primaryKey } from 'drizzle-orm/pg-core';
import { users, sitters } from './identity.js';

/**
 * FAVORI BAKICILAR.
 *
 * NEDEN VAR: sahip bir bakiciyi begeniyor ama hemen rezervasyon yapmiyor
 * — once esine soruyor, once tarihleri netlestiriyor. Sonra geri
 * donduğunde o bakiciyi bir daha bulamiyor: arama sonuclari siralamaya
 * ve tarihe gore degisiyor, kartta ad da yalnizca "Camille B." Bu,
 * denetimde kayit altina alinan gercek bir kayip noktasiydi.
 *
 * TABLO NEDEN BOYLE SADE: burada yalnizca "kim, kimi, ne zaman"
 * saklaniyor. Not, etiket, klasor gibi alanlar yok — kimse istemedi ve
 * her ek alan, silinmesi gereken bir kisisel veri daha demek.
 *
 * SAKLAMA: kullanici silindiginde favorileri de gider (cascade). Bakici
 * hesabini kapatirsa favori kaydi da gider — kapali bir hesabi favori
 * listesinde tutmak, tiklanamaz bir karti sonsuza kadar gostermek olurdu.
 *
 * BILESIK ANAHTAR: ayni bakici iki kez favorilenemez. Bunu uygulamada
 * kontrol etmek yerine veritabanina soyletmek, es zamanli iki tiklamada
 * cift kayit olusmasini da engelliyor.
 */
export const favourites = pgTable(
  'favourites',
  {
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sitterId: uuid('sitter_id').notNull().references(() => sitters.userId, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.sitterId] }),
    /* Liste "en son eklenen ustte" siralaniyor — indeks bu siraya gore. */
    index('favourites_user_idx').on(t.userId, t.createdAt),
  ],
);
