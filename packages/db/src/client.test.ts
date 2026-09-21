import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { getDb, withDbErrors } from './client.js';
import { isLocalDatabase } from './seed-guard.js';

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

  /*
    RECETESI OLMAYAN hata da kodunu gostermeli. Once bu durumda ham hata
    firlatiliyordu ve ekranda yalnizca "Failed query: SELECT ..." yaziyordu;
    Postgres'in kodu ve cumlesi kaybolmustu.
  */
  it('RECETESIZ hatada bile Postgres kodu goruniyor', async () => {
    // 22012: sifira bolme — sozlukte recetesi OLMAYAN bir ornek
    const m = await messageFor(sql`SELECT 1 / 0`);
    expect(m).toMatch(/Postgres 22012/);
    expect(m).toContain('db:doctor');
  });
});

/*
  UZAK VERITABANINDA TLS.

  Gercek bir uzak sunucuya baglanmadan olculebilen tek sey karar
  mantigi; burada test edilen de o. Yerelde TLS acilmamali (docker'da
  sertifika yok, acilsa gelistirme kirilir), uzakta acilmali, adres
  zaten sslmode soyluyorsa karar ona birakilmali.
*/
describe('uzak baglantida TLS karari', () => {
  const decide = (url: string) => {
    const hasSslMode = /[?&]sslmode=/i.test(url);
    return !isLocalDatabase(url) && !hasSslMode;
  };

  it('yerelde TLS acilmaz', () => {
    expect(decide('postgresql://havre:havre@localhost:5432/havre')).toBe(false);
    expect(decide('postgresql://havre:havre@127.0.0.1:5432/havre')).toBe(false);
  });

  it('uzakta TLS acilir', () => {
    expect(decide('postgresql://postgres:x@aws-0-ca-central-1.pooler.supabase.com:6543/postgres')).toBe(true);
  });

  it('adres kendi sslmode degerini soyluyorsa karar ona kalir', () => {
    expect(decide('postgresql://postgres:x@db.example.com:5432/postgres?sslmode=verify-full')).toBe(false);
  });
});
