/**
 * Tipografi — Fraunces (baslik) + Inter (arayuz).
 * DIKKAT: Fransizca metin Ingilizce'ye gore ~%15-20 daha uzundur.
 * Sabit genislikli buton/etiket kullanmayin; iki satira tasmayi her bilesen kaldirmali.
 */

export const fontFamily = {
  display: "'Fraunces Variable', 'Fraunces', Georgia, 'Times New Roman', serif",
  ui: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

/** [fontSize, lineHeight, letterSpacing, weight, family] */
export const textStyles = {
  display:  { size: '3rem',     line: '3.25rem', tracking: '-0.02em',  weight: 600, family: 'display' },
  h1:       { size: '2.25rem',  line: '2.625rem', tracking: '-0.015em', weight: 600, family: 'display' },
  h2:       { size: '1.75rem',  line: '2.125rem', tracking: '-0.01em',  weight: 600, family: 'display' },
  h3:       { size: '1.375rem', line: '1.75rem',  tracking: '0',        weight: 600, family: 'ui' },
  h4:       { size: '1.125rem', line: '1.625rem', tracking: '0',        weight: 600, family: 'ui' },
  bodyLg:   { size: '1.0625rem',line: '1.6875rem',tracking: '0',        weight: 400, family: 'ui' },
  body:     { size: '0.9375rem',line: '1.5rem',   tracking: '0',        weight: 400, family: 'ui' },
  bodySm:   { size: '0.8125rem',line: '1.25rem',  tracking: '0',        weight: 400, family: 'ui' },
  caption:  { size: '0.75rem',  line: '1rem',     tracking: '0.01em',   weight: 500, family: 'ui' },
} as const;

export type TextStyle = keyof typeof textStyles;
