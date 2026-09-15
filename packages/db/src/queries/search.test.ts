import { describe, it, expect } from 'vitest';
import { getDb } from '../client.js';
import { resolvePlace } from './place.js';
import { countSitters, searchSitters, SEARCH_PAGE_SIZE } from './search.js';

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
