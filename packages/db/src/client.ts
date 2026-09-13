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
export interface DbFault {
  code: string;
  message: string;
  address?: string;
  port?: number;
}

/**
 * Hata zincirinin KOKUNE iner.
 *
 * Drizzle, postgres-js hatasini "Failed query: ..." diye sarar ve asil hatayi
 * .cause icine koyar; postgres-js de bazen bir kat daha sarar. Sadece dis
 * nesneye bakmak kodu '?' gosterir ve YANLIS teshise yol acar — bizzat yasandi:
 * sunucu hic calismiyorken "PostGIS kurulamadi" yaziliyordu.
 */
export function rootFault(err: unknown): DbFault {
  const seen = new Set<unknown>();
  let node: unknown = err;
  let best: DbFault | null = null;

  while (node && typeof node === 'object' && !seen.has(node)) {
    seen.add(node);
    const e = node as Record<string, unknown>;
    const code = (e.code ?? e.errno) as string | undefined;
    if (code && !best) {
      best = {
        code: String(code),
        message: typeof e.message === 'string' ? e.message : '',
        address: typeof e.address === 'string' ? e.address : undefined,
        port: typeof e.port === 'number' ? e.port : undefined,
      };
    }
    // once cause, sonra AggregateError benzeri errors[0]
    node = e.cause ?? (Array.isArray(e.errors) ? e.errors[0] : undefined);
  }

  if (best) return best;
  const m = err instanceof Error ? err.message : String(err);
  return { code: '?', message: m };
}

/** Baglanti kaynakli hata kodlari — PostGIS/sema hatalarindan ayirmak icin */
export const CONNECTION_CODES = new Set([
  'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'ECONNRESET',
  'EPIPE', 'CONNECT_TIMEOUT', 'CONNECTION_CLOSED', 'CONNECTION_ENDED',
  'CONNECTION_DESTROYED', 'CONNECTION_CONNECT_TIMEOUT',
]);

function explain(err: unknown): Error {
  const fault = rootFault(err);
  const code = fault.code;
  const base = fault.message || (err instanceof Error ? err.message : String(err));

  const where = fault.address ? ` (${fault.address}:${fault.port ?? ''})` : '';

  const hint = (() => {
    if (CONNECTION_CODES.has(code)) {
      return `Veritabanina baglanilamadi${where}. Calisan bir Postgres var mi? → npm run db:doctor`;
    }
    switch (code) {
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
