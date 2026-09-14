import { describe, it, expect, beforeAll } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb } from '../client.js';
import { getAccountSummary, getSitterStatus } from './account.js';

/**
 * HESAP OZETI TESTLERI.
 *
 * Buradaki tek soru urunun kendisi kadar onemli: "ben neyim?"
 * Verilen sozler:
 *  - bakici kaydi olmayan kisi icin `sitter` NULL doner (herkes once sahip)
 *  - taslak basvuru bakiciligi VERMEZ; durum oldugu gibi gorunur
 *  - onboarding alanlari deger degil yalnizca VAR/YOK bildirir
 *  - sayilar karsi tarafi degil, BAKAN KISIYI anlatir
 */
const db = getDb();

let ownerId = '';
let sitterId = '';

async function mkUser(email: string, name: string): Promise<string> {
  const r = await db.execute(sql`
    INSERT INTO users (email, role, locale) VALUES (${email}, 'owner'::user_role, 'en-CA')
    RETURNING id::text
  `);
  const id = String((r as unknown as Array<{ id: string }>)[0]!.id);
  await db.execute(sql`
    INSERT INTO profiles (user_id, first_name, last_name_initial) VALUES (${id}, ${name}, 'T')
  `);
  return id;
}

beforeAll(async () => {
  const stamp = Date.now();
  ownerId = await mkUser(`acc-owner-${stamp}@havre-test.ca`, 'Sahip');
  sitterId = await mkUser(`acc-sitter-${stamp}@havre-test.ca`, 'Bakici');
  await db.execute(sql`INSERT INTO sitters (user_id, status) VALUES (${sitterId}, 'draft')`);
});

describe('hesap ozeti', () => {
  it('bakici kaydi olmayan kisi icin sitter NULL', async () => {
    const me = await getAccountSummary(db, ownerId);
    expect(me).not.toBeNull();
    expect(me!.sitter).toBeNull();
    expect(me!.firstName).toBe('Sahip');
    expect(me!.suspended).toBe(false);
    expect(await getSitterStatus(db, ownerId)).toBeNull();
  });

  it('taslak basvuru DURUMUYLA birlikte goruluyor', async () => {
    const me = await getAccountSummary(db, sitterId);
    expect(me!.sitter?.status).toBe('draft');
    // Bos basvuruda hicbir adim tamam degil — ekran "sirada ne var" diyebiliyor
    expect(me!.sitter?.steps).toEqual({
      hasAbout: false, hasLocation: false, serviceCount: 0,
      hasHome: false, screeningStarted: false,
    });
    expect(await getSitterStatus(db, sitterId)).toBe('draft');
  });

  it('askidaki hesap bunu SOYLUYOR', async () => {
    await db.execute(sql`UPDATE users SET suspended_at = now() WHERE id = ${ownerId}`);
    const me = await getAccountSummary(db, ownerId);
    expect(me!.suspended).toBe(true);
    await db.execute(sql`UPDATE users SET suspended_at = NULL WHERE id = ${ownerId}`);
  });

  it('silinmis hesap doner degil, YOK', async () => {
    const tmp = await mkUser(`acc-gone-${Date.now()}@havre-test.ca`, 'Silinmis');
    await db.execute(sql`UPDATE users SET deleted_at = now() WHERE id = ${tmp}`);
    expect(await getAccountSummary(db, tmp)).toBeNull();
  });

  it('sayilar sifirdan baslar', async () => {
    const me = await getAccountSummary(db, ownerId);
    expect(me!.counts).toEqual({
      upcomingBookings: 0, pendingRequests: 0, unreadMessages: 0, pets: 0,
    });
  });
});
