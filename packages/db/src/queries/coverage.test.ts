import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import { resolvePlace } from './place.js';
import { listCoverage, setCityLive, createCity } from './coverage.js';
import { countSitters, searchSitters } from './search.js';
import { getSitterProfile } from './sitter.js';

/**
 * KAPSAM — VERILEN SOZ BU.
 *
 * Kapali bir sehir "listede yok" demek degil: o sehirdeki hicbir
 * bakici aramada CIKMAMALI ve hicbirinin herkese acik profili
 * ACILMAMALI. Bu filtre kayarsa hata sessiz olur -- hizmet
 * vermedigimiz bir sehirde bir sahip rezervasyon ister, bakici da
 * kabul eder, ve ikisi de bunun bir hata oldugunu bilmez.
 */
const db = getDb();

async function torontoCriteria() {
  const place = await resolvePlace(db, 'Toronto', 'en-CA');
  if (!place) throw new Error('Tohum veri yok — npm run db:seed');
  return {
    serviceType: 'boarding' as const,
    lon: place.lon, lat: place.lat, radiusMeters: 50_000,
  };
}

const cityIdBySlug = async (slug: string): Promise<string> => {
  const rows = await db.execute(sql`SELECT id FROM cities WHERE slug_en = ${slug} LIMIT 1`);
  const row = (rows as unknown as Array<{ id: string }>)[0];
  if (!row) throw new Error(`Sehir yok: ${slug}`);
  return String(row.id);
};

/** Testin kendi kurdugu durumu geri almasi icin — sira onemli degil, kapsam onemli. */
async function withCityClosed(slug: string, body: () => Promise<void>): Promise<void> {
  const id = await cityIdBySlug(slug);
  const before = await db.execute(sql`SELECT is_live FROM cities WHERE id = ${id}`);
  const wasLive = Boolean((before as unknown as Array<{ is_live: boolean }>)[0]?.is_live);
  try {
    await db.execute(sql`UPDATE cities SET is_live = false WHERE id = ${id}`);
    await body();
  } finally {
    await db.execute(sql`UPDATE cities SET is_live = ${wasLive} WHERE id = ${id}`);
  }
}

describe('kapali sehir', () => {
  it('tohum veride YALNIZCA Toronto acik', async () => {
    const rows = await listCoverage(db);
    const live = rows.filter((c) => c.isLive).map((c) => c.slugEn);
    expect(live).toEqual(['toronto']);
  });

  it('kapaliyken arama HICBIR bakici dondurmuyor', async () => {
    const criteria = await torontoCriteria();

    const open = await searchSitters(db, { ...criteria, limit: 500 }, 'en-CA');
    expect(open.length).toBeGreaterThan(0);

    await withCityClosed('toronto', async () => {
      const closed = await searchSitters(db, { ...criteria, limit: 500 }, 'en-CA');
      expect(closed).toEqual([]);
      // Sayim da ayni kosullari kullanmali: biri sifir derken digeri
      // "43 bakici" derse ekran kendi kendisiyle celisir.
      expect(await countSitters(db, criteria)).toBe(0);
    });

    // Geri acilinca eskisi gibi
    const again = await searchSitters(db, { ...criteria, limit: 500 }, 'en-CA');
    expect(again.length).toBe(open.length);
  });

  it('kapaliyken bakicinin herkese acik profili ACILMIYOR', async () => {
    const criteria = await torontoCriteria();
    const [first] = await searchSitters(db, { ...criteria, limit: 1 }, 'en-CA');
    if (!first?.slug) throw new Error('Tohum veride Toronto bakicisi yok');

    expect(await getSitterProfile(db, first.slug, 'en-CA')).not.toBeNull();
    await withCityClosed('toronto', async () => {
      // Adres elde paylasilabilir; sayfa "rezervasyon iste" dememeli.
      expect(await getSitterProfile(db, first.slug!, 'en-CA')).toBeNull();
    });
  });
});

describe('panelden acma ve kapatma', () => {
  it('acmak live_since damgaliyor, kapatmak SILMIYOR', async () => {
    const id = await cityIdBySlug('ottawa');
    const admin = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    const actor = String((admin as unknown as Array<{ id: string }>)[0]!.id);

    try {
      const opened = await setCityLive(db, id, true, actor);
      expect(opened.ok).toBe(true);
      const after = (await listCoverage(db)).find((c) => c.id === id)!;
      expect(after.isLive).toBe(true);
      expect(after.liveSince).not.toBeNull();

      await setCityLive(db, id, false, actor);
      const closed = (await listCoverage(db)).find((c) => c.id === id)!;
      expect(closed.isLive).toBe(false);
      /* Tarih duruyor: "bir sure acikti" bilgisi, kapaliyken de dogru. */
      expect(closed.liveSince).not.toBeNull();
    } finally {
      await db.execute(sql`UPDATE cities SET is_live = false, live_since = NULL WHERE id = ${id}`);
    }
  });

  it('yeni sehir KAPALI basliyor ve ayni slug iki kez eklenemiyor', async () => {
    const admin = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    const actor = String((admin as unknown as Array<{ id: string }>)[0]!.id);
    const input = {
      nameEn: 'Testville', nameFr: 'Testville',
      slugEn: 'testville-qa', slugFr: 'testville-qa',
      province: 'ON', lat: 43.5, lon: -80.5, tier: 3,
    };

    let created: { ok: true; id: string } | { ok: false; error: string } | null = null;
    try {
      created = await createCity(db, input, actor);
      expect(created.ok).toBe(true);

      const row = (await listCoverage(db)).find((c) => c.slugEn === 'testville-qa')!;
      /* Eklemek ve acmak AYRI iki karar: yeni sehir kendiliginden
         yayina girmiyor. */
      expect(row.isLive).toBe(false);
      expect(row.sitterCount).toBe(0);

      const again = await createCity(db, input, actor);
      expect(again).toEqual({ ok: false, error: 'duplicate_slug' });
    } finally {
      await db.execute(sql`DELETE FROM cities WHERE slug_en = 'testville-qa'`);
    }
  });

  it('acma ve kapatma denetim kaydina yaziliyor', async () => {
    const id = await cityIdBySlug('ottawa');
    const admin = await db.execute(sql`SELECT id FROM users LIMIT 1`);
    const actor = String((admin as unknown as Array<{ id: string }>)[0]!.id);

    try {
      await setCityLive(db, id, true, actor);
      await setCityLive(db, id, false, actor);
      const rows = await db.execute(sql`
        SELECT action FROM audit_log
         WHERE entity = 'city' AND entity_id = ${id}
         ORDER BY created_at DESC LIMIT 2
      `);
      const actions = (rows as unknown as Array<{ action: string }>).map((r) => r.action);
      expect(actions).toEqual(['coverage.cityClosed', 'coverage.cityOpened']);
    } finally {
      await db.execute(sql`UPDATE cities SET is_live = false, live_since = NULL WHERE id = ${id}`);
      await db.execute(sql`DELETE FROM audit_log WHERE entity = 'city' AND entity_id = ${id}`);
    }
  });
});
