/**
 * YER TUTUCU FOTOGRAF URETICI.
 *
 * Depoda gercek fotograf yok; olsaydi bile lisansi belirsiz ikili dosyalar
 * git gecmisine girerdi. Onun yerine kayittaki (src/lib/photos.ts) her yuva
 * icin marka renklerinde bir JPEG uretiyoruz.
 *
 * Gerekce: eksik gorsel = bozuk sayfa. Yer tutucu, `npm run photos:fetch`
 * hic calistirilmasa bile sitenin TASARLANMIS gorunmesini saglar; gercek
 * fotograflar ayni dosya adlarinin uzerine yazilir.
 *
 *   npm run photos:placeholders            (apps/web icinde)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PHOTOS } from '../src/lib/photos.js';

const here = dirname(fileURLToPath(import.meta.url));
const outRoot = join(here, '..', 'public', 'photos');

/**
 * Dort pastel aile — hizmet kutucuklariyla ayni tonlar.
 *
 * Palet "Cizgi Film"e gecince bu degerler ESKI palette kalmisti ve yer
 * tutucu gorseller sayfanin geri kalaniyla ayri bir dunyada duruyordu
 * (giris sayfasinin yan paneli sicak krem zeminin yaninda lila
 * goruniyordu). Gercek fotograflar gelene kadar yer tutucu da markanin
 * icinde durmali.
 */
const TINTS = [
  { a: '#FBDEE6', b: '#F3BACC', ink: '#AF3453' },
  { a: '#D8EDE2', b: '#B3D9C6', ink: '#25664C' },
  { a: '#FBE3BE', b: '#F2CD98', ink: '#7A5210' },
  { a: '#DFE3F7', b: '#C2C9EC', ink: '#3F4A8F' },
] as const;

function sceneSvg(w: number, h: number, t: typeof TINTS[number], seed: number): string {
  const r = (n: number) => ((Math.sin(seed * 9.7 + n * 3.1) + 1) / 2);
  const cx1 = (0.18 + r(1) * 0.5) * w;
  const cy1 = (0.12 + r(2) * 0.4) * h;
  const cx2 = (0.45 + r(3) * 0.5) * w;
  const cy2 = (0.55 + r(4) * 0.4) * h;
  const s = Math.min(w, h);
  // Pati izi — merkezden kaydirilmis, tasarsa da sorun degil (kirpiliyor)
  const px = (0.58 + r(5) * 0.22) * w;
  const py = (0.62 + r(6) * 0.2) * h;
  const pr = s * 0.085;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/>
    </linearGradient>
    <radialGradient id="s1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <radialGradient id="s2"><stop offset="0" stop-color="${t.ink}" stop-opacity=".16"/><stop offset="1" stop-color="${t.ink}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <ellipse cx="${cx1}" cy="${cy1}" rx="${s * 0.62}" ry="${s * 0.52}" fill="url(#s1)"/>
  <ellipse cx="${cx2}" cy="${cy2}" rx="${s * 0.7}" ry="${s * 0.58}" fill="url(#s2)"/>
  <g fill="${t.ink}" opacity=".13">
    <ellipse cx="${px}" cy="${py + pr * 0.9}" rx="${pr * 1.15}" ry="${pr * 0.95}"/>
    <ellipse cx="${px - pr * 1.25}" cy="${py - pr * 0.45}" rx="${pr * 0.48}" ry="${pr * 0.62}"/>
    <ellipse cx="${px - pr * 0.42}" cy="${py - pr * 1.05}" rx="${pr * 0.48}" ry="${pr * 0.62}"/>
    <ellipse cx="${px + pr * 0.42}" cy="${py - pr * 1.05}" rx="${pr * 0.48}" ry="${pr * 0.62}"/>
    <ellipse cx="${px + pr * 1.25}" cy="${py - pr * 0.45}" rx="${pr * 0.48}" ry="${pr * 0.62}"/>
  </g>
</svg>`;
}

function portraitSvg(w: number, h: number, t: typeof TINTS[number]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${t.a}"/><stop offset="1" stop-color="${t.b}"/>
  </linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <g fill="${t.ink}" opacity=".22">
    <circle cx="${w / 2}" cy="${h * 0.38}" r="${w * 0.16}"/>
    <path d="M ${w * 0.2} ${h} a ${w * 0.3} ${h * 0.3} 0 0 1 ${w * 0.6} 0 Z"/>
  </g>
</svg>`;
}

const entries = Object.entries(PHOTOS);
await mkdir(outRoot, { recursive: true });

let i = 0;
for (const [id, spec] of entries) {
  const t = TINTS[spec.tint];
  if (!t) throw new Error(`gecersiz tint: ${id}`);
  const svg = spec.kind === 'portrait'
    ? portraitSvg(spec.width, spec.height, t)
    : sceneSvg(spec.width, spec.height, t, i + 1);
  const out = join(outRoot, `${spec.file}.jpg`);
  await mkdir(dirname(out), { recursive: true });
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 72, mozjpeg: true }).toBuffer();
  await writeFile(out, buf);
  i += 1;
}

await writeFile(
  join(outRoot, 'README.md'),
  `# public/photos

Bu klasordeki JPEG'ler **yer tutucudur** — \`npm run photos:placeholders\` uretir.
Gercek fotograflar icin \`UNSPLASH_ACCESS_KEY\` ile \`npm run photos:fetch\`
calistirin; ayni dosya adlarinin uzerine yazar ve CREDITS.md olusturur.
Kendi fotograflarinizi da ayni ad ve orana kaydederek koyabilirsiniz.
Yuva listesi: \`apps/web/src/lib/photos.ts\`
`,
);

console.log(`${entries.length} yer tutucu uretildi -> apps/web/public/photos/`);
