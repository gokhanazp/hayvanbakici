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
      /*
        SUTUN YOK: sema kodun gerisinde kalmis. Bu, "tablo yok"tan farkli
        ve daha sinsi bir durum — uygulama acilir, sayfalarin cogu calisir,
        yalnizca yeni alana dokunan sorgu patlar. Ham hata "column
        r.hidden_at does not exist" diyordu ve bunun cevabinin bir
        migration oldugu hicbir yerde yazmiyordu (bizzat yasandi).
      */
      case '42703':
        return 'Veritabani semasi kodun gerisinde: bekleyen migration var. → npm run db:migrate';
      case '42704':
        return 'Tip veya uzanti bulunamadi. Buyuk ihtimalle PostGIS kurulu degil. → docker compose kullanin veya: brew install postgis';
      case '3F000':
        return 'Sema bulunamadi. Veritabani bos olabilir. → npm run db:migrate';
      case '53300':
        return 'Sunucu baglanti sinirina ulasti (too many connections). Calisan eski dev sunucularini kapatin; Docker kullaniyorsaniz: npm run db:down && npm run db:up';
      case '57P03':
        return 'Sunucu henuz hazir degil (baslatiliyor ya da kurtariliyor). Birkac saniye sonra tekrar deneyin.';
      case '57P01':
      case '57P02':
        return 'Baglanti sunucu tarafindan kesildi (sunucu yeniden baslatildi ya da kapandi). → npm run db:doctor';
      case '22P02':
        return 'Gecersiz deger: bir parametre bekledigi tipe donusturulemedi (ornegin uydurma bir enum degeri ya da bozuk bir UUID).';
      case '42601':
        return 'SQL soz dizimi hatasi — bu bizim hatamiz, sorgu yanlis yazilmis.';
      default:
        return null;
    }
  })();

  /*
    RECETESI OLMAYAN HATADA BILE KOD GORUNSUN.

    Once recete yoksa ham hata oldugu gibi firlatiliyordu; ekranda
    "Failed query: SELECT ... params: boarding,3" yaziyordu ve Postgres'in
    KENDI hata kodu ile mesaji hicbir yerde gorunmuyordu (bizzat yasandi —
    hata ekranina bakip ne oldugunu anlamak mumkun olmadi).

    Artik teshis her zaman var: recete varsa recete + kod, yoksa en azindan
    kod ve sunucunun soyledigi cumle.
  */
  if (!hint) {
    if (!code || code === '?') return err instanceof Error ? err : new Error(base);
    const plain = new Error(
      `Veritabani hatasi (Postgres ${code}): ${base}\n` +
      'Bu kod icin hazir bir recete yok. → npm run db:doctor',
    );
    plain.cause = err;
    return plain;
  }

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
