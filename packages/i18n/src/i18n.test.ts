import { describe, it, expect } from 'vitest';
import {
  findMissingKeys, getMessages, interpolate, localeFromSegment,
  segmentFor, suggestLocale, serviceSlug, serviceFromSlug, normalizeSlug,
} from './index.js';

describe('Bill 96 butunluk kontrolu', () => {
  it('FR katalogu EN katalogunun alt kumesi OLAMAZ — eksik anahtar yok', () => {
    expect(findMissingKeys()).toEqual([]);
  });
});

describe('locales', () => {
  it('segment <-> locale eslemesi', () => {
    expect(localeFromSegment('fr')).toBe('fr-CA');
    expect(localeFromSegment('de')).toBeNull();
    expect(segmentFor('fr-CA')).toBe('fr');
  });

  it('Accept-Language yalnizca ONERI uretir', () => {
    expect(suggestLocale('fr-CA,fr;q=0.9')).toBe('fr-CA');
    expect(suggestLocale('en-US,en;q=0.9')).toBe('en-CA');
    expect(suggestLocale(null)).toBe('en-CA');
  });
});

describe('slugs', () => {
  it('hizmet slug-lari iki dilde de cevrilir', () => {
    expect(serviceSlug('boarding', 'en-CA')).toBe('dog-boarding');
    expect(serviceSlug('boarding', 'fr-CA')).toBe('pension-pour-chien');
  });

  it('slug -> hizmet ters cozumu dil bazlidir', () => {
    expect(serviceFromSlug('pension-pour-chien', 'fr-CA')).toBe('boarding');
    expect(serviceFromSlug('pension-pour-chien', 'en-CA')).toBeNull();
  });

  it('sehir slug-lari aksansizlastirilir', () => {
    expect(normalizeSlug('Montréal')).toBe('montreal');
    expect(normalizeSlug('Québec City')).toBe('quebec-city');
  });
});

describe('interpolate', () => {
  it('degiskenleri yerlestirir', () => {
    const m = getMessages('en-CA');
    expect(interpolate(m.home.trustStripSitters, { count: 247, city: 'Toronto' }))
      .toBe('247 verified sitters in Toronto');
  });
  it('bilinmeyen anahtari oldugu gibi birakir', () => {
    expect(interpolate('Hi {name}', {})).toBe('Hi {name}');
  });
});
