import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb, withDbErrors } from './client.js';

/**
 * HATA MESAJLARI.
 *
 * Bu testler bir ozelligi degil, BIR DENEYIMI koruyor: ham Postgres
 * hatasi "column r.hidden_at does not exist" diyordu ve cevabinin bir
 * migration oldugunu hicbir yerde soylemiyordu. Mesajin icinde
 * calistirilacak komut YOKSA test kirilir.
 */
const db = getDb();

async function messageFor(query: ReturnType<typeof sql>): Promise<string> {
  try {
    await withDbErrors(async () => db.execute(query));
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('sorgu hata vermedi');
}

describe('veritabani hata mesajlari', () => {
  it('EKSIK SUTUN icin migration komutunu soyler', async () => {
    const m = await messageFor(sql`SELECT olmayan_sutun FROM users LIMIT 1`);
    expect(m).toContain('npm run db:migrate');
    expect(m).toMatch(/sema|Sema/);
  });

  it('EKSIK TABLO icin de migration komutunu soyler', async () => {
    const m = await messageFor(sql`SELECT 1 FROM olmayan_tablo`);
    expect(m).toContain('npm run db:migrate');
  });

  it('ham Postgres kodunu da birakir — teshis icin gerekli', async () => {
    const m = await messageFor(sql`SELECT olmayan_sutun FROM users LIMIT 1`);
    expect(m).toContain('42703');
  });
});
