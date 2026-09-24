import { describe, it, expect } from 'vitest';
import { and, eq, inArray } from 'drizzle-orm';
import { sitterServices } from '../schema/services.js';
import { getDb } from '../client.js';
import { resolvePlace } from './place.js';
import {
  countSitters, searchSitters, SEARCH_PAGE_SIZE,
  SEARCH_SORTS, isSearchSort, type SearchSort,
} from './search.js';

/**
 * ARAMA SAYFALAMASI — gercek veritabanina karsi (tohum veri gerekir).
 *
 * Verilen soz: ekranda yazan sayi ile gezilebilen sonuc sayisi AYNI olmali.
 * Bu bozuldugunda kullanici "43 bakici" yazip 9 kart cizen bir sayfa
 * goruyor — nitekim gorulmustu.
 */
const db = getDb();

async function toronto() {
  const place = await resolvePlace(db, 'Toronto', 'en-CA');
  if (!place) throw new Error('Tohum veri yok — npm run db:seed');
  return {
    serviceType: 'boarding' as const,
    lon: place.lon,
    lat: place.lat,
    radiusMeters: 50_000,
  };
}

describe('arama sayfalamasi', () => {
  it('sayim ile listeleme AYNI kosullari kullaniyor', async () => {
    const criteria = await toronto();
    const total = await countSitters(db, criteria);
    expect(total).toBeGreaterThan(0);

    /* Sinirsiz gibi genis bir sayfa: doner satir sayisi toplamla ayni olmali.
       Iki sorgunun WHERE'i ayrisirsa bu test kirmizi olur. */
    const all = await searchSitters(db, { ...criteria, limit: 500 }, 'en-CA');
    expect(all.length).toBe(total);
  });

  it('sayfalar birbirinin AYNISI degil ve hepsi birlikte tamami veriyor', async () => {
    const criteria = await toronto();
    const total = await countSitters(db, criteria);
    const pageCount = Math.ceil(total / SEARCH_PAGE_SIZE);
    expect(pageCount).toBeGreaterThan(1); // tohum veride Toronto kalabalik

    const first = await searchSitters(db, { ...criteria, limit: SEARCH_PAGE_SIZE }, 'en-CA');
    const second = await searchSitters(
      db, { ...criteria, limit: SEARCH_PAGE_SIZE, offset: SEARCH_PAGE_SIZE }, 'en-CA',
    );

    expect(first.length).toBe(SEARCH_PAGE_SIZE);
    expect(second.length).toBeGreaterThan(0);

    const ids = new Set([...first, ...second].map((s) => s.id));
    expect(ids.size).toBe(first.length + second.length); // tekrar eden kayit yok
  });

  it('son sayfanin otesi BOS doner, hata degil', async () => {
    const criteria = await toronto();
    const total = await countSitters(db, criteria);
    const beyond = await searchSitters(db, { ...criteria, offset: total + 10 }, 'en-CA');
    expect(beyond).toEqual([]);
  });

  it('filtre hem sayiyi hem listeyi ayni sekilde daraltiyor', async () => {
    const criteria = await toronto();
    const all = await countSitters(db, criteria);
    const cheap = { ...criteria, maxPriceCents: 4000 };

    const cheapCount = await countSitters(db, cheap);
    const cheapRows = await searchSitters(db, { ...cheap, limit: 500 }, 'en-CA');

    expect(cheapCount).toBeLessThanOrEqual(all);
    expect(cheapRows.length).toBe(cheapCount);
    for (const row of cheapRows) expect(row.priceCents).toBeLessThanOrEqual(4000);
  });
});

/**
 * SIRALAMA.
 *
 * Siralama sonuc KUMESINI degistirmez, yalnizca sirasini: "fiyata gore"
 * diyen kullanici daha az bakici gormeye baslarsa bu bir filtre olur ve
 * kimse ondan bunu istemedi. Testler hem sirayi hem de kumenin ayni
 * kaldigini kontrol ediyor.
 */
describe('arama siralamasi', () => {
  it('gecerli siralama adlarini taniyor, uydurulani reddediyor', () => {
    for (const s of SEARCH_SORTS) expect(isSearchSort(s)).toBe(true);
    expect(isSearchSort('ucuz')).toBe(false);
    /* Deger dogrudan SQL'e giriyor; suzgecten gecmeyen bir dize
       buraya kadar gelememeli. */
    expect(isSearchSort('price; DROP TABLE users')).toBe(false);
  });

  it('FIYAT siralamasi artan', async () => {
    const criteria = await toronto();
    const rows = await searchSitters(db, { ...criteria, sort: 'price', limit: 30 }, 'en-CA');
    expect(rows.length).toBeGreaterThan(1);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i]!.priceCents).toBeGreaterThanOrEqual(rows[i - 1]!.priceCents);
    }
  });

  it('MESAFE siralamasi artan', async () => {
    const criteria = await toronto();
    const rows = await searchSitters(db, { ...criteria, sort: 'distance', limit: 30 }, 'en-CA');
    expect(rows.length).toBeGreaterThan(1);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i]!.distanceMeters).toBeGreaterThanOrEqual(rows[i - 1]!.distanceMeters);
    }
  });

  it('PUAN siralamasinin basi tek yorumlu hesaplarla dolmuyor', async () => {
    const criteria = await toronto();
    const rows = await searchSitters(db, { ...criteria, sort: 'rating', limit: 5 }, 'en-CA');
    expect(rows.length).toBeGreaterThan(0);
    /* Yorum sayisi agirligi devrede: ilk siradaki, listenin en az
       yorumlusu olamaz (tohum veride bes ve uzeri yorumlu bakici var). */
    expect(rows[0]!.reviewCount).toBeGreaterThan(1);
  });

  it('siralama KUMEYI degistirmiyor — ayni bakicilar, baska sira', async () => {
    const criteria = await toronto();
    const ids = async (sort: SearchSort) =>
      new Set(
        (await searchSitters(db, { ...criteria, sort, limit: 500 }, 'en-CA')).map((s) => s.id),
      );

    const best = await ids('best');
    for (const sort of ['price', 'rating', 'distance'] as const) {
      const other = await ids(sort);
      expect(other.size).toBe(best.size);
      for (const id of best) expect(other.has(id)).toBe(true);
    }
  });
});

/**
 * BOYUT FILTRESI — VERILEN SOZ BU.
 *
 * Bakici sihirbazda hangi kademeleri isaretlediyse yalnizca onlar
 * kabul edilmis sayiliyor. Bu filtre kayarsa hata gorunmez olur:
 * bakiciya alamayacagi bir hayvan icin istek gider, sahip de reddi
 * gunler sonra ogrenir. Onceki model tek bir tavandi ve kesintisiz
 * olmayan bir kumeyi ("orta ve dev alirim, kucuk almam") hic
 * kuramiyordu — o kume artik hem saklaniyor hem de ARANIYOR.
 */
describe('boyut filtresi', () => {
  it('kiloyu kademeye cevirip bakicinin kumesinde ariyor', async () => {
    const criteria = await toronto();

    // 3 kg = kucuk kademesi. Donen her bakicinin bu kademeyi
    // isaretlemis olmasi gerekiyor — sorgunun kendi sonucuna degil,
    // satirlarin kendisine bakiliyor.
    const small = await searchSitters(db, { ...criteria, petWeightKg: 3, limit: 500 }, 'en-CA');
    expect(small.length).toBeGreaterThan(0);

    const rows = await db
      .select({ sizes: sitterServices.acceptedSizes })
      .from(sitterServices)
      .where(and(
        inArray(sitterServices.sitterId, small.map((s) => s.id)),
        eq(sitterServices.serviceType, 'boarding'),
        eq(sitterServices.isActive, true),
      ));
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r.sizes).toContain('small');
  });

  /*
    Bu test once tohum verideki rastgeleye dayaniyordu ("kucugu
    atlayan bir bakici vardir"). Goc ile doldurulmus bir veritabaninda
    boyle bir satir YOK — geri doldurma her zaman kucukten basliyor —
    ve test kirmizi oluyordu. Oysa kirmizi olan sey uygulama degil,
    testin varsayimiydi.

    Artik kosulu test kendisi kuruyor: var olan bir bakiciyi gecici
    olarak "yalnizca orta" yapiyor, iki aramayi da olcuyor ve satiri
    eski haline geri koyuyor.
  */
  it('kucukleri ALMAYAN bakici kucuk aramada CIKMIYOR', async () => {
    const criteria = await toronto();
    const small = await searchSitters(db, { ...criteria, petWeightKg: 3, limit: 500 }, 'en-CA');
    expect(small.length).toBeGreaterThan(0);

    const victim = small[0]!.id;
    const [row] = await db
      .select({ id: sitterServices.id, sizes: sitterServices.acceptedSizes })
      .from(sitterServices)
      .where(and(
        eq(sitterServices.sitterId, victim),
        eq(sitterServices.serviceType, 'boarding'),
        eq(sitterServices.isActive, true),
      ));
    if (!row) throw new Error('Tohum veri beklenmedik: konaklama hizmeti yok');

    try {
      await db.update(sitterServices)
        .set({ acceptedSizes: ['medium'] })
        .where(eq(sitterServices.id, row.id));

      // 3 kg = kucuk kademesi, artik isaretli degil: CIKMAMALI.
      const afterSmall = await searchSitters(db, { ...criteria, petWeightKg: 3, limit: 500 }, 'en-CA');
      expect(afterSmall.map((s) => s.id)).not.toContain(victim);

      // 12 kg = orta: ayni bakici hala cikmali. Bu ikinci olcum
      // olmadan test, filtrenin her seyi eledigini de gecerdi.
      const afterMedium = await searchSitters(db, { ...criteria, petWeightKg: 12, limit: 500 }, 'en-CA');
      expect(afterMedium.map((s) => s.id)).toContain(victim);
    } finally {
      await db.update(sitterServices)
        .set({ acceptedSizes: row.sizes })
        .where(eq(sitterServices.id, row.id));
    }
  });

  it('sayim ile listeleme boyut filtresinde de ayni', async () => {
    const criteria = await toronto();
    const params = { ...criteria, petWeightKg: 60 };
    const total = await countSitters(db, params);
    const rows = await searchSitters(db, { ...params, limit: 500 }, 'en-CA');
    expect(rows.length).toBe(total);
  });
});
