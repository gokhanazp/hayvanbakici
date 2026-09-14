import { describe, it, expect } from 'vitest';
import { postalRegion } from './postal.js';

describe('postalRegion', () => {
  it('M ile baslayan kod Toronto', () => {
    expect(postalRegion('M4M 1A1')).toEqual({ fsa: 'M4M', province: 'ON', citySlug: 'toronto' });
  });

  it('H ile baslayan kod Montreal', () => {
    expect(postalRegion('h2t 1r6')).toEqual({ fsa: 'H2T', province: 'QC', citySlug: 'montreal' });
  });

  it('bosluksuz ve kucuk harf kabul edilir', () => {
    expect(postalRegion('m5v3l9')?.fsa).toBe('M5V');
  });

  it('yalnizca FSA de kabul edilir', () => {
    expect(postalRegion('V6B')).toEqual({ fsa: 'V6B', province: 'BC' });
  });

  it('sehir belirsizse citySlug YOK — tahmin uretmiyoruz', () => {
    const r = postalRegion('L4W 5N6');
    expect(r?.province).toBe('ON');
    expect(r && 'citySlug' in r).toBe(false);
  });

  it('gecersiz harfler reddedilir (D, F, I, O, Q, U, W, Z bas harf olamaz)', () => {
    for (const bad of ['D1A 1A1', 'F2B 2B2', 'I3C 3C3', 'O4D 4D4', 'Q5E 5E5', 'U6F 6F6', 'W7G 7G7', 'Z8H 8H8']) {
      expect(postalRegion(bad), bad).toBeNull();
    }
  });

  it('posta kodu olmayan metin null doner', () => {
    for (const v of ['Leslieville', 'Toronto', '', '12345', 'M4', 'M4M 1A']) {
      expect(postalRegion(v), v).toBeNull();
    }
  });

  it('ABD posta kodu Kanada kodu sanilmaz', () => {
    expect(postalRegion('90210')).toBeNull();
  });
});
