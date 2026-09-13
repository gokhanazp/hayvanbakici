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

console.log('tablolar temizleniyor...');
await db.execute(sql`
  TRUNCATE TABLE
    reviews, booking_events, bookings, sitter_availability, sitter_services,
    verifications, pets, profiles, sitters, users,
    landing_pages, neighbourhoods, cities
  RESTART IDENTITY CASCADE
`);

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
    }).returning({ id: s.users.id });
    const userId = user!.id;

    await db.insert(s.profiles).values({
      userId, firstName: first, lastNameInitial: initial,
      cityId, neighbourhoodId: hoodIds[hoodIdx]!, province: city.province,
      bio: pick(r, BIOS[city.province === 'QC' ? 'fr' : 'en']),
      approxLocation: point(lon, lat) as unknown as string,
    });

    const reviewCount = Math.floor(4 + r() * 190);
    const rating = Math.round((4.55 + r() * 0.45) * 10) / 10;
    const badge = (1 + Math.floor(r() * 4)) as 1 | 2 | 3 | 4;

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
      referralCode: `${city.slugEn}-${first.toLowerCase()}-${i}`,
      activatedAt: new Date(),
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
        acceptedSizeMaxKg: pick(r, [15, 25, 40, 60]),
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
const allServices = await db.select({
  sitterId: s.sitterServices.sitterId,
  serviceType: s.sitterServices.serviceType,
  priceCents: s.sitterServices.priceCents,
  policy: s.sitterServices.cancellationPolicy,
  province: s.profiles.province,
}).from(s.sitterServices)
  .innerJoin(s.profiles, sql`${s.profiles.userId} = ${s.sitterServices.sitterId}`);

/*
  TEK SAHIP YERINE OTUZ SAHIP.
  Onceden tek bir sahip vardi ve profil satiri yoktu; yorumlar tek kisiye
  aitti ve yazar adi hicbir yerde gorunmuyordu. Yorum listesinin gercekci
  gorunmesi icin isimli, profilli sahipler gerekiyor.
*/
const ownerIds: string[] = [];
for (let i = 0; i < 30; i++) {
  const [u] = await db.insert(s.users).values({
    email: `owner${i}@seed.havre.test`,
    locale: i % 3 === 0 ? 'fr-CA' : 'en-CA',
    role: 'owner',
  }).returning({ id: s.users.id });
  await db.insert(s.profiles).values({
    userId: u!.id,
    firstName: FIRST_NAMES[i % FIRST_NAMES.length]!,
    lastNameInitial: String.fromCharCode(65 + (i * 7) % 26),
  });
  ownerIds.push(u!.id);
}

const [ownerUser] = await db.insert(s.users).values({
  email: 'owner@seed.havre.test', locale: 'en-CA', role: 'owner',
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
      startAt: start, endAt: end, units, petIds: [],
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
await client.end();
