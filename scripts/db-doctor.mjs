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

const sqlc = postgres(url, { max: 1, onnotice: () => {} });
const ok = (s) => console.log(`  ✓ ${s}`);
const no = (s) => console.log(`  ✗ ${s}`);

console.log('\nVERITABANI TESHISI\n');

let server;
try {
  [{ version: server }] = await sqlc`SELECT version()`;
  ok(`Baglanti kuruldu`);
  console.log(`     ${server.split(',')[0]}`);
} catch (e) {
  no(`Baglanilamadi: ${e.message}`);
  console.log('\n  → Postgres calismiyor. npm run db:up  (ya da Postgres.app / brew services start)\n');
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

const cityRow = n > 1
  ? await sqlc`SELECT count(*)::int AS n FROM cities`.catch(() => [{ n: 0 }])
  : [{ n: 0 }];
if (cityRow[0].n > 0) ok(`${cityRow[0].n} sehir tohumlandi`);
else no('Tohum verisi yok → npm run db:seed');

console.log('');
await sqlc.end();
