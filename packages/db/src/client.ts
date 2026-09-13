import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Postgres hatalarini ne yapilacagini soyleyen mesajlara cevirir.
 *
 * Neden var: ham hata "Failed query: select ... from cities" diyor ve SEBEBI
 * soylemiyordu. Tablonun olmamasi, veritabaninin kapali olmasi ve PostGIS'in
 * kurulu olmamasi ayni ekrani uretiyordu. Bu siniflardaki her hata artik
 * dogrudan calistirilacak komutu veriyor.
 */
function explain(err: unknown): Error {
  const e = err as { code?: string; message?: string; cause?: { code?: string } };
  const code = e?.code ?? e?.cause?.code;
  const base = e?.message ?? String(err);

  const hint = (() => {
    switch (code) {
      case 'ECONNREFUSED':
        return 'Veritabanina baglanilamadi. Calisiyor mu? → npm run db:up (veya Postgres.app/brew services start)';
      case 'ENOTFOUND':
        return 'DATABASE_URL icindeki sunucu adi cozulemedi. .env dosyasini kontrol edin.';
      case '3D000':
        return 'Veritabani yok. → createdb havre  (ya da npm run db:up)';
      case '28P01':
      case '28000':
        return 'Kullanici adi/parola reddedildi. .env icindeki DATABASE_URL yanlis.';
      case '42P01':
        return 'Tablolar yok — migration calistirilmamis (ya da PostGIS eksik oldugu icin yarida kalmis). → npm run db:migrate';
      case '42704':
        return 'Tip veya uzanti bulunamadi. Buyuk ihtimalle PostGIS kurulu degil. → docker compose kullanin veya: brew install postgis';
      case '3F000':
        return 'Sema bulunamadi. Veritabani bos olabilir. → npm run db:migrate';
      default:
        return null;
    }
  })();

  if (!hint) return err instanceof Error ? err : new Error(base);

  const wrapped = new Error(`${hint}\n\n(Postgres ${code ?? '?'}: ${base})`);
  wrapped.cause = err;
  return wrapped;
}

export function getDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL tanimli degil.\n' +
      'Monorepo kokunde .env olusturun: cp .env.example .env',
    );
  }
  if (!_db) {
    const client = postgres(connectionString, {
      max: 10,
      prepare: false,
      onnotice: () => {},
    });
    _db = drizzle(client, { schema });
  }
  return _db;
}

/** Sorgu hatalarini aciklayici mesaja ceviren sarmalayici. */
export async function withDbErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw explain(err);
  }
}

export type Database = ReturnType<typeof getDb>;
export { schema };
