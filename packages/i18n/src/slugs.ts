/**
 * HIZMET SLUG'LARI — iki dilde de cevrilir (yol haritasi §7.2).
 * Fransizca URL'de Ingilizce slug birakilmaz.
 *
 * Terminoloji stratejisi (§7.8): Quebec'te hem "pension pour chien" (yuksek hacim,
 * eski/kennel cagrisimi) hem "hebergement pour chien" (marka icin tercih edilir)
 * araniyor. Cozum: URL slug'i hacmi takip eder, H1 marka tonunu tasir.
 */
import type { ServiceType } from '@havre/core';
import type { Locale } from './locales.js';

export const SERVICE_SLUGS: Readonly<Record<ServiceType, Record<Locale, string>>> = {
  boarding:      { 'en-CA': 'dog-boarding',    'fr-CA': 'pension-pour-chien' },
  house_sitting: { 'en-CA': 'house-sitting',   'fr-CA': 'gardiennage-a-domicile' },
  drop_in:       { 'en-CA': 'drop-in-visits',  'fr-CA': 'visites-a-domicile' },
  dog_walking:   { 'en-CA': 'dog-walking',     'fr-CA': 'promenade-de-chien' },
  day_care:      { 'en-CA': 'doggy-day-care',  'fr-CA': 'garderie-pour-chien' },
  training:      { 'en-CA': 'dog-training',    'fr-CA': 'dressage-de-chien' },
  grooming:      { 'en-CA': 'pet-grooming',    'fr-CA': 'toilettage' },
};

const REVERSE: Record<Locale, Record<string, ServiceType>> = { 'en-CA': {}, 'fr-CA': {} };
for (const [service, byLocale] of Object.entries(SERVICE_SLUGS) as [ServiceType, Record<Locale, string>][]) {
  for (const [locale, slug] of Object.entries(byLocale) as [Locale, string][]) {
    REVERSE[locale][slug] = service;
  }
}

export function serviceSlug(service: ServiceType, locale: Locale): string {
  return SERVICE_SLUGS[service][locale];
}

export function serviceFromSlug(slug: string, locale: Locale): ServiceType | null {
  return REVERSE[locale][slug] ?? null;
}

/** Sehir slug'lari: aksanlar sadelestirilir ama FR'de yerel ad korunur (Montreal / montreal) */
export function normalizeSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
