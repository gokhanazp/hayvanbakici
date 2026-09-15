import { describe, it, expect } from 'vitest';
import { parseFavCookie, serializeFavCookie, MAX_ANON_FAVOURITES } from './favourites';

/**
 * FAVORI CEREZI.
 *
 * Cerez KULLANICININ tarayicisindan geliyor: elle duzenlenmis, baska bir
 * siteden gelmis ya da bozulmus olabilir. Buradaki tek is, o dizeden
 * yalnizca kimlik gibi gorunen seyleri almak — cunku bu degerler
 * sonrasinda SQL sorgusuna parametre olarak giriyor.
 */
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

describe('favori cerezi ayristirma', () => {
  it('normal liste', () => {
    expect(parseFavCookie(`${A},${B}`)).toEqual([A, B]);
  });

  it('cerez yoksa bos', () => {
    expect(parseFavCookie(undefined)).toEqual([]);
    expect(parseFavCookie('')).toEqual([]);
  });

  it('BICIM DISI her sey atiliyor', () => {
    expect(parseFavCookie(`${A},not-a-uuid,,${B}`)).toEqual([A, B]);
    expect(parseFavCookie("'; DROP TABLE favourites; --")).toEqual([]);
    /* Rakam dizisi de kimlik degil */
    expect(parseFavCookie('12345')).toEqual([]);
  });

  it('bosluk ve BUYUK HARF kabul, ama tek bicime indiriliyor', () => {
    expect(parseFavCookie(` ${A.toUpperCase()} `)).toEqual([A]);
  });

  it('AYNI kimlik iki kez yazilmissa bir kez', () => {
    expect(parseFavCookie(`${A},${A},${B}`)).toEqual([A, B]);
  });

  it('TAVAN uygulaniyor — tasan cerez sessizce dusurulur, o yuzden tasmasin', () => {
    const many = Array.from(
      { length: MAX_ANON_FAVOURITES + 10 },
      (_, i) => `${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`,
    ).join(',');
    expect(parseFavCookie(many)).toHaveLength(MAX_ANON_FAVOURITES);
  });
});

describe('favori cerezi yazma', () => {
  it('yazip okumak ayni listeyi veriyor', () => {
    expect(parseFavCookie(serializeFavCookie([A, B]))).toEqual([A, B]);
  });

  it('yazarken de tavan var', () => {
    const many = Array.from({ length: 50 }, (_, i) =>
      `${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`);
    expect(serializeFavCookie(many).split(',')).toHaveLength(MAX_ANON_FAVOURITES);
  });

  it('bos liste bos dize', () => {
    expect(serializeFavCookie([])).toBe('');
  });
});
