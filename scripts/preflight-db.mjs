/**
 * Veritabani on kontrolu.
 * Amac: Docker yoksa anlamsiz bir hata yerine ne yapilacagini soylemek.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import net from 'node:net';

const url = process.env.DATABASE_URL ?? '';
const port = Number(new URL(url.replace(/^postgres(ql)?:/, 'http:')).port || 5432);

const reachable = await new Promise((resolve) => {
  const s = net.connect({ host: '127.0.0.1', port, timeout: 1200 });
  s.on('connect', () => { s.destroy(); resolve(true); });
  s.on('error', () => resolve(false));
  s.on('timeout', () => { s.destroy(); resolve(false); });
});

if (reachable) {
  console.log(`✓ Veritabani ${port} portunda yanit veriyor.`);
  process.exit(0);
}

let hasDocker = false;
try { execSync('docker info', { stdio: 'ignore' }); hasDocker = true; } catch { /* yok */ }

if (!existsSync('.env')) {
  console.error('\n✗ .env yok. Once: cp .env.example .env\n');
  process.exit(1);
}

if (hasDocker) {
  console.log('Docker calisiyor, veritabani kaldiriliyor...');
  process.exit(0);
}

console.error(`
✗ ${port} portunda veritabani yok ve Docker da calismiyor.

Uc secenekten biri:

  1) Docker Desktop     — kurup acin, sonra: npm run setup
  2) Postgres.app       — https://postgresapp.com (PostGIS dahil gelir)
                          Sonra: createdb havre && npm run db:migrate && npm run db:seed
  3) Homebrew           — brew install postgresql@16 postgis
                          brew services start postgresql@16
                          createuser -s havre && createdb -O havre havre
                          npm run db:migrate && npm run db:seed

PostGIS ZORUNLU: sema geography sutunlari kullaniyor, duz postgres yetmez.
`);
process.exit(1);
