import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from './color.js';

/**
 * KONTRAST TESTI.
 *
 * Palet degistiginde ilk kirilan sey okunurluk oluyor ve gozle fark
 * edilmiyor — ilk denemede soluk metin krem zeminde 2.95'te kalmisti,
 * ekranda "biraz acik" gorunuyordu, oysa AODA/WCAG 2.2 AA'nin altindaydi.
 * Bu test o hatayi bir daha gozle aramamak icin var.
 *
 * Ontario AODA, WCAG 2.2 AA'yi yasal zorunluluk haline getiriyor
 * (yol haritasi §8.7): normal metin 4.5:1, buyuk metin ve arayuz
 * bilesenleri 3:1.
 */

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

type Theme = typeof lightTheme;

/** [metin, zemin, en az, aciklama] */
const PAIRS: Array<[keyof Theme, keyof Theme, number, string]> = [
  ['ink', 'canvas', 4.5, 'govde metni'],
  ['ink', 'surface', 4.5, 'kart uzerinde metin'],
  ['ink-secondary', 'canvas', 4.5, 'ikincil metin'],
  ['ink-muted', 'canvas', 4.5, 'soluk metin (fiyat satirlari)'],
  ['ink-muted', 'surface', 4.5, 'kart uzerinde soluk metin'],
  ['primary-on', 'primary', 4.5, 'birincil dugme metni'],
  ['primary-active', 'primary-subtle', 4.5, 'veri seridi metni'],
  ['panel-ink', 'panel', 4.5, 'koyu panel metni'],
  ['panel-ink-muted', 'panel', 4.5, 'koyu panelde soluk metin'],
  ['danger-strong', 'danger-subtle', 4.5, 'hata kutusu'],
  ['success-strong', 'success-subtle', 4.5, 'basari kutusu'],
  ['info-strong', 'info-subtle', 4.5, 'bilgi kutusu'],
  ['warning-strong', 'warning-subtle', 4.5, 'uyari kutusu'],
  /*
    Beyaz yuzey uzerinde de okunmali: "cevap bekleniyor" satiri kartin
    kendi zemininde duruyor, uyari kutusunda degil.
  */
  ['warning-strong', 'surface', 4.5, 'beyaz kart uzerinde uyari metni'],
  ['tile-rose-ink', 'tile-rose', 4.5, 'pastel kutucuk — gul'],
  ['tile-sage-ink', 'tile-sage', 4.5, 'pastel kutucuk — adacayi'],
  ['tile-apricot-ink', 'tile-apricot', 4.5, 'pastel kutucuk — kayisi'],
  ['tile-peri-ink', 'tile-peri', 4.5, 'pastel kutucuk — peri'],
  /*
    RENKLI BANTLAR. Her bant dort ayri metin tonu tasiyor; biri bile
    4.5'in altina dusunce bant tonu degil, METIN tonu duzeltilir — bant
    rengi tasarim karari, kontrast degil.
  */
  ['ink', 'band-blush', 4.5, 'kahraman bandi — baslik'],
  ['ink-secondary', 'band-blush', 4.5, 'kahraman bandi — ikincil'],
  ['ink-muted', 'band-blush', 4.5, 'kahraman bandi — soluk'],
  ['primary', 'band-blush', 4.5, 'kahraman bandi — vurgu'],
  ['ink', 'band-apricot', 4.5, 'kayisi bandi — baslik'],
  ['ink-muted', 'band-apricot', 4.5, 'kayisi bandi — soluk'],
  ['ink', 'band-sage', 4.5, 'adacayi bandi — baslik'],
  ['ink-muted', 'band-sage', 4.5, 'adacayi bandi — soluk'],
  ['primary', 'band-sage', 4.5, 'adacayi bandi — vurgu'],
  ['accent-hover', 'accent-subtle', 4.5, 'adacayi rozet metni'],
  ['ink-muted', 'surface-sunken', 4.5, 'cokuk yuzeyde soluk metin'],
  // Arayuz bilesenleri ve buyuk metin: 3:1 yeterli
  ['primary', 'canvas', 3, 'baglanti / vurgu rengi'],
  ['border-strong', 'surface', 1.5, 'girdi cercevesi'],
];

describe.each([
  ['acik tema', lightTheme],
  ['koyu tema', darkTheme],
] as const)('%s kontrasti', (_name, theme) => {
  it.each(PAIRS)('%s / %s >= %s:1 (%s)', (fg, bg, min) => {
    const ratio = contrast(theme[fg], theme[bg]);
    expect(Number(ratio.toFixed(2))).toBeGreaterThanOrEqual(min);
  });
});

describe('palet butunlugu', () => {
  it('koyu tema acik temanin TUM anahtarlarini tasir', () => {
    const missing = Object.keys(lightTheme).filter((k) => !(k in darkTheme));
    expect(missing).toEqual([]);
  });

  it('her deger gecerli bir hex', () => {
    for (const theme of [lightTheme, darkTheme]) {
      for (const [key, value] of Object.entries(theme)) {
        expect(value, key).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});
