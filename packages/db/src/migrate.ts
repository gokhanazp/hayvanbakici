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
  const e = err as { message?: string };
  console.error(`
✗ PostGIS kurulamadi.

Bu sema geography sutunlari ve GIST indeksleri kullaniyor; PostGIS olmadan
migration calismaz. Duz bir postgres kurulumu YETMEZ.

  Docker    : npm run db:up          (postgis/postgis:16-3.4 imaji)
  Postgres.app: PostGIS zaten dahil   (https://postgresapp.com)
  Homebrew  : brew install postgis

(${e?.message ?? err})
`);
  await client.end();
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
