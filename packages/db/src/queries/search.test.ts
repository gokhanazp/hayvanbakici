import { describe, it, expect } from 'vitest';
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
