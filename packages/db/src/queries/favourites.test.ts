import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import { resolvePlace } from './place.js';
import { searchSitters } from './search.js';
import {
  addFavourite, removeFavourite, favouriteIds, favouriteIdsOrdered,
  favouriteSitters, claimFavourites, existingSitterIds,
} from './favourites.js';

/**
 * FAVORILER.
 *
 * Verilen soz kucuk ama kesin: kullanicinin isaretledigi bakici, geri
 * donduğunde ORADA olacak. Testler bu sozun kirilabilecegi yerlere
 * bakiyor — cift ekleme, silinmis bakici, cerezden hesaba tasima.
 */
const db = getDb();

let sitterA = '';
let sitterB = '';
let userId = '';

beforeAll(async () => {
  const place = await resolvePlace(db, 'Toronto', 'en-CA');
  if (!place) throw new Error('Tohum veri yok — npm run db:seed');
  const rows = await searchSitters(db, {
    serviceType: 'boarding', lon: place.lon, lat: place.lat,
    radiusMeters: 50_000, limit: 2,
  }, 'en-CA');
  sitterA = rows[0]!.id;
  sitterB = rows[1]!.id;

  /* Test kullanicisi: favorileri baska bir hesabin verisine karismasin. */
  const res = await db.execute(sql`
    INSERT INTO users (email, locale)
    VALUES (${`fav-test-${Date.now()}@example.test`}, 'en-CA')
    RETURNING id::text AS id
  `);
  userId = String((res as unknown as Array<{ id: string }>)[0]!.id);
});

describe('favori ekleme ve cikarma', () => {
  it('eklenen favori listede gorunuyor', async () => {
    await addFavourite(db, userId, sitterA);
    expect((await favouriteIds(db, userId)).has(sitterA)).toBe(true);
  });

  it('AYNI bakiciyi iki kez eklemek hata vermiyor ve tek kayit birakiyor', async () => {
    await addFavourite(db, userId, sitterA);
    await addFavourite(db, userId, sitterA);
    const ids = await favouriteIdsOrdered(db, userId);
    expect(ids.filter((i) => i === sitterA)).toHaveLength(1);
  });

  it('cikarilan favori listeden gidiyor', async () => {
    await addFavourite(db, userId, sitterB);
    await removeFavourite(db, userId, sitterB);
    expect((await favouriteIds(db, userId)).has(sitterB)).toBe(false);
  });

  it('olmayan bir favoriyi cikarmak hata degil', async () => {
    await expect(removeFavourite(db, userId, sitterB)).resolves.toBeUndefined();
  });
});

describe('kart icin gereken veri', () => {
  it('kart cizmeye yetecek alanlar geliyor', async () => {
    const [s] = await favouriteSitters(db, [sitterA], 'en-CA');
    expect(s).toBeDefined();
    /* Kart bu alanlarla ciziliyor; biri bos gelirse ekranda "undefined"
       ya da tiklanmayan bir baglanti olur. */
    expect(s!.slug).not.toBe('');
    expect(s!.firstName).not.toBe('');
    expect(s!.citySlugEn).not.toBe('');
    expect(s!.citySlugFr).not.toBe('');
    expect(s!.priceCents).toBeGreaterThan(0);
    expect(s!.serviceType).toBeTruthy();
  });

  it('SIRA cagiranin verdigi sira — SQL’in dondugu sira degil', async () => {
    const forward = await favouriteSitters(db, [sitterA, sitterB], 'en-CA');
    const backward = await favouriteSitters(db, [sitterB, sitterA], 'en-CA');
    expect(forward.map((s) => s.id)).toEqual([sitterA, sitterB]);
    expect(backward.map((s) => s.id)).toEqual([sitterB, sitterA]);
  });

  it('bos liste bos doner, sorgu calismaz', async () => {
    expect(await favouriteSitters(db, [], 'en-CA')).toEqual([]);
  });

  it('OLMAYAN kimlik sessizce dusuyor — liste kisaliyor, patlamiyor', async () => {
    const ghost = '00000000-0000-4000-8000-000000000000';
    const rows = await favouriteSitters(db, [sitterA, ghost], 'en-CA');
    expect(rows.map((s) => s.id)).toEqual([sitterA]);
  });
});

describe('cerezden hesaba tasima', () => {
  it('yalnizca GERCEK bakicilar tasiniyor', async () => {
    const ghost = '00000000-0000-4000-8000-000000000000';
    expect(await existingSitterIds(db, [sitterA, ghost])).toEqual([sitterA]);
  });

  it('bos liste icin sorgu yok', async () => {
    expect(await existingSitterIds(db, [])).toEqual([]);
  });

  it('tasima EKLEMEDIR — hesapta olan silinmiyor, kesisim ikilenmez', async () => {
    await addFavourite(db, userId, sitterA);
    const before = await favouriteIds(db, userId);

    // sitterA zaten hesapta, sitterB degil: yalnizca biri eklenmeli
    const moved = await claimFavourites(db, userId, [sitterA, sitterB]);
    expect(moved).toBe(1);

    const after = await favouriteIds(db, userId);
    expect(after.has(sitterA)).toBe(true);   // duruyor
    expect(after.has(sitterB)).toBe(true);   // eklendi
    expect(after.size).toBe(before.size + 1);
  });

  it('tasinacak gecerli kimlik yoksa sifir doner', async () => {
    const ghost = '00000000-0000-4000-8000-000000000000';
    expect(await claimFavourites(db, userId, [ghost])).toBe(0);
  });
});

describe('kartta hangi hizmet yaziyor', () => {
  it('BASLICA hizmet — en ucuz olan degil', async () => {
    /*
      Konaklama arayip favorilemis kullaniciya gezdirme fiyatini
      gostermek, dogru bir rakamla yanlis soruyu cevaplamak olurdu.
      Bakici konaklama sunuyorsa kartta konaklama yaziyor.
    */
    /*
      Siralamasiz bir LIMIT 1 vardi: baska bir test dosyasinin yarattigi,
      sehri olmayan bir bakici secilebiliyordu ve favouriteSitters
      (sehirle JOIN yapiyor) hicbir satir dondurmuyordu. Sehir zorunlu,
      sira sabit.
    */
    const rows = await db.execute(sql`
      SELECT ss.sitter_id::text AS id
      FROM sitter_services ss
      JOIN sitters  st ON st.user_id = ss.sitter_id
      JOIN profiles p  ON p.user_id  = ss.sitter_id
      JOIN cities   c  ON c.id       = p.city_id
      WHERE ss.is_active AND ss.service_type = 'boarding' AND st.status = 'active'
        AND EXISTS (
          SELECT 1 FROM sitter_services o
          WHERE o.sitter_id = ss.sitter_id AND o.is_active
            AND o.service_type <> 'boarding' AND o.price_cents < ss.price_cents
        )
      ORDER BY st.created_at, ss.sitter_id
      LIMIT 1
    `);
    const id = (rows as unknown as Array<{ id: string }>)[0]?.id;
    if (!id) return; // tohum veride boyle bir bakici yoksa test anlamsiz

    const [s] = await favouriteSitters(db, [id], 'en-CA');
    expect(s!.serviceType).toBe('boarding');
  });
});
