/**
 * Veritabani teshis araci.
 *
 * "PostGIS kurulu degil" demek yetmiyor: dogru komut Postgres'in NEREDEN
 * geldigine bagli (Homebrew / Postgres.app / Docker). Bu script sunucuya
 * baglanip ne oldugunu tespit eder ve TEK bir recete yazar.
 */
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✗ DATABASE_URL yok. Monorepo kokunde: cp .env.example .env');
  process.exit(1);
}

const sqlc = postgres(url, { max: 1, onnotice: () => {}, connect_timeout: 5 });

const shown = url.replace(/:[^:@/]*@/, ':***@');
const target = (() => {
  try { const u = new URL(url.replace(/^postgres(ql)?:/, 'http:')); return `${u.hostname}:${u.port || 5432}`; }
  catch { return '?'; }
})();
const ok = (s) => console.log(`  ✓ ${s}`);
const no = (s) => console.log(`  ✗ ${s}`);

console.log('\nVERITABANI TESHISI\n');

/** Ayni URL'yi farkli bir host ile dener — localhost/IPv6 tuzagini yakalamak icin */
async function tryHost(host) {
  const u = url.replace(/@[^/]+\//, `@${host}/`);
  const c = postgres(u, { max: 1, onnotice: () => {}, connect_timeout: 4 });
  try { await c`SELECT 1`; await c.end({ timeout: 1 }); return true; }
  catch { await c.end({ timeout: 1 }).catch(() => {}); return false; }
}

let server;
try {
  [{ version: server }] = await sqlc`SELECT version()`;
  ok(`Baglanti kuruldu`);
  console.log(`     ${server.split(',')[0]}`);
} catch (e) {
  // postgres-js baglanti hatalarinin message'i BOS olabilir; kod ve adres her zaman yazdirilir
  const code = e?.code ?? e?.errno ?? '?';
  no(`Baglanilamadi (${code})`);
  console.log(`     hedef : ${target}`);
  console.log(`     url   : ${shown}`);
  if (e?.message) console.log(`     mesaj : ${e.message}`);

  // localhost -> IPv6 (::1) tuzagi: Docker IPv4'te dinler, macOS once ::1 dener
  const hostInUrl = target.split(':')[0];
  if (hostInUrl === 'localhost') {
    const v4 = await tryHost('127.0.0.1:' + (target.split(':')[1] || 5432));
    if (v4) {
      console.log(`
  ✓ BULUNDU: 127.0.0.1 ile baglanti CALISIYOR, 'localhost' ile calismiyor.

  Sebep: macOS 'localhost' adresini once IPv6 (::1) olarak cozuyor; Docker ise
  IPv4'te dinliyor. Duzeltme — .env icinde localhost yerine 127.0.0.1 yazin:

    DATABASE_URL=postgresql://havre:havre@127.0.0.1:5432/havre

  Sonra: npm run db:migrate && npm run db:seed
`);
      process.exit(1);
    }
  }

  // Docker konteyneri var mi?
  try {
    const { execSync } = await import('node:child_process');
    const ps = execSync('docker ps -a --filter name=havre-db --format "{{.Names}} {{.Status}}"',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (ps) console.log(`\n  Docker konteyneri: ${ps}`);
    else console.log('\n  Docker konteyneri havre-db bulunamadi → npm run db:up');
  } catch { /* docker yok */ }

  console.log(`
  Calisan bir Postgres yok. Uc secenekten biri:

    1) Docker Desktop  — kurup acin, sonra:
         npm run db:up && npm run db:migrate && npm run db:seed

    2) Postgres.app    — https://postgresapp.com  (PostGIS DAHIL gelir, en az ugras)
         Indirin, acin, Initialize deyin. Sonra:
         createuser -s havre && createdb -O havre havre
         npm run db:migrate && npm run db:seed

    3) Homebrew        — brew install postgresql@16 postgis
         brew services start postgresql@16
         createuser -s havre && createdb -O havre havre
         npm run db:migrate && npm run db:seed

  PostGIS ZORUNLU: sema geography sutunlari kullaniyor.
`);
  process.exit(1);
}

// Nereden geldigi: derleyici/platform izleri ve dosya yollari
const [{ config_file: configFile }] = await sqlc`SHOW config_file`;
let flavour = 'bilinmiyor';
if (/\/opt\/homebrew|\/usr\/local\/Cellar|\/opt\/homebrew\/var/.test(configFile)) flavour = 'homebrew';
else if (/Application Support\/Postgres|Postgres\.app/i.test(configFile)) flavour = 'postgresapp';
else if (/^\/var\/lib\/postgresql/.test(configFile)) flavour = 'docker';
ok(`Kurulum tipi: ${flavour}`);
console.log(`     config: ${configFile}`);

// PostGIS: kurulu mu, kurulabilir mi?
const [installed] = await sqlc`SELECT extversion FROM pg_extension WHERE extname = 'postgis'`;
const [available] = await sqlc`SELECT default_version FROM pg_available_extensions WHERE name = 'postgis'`;

if (installed) {
  ok(`PostGIS kurulu: ${installed.extversion}`);
} else if (available) {
  no(`PostGIS bu veritabaninda etkin degil (ama sunucuda mevcut: ${available.default_version})`);
  console.log('\n  RECETE — tek komut yeter:\n    npm run db:migrate\n');
  await sqlc.end(); process.exit(0);
} else {
  no('PostGIS sunucuda YOK — once ikili dosyalari kurulmali');
  const recipe = {
    homebrew: [
      'brew install postgis',
      'brew services restart postgresql@16   # surumunuz farkliysa onu yazin',
      'npm run db:migrate',
    ],
    postgresapp: [
      'Postgres.app PostGIS ile gelir ama bu sunucu farkli bir kurulum gibi gorunuyor.',
      'Postgres.app kullanmak icin: onu acin, sonra .env icindeki portu ona gore ayarlayin.',
    ],
    docker: [
      'Calisan imaj duz postgres. postgis/postgis:16-3.4 gerekiyor:',
      'docker compose down -v && npm run db:up && npm run db:migrate',
    ],
    bilinmiyor: [
      'En kolayi Docker: mevcut Postgres 5432 portunu kullaniyorsa once onu durdurun,',
      'sonra: npm run db:up && npm run db:migrate',
      'Alternatif (Homebrew ise): brew install postgis && brew services restart postgresql@16',
    ],
  }[flavour];
  console.log('\n  RECETE:');
  for (const line of recipe) console.log(`    ${line}`);
  console.log('');
  await sqlc.end(); process.exit(1);
}

// Tablolar
const [{ n }] = await sqlc`
  SELECT count(*)::int AS n FROM information_schema.tables
  WHERE table_schema='public' AND table_type='BASE TABLE'`;
if (n > 1) ok(`${n} tablo var`); else no(`Tablo yok → npm run db:migrate`);

/*
  BEKLEYEN MIGRATION.

  "Tablo var" demek "sema guncel" demek degil. Yeni bir sutun ekleyen bir
  migration calistirilmadiginda uygulama ACILIYOR, sayfalarin cogu
  calisiyor ve yalnizca o sutuna dokunan sorgu patliyor — hata da
  "column r.hidden_at does not exist" gibi, cevabinin migration oldugunu
  soylemeyen bir cumle oluyor (bizzat yasandi). Teshis burada yapilsin.
*/
if (n > 1) {
  const { readFileSync } = await import('node:fs');
  const journalUrl = new URL('../packages/db/migrations/meta/_journal.json', import.meta.url);
  let expected = 0;
  try { expected = JSON.parse(readFileSync(journalUrl, 'utf8')).entries.length; } catch { /* yok */ }

  const appliedRow = await sqlc`
    SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations
  `.catch(() => null);

  if (appliedRow === null) {
    no('Migration kaydi bulunamadi → npm run db:migrate');
  } else if (expected > 0 && appliedRow[0].n < expected) {
    no(`${expected - appliedRow[0].n} BEKLEYEN migration var (${appliedRow[0].n}/${expected}) → npm run db:migrate`);
  } else if (expected > 0) {
    ok(`Sema guncel (${appliedRow[0].n}/${expected} migration)`);
  }
}

/*
  BAGLANTI KULLANIMI.

  "too many clients already" (53300) bu projede en sik gorulen ikinci
  hata ve sebebi neredeyse her zaman ayni: arkada unutulmus dev
  sunuculari. Ekran bunu TAHMIN ETTIRMEK yerine gosteriyor — kac
  baglanti var, siniri ne, kim tutuyor.
*/
const [{ used, limit }] = await sqlc`
  SELECT (SELECT count(*)::int FROM pg_stat_activity) AS used,
         current_setting('max_connections')::int      AS limit`;

const pct = Math.round((used / limit) * 100);
if (pct < 70) ok(`Baglanti: ${used}/${limit}`);
else no(`Baglanti: ${used}/${limit} (%${pct}) — sinira yaklasiyor`);

if (pct >= 50) {
  const holders = await sqlc`
    SELECT coalesce(application_name, '(isimsiz)') AS who,
           state, count(*)::int AS n,
           max(now() - state_change)::text AS idle_for
    FROM pg_stat_activity
    WHERE datname = current_database() AND pid <> pg_backend_pid()
    GROUP BY 1, 2 ORDER BY n DESC LIMIT 8`;

  console.log('\n  KIM TUTUYOR:');
  for (const h of holders) {
    console.log(`    ${String(h.n).padStart(3)} × ${h.who} — ${h.state} (${h.idle_for})`);
  }
  console.log(`
  RECETE:
    1. Fazladan calisan dev sunucularini kapatin:  pkill -f "next dev"
    2. Bos baglantilari birakmak icin sunucuyu yeniden baslatin ya da:
       psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = current_database() AND pid <> pg_backend_pid()
           AND state = 'idle' AND state_change < now() - interval '5 minutes'"
    3. Docker kullaniyorsaniz en kolayi: npm run db:down && npm run db:up
`);
}

const cityRow = n > 1
  ? await sqlc`SELECT count(*)::int AS n FROM cities`.catch(() => [{ n: 0 }])
  : [{ n: 0 }];
if (cityRow[0].n > 0) ok(`${cityRow[0].n} sehir tohumlandi`);
else no('Tohum verisi yok → npm run db:seed');

console.log('');
await sqlc.end();
