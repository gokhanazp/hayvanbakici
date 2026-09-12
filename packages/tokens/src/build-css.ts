/**
 * tokens.css uretici.
 * Tek kaynak = TS token'lari. Ciktilar: dist/tokens.css
 *
 * Tema kurali (yol haritasi §4.2):
 *  - Acik palet bare :root'ta tanimlanir
 *  - Koyu palet hem prefers-color-scheme hem [data-theme="dark"] altinda
 *  - Hicbir renk SADECE media query icinde tanimlanmaz
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lightTheme, darkTheme } from './color.ts';
import { fontFamily, fontWeight, textStyles } from './typography.ts';
import { space, radius, shadow, motion, breakpoint, minTouchTarget } from './layout.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'dist');

const vars = (obj: Record<string, string | number>, prefix: string) =>
  Object.entries(obj)
    .map(([k, v]) => `  --${prefix}-${k.replace(/\./g, '_')}: ${v};`)
    .join('\n');

const textStyleBlocks = Object.entries(textStyles)
  .map(([name, s]) => {
    const kebab = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
    return `.text-${kebab} {
  font-family: var(--font-${s.family});
  font-size: ${s.size};
  line-height: ${s.line};
  letter-spacing: ${s.tracking};
  font-weight: ${s.weight};
}`;
  })
  .join('\n\n');

const css = `/* GENERATED — packages/tokens/src/build-css.ts. Elle duzenlemeyin. */

:root {
  color-scheme: light dark;

  /* --- Renk (acik tema) --- */
${vars(lightTheme, 'color')}

  /* --- Tipografi --- */
  --font-display: ${fontFamily.display};
  --font-ui: ${fontFamily.ui};
  --font-mono: ${fontFamily.mono};
${vars(fontWeight, 'weight')}

  /* --- Uzay --- */
${vars(space, 'space')}

  /* --- Kose yaricapi --- */
${vars(radius, 'radius')}

  /* --- Golge --- */
${vars(shadow, 'shadow')}

  /* --- Hareket --- */
${vars(motion.duration, 'duration')}
${vars(motion.easing, 'easing')}

  /* --- Kirilma noktalari (referans) --- */
${vars(breakpoint, 'bp')}

  /* --- Erisilebilirlik --- */
  --min-touch-target: ${minTouchTarget};
}

/* Koyu tema — sistem tercihi (acik tema acikca secilmediyse) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${vars(darkTheme, 'color')}
  }
}

/* Koyu tema — acik secim */
:root[data-theme="dark"] {
${vars(darkTheme, 'color')}
}

/* --- Tipografi yardimci siniflari --- */
${textStyleBlocks}

/* --- Hareket azaltma (WCAG 2.3.3) --- */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'tokens.css'), css, 'utf8');
console.log('tokens.css yazildi ->', join(outDir, 'tokens.css'));
