#!/usr/bin/env node
/**
 * PAYLASILAN JS BUTCESI.
 *
 * "First Load JS shared by all" — her sayfanin, her ziyaretcinin
 * indirdigi ortak paket. Bu sayi sessizce buyuyor: kucuk bir yardimci
 * paket eklenir, bir bilesen yanlislikla istemci tarafina kacar ve
 * kimse fark etmez. Bu betik fark ediyor.
 *
 * NASIL OLCULUYOR: `.next/app-build-manifest.json` her sayfanin
 * yukledigi dosyalari veriyor. HEPSINDE ORTAK olan .js dosyalari
 * paylasilan pakettir — Next'in kendi cikti tablosunda yazdigi sey de
 * budur. Dosyalar diskten okunup ham (sikistirilmamis) boyutlari
 * toplaniyor; Next de boyle yaziyor.
 *
 * Kullanim:  node scripts/check-bundle-budget.mjs [--set]
 *   --set : olculen degeri yeni butce olarak yazar (bilerek buyutme).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const webDir = path.join(root, 'apps', 'web');
const manifestPath = path.join(webDir, '.next', 'app-build-manifest.json');
const budgetPath = path.join(root, 'scripts', 'bundle-budget.json');

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
} catch {
  console.error('✗ .next/app-build-manifest.json yok — once: npm run build');
  process.exit(1);
}

const pages = Object.values(manifest.pages ?? {});
if (pages.length === 0) {
  console.error('✗ manifest bos — build yarim kalmis olabilir');
  process.exit(1);
}

// Her sayfada bulunan .js dosyalari = paylasilan paket
const shared = pages
  .reduce((acc, files) => acc.filter((f) => files.includes(f)), [...pages[0]])
  .filter((f) => f.endsWith('.js'));

const bytes = shared.reduce(
  (sum, f) => sum + gzipSync(readFileSync(path.join(webDir, '.next', f))).length,
  0,
);
const kB = Math.round(bytes / 100) / 10;

const budget = JSON.parse(readFileSync(budgetPath, 'utf8'));

if (process.argv.includes('--set')) {
  budget.sharedJsBytes = bytes;
  writeFileSync(budgetPath, `${JSON.stringify(budget, null, 2)}\n`);
  console.log(`✓ butce guncellendi: ${kB} kB (${bytes} bayt)`);
  process.exit(0);
}

const limit = budget.sharedJsBytes + budget.toleranceBytes;
const limitKB = Math.round(limit / 100) / 10;

console.log(`paylasilan JS: ${kB} kB (${shared.length} dosya) · butce ${limitKB} kB`);

if (bytes > limit) {
  const over = Math.round((bytes - budget.sharedJsBytes) / 100) / 10;
  console.error(
    `\n✗ PAYLASILAN JS BUTCEYI ASTI (+${over} kB).\n\n` +
    '  Bu sayi her sayfada, her ziyaretcide odenir. Once neyin eklendigine bak:\n' +
    "    npx turbo run build --filter=@havre/web --force  ve cikti tablosu\n\n" +
    '  Buyume BILEREK ise butceyi guncelle:\n' +
    '    node scripts/check-bundle-budget.mjs --set\n',
  );
  process.exit(1);
}
process.exit(0);
