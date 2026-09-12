/**
 * Diller — en-CA ve fr-CA.
 *
 * BILL 96 (yol haritasi §8.3): Fransizca "faz 2" degil, HUKUKI ZORUNLULUK.
 * Fransizca versiyon Ingilizce ile 1:1 olmali — icerik, sunum ve ISLEVSELLIK
 * bakimindan "en az esdeger kalitede". Ceza 3.000-30.000 CAD, tekrarda 3x.
 *
 * UYARI: Quebec Fransizcasi != Fransa Fransizcasi. Ceviri icin Quebec yerlisi
 * editor kullanilmali; makine cevirisi OQLF nezdinde risk.
 */

export const LOCALES = ['en-CA', 'fr-CA'] as const;
export type Locale = (typeof LOCALES)[number];

/** URL segmenti (yol haritasi §7.2: /en/... ve /fr/...) */
export const LOCALE_SEGMENTS = { 'en-CA': 'en', 'fr-CA': 'fr' } as const;
export type LocaleSegment = (typeof LOCALE_SEGMENTS)[Locale];

export const DEFAULT_LOCALE: Locale = 'en-CA';

const SEGMENT_TO_LOCALE: Record<string, Locale> = { en: 'en-CA', fr: 'fr-CA' };

export function localeFromSegment(segment: string): Locale | null {
  return SEGMENT_TO_LOCALE[segment] ?? null;
}

export function segmentFor(locale: Locale): LocaleSegment {
  return LOCALE_SEGMENTS[locale];
}

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

/**
 * Accept-Language basligindan dil onerisi.
 * DIKKAT: Otomatik YONLENDIRME YAPMAYIN (yol haritasi §7.2) — Googlebot cogunlukla
 * ABD IP'sinden gelir ve fr-CA sayfalari hic taranmaz. Sadece banner ile ONERIN.
 */
export function suggestLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const first = acceptLanguage.split(',')[0]?.trim().toLowerCase() ?? '';
  return first.startsWith('fr') ? 'fr-CA' : 'en-CA';
}
