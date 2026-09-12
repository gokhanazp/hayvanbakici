import { enCA } from './messages/en-CA.js';
import { frCA } from './messages/fr-CA.js';
import type { Locale } from './locales.js';

export * from './locales.js';
export * from './slugs.js';

export type Messages = typeof enCA;

const CATALOGS: Record<Locale, Messages> = {
  'en-CA': enCA,
  'fr-CA': frCA as unknown as Messages,
};

export function getMessages(locale: Locale): Messages {
  return CATALOGS[locale];
}

/** Basit interpolasyon: "{count} sitters" + { count: 12 } */
export function interpolate(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * Katalog butunlugu kontrolu — Bill 96 icin kritik.
 * FR katalogunda eksik anahtar varsa CI kirilmalidir; Fransizca versiyon
 * Ingilizce'nin ALT KUMESI OLAMAZ.
 */
export function findMissingKeys(): string[] {
  const missing: string[] = [];
  const walk = (en: unknown, fr: unknown, path: string): void => {
    if (typeof en !== 'object' || en === null) return;
    for (const key of Object.keys(en as Record<string, unknown>)) {
      const nextPath = path ? `${path}.${key}` : key;
      const frValue = (fr as Record<string, unknown> | null)?.[key];
      if (frValue === undefined) {
        missing.push(nextPath);
        continue;
      }
      walk((en as Record<string, unknown>)[key], frValue, nextPath);
    }
  };
  walk(enCA, frCA, '');
  return missing;
}
