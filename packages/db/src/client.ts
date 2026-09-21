import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';
import { isLocalDatabase } from './seed-guard.js';

type Db = ReturnType<typeof drizzle<typeof schema>>;

/*
  HAVUZ, MODULUN DEGIL SURECIN OMRU KADAR YASAMALI.

  Gelistirme sunucusu her degisiklikte modulleri YENIDEN degerlendiriyor.
  Havuz yalnizca modul duzeyinde bir degiskende dursaydi, her yeniden
  derleme yeni bir havuz acar, eskisi de baglantilarini tutmaya devam
  ederdi: yirmi kayitli degisiklikten sonra Postgres "too many clients
  already" (53300) diyor ve site aciliyor gibi gorunup her sayfada
  patliyor (bizzat yasandi).

  `globalThis` modul yeniden degerlendirilse de ayni kaliyor; bu yuzden
  havuzun adresi orada tutuluyor. Uretimde de zarari yok — orada modul
  zaten bir kez degerlendiriliyor.
*/
const GLOBAL_KEY = Symbol.for('havre.db.pool');
const globalStore = globalThis as unknown as Record<symbol, Db | undefined>;

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
        /*
          Bu hatanin sebebi neredeyse hicbir zaman "cok kullanici" degil:
          arkada unutulmus dev sunuculari ya da eski havuzlar. Recete de
          bunu soyluyor — once kimin tuttuguna BAKMANIN yolunu veriyoruz,
          korlemesine yeniden baslatmayi degil.
        */
        return 'Sunucu baglanti sinirina ulasti (too many connections). '
          + 'Genellikle arkada unutulmus dev sunuculari tutuyor. '
          + 'Kim tutuyor: npm run db:doctor  ·  Hepsini kapatmak icin: '
          + 'pkill -f "next dev"  ·  Docker ise: npm run db:down && npm run db:up';
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
  const existing = globalStore[GLOBAL_KEY];
  if (existing) return existing;

  /*
    HAVUZ BOYU. Postgres'in varsayilan siniri 100 baglanti ve bunun bir
    kismi zaten bakim islerine ayrilmis. Gelistirmede ayni anda birkac
    surec acik olabiliyor (web, testler, drizzle studio, psql), o yuzden
    varsayilan daha kucuk. DB_POOL_MAX ile degistirilebilir.

    idle_timeout: bos baglantiyi sonsuza kadar tutmuyoruz; birkac dakika
    once kapatilmis bir sayfanin baglantisi, acilmak isteyen yeni surecin
    yerini kaplamamali.
  */
  /*
    SUNUCUSUZDA HAVUZ KUCUK OLMALI.

    Tek bir uzun omurlu sunucuda 10 baglantili bir havuz dogru. Vercel
    gibi sunucusuz bir ortamda ise AYNI ANDA ONLARCA fonksiyon ornegi
    yasiyor ve her biri kendi havuzunu aciyor: 10 x 30 ornek = 300
    baglantı, havuzlayicinin istemci sinirini tek basina doldurur ve
    istekler sirada bekler.

    Bu yuzden varsayilan ortamdan cikariliyor. DB_POOL_MAX verilirse o
    kazaniyor (build sirasinda gecici olarak buyutmek mesru).
  */
  const serverless = Boolean(process.env.VERCEL) || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
  const fromEnv = Number(process.env.DB_POOL_MAX);
  const max = Number.isFinite(fromEnv) && fromEnv > 0
    ? Math.floor(fromEnv)
    : serverless ? 2
    : (process.env.NODE_ENV === 'production' ? 10 : 5);

  /*
    UZAK VERITABANINA TLS ZORUNLU.

    postgres-js, adreste `sslmode` yazmiyorsa sifresiz baglaniyor.
    Yerelde (docker) bu dogru ve pratik; ama Supabase ya da baska bir
    saglayiciya sifresiz baglanmak iki anlama gelir: ya baglanti
    kurulmaz ve "connection is insecure" diye anlasilmaz bir hata
    alirsin, ya da kurulur ve KULLANICI VERISI INTERNETTEN ACIK GECER.

    Bu yuzden karar adresten cikariliyor: yerel degilse ve adres zaten
    bir sslmode soylemiyorsa TLS acilir. Adreste sslmode varsa ona
    dokunulmuyor — ozellikle `verify-full` kullanmak isteyen biri
    burada engellenmemeli.
  */
  const hasSslMode = /[?&]sslmode=/i.test(connectionString);
  const needsTls = !isLocalDatabase(connectionString) && !hasSslMode;

  const client = postgres(connectionString, {
    ...(needsTls ? { ssl: 'require' as const } : {}),
    max,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    prepare: false,
    onnotice: () => {},
    /*
      Baglantiya AD veriyoruz. `npm run db:doctor` baglantilari kim
      tutuyor diye sordugunda, isimsiz bir liste hicbir sey anlatmiyor;
      "havre-web" ile "havre-test" ayirt edilebilir olmali.
    */
    connection: { application_name: process.env.DB_APP_NAME ?? 'havre-web' },
  });

  const db = drizzle(client, { schema });
  globalStore[GLOBAL_KEY] = db;
  return db;
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
