import { describe, it, expect } from 'vitest';
import { getDb } from '../client.js';
import { resolvePlace } from './place.js';

/**
 * YER COZUMLEME — gercek veritabanina karsi.
 *
 * Sahte veriyle test etmek anlamsiz: dogrulanan sey PostGIS merkez
 * noktalarinin okunmasi, aksan sadelestirmesinin Postgres'te calismasi ve
 * posta kodu geri dususunun gercek sehir tablosunu kullanmasi.
 *
 * Tohum veri gerektirir (npm run db:seed).
 */
const db = getDb();

describe('resolvePlace', () => {
  it('sehir adini bulur', async () => {
    const r = await resolvePlace(db, 'Toronto', 'en-CA');
    expect(r?.kind).toBe('city');
    expect(r?.citySlugEn).toBe('toronto');
    expect(r?.approximate).toBe(false);
  });

  it('aksansiz yazim aksanli adi bulur (Montreal -> Montréal)', async () => {
    const r = await resolvePlace(db, 'Montreal', 'fr-CA');
    expect(r?.citySlugEn).toBe('montreal');
  });

  it('mahalle adi sehirden ONCE gelir ve kesindir', async () => {
    const r = await resolvePlace(db, 'Leslieville', 'en-CA');
    expect(r?.kind).toBe('neighbourhood');
    expect(r?.label).toContain('Toronto');
    expect(r?.approximate).toBe(false);
  });

  it('M ile baslayan posta kodu Toronto cevresi — YAKLASIK isaretli', async () => {
    const r = await resolvePlace(db, 'M4M 1A1', 'en-CA');
    expect(r?.kind).toBe('postal');
    expect(r?.citySlugEn).toBe('toronto');
    expect(r?.approximate).toBe(true);
  });

  it('H ile baslayan posta kodu Montreal', async () => {
    const r = await resolvePlace(db, 'H2T1R6', 'fr-CA');
    expect(r?.citySlugEn).toBe('montreal');
  });

  it('ilde birden fazla sehir varsa en guclusune duser', async () => {
    // L = Ontario, belirli bir sehir degil
    const r = await resolvePlace(db, 'L4W 5N6', 'en-CA');
    expect(r?.kind).toBe('postal');
    expect(r?.cityNameEn).toBeTruthy();
  });

  it('taninmayan metin null doner — tahmin uretmez', async () => {
    expect(await resolvePlace(db, 'Ankara', 'en-CA')).toBeNull();
    expect(await resolvePlace(db, 'zzzz', 'en-CA')).toBeNull();
  });

  it('SQL enjeksiyonu denemesi zarar vermez', async () => {
    const evil = "Toronto'; DROP TABLE cities; --";
    expect(await resolvePlace(db, evil, 'en-CA')).toBeNull();
    // tablo hala yerinde
    expect((await resolvePlace(db, 'Toronto', 'en-CA'))?.citySlugEn).toBe('toronto');
  });

  it('dolar tirnagi da sorguyu kirmaz', async () => {
    const evil = '$q$ OR 1=1 --';
    expect(await resolvePlace(db, evil, 'en-CA')).toBeNull();
  });
});

describe('resolvePlace — kismi eslesme', () => {
  it('kisaltilmis mahalle adi bulunur (Plateau -> Le Plateau-Mont-Royal)', async () => {
    const r = await resolvePlace(db, 'Plateau', 'fr-CA');
    expect(r?.kind).toBe('neighbourhood');
    expect(r?.citySlugEn).toBe('montreal');
  });

  it('birebir eslesme kismi eslesmeden ONCE gelir', async () => {
    const r = await resolvePlace(db, 'Mile End', 'en-CA');
    expect(r?.label.startsWith('Mile End')).toBe(true);
  });

  it('LIKE jokerleri desen olarak calismaz', async () => {
    // "%" tek basina her kaydi getirmemeli
    expect(await resolvePlace(db, '%', 'en-CA')).toBeNull();
    expect(await resolvePlace(db, '%%%', 'en-CA')).toBeNull();
    expect(await resolvePlace(db, '_____', 'en-CA')).toBeNull();
  });
});
