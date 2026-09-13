import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * Testler GERCEK Postgres'e baglaniyor (bkz. src/auth.test.ts basindaki not),
 * bu yuzden monorepo kokundeki .env burada okunuyor. Vitest kendi basina
 * .env okumaz ve turbo hermetik oldugu icin degiskeni de gecirmez.
 */
const envPath = fileURLToPath(new URL('../../../.env', import.meta.url));

try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m?.[1]) continue;
    if (process.env[m[1]] !== undefined) continue;
    process.env[m[1]] = (m[2] ?? '').replace(/^["']|["']$/g, '');
  }
} catch {
  // .env yoksa sessiz gec — CI degiskenleri dogrudan verebilir.
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    'Kimlik testleri gercek bir veritabani istiyor. Once: npm run db:up && npm run db:migrate',
  );
}
