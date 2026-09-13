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
  REVIEW_BODIES_EN, REVIEW_BODIES_FR,
} from './seed-data.js';
import { SERVICES, servicesForPhase, type ServiceType } from '@havre/core';

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
      bio: null,
      approxLocation: point(lon, lat) as unknown as string,
    });

    const reviewCount = Math.floor(4 + r() * 190);
    const rating = Math.round((4.55 + r() * 0.45) * 10) / 10;
    const badge = (1 + Math.floor(r() * 4)) as 1 | 2 | 3 | 4;

    await db.insert(s.sitters).values({
      userId, status: 'active', badgeLevel: badge,
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

const [ownerUser] = await db.insert(s.users).values({
  email: 'owner@seed.havre.test', locale: 'en-CA', role: 'owner',
}).returning({ id: s.users.id });
const ownerId = ownerUser!.id;

const r2 = rng('bookings');
for (const svcRow of allServices) {
  const n = Math.floor(r2() * 9); // 0-8 tamamlanmis rezervasyon
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

    const [bk] = await db.insert(s.bookings).values({
      ownerId, sitterId: svcRow.sitterId, serviceType: svcRow.serviceType,
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
        bookingId: bk!.id, authorId: ownerId, subjectId: svcRow.sitterId,
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

console.log(`tohum tamam: ${sitterTotal} bakici, ${bookingTotal} rezervasyon`);
await client.end();
