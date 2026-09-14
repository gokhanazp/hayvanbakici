/**
 * Tipografi — Bricolage Grotesque (baslik) + Schibsted Grotesk (arayuz).
 *
 * Karar gerekcesi (tasarim kanvasi, "C acik" yonu):
 * Fraunces ve Inter yaygin kullanildiklari icin premium konumlandirmayi zayiflatiyordu.
 * Bricolage'in karakterli, siki harf araligi markaya kimlik veriyor; Schibsted Grotesk
 * uzun listelerde ve Fransizca aksanlarda temiz kaliyor.
 *
 * DIKKAT: Fransizca metin Ingilizce'ye gore ~%15-20 daha uzundur.
 * Sabit genislikli buton/etiket kullanmayin; iki satira tasmayi her bilesen kaldirmali.
 */

/**
 * DIKKAT — `--font-ui` KENDI ICINDE var(--font-ui) CAGIRMAZ.
 *
 * Onceden soyleydi:  --font-ui: var(--font-ui), 'Helvetica Neue', ...
 * Bu bir DONGU. next/font ayni degiskeni <html> uzerinde tanimladigi icin
 * cogu sayfada kazara calisiyordu: hangi bildirimin sonra geldigine
 * bagliydi. Yonetici panelinde sira degisti, dongu olustu ve tarayici
 * bildirimi sessizce atti — butun panel Times New Roman'a dustu.
 *
 * Artik iki ayri ad var: next/font KAYNAK degiskeni (`--font-ui-src`)
 * yaziyor, token onu SARIYOR. Sira ne olursa olsun dongu yok. Bu ayrica
 * iki agacin farkli yazi tipi kullanmasini mumkun kiliyor: site
 * Schibsted, /admin Inter.
 */
export const fontFamily = {
  /** Baslik ve buyuk sayilar. Agirlik 600-800, siki tracking ile kullanilir. */
  display: "var(--font-display-src), 'Helvetica Neue', Arial, sans-serif",
  /** Tum arayuz metni. */
  ui: "var(--font-ui-src), 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace",
} as const;

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 800,
} as const;

/** Display stilleri siki tracking ister; gövde metni notr kalir. */
export const textStyles = {
  display:  { size: '3.125rem', line: '3.25rem',  tracking: '-0.038em', weight: 800, family: 'display' },
  h1:       { size: '2.25rem',  line: '2.5rem',   tracking: '-0.035em', weight: 800, family: 'display' },
  h2:       { size: '1.75rem',  line: '2.125rem', tracking: '-0.03em',  weight: 600, family: 'display' },
  h3:       { size: '1.5rem',   line: '1.875rem', tracking: '-0.03em',  weight: 600, family: 'display' },
  h4:       { size: '1.0625rem',line: '1.5rem',   tracking: '0',        weight: 600, family: 'ui' },
  bodyLg:   { size: '1.0625rem',line: '1.7rem',   tracking: '0',        weight: 400, family: 'ui' },
  body:     { size: '0.9375rem',line: '1.45rem',  tracking: '0',        weight: 400, family: 'ui' },
  bodySm:   { size: '0.8125rem',line: '1.25rem',  tracking: '0',        weight: 400, family: 'ui' },
  caption:  { size: '0.75rem',  line: '1rem',     tracking: '0.01em',   weight: 500, family: 'ui' },
  /** Buyuk para/istatistik rakamlari — display ailesi, tabular */
  numeral:  { size: '2.125rem', line: '2.125rem', tracking: '-0.03em',  weight: 600, family: 'display' },
} as const;

export type TextStyle = keyof typeof textStyles;

/** next/font ile yuklenecek aileler — apps/web/src/app/[locale]/layout.tsx */
export const FONT_SOURCES = {
  display: { family: 'Bricolage Grotesque', weights: [400, 600, 800] },
  ui: { family: 'Schibsted Grotesk', weights: [400, 500, 600] },
} as const;
