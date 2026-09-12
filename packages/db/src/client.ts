import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema/index.js';

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb(connectionString = process.env.DATABASE_URL) {
  if (!connectionString) throw new Error('DATABASE_URL tanimli degil');
  if (!_db) {
    const client = postgres(connectionString, { max: 10, prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export type Database = ReturnType<typeof getDb>;
export { schema };
