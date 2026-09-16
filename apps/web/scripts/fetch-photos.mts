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
import { mkdir, writeFile, readFile, stat } from 'node:fs/promises';
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

/*
  `query` de kilitleniyor: kayittaki arama ifadesi degistiginde (ornegin
  duz portreler yerine hayvanli kareler istedigimizde) o yuva otomatik
  YENIDEN seciliyor. Aksi halde kilit eski secimi sonsuza kadar korur ve
  "sorguyu degistirdim ama fotograf ayni" durumu olusur.
*/
interface LockEntry {
  photoId: string;
  author: string;
  authorUrl: string;
  page: string;
  query?: string;
}
type Lock = Record<string, LockEntry>;

const lock: Lock = await readFile(lockPath, 'utf8').then(JSON.parse).catch(() => ({}));

/*
  KOTA GERCEK BIR SINIR.
  Unsplash'in Demo uygulamalari saatte 50 istek veriyor; her yuva iki API
  cagrisi harciyor (arama + indirme bildirimi), yani 24 yuvalik tam bir tur
  48 istek. Tek tur sigar, ikinci tur sigmaz. Bu yuzden:
   - kota bitince acik bir mesajla DURULUYOR (sessiz 403 yerine),
   - secimler her yuvadan SONRA kilit dosyasina yaziliyor,
   - zaten inmis yuvalar tekrar cagri harcamiyor.
*/
let remaining = Infinity;

const api = async (path: string): Promise<unknown> => {
  const res = await fetch(`https://api.unsplash.com${path}`, {
    headers: { Authorization: `Client-ID ${KEY}`, 'Accept-Version': 'v1' },
  });
  const left = res.headers.get('x-ratelimit-remaining');
  if (left !== null) remaining = Number(left);
  if (res.status === 403 && remaining === 0) {
    throw new Error(
      'Unsplash saatlik kota doldu (Demo uygulama: 50 istek/saat).\n' +
      'Inen fotograflar ve secimler photos.lock.json icinde duruyor —\n' +
      'bir saat sonra ayni komutu calistirin, kaldigi yerden devam eder.',
    );
  }
  if (!res.ok) throw new Error(`Unsplash ${res.status} ${res.statusText} — ${path}`);
  return res.json();
};

const exists = async (p: string): Promise<boolean> =>
  stat(p).then(() => true).catch(() => false);

interface UPhoto {
  id: string;
  urls: { raw: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
}

const used = new Set(Object.values(lock).map((e) => e.photoId));

/*
  YER TUTUCU = DOSYA YOK SAYILIR.

  Yer tutucu uretici, gercek fotografla AYNI dosya adina yaziyor. Asagidaki
  "zaten var, atla" kontrolu bunu gercek fotograf saniyordu: yer tutucular
  bir kez uretildikten sonra `photos:fetch` HICBIR SEY indirmiyor, ama
  CREDITS.md'yi yazdigi icin calismis GIBI gorunuyordu (bu bizzat yasandi —
  atiflar guncellendi, ekrandaki pembe degradeler kaldi).

  make-photo-placeholders.mts hangi yuvalari urettigini .placeholders.json'a
  yaziyor; buradaki yuvalar "yok" sayiliyor ve uzerlerine yaziliyor.
*/
const placeholderPath = join(outRoot, '.placeholders.json');
const placeholders = new Set<string>(
  await readFile(placeholderPath, 'utf8')
    .then((t) => JSON.parse(t) as string[])
    .catch(() => []),
);

let done = 0;
let skipped = 0;

for (const [id, spec] of Object.entries(PHOTOS) as Array<[PhotoId, typeof PHOTOS[PhotoId]]>) {
  if (only && !only.has(id)) continue;

  const out = join(outRoot, `${spec.file}.jpg`);

  /*
    Zaten inmis ve kilitli bir yuvaya dokunmuyoruz. Ilk surumde her calisma
    24 yuvanin hepsini yeniden indiriyordu: ikinci calistirmada kota doluyor
    ve elinizde yarim bir set kaliyordu. Yeniden secmek icin --force.
  */
  const locked = lock[id];
  const staleQuery = locked !== undefined && locked.query !== spec.query;

  const isPlaceholder = placeholders.has(id);
  if (!force && locked && !staleQuery && !isPlaceholder && (await exists(out)) && !only) {
    skipped += 1;
    continue;
  }

  let entry = force || staleQuery ? undefined : locked;
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
      query: spec.query,
    };
    lock[id] = entry;
  }

  // Unsplash API sartlari: indirme once bu uc noktadan bildirilir.
  await api(photo.links.download_location.replace('https://api.unsplash.com', ''));

  const url = `${photo.urls.raw}&w=${spec.width}&h=${spec.height}&fit=crop&crop=faces,entropy&q=78&fm=jpg`;
  const bin = await fetch(url);
  if (!bin.ok) throw new Error(`indirme basarisiz ${id}: ${bin.status}`);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, Buffer.from(await bin.arrayBuffer()));
  placeholders.delete(id);

  // Kilit HER YUVADAN SONRA yaziliyor: tur ortasinda kota biterse
  // o ana kadarki secimler kaybolmaz.
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
  done += 1;
  console.log(`✓ ${id.padEnd(16)} ${entry.author}${remaining < 12 ? `   (kota: ${remaining})` : ''}`);
}

await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
await writeFile(
  placeholderPath,
  `${JSON.stringify([...placeholders].sort(), null, 2)}\n`,
);

const credits = Object.entries(lock)
  .map(([id, e]) => `- **${id}** — [${e.author}](${e.authorUrl}?utm_source=havre&utm_medium=referral) / [Unsplash](${e.page})`)
  .join('\n');
await writeFile(join(outRoot, 'CREDITS.md'), `# Fotograf atiflari

Bu klasordeki fotograflar Unsplash'tan alinmistir ve Unsplash Lisansi ile
kullanilir. Atif lisans geregi zorunlu degil, API sartlari geregi zorunludur.

${credits}
`);
console.log(
  `CREDITS.md ve photos.lock.json guncellendi — ${done} indirildi` +
  (skipped ? `, ${skipped} zaten vardi (yenilemek icin --force)` : '') + '.',
);
if (placeholders.size > 0) {
  console.warn(
    `UYARI: ${placeholders.size} yuva hala YER TUTUCU: ` +
    `${[...placeholders].sort().join(', ')}`,
  );
}
