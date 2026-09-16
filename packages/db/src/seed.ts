/**
 * Tohum verisi yukleyici — GELISTIRME ICIN.
 *
 * Uretilen kullanicilar, fiyatlar ve yorumlar gercek degildir; hicbir pazarlama
 * malzemesinde kullanilamaz. Amac: arama, arz esigi kurali ve landing sayfasi
 * istatistiklerini gercek SQL uzerinde calistirabilmek.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as s from './schema/index.js';
import {
  SEED_CITIES, FIRST_NAMES, HOME_TYPES, BASE_PRICE_CENTS,
  REVIEW_BODIES_EN, REVIEW_BODIES_FR, BIOS,
  PERSON_PHOTO_SLOTS, HOME_PHOTO_SLOTS, PET_SEEDS,
  SCHEDULE_TEXTS_EN, SCHEDULE_TEXTS_FR, TYPICAL_DAY_TEXTS_EN, TYPICAL_DAY_TEXTS_FR,
  SAFETY_TEXTS_EN, SAFETY_TEXTS_FR, OWNER_PREFS_TEXTS_EN, OWNER_PREFS_TEXTS_FR,
} from './seed-data.js';
import { SERVICES, servicesForPhase, type ServiceType } from '@havre/core';
import { sitterSlug } from './queries/onboarding.js';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL tanimli degil');
const client = postgres(url, { max: 1 });
const db = drizzle(client, { schema: s });

/** Deterministik sozde-rastgele: ayni tohum -> ayni veri */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;
const point = (lon: number, lat: number) =>
  sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`;

const SERVICE_LIST = servicesForPhase('v1_5');

/*
  TEMIZLIK — SENIN VERINI SILMEDEN.

  Once neredeyse her sey TRUNCATE ediliyordu: gelistiricinin hesabi,
  mesajlari, favorileri. Iki kez yasandi — once "sifrem calismiyor"
  (hesap silinmisti), sonra "mesajlarim gitti".

  UC KURAL:

  1. TOHUM KIMLIKLERI KALICI. Tohum kullanicilari, profilleri ve
     bakici kayitlari SILINIP YENIDEN YARATILMIYOR; e-postaya gore
     guncelleniyor (upsert). Kimlikleri sabit kalinca, o bakicilarla
     yapilmis konusmalar ve favoriler de ayakta kaliyor.

  2. TRUNCATE ... CASCADE DEGIL, DELETE.
     TRUNCATE CASCADE, `ON DELETE SET NULL` yazsa bile referans veren
     TABLOYU KOMPLE bosaltiyor: `TRUNCATE bookings CASCADE` konusmalari
     da siliyordu. `DELETE FROM bookings` ise kurala uyuyor —
     conversations.booking_id NULL oluyor, konusma duruyor.

  3. GERCEK HESAPLAR HIC ELLENMIYOR.

  Geriye kalan: rezervasyonlar, yorumlar, musaitlik, fiyatlar ve
  sehirler her seferinde yeniden uretiliyor. Bunlar zaten uydurma veri.
*/
const SEED_EMAIL = '%@seed.havre.test';

console.log('tablolar temizleniyor...');

const beforeRows = await db.execute(sql`
  SELECT
    (SELECT count(*)::int FROM users WHERE email NOT LIKE ${SEED_EMAIL}) AS accounts,
    (SELECT count(*)::int FROM messages) AS messages,
    (SELECT count(*)::int FROM favourites) AS favourites
`);
const before = (beforeRows as unknown as Array<{
  accounts: number; messages: number; favourites: number;
}>)[0] ?? { accounts: 0, messages: 0, favourites: 0 };

/*
  Rezervasyonlara BAGLI olup CASCADE'i olmayanlar once. Tohum bunlari
  uretmiyor; yine de duruyorlarsa silinen bir rezervasyona bagli
  kalirlar ve DELETE engellenirdi.
*/
await db.execute(sql`DELETE FROM claims`);
await db.execute(sql`DELETE FROM disputes`);
await db.execute(sql`DELETE FROM reviews`);
/* booking_events, meet_and_greets ve reviews CASCADE ile gidiyor;
   conversations.booking_id NULL'a dusuyor ve KONUSMA KALIYOR. */
await db.execute(sql`DELETE FROM bookings`);

/* Tohum bakicilarinin uretilen satirlari — bakici kaydinin KENDISI kaliyor. */
const seedSitters = sql`
  SELECT st.user_id FROM sitters st
  JOIN users u ON u.id = st.user_id
  WHERE u.email LIKE ${SEED_EMAIL}
`;
await db.execute(sql`DELETE FROM sitter_availability WHERE sitter_id IN (${seedSitters})`);
await db.execute(sql`DELETE FROM sitter_services WHERE sitter_id IN (${seedSitters})`);
await db.execute(sql`DELETE FROM sitter_photos WHERE sitter_id IN (${seedSitters})`);
await db.execute(sql`DELETE FROM verifications WHERE sitter_id IN (${seedSitters})`);
await db.execute(sql`DELETE FROM pets WHERE owner_id IN (SELECT id FROM users WHERE email LIKE ${SEED_EMAIL})`);

/* Sehirler saf referans verisi; profiles.city_id'de yabanci anahtar yok. */
await db.execute(sql`TRUNCATE TABLE landing_pages, neighbourhoods, cities RESTART IDENTITY CASCADE`);

let sitterTotal = 0;
let bookingTotal = 0;

for (const city of SEED_CITIES) {
  const r = rng(city.slugEn);

  const [cityRow] = await db.insert(s.cities).values({
    slugEn: city.slugEn, slugFr: city.slugFr,
    nameEn: city.nameEn, nameFr: city.nameFr,
    province: city.province, tier: city.tier, population: city.population,
    centroid: point(city.lon, city.lat) as unknown as string,
  }).returning({ id: s.cities.id });
  const cityId = cityRow!.id;

  const hoodIds: string[] = [];
  for (const h of city.neighbourhoods) {
    const [row] = await db.insert(s.neighbourhoods).values({
      cityId,
      slugEn: h.en.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      slugFr: (h.fr ?? h.en).normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      nameEn: h.en, nameFr: h.fr ?? h.en,
      centroid: point(h.lon, h.lat) as unknown as string,
    }).returning({ id: s.neighbourhoods.id });
    hoodIds.push(row!.id);
  }

  for (let i = 0; i < city.sitterCount; i++) {
    const first = pick(r, FIRST_NAMES);
    const initial = String.fromCharCode(65 + Math.floor(r() * 26));
    const hoodIdx = i % city.neighbourhoods.length;
    const hood = city.neighbourhoods[hoodIdx]!;
    // Mahalle merkezinden ~±700 m kaydirilmis YAKLASIK konum (gizlilik)
    const lon = hood.lon + (r() - 0.5) * 0.018;
    const lat = hood.lat + (r() - 0.5) * 0.013;

    const [user] = await db.insert(s.users).values({
      email: `${city.slugEn}.sitter${i}@seed.havre.test`,
      locale: city.province === 'QC' ? 'fr-CA' : 'en-CA',
      role: 'sitter',
      /*
        UPSERT — SILIP YENIDEN YARATMIYORUZ.

        Kimlik sabit kalinca, bu bakiciyla yapilmis konusmalar ve
        favoriler her tohumlamada ayakta kaliyor. Once silinip
        yeniden yaratiliyordu ve kimlik her seferinde degistigi icin
        gelistiricinin mesajlari kayboluyordu.
      */
    }).onConflictDoUpdate({
      target: s.users.email,
      set: { locale: city.province === 'QC' ? 'fr-CA' : 'en-CA', role: 'sitter' },
    }).returning({ id: s.users.id });
    const userId = user!.id;

    await db.insert(s.profiles).values({
      userId, firstName: first, lastNameInitial: initial,
      /*
        Demo fotografi — gercek bakici kendi fotografini yukleyince degisir.
        Adim 7, yuva sayisiyla (12) ARALARINDA ASAL olmali: ilk denemede adim
        6 idi ve her sehirde yalnizca iki yuz donuyordu (bir yuz 40 bakicida).
      */
      avatarUrl: PERSON_PHOTO_SLOTS[(sitterTotal * 7) % PERSON_PHOTO_SLOTS.length]!,
      cityId, neighbourhoodId: hoodIds[hoodIdx]!, province: city.province,
      bio: pick(r, BIOS[city.province === 'QC' ? 'fr' : 'en']),
      approxLocation: point(lon, lat) as unknown as string,
    }).onConflictDoUpdate({
      target: s.profiles.userId,
      set: {
        firstName: first, lastNameInitial: initial,
        avatarUrl: PERSON_PHOTO_SLOTS[(sitterTotal * 7) % PERSON_PHOTO_SLOTS.length]!,
        cityId, neighbourhoodId: hoodIds[hoodIdx]!, province: city.province,
        approxLocation: point(lon, lat) as unknown as string,
      },
    });

    const reviewCount = Math.floor(4 + r() * 190);
    const rating = Math.round((4.55 + r() * 0.45) * 10) / 10;
    const badge = (1 + Math.floor(r() * 4)) as 1 | 2 | 3 | 4;
    /* Bakicinin serbest metinleri sehrin diliyle: Quebec'te Fransizca. */
    const fr = city.province === 'QC';

    await db.insert(s.sitters).values({
      userId,
      // Profil adresi onboarding'dekiyle AYNI fonksiyondan — iki ayri yerde
      // iki ayri kural olsaydi tohum veriyle gercek kayitlar farkli adresler
      // uretir ve test ettigimiz sey uretimdeki sey olmazdi.
      slug: sitterSlug(userId, first, initial),
      status: 'active', badgeLevel: badge,
      medianResponseMinutes: Math.floor(10 + r() * 180),
      acceptanceRate: Math.round((0.55 + r() * 0.45) * 100) / 100,
      cancellationRate: Math.round(r() * 0.06 * 100) / 100,
      profileCompleteness: Math.round((0.6 + r() * 0.4) * 100) / 100,
      averageRating: rating, reviewCount,
      homeType: pick(r, HOME_TYPES),
      hasYard: r() > 0.45, yardFenced: r() > 0.5, hasOwnPets: r() > 0.55,
      maxConcurrentPets: 1 + Math.floor(r() * 3),
      /*
        UC DURUMLU ALANLAR — bilerek bir kismi null.

        Hepsini doldurursak sayfayi yalnizca "dolu profil" halinde test
        etmis oluruz; oysa yeni bir bakicinin profili yari bos olacak ve
        asil kirilan yer orasi. Yaklasik dortte biri cevapsiz kaliyor.
      */
      hasChildren: r() < 0.25 ? null : r() > 0.65,
      petsOnBed: r() < 0.25 ? null : r() > 0.5,
      petsOnFurniture: r() < 0.25 ? null : r() > 0.45,
      pottyBreakHours: r() < 0.3 ? null : 2 + Math.floor(r() * 5),
      /* Kosullarin cogunda sart YOK — gercek dagilim boyle ve sayfanin
         "hicbir sart yok" halini de gormemiz gerekiyor. */
      spayedNeuteredOnly: r() > 0.55,
      noFemalesInHeat: r() > 0.7,
      houseTrainedOnly: r() > 0.75,
      minPetAgeMonths: r() > 0.75 ? pick(r, [6, 12, 24]) : null,
      scheduleText: r() < 0.2 ? null : pick(r, fr ? SCHEDULE_TEXTS_FR : SCHEDULE_TEXTS_EN),
      typicalDayText: r() < 0.25 ? null : pick(r, fr ? TYPICAL_DAY_TEXTS_FR : TYPICAL_DAY_TEXTS_EN),
      safetyText: r() < 0.3 ? null : pick(r, fr ? SAFETY_TEXTS_FR : SAFETY_TEXTS_EN),
      ownerPrefsText: r() < 0.25 ? null : pick(r, fr ? OWNER_PREFS_TEXTS_FR : OWNER_PREFS_TEXTS_EN),
      referralCode: `${city.slugEn}-${first.toLowerCase()}-${i}`,
      activatedAt: new Date(),
      /*
        Bakici kaydi da UPSERT: satir kalinca ona baglanan konusmalar,
        favoriler ve profil adresi (slug) de kaliyor. Slug zaten
        kimlikten turetiliyor, yani kimlik sabitse adres de sabit —
        acik bir sekme yenilendiginde 404 vermiyor.
      */
    }).onConflictDoUpdate({
      target: s.sitters.userId,
      set: {
        status: 'active', badgeLevel: badge,
        averageRating: rating, reviewCount,
        homeType: pick(r, HOME_TYPES),
        activatedAt: new Date(),
      },
    });

    // Hizmetler: her bakici 2-4 tanesini sunar, boarding her zaman var
    const offered: ServiceType[] = ['boarding'];
    for (const svc of SERVICE_LIST) {
      if (svc !== 'boarding' && r() > 0.45) offered.push(svc);
    }
    for (const svc of offered) {
      const base = BASE_PRICE_CENTS[svc] ?? 4000;
      await db.insert(s.sitterServices).values({
        sitterId: userId, serviceType: svc,
        priceCents: Math.round((base * (0.78 + r() * 0.55)) / 100) * 100,
        priceUnit: SERVICES[svc].unit,
        extraPetPriceCents: Math.round((base * 0.35) / 100) * 100,
        holidaySurchargePct: r() > 0.6 ? 20 : 0,
        cancellationPolicy: pick(r, ['flexible', 'moderate', 'strict'] as const),
        acceptedSizeMinKg: 0,
        /*
          KADEME SINIRLARINDAN biri. Once 15/25/40/60 seciliyordu ve
          profildeki kutucuklar yarim kaliyordu: 25 kiloya kadar alan
          bakicida "18-45 kg" kademesi cizilmiyor, cunku o kademe
          tamamen kapsanmiyor (bkz. petSizeStepsFor). Sihirbaz da
          yalnizca bu dort degeri sunuyor.
        */
        acceptedSizeMaxKg: pick(r, [7, 18, 45, 100]),
        acceptsDogs: true,
        acceptsCats: r() > 0.35,
        acceptsOther: r() > 0.85,
      });
    }

    // Musaitlik: onumuzdeki 90 gun, ~%18'i kapali
    const days = Array.from({ length: 90 }, (_, d) => {
      const date = new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
      return { sitterId: userId, date, status: r() > 0.18 ? 'open' : 'blocked' };
    });
    await db.insert(s.sitterAvailability).values(days);

    // Ev galerisi: 2-3 fotograf. Profil sayfasinin bos gorunmemesi icin degil,
    // sahiplerin en cok sorduğu sey "kopegim nerede kalacak" oldugu icin.
    const shots = 2 + Math.floor(r() * 2);
    await db.insert(s.sitterPhotos).values(
      Array.from({ length: shots }, (_, k) => ({
        sitterId: userId,
        url: HOME_PHOTO_SLOTS[(i * 3 + k) % HOME_PHOTO_SLOTS.length]!,
        sortOrder: k,
      })),
    );

    sitterTotal++;
  }
  console.log(`${city.nameEn}: ${city.sitterCount} bakici`);
}

/**
 * Tamamlanmis rezervasyonlar + yorumlar.
 * Landing sayfasi istatistikleri (rezervasyon sayisi, tekrar orani) bunlardan uretilir,
 * yani sayfadaki rakamlar uydurma degil gercekten sorgulanan veri olur.
 */
console.log('rezervasyonlar uretiliyor...');
/*
  YALNIZCA TOHUM BAKICILARI.

  Once butun sitter_services satirlari aliniyordu ve bu, TRUNCATE
  edildikleri icin fark etmiyordu. Artik gercek bakici kayitlari
  duruyor — gelistirici sihirbazi yarim biraktiysa profilinde il
  bilgisi olmayabilir ve rezervasyon uretimi 'province NOT NULL' ile
  cokuyordu (bizzat yasandi).

  Ustelik dogru olan da bu: gelistiricinin kendi bakici profiline
  uydurma rezervasyon ve yorum yazmak, test ettigi ekrani bozar.
*/
const allServices = await db.select({
  sitterId: s.sitterServices.sitterId,
  serviceType: s.sitterServices.serviceType,
  priceCents: s.sitterServices.priceCents,
  policy: s.sitterServices.cancellationPolicy,
  province: s.profiles.province,
}).from(s.sitterServices)
  .innerJoin(s.profiles, sql`${s.profiles.userId} = ${s.sitterServices.sitterId}`)
  .innerJoin(s.users, sql`${s.users.id} = ${s.sitterServices.sitterId}`)
  .where(sql`${s.users.email} LIKE ${SEED_EMAIL}`);

/*
  TEK SAHIP YERINE OTUZ SAHIP.
  Onceden tek bir sahip vardi ve profil satiri yoktu; yorumlar tek kisiye
  aitti ve yazar adi hicbir yerde gorunmuyordu. Yorum listesinin gercekci
  gorunmesi icin isimli, profilli sahipler gerekiyor.
*/
const ownerIds: string[] = [];
/** sahip -> hayvan; rezervasyonu dogru hayvana baglamak icin */
const ownerPetIds = new Map<string, string>();
for (let i = 0; i < 30; i++) {
  const [u] = await db.insert(s.users).values({
    email: `owner${i}@seed.havre.test`,
    locale: i % 3 === 0 ? 'fr-CA' : 'en-CA',
    role: 'owner',
  }).onConflictDoUpdate({
    target: s.users.email,
    set: { locale: i % 3 === 0 ? 'fr-CA' : 'en-CA', role: 'owner' },
  }).returning({ id: s.users.id });
  await db.insert(s.profiles).values({
    userId: u!.id,
    firstName: FIRST_NAMES[i % FIRST_NAMES.length]!,
    lastNameInitial: String.fromCharCode(65 + (i * 7) % 26),
    // Yorumlarin yaninda gorunur. Sahiplerin bir kismi fotograf yuklemez;
    // ucte biri bilerek fotografsiz birakildi, arayuz o hali de tasimali.
    avatarUrl: i % 3 === 0 ? null : PERSON_PHOTO_SLOTS[(i * 7) % PERSON_PHOTO_SLOTS.length]!,
  }).onConflictDoUpdate({
    target: s.profiles.userId,
    set: {
      firstName: FIRST_NAMES[i % FIRST_NAMES.length]!,
      lastNameInitial: String.fromCharCode(65 + (i * 7) % 26),
      avatarUrl: i % 3 === 0 ? null : PERSON_PHOTO_SLOTS[(i * 7) % PERSON_PHOTO_SLOTS.length]!,
    },
  });
  /*
    HER SAHIBIN BIR HAYVANI VAR. Rezervasyonlar bu hayvana baglaniyor;
    daha once petIds bos birakiliyordu ve demo ekranlarda "hangi hayvan"
    satiri hic gorunmuyordu — siteden yapilan gercek bir rezervasyon ise
    her zaman bir hayvan tasiyor.
  */
  const petSeed = PET_SEEDS[i % PET_SEEDS.length]!;
  const [pet] = await db.insert(s.pets).values({
    ownerId: u!.id,
    name: petSeed.name,
    species: petSeed.species,
    breed: petSeed.breed,
    weightKg: petSeed.species === 'cat' ? 4 + (i % 3) : 8 + (i % 22),
  }).returning({ id: s.pets.id });
  ownerPetIds.set(u!.id, pet!.id);

  ownerIds.push(u!.id);
}

const [ownerUser] = await db.insert(s.users).values({
  email: 'owner@seed.havre.test', locale: 'en-CA', role: 'owner',
}).onConflictDoUpdate({
  target: s.users.email,
  set: { locale: 'en-CA', role: 'owner' },
}).returning({ id: s.users.id });
const ownerId = ownerUser!.id;

const r2 = rng('bookings');
for (const svcRow of allServices) {
  const n = Math.floor(r2() * 9); // 0-8 tamamlanmis rezervasyon
  /*
    Bu bakicinin DUZENLI musterisi. 'repeat' ve 'sitter_referral' atiflari
    hep ayni kisiye baglaniyor — tekrar musteri tanimi bu. Yeni musteriler
    ('platform') ise her seferinde baska biri; aksi halde tum yorumlar tek
    ada dusuyor ve liste sahte duruyordu.
  */
  const regularOwner = Math.floor(r2() * 30);
  for (let b = 0; b < n; b++) {
    const units = 1 + Math.floor(r2() * 6);
    const subtotal = svcRow.priceCents * units;
    const ownerFee = Math.min(Math.round(subtotal * 0.07), 4500);
    const daysAgo = 5 + Math.floor(r2() * 200);
    const start = new Date(Date.now() - daysAgo * 86400000);
    const end = new Date(start.getTime() + units * 86400000);
    const attribution = b === 0 ? 'platform' : (r2() > 0.7 ? 'sitter_referral' : 'repeat');
    const pct = attribution === 'sitter_referral' ? 0 : attribution === 'repeat' ? 10 : 18;
    const commission = Math.round((subtotal * pct) / 100);
    // Ayni bakicinin tekrar musterisi ayni sahip olsun: 'repeat' atifi
    // yalnizca sahip GERCEKTEN ayniysa anlamli.
    const bookingOwnerId = ownerIds[
      (attribution === 'platform' ? Math.floor(r2() * ownerIds.length) : regularOwner)
        % ownerIds.length
    ] ?? ownerId;

    const [bk] = await db.insert(s.bookings).values({
      ownerId: bookingOwnerId, sitterId: svcRow.sitterId, serviceType: svcRow.serviceType,
      status: 'payout_released',
      startAt: start, endAt: end, units,
      petIds: [ownerPetIds.get(bookingOwnerId)].filter((x): x is string => Boolean(x)),
      unitPriceCents: svcRow.priceCents, baseCents: subtotal, subtotalCents: subtotal,
      ownerFeeCents: ownerFee, ownerTaxCents: Math.round(ownerFee * 0.13),
      ownerTotalCents: subtotal + ownerFee + Math.round(ownerFee * 0.13),
      attribution, sitterCommissionPct: pct, sitterCommissionCents: commission,
      sitterCommissionTaxCents: Math.round(commission * 0.13),
      sitterPayoutCents: subtotal - commission - Math.round(commission * 0.13),
      province: svcRow.province!, cancellationPolicy: svcRow.policy,
      completedAt: end,
    }).returning({ id: s.bookings.id });

    // Rezervasyonlarin ~%62'si yorum aliyor
    if (r2() > 0.38) {
      const fr = svcRow.province === 'QC';
      await db.insert(s.reviews).values({
        bookingId: bk!.id,
        // Yazar rezervasyonun sahibi olmali; rastgele bir sahip secmek
        // yorumu baska birinin rezervasyonuna baglardi.
        authorId: bookingOwnerId,
        subjectId: svcRow.sitterId,
        direction: 'owner_to_sitter',
        rating: r2() > 0.12 ? 5 : 4,
        body: pick(r2, fr ? REVIEW_BODIES_FR : REVIEW_BODIES_EN),
        locale: fr ? 'fr-CA' : 'en-CA',
        publishedAt: end,
      });
    }
    bookingTotal++;
  }
}

/*
  OZET SUTUNLARI GERCEK YORUMLARDAN YENIDEN HESAPLA.

  Bakici satirlari rezervasyonlardan ONCE yaziliyor, dolayisiyla o anda
  average_rating ve review_count rastgele atanmisti. Sonuc: profil sayfasinda
  baslikta "4,9 (189)" yaziyor ama yorum listesi bos cikiyordu — tarayicida
  yakalandi. Tohum verinin kendi icinde tutarli olmasi sart: tutarsiz veriyle
  yapilan her gorsel kontrol yaniltici.
*/
await db.execute(sql`
  UPDATE sitters st SET
    review_count = COALESCE(agg.n, 0),
    average_rating = COALESCE(agg.avg, 0)
  FROM (
    SELECT subject_id,
           count(*)::int AS n,
           round(avg(rating)::numeric, 1)::float8 AS avg
    FROM reviews
    WHERE direction = 'owner_to_sitter' AND published_at IS NOT NULL
    GROUP BY subject_id
  ) agg
  WHERE st.user_id = agg.subject_id
`);
await db.execute(sql`
  UPDATE sitters SET review_count = 0, average_rating = 0
  WHERE user_id NOT IN (
    SELECT subject_id FROM reviews
    WHERE direction = 'owner_to_sitter' AND published_at IS NOT NULL
  )
`);

const [check] = (await db.execute(sql`
  SELECT count(*)::int AS with_reviews FROM sitters WHERE review_count > 0
`)) as unknown as Array<{ with_reviews: number }>;

console.log(`tohum tamam: ${sitterTotal} bakici, ${bookingTotal} rezervasyon, ${check?.with_reviews ?? 0} bakicinin yorumu var`);

/*
  KORUNAN HESAPLARIN SEHRINI TAZELE.

  Sehirler her tohumlamada yeniden uretiliyor ve kimlikleri degisiyor;
  korunan bir profilin city_id'si eski bir sehri gosterir ve hesap
  sayfasi bos bir sehirle acilir. (profiles.city_id'de yabanci anahtar
  yok — bu yuzden veritabani bunu kendisi yakalamiyor.)
*/
const [firstCity] = (await db.execute(sql`
  SELECT c.id::text AS city_id,
         (SELECT n.id::text FROM neighbourhoods n WHERE n.city_id = c.id LIMIT 1) AS hood_id
  FROM cities c ORDER BY c.tier, c.name_en LIMIT 1
`)) as unknown as Array<{ city_id: string; hood_id: string | null }>;

if (firstCity) {
  const fixed = await db.execute(sql`
    UPDATE profiles SET city_id = ${firstCity.city_id}::uuid,
                        neighbourhood_id = ${firstCity.hood_id}::uuid
    WHERE city_id IS NOT NULL
      AND city_id NOT IN (SELECT id FROM cities)
    RETURNING user_id
  `);
  const n = (fixed as unknown as Array<unknown>).length;
  if (n > 0) console.log(`${n} korunan profilin sehri tazelendi.`);
}

/*
  NE KORUNDUGUNU YAZ.

  "Mesajlarim gitti" sorusunun sorulmasindansa, komutun kendisi ne
  birakip ne aldigini soylesin. Sayilar tohumlamadan ONCE ve SONRA
  olculuyor: soz verdigimiz sey degil, olan sey yaziliyor.
*/
const afterRows = await db.execute(sql`
  SELECT
    (SELECT count(*)::int FROM users WHERE email NOT LIKE ${SEED_EMAIL}) AS accounts,
    (SELECT count(*)::int FROM messages) AS messages,
    (SELECT count(*)::int FROM favourites) AS favourites
`);
const after = (afterRows as unknown as Array<{
  accounts: number; messages: number; favourites: number;
}>)[0] ?? { accounts: 0, messages: 0, favourites: 0 };

if (before.accounts > 0 || before.messages > 0 || before.favourites > 0) {
  console.log(
    `korundu: ${after.accounts}/${before.accounts} hesap · `
    + `${after.messages}/${before.messages} mesaj · `
    + `${after.favourites}/${before.favourites} favori`,
  );
}

await client.end();
