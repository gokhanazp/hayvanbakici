/**
 * Migration calistirici.
 * PostGIS uzantisi migration'lardan ONCE kurulur — semada geography sutunlari var.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL tanimli degil');

const client = postgres(url, { max: 1 });
const db = drizzle(client);

await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis`);
await migrate(db, { migrationsFolder: new URL('../migrations', import.meta.url).pathname });
console.log('migration tamam');
await client.end();
