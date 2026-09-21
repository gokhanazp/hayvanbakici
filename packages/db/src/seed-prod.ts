/**
 * URETIM TOHUMU — REFERANS VERISI, UYDURMA KISI YOK.
 *
 * `db:seed` gelistirme icin: 144 uydurma bakici, 1.760 uydurma
 * rezervasyon, 1.136 uydurma yorum. Canli sitede bunlarin hepsi ekranda
 * GERCEKMIS gibi gorunur — "247 dogrulanmis bakici" yazan bir ana sayfa,
 * arkasinda kimse yokken en buyuk iddiamizi curutur.
 *
 * Bu betik yalnizca SEHIR ve MAHALLE verisini yukluyor. Ikisi de gercek
 * cografya: adlar, iki dilli adresler ve koordinatlar. Arama bunlar
 * olmadan calismiyor (PostGIS mesafesi mahalle merkezinden hesaplaniyor)
 * ve SEO sayfalarinin tamami bunlarin uzerine kurulu.
 *
 * `sitterCount` ALANI OKUNMUYOR: o, gelistirme tohumunun kac kisi
 * uretecegini soyluyor. Burada kimse uretilmiyor. Arz esigi kurali
 * (3'ten az bakici = noindex) gercek bakicilar geldikce kendiliginden
 * calisiyor.
 *
 * TEKRAR CALISTIRILABILIR. Sehirler slug'a gore upsert ediliyor, yani
 * kimlikleri sabit kaliyor ve o sehre bagli profiller kopmuyor.
 * Mahalleler her seferinde yeniden yaziliyor (profiles.neighbourhood_id
 * uzerinde yabanci anahtar yok).
 *
 * UYDURMA HESAPLARI DA TEMIZLIYOR: bir veritabani once gelistirme
 * tohumuyla doldurulduysa, `--clean` ile @seed.havre.test hesaplarinin
 * tamami ve onlara bagli her sey siliniyor. Gercek hesaplara
 * DOKUNMUYOR.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as s from './schema/index.js';
import { SEED_CITIES } from './seed-data.js';
import { hostOf } from './seed-guard.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL tanimli degil');

const clean = process.argv.includes('--clean');

const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema: s });

const point = (lon: number, lat: number) =>
  sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`;

const slugify = (v: string) =>
  v.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

console.log(`veritabani: ${hostOf(url) || '(cozulemedi)'}`);

/* ------------------------------------------------- uydurma veri temizligi */
/*
  NEYIN UYDURMA OLDUGU TAHMINLE DEGIL, RFC ILE BELIRLENIYOR.

  Ilk denemede yalnizca `@seed.havre.test` siliyordum. Uretim tohumundan
  sonra ekrana bastigim "veritabaninda kalan" satiri 691 kullanici ve
  321 bakici gosterdi: otomatik testlerin biraktigi fikstur hesaplari.
  Sonra 89 tane daha cikti. Gordugum alan adlarini tek tek listeye
  eklemek yerine KURALI yazdim:

  - RFC 2606 `.test`, `.example`, `.invalid`, `.localhost` ust duzey
    alan adlarini SINAMA ICIN AYIRIYOR; bu adreslere posta gidemez.
  - Ayni RFC `example.com/net/org` alan adlarini da ayiriyor.
  - `@havre-test.ca` bizim kendi test alan adimiz (auth.test.ca vb.).

  Yani bu desenlerden birine uyan bir adres GERCEK bir kullaniciya ait
  OLAMAZ. Disinda kalan her sey gercek sayiliyor ve dokunulmuyor:
  silmenin geri donusu yok, fazla silmektense az silmek.
*/
const FAKE_PATTERNS = [
  '%@seed.havre.test',
  '%@havre-test.ca',
  '%@%.test',
  '%@%.example',
  '%@%.invalid',
  '%@%.localhost',
  '%@example.com',
  '%@example.net',
  '%@example.org',
];

/** `email LIKE p1 OR email LIKE p2 OR ...` — tek yerden uretiliyor. */
const fakeWhere = sql.join(
  FAKE_PATTERNS.map((p) => sql`email LIKE ${p}`),
  sql` OR `,
);

const fakeRows = await db.execute(sql`
  SELECT count(*)::int AS n FROM users WHERE ${fakeWhere}
`) as unknown as Array<{ n: number }>;
const fakeCount = fakeRows[0]?.n ?? 0;

if (fakeCount > 0 && !clean) {
  /*
    SESSIZCE GECMIYORUZ. Uydurma hesaplarin durdugu bir veritabanina
    "uretim tohumu" yuklemek, isin bittigi izlenimi verirdi; oysa site
    hala 144 uydurma bakici gosteriyor olurdu.
  */
  await client.end();
  throw new Error(
    `Bu veritabaninda ${fakeCount} adet uydurma hesap var ` +
    '(sinama icin ayrilmis alan adlari).\nCanliya cikarsa site bastan sona yalan soyler.\n\n' +
    'Silmek icin:  npm run db:seed:prod -- --clean\n' +
    'Gercek hesaplara dokunulmaz.',
  );
}

if (clean && fakeCount > 0) {
  console.log(`${fakeCount} uydurma hesap ve bagli veriler siliniyor...`);

  const seedUsers = sql`(SELECT id FROM users WHERE ${fakeWhere})`;

  /*
    SIRA ONEMLI: CASCADE'i olmayan baglantilar once. Ayrica silme
    KULLANICIDAN degil, YAPRAKTAN basliyor — tohum kullanicisini silmek
    gercek bir kullanicinin o kisiyle yaptigi konusmayi da goturmemeli.
  */
  await db.execute(sql`DELETE FROM claims WHERE booking_id IN (
    SELECT id FROM bookings WHERE owner_id IN ${seedUsers} OR sitter_id IN ${seedUsers})`);
  await db.execute(sql`DELETE FROM disputes WHERE booking_id IN (
    SELECT id FROM bookings WHERE owner_id IN ${seedUsers} OR sitter_id IN ${seedUsers})`);
  await db.execute(sql`DELETE FROM reviews WHERE author_id IN ${seedUsers} OR subject_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM bookings WHERE owner_id IN ${seedUsers} OR sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM messages WHERE sender_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM conversations WHERE owner_id IN ${seedUsers} OR sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM favourites WHERE user_id IN ${seedUsers} OR sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM pets WHERE owner_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM sitter_availability WHERE sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM sitter_services WHERE sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM sitter_photos WHERE sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM verifications WHERE sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM sitter_slug_history WHERE sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM admin_notes WHERE author_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM meet_and_greets WHERE owner_id IN ${seedUsers} OR sitter_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM sitters WHERE user_id IN ${seedUsers}`);
  await db.execute(sql`DELETE FROM profiles WHERE user_id IN ${seedUsers}`);
  /*
    users siliniyor. CASCADE'i olanlar (sessions, accounts, favourites,
    consent_records, automated_decisions) kendiliginden gidiyor;
    SET NULL olanlar (reports, commission_*) baglantiyi birakiyor ve
    KAYIT KALIYOR — denetim izini silmek istemiyoruz.

    NO ACTION olan her tablo yukarida ELLE bosaltildi. Listeyi tahminle
    degil, pg_constraint'i sorgulayarak cikardim: ilk denemede
    admin_notes atlanmisti ve silme yabanci anahtar hatasiyla durdu.
  */
  await db.execute(sql`DELETE FROM users WHERE ${fakeWhere}`);
}

/* ------------------------------------------------------- sehir ve mahalle */
console.log('sehirler ve mahalleler yukleniyor...');

let cityCount = 0;
let hoodCount = 0;

for (const city of SEED_CITIES) {
  /*
    SLUG'A GORE UPSERT: sehrin kimligi sabit kaliyor. Silip yeniden
    yaratsaydik, o sehre bagli her profilin city_id'si bosa duserdi.
  */
  const [row] = await db.insert(s.cities).values({
    slugEn: city.slugEn, slugFr: city.slugFr,
    nameEn: city.nameEn, nameFr: city.nameFr,
    province: city.province, tier: city.tier, population: city.population,
    centroid: point(city.lon, city.lat) as unknown as string,
  }).onConflictDoUpdate({
    /*
      BENZERSIZLIK (slug_en, province) UZERINDE, tek basina slug_en
      degil: "london" hem Ontario'da hem Birlesik Krallik'ta var ve sema
      bunu dogru kurmus. Yalnizca slug_en yazdigimda Postgres
      "eslesen bir kisitlama yok" dedi — tarayicida degil, betigi
      calistirinca cikti.
    */
    target: [s.cities.slugEn, s.cities.province],
    set: {
      slugFr: city.slugFr, nameEn: city.nameEn, nameFr: city.nameFr,
      province: city.province, tier: city.tier, population: city.population,
      centroid: point(city.lon, city.lat) as unknown as string,
    },
  }).returning({ id: s.cities.id });

  const cityId = row!.id;
  cityCount += 1;

  /* Mahalleler tamamen yeniden yaziliyor: uzerlerinde yabanci anahtar
     yok ve boylece listeden cikarilan bir mahalle gercekten gidiyor. */
  await db.execute(sql`DELETE FROM neighbourhoods WHERE city_id = ${cityId}`);

  for (const h of city.neighbourhoods) {
    await db.insert(s.neighbourhoods).values({
      cityId,
      slugEn: slugify(h.en),
      slugFr: slugify(h.fr ?? h.en),
      nameEn: h.en, nameFr: h.fr ?? h.en,
      centroid: point(h.lon, h.lat) as unknown as string,
    });
    hoodCount += 1;
  }
}

const left = await db.execute(sql`
  SELECT
    (SELECT count(*)::int FROM users)   AS users,
    (SELECT count(*)::int FROM sitters) AS sitters,
    (SELECT count(*)::int FROM bookings) AS bookings,
    (SELECT count(*)::int FROM reviews)  AS reviews
`) as unknown as Array<{ users: number; sitters: number; bookings: number; reviews: number }>;
const n = left[0] ?? { users: 0, sitters: 0, bookings: 0, reviews: 0 };

console.log(
  `\nuretim tohumu tamam: ${cityCount} sehir · ${hoodCount} mahalle\n` +
  `veritabaninda kalan: ${n.users} kullanici · ${n.sitters} bakici · ` +
  `${n.bookings} rezervasyon · ${n.reviews} yorum`,
);
if (n.sitters === 0) {
  console.log(
    'Hic bakici yok — arz esigi kurali geregi sehir sayfalari indekslenmeyecek.\n' +
    'Ilk gercek bakicilar onaylandikca sayfalar kendiliginden acilir.',
  );
}

await client.end();
