/**
 * UNSPLASH'TAN GERCEK FOTOGRAFLARI INDIRIR.
 *
 *   UNSPLASH_ACCESS_KEY=... npm run photos:fetch          (apps/web icinde)
 *   ... npm run photos:fetch -- --only hero-primary,person-01
 *   ... npm run photos:fetch -- --force                   (secimleri yeniler)
 *
 * Anahtar: https://unsplash.com/developers (ucretsiz, Demo uygulama 50 istek/saat).
 *
 * NEDEN BETIK, NEDEN CANLI CDN DEGIL:
 *  - Fotograflar kendi sunucumuzdan gider: sinir otesi istek yok (Law 25),
 *    build dis servise bagimli degil, LCP'de ek baglanti kurulumu yok.
 *  - Secimler photos.lock.json'a yazilir; ayni komut ayni fotograflari getirir.
 *    Tasarimin bir daha calistirildiginda degismesi kabul edilemez.
 *
 * UNSPLASH KURALLARI (API sartlari) — bilerek uygulaniyor:
 *  - Indirme oncesi `download_location` uc noktasi tetiklenir (zorunlu).
 *  - Fotografci adi ve profil baglantisi CREDITS.md'ye yazilir (atif zorunlu).
 *  - Fotograflar oldugu gibi kullanilir, yeniden satilmaz.
 *
 * Bu fotograflar GECICIDIR: gercek bakicilar kendi fotograflarini yukleyecek.
 * Stok bir yuzu "gercek musterimiz" diye sunmak uydurma sosyal kanit olur —
 * kayittaki kisi fotograflari yalnizca DEMO verisinde (seed) kullanilir.
 */
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PHOTOS, type PhotoId } from '../src/lib/photos.js';

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) {
  console.error(
    'UNSPLASH_ACCESS_KEY yok.\n' +
    '  1) https://unsplash.com/developers -> New Application\n' +
    '  2) Access Key\'i .env dosyasina UNSPLASH_ACCESS_KEY=... olarak ekleyin\n' +
    '  3) npm run photos:fetch\n' +
    'Anahtar olmadan site, depodaki marka renkli yer tutucularla calisir.',
  );
  process.exit(1);
}

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, '..', 'public', 'photos');
const lockPath = join(here, '..', 'photos.lock.json');

const args = process.argv.slice(2);
const force = args.includes('--force');
const onlyArg = args[args.indexOf('--only') + 1];
const only = args.includes('--only') && onlyArg ? new Set(onlyArg.split(',')) : null;

interface LockEntry { photoId: string; author: string; authorUrl: string; page: string }
type Lock = Record<string, LockEntry>;

const lock: Lock = await readFile(lockPath, 'utf8').then(JSON.parse).catch(() => ({}));

const api = async (path: string): Promise<unknown> => {
  const res = await fetch(`https://api.unsplash.com${path}`, {
    headers: { Authorization: `Client-ID ${KEY}`, 'Accept-Version': 'v1' },
  });
  if (!res.ok) throw new Error(`Unsplash ${res.status} ${res.statusText} — ${path}`);
  return res.json();
};

interface UPhoto {
  id: string;
  urls: { raw: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}

const used = new Set(Object.values(lock).map((e) => e.photoId));

for (const [id, spec] of Object.entries(PHOTOS) as Array<[PhotoId, typeof PHOTOS[PhotoId]]>) {
  if (only && !only.has(id)) continue;

  let entry = force ? undefined : lock[id];
  let photo: UPhoto;

  if (entry) {
    photo = (await api(`/photos/${entry.photoId}`)) as UPhoto;
  } else {
    const orientation = spec.width > spec.height ? 'landscape'
      : spec.width < spec.height ? 'portrait' : 'squarish';
    const q = encodeURIComponent(spec.query);
    const found = (await api(
      `/search/photos?query=${q}&orientation=${orientation}&per_page=12&content_filter=high`,
    )) as { results: UPhoto[] };
    // Ayni fotografin iki yuvada cikmasi, sayfada iki kez gorunmesi demek.
    const pick = found.results.find((p) => !used.has(p.id)) ?? found.results[0];
    if (!pick) { console.warn(`! ${id}: sonuc yok (${spec.query})`); continue; }
    photo = pick;
    used.add(pick.id);
    entry = {
      photoId: pick.id, author: pick.user.name,
      authorUrl: pick.user.links.html, page: pick.links.html,
    };
    lock[id] = entry;
  }

  // Unsplash API sartlari: indirme once bu uc noktadan bildirilir.
  await api(photo.links.download_location.replace('https://api.unsplash.com', ''));

  const url = `${photo.urls.raw}&w=${spec.width}&h=${spec.height}&fit=crop&crop=faces,entropy&q=78&fm=jpg`;
  const bin = await fetch(url);
  if (!bin.ok) throw new Error(`indirme basarisiz ${id}: ${bin.status}`);
  const out = join(outRoot, `${spec.file}.jpg`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(await bin.arrayBuffer()));
  console.log(`✓ ${id.padEnd(16)} ${entry.author}`);
}

await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);

const credits = Object.entries(lock)
  .map(([id, e]) => `- **${id}** — [${e.author}](${e.authorUrl}?utm_source=havre&utm_medium=referral) / [Unsplash](${e.page})`)
  .join('\n');
await writeFile(join(outRoot, 'CREDITS.md'), `# Fotograf atiflari

Bu klasordeki fotograflar Unsplash'tan alinmistir ve Unsplash Lisansi ile
kullanilir. Atif lisans geregi zorunlu degil, API sartlari geregi zorunludur.

${credits}
`);
console.log('CREDITS.md ve photos.lock.json guncellendi.');
