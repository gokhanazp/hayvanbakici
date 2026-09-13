/**
 * Migration calistirici.
 *
 * PostGIS uzantisi migration'lardan ONCE kurulur — sema geography sutunlari
 * kullaniyor. Uzanti yoksa SESSIZCE devam etmek yerine acikca durur: aksi halde
 * migration yarida kalir, tablolar olusmaz ve uygulama "cities tablosu yok"
 * diye anlamsiz bir hata verir.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { rootFault, CONNECTION_CODES } from './client.js';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('\n✗ DATABASE_URL tanimli degil. Monorepo kokunde: cp .env.example .env\n');
  process.exit(1);
}

const client = postgres(url, { max: 1, onnotice: () => {} });
const db = drizzle(client);

try {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`);
} catch (err) {
  // Drizzle asil hatayi .cause icine gomer; koke inmeden dogru teshis olmaz.
  const fault = rootFault(err);
  const code = fault.code;
  // message zaten adresi iceriyorsa tekrar etme
  const addr = fault.address ? `${fault.address}:${fault.port ?? ''}` : '';
  const detail = (fault.message.includes(addr) ? fault.message : [fault.message, addr].filter(Boolean).join(' '))
    || '(sunucudan mesaj gelmedi)';

  if (code === '42501') {
    console.error(`
✗ PostGIS kurma yetkiniz yok.

  Hata kodu : ${code}
  Ayrinti   : ${detail}

CREATE EXTENSION superuser ister. Kullaniciyi yetkilendirin:
  psql -d postgres -c "ALTER ROLE havre SUPERUSER"
ya da uzantiyi bir kez elle kurun:
  psql -d havre -c "CREATE EXTENSION postgis"
`);
    await client.end({ timeout: 1 }).catch(() => {});
    process.exit(1);
  }

  if (CONNECTION_CODES.has(code) || code === '28P01' || code === '3D000') {
    console.error(`
✗ Veritabanina BAGLANILAMADI (PostGIS ile ilgisi yok).

  Hata kodu : ${code}
  Ayrinti   : ${detail}
  DATABASE_URL: ${url.replace(/:[^:@/]*@/, ':***@')}

Calisan bir Postgres yok gibi gorunuyor. Teshis icin: npm run db:doctor

  Docker Desktop  : npm run db:up
  Postgres.app    : https://postgresapp.com  (PostGIS dahil)
  Homebrew        : brew install postgresql@16 postgis
                    brew services start postgresql@16
                    createuser -s havre && createdb -O havre havre
`);
  } else {
    console.error(`
✗ PostGIS kurulamadi.

Bu sema geography sutunlari ve GIST indeksleri kullaniyor; PostGIS olmadan
migration calismaz. Duz bir postgres kurulumu YETMEZ.

  Hata kodu : ${code}
  Ayrinti   : ${detail}

  Docker       : npm run db:up          (postgis/postgis:16-3.4 imaji)
  Postgres.app : PostGIS zaten dahil
  Homebrew     : brew install postgis && brew services restart postgresql@16
`);
  }
  await client.end({ timeout: 1 }).catch(() => {});
  process.exit(1);
}

const version = await db.execute(sql`SELECT postgis_version() AS v`);
console.log('PostGIS:', (version as unknown as Array<{ v: string }>)[0]?.v);

await migrate(db, { migrationsFolder: new URL('../migrations', import.meta.url).pathname });

const tables = await db.execute(sql`
  SELECT count(*)::int AS n FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
`);
console.log(`✓ migration tamam — ${(tables as unknown as Array<{ n: number }>)[0]?.n} tablo`);

await client.end();
