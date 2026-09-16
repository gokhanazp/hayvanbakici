import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lightTheme } from './color.js';
import { space, radius, shadow, motion, breakpoint } from './layout.js';
import { fontFamily } from './typography.js';

/**
 * TANIMSIZ TOKEN AVCISI.
 *
 * NEDEN VAR: `padding-block: var(--space-14)` yazildi, --space-14 diye bir
 * token YOKTU ve tarayici o bildirimi sessizce ATTI. Sonuc: butun
 * bolumlerin dikey bosluğu sifir, sayfa "yazilar birbirine girmis" gorundu
 * ve hata konsola dusmedi, derlemeyi kirmadi, testten gecti.
 *
 * Tipografi hatalari (--color-primry) ayni sekilde sessizdir. Bu test,
 * uygulamanin CSS ve JSX'inde gecen HER var(--...) adini token sozlugune
 * karsi dogruluyor.
 *
 * Test tokens paketinde duruyor cunku sozlugun sahibi bu paket; uygulama
 * kaynagini okumasi bilincli bir istisna.
 */

const here = dirname(fileURLToPath(import.meta.url));
const APP_SRC = join(here, '..', '..', '..', 'apps', 'web', 'src');

/** Token uretiminde kullanilan on ek -> anahtar kumesi */
const KNOWN = new Set<string>([
  ...Object.keys(lightTheme).map((k) => `color-${k}`),
  ...Object.keys(space).map((k) => `space-${k.replace('.', '_')}`),
  ...Object.keys(radius).map((k) => `radius-${k}`),
  ...Object.keys(shadow).map(
    (k) => `shadow-${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`,
  ),
  ...Object.keys(motion.duration).map((k) => `duration-${k}`),
  ...Object.keys(motion.easing).map((k) => `easing-${k}`),
  ...Object.keys(fontFamily).map((k) => `font-${k}`),
  ...Object.keys(breakpoint).map((k) => `bp-${k}`),
  // build-css.ts ayrica bunu yaziyor
  'min-touch-target',
]);

/**
 * globals.css icinde tanimlanan yerel degiskenler de gecerli sayilir.
 * Bildirim satir basinda olmak zorunda degil (`:root { --section-y: ... }`
 * tek satirdir), bu yuzden `{` ve `;` sonrasi da taraniyor.
 */
function locallyDefined(css: string): Set<string> {
  const out = new Set<string>();
  for (const m of css.matchAll(/(?:^|[{;])\s*--([a-z0-9-]+)\s*:/gim)) {
    out.add(m[1]!);
  }
  return out;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (/\.(css|tsx|ts)$/.test(name)) acc.push(full);
  }
  return acc;
}

describe('CSS degisken sozlugu', () => {
  const files = walk(APP_SRC);
  const globals = files.find((f) => f.endsWith('globals.css'));
  const local = globals ? locallyDefined(readFileSync(globals, 'utf8')) : new Set<string>();

  it('uygulama kaynagini bulabiliyor', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('var(--...) ile cagrilan her token TANIMLI', () => {
    const unknown: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const m of text.matchAll(/var\(\s*--([a-z0-9_-]+)\s*[,)]/gi)) {
        const name = m[1]!;
        if (!KNOWN.has(name) && !local.has(name)) {
          unknown.push(`${name}  (${file.slice(APP_SRC.length + 1)})`);
        }
      }
    }
    expect([...new Set(unknown)]).toEqual([]);
  });
});
