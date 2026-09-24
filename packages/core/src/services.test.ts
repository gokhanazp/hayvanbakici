import { describe, it, expect } from 'vitest';
import { primaryService, servicesForPhase, petSizeForKg, normalizePetSizes, SERVICES } from './services.js';

/*
  VITRIN HIZMETI.

  "En ucuz" varsayimi liste sayfasiyla profil arasinda beklenti
  kirilmasina yol aciyordu: listede "konaklama 62 $" gorup profile
  giren kisi 31 $ (gezdirme) goruyordu. Sira artik fiyata degil
  hizmet agirligina bagli ve belirlenimci.
*/
describe('primaryService', () => {
  it('konaklama her zaman one cikar — fiyat farketmez', () => {
    const offered = [
      { serviceType: 'dog_walking' as const, priceCents: 3100 },
      { serviceType: 'boarding' as const, priceCents: 4000 },
    ];
    expect(primaryService(offered)?.serviceType).toBe('boarding');
  });

  it('konaklama yoksa sira SERVICE_TYPES sirasini izler', () => {
    const offered = [
      { serviceType: 'dog_walking' as const },
      { serviceType: 'drop_in' as const },
      { serviceType: 'house_sitting' as const },
    ];
    expect(primaryService(offered)?.serviceType).toBe('house_sitting');
  });

  it('girdi sirasi sonucu DEGISTIRMEZ', () => {
    const a = [{ serviceType: 'boarding' as const }, { serviceType: 'drop_in' as const }];
    const b = [{ serviceType: 'drop_in' as const }, { serviceType: 'boarding' as const }];
    expect(primaryService(a)?.serviceType).toBe(primaryService(b)?.serviceType);
  });

  it('tek hizmette onu dondurur, bos listede undefined', () => {
    expect(primaryService([{ serviceType: 'drop_in' as const }])?.serviceType).toBe('drop_in');
    expect(primaryService([])).toBeUndefined();
  });

  it('v1 listesindeki her hizmetin birimi tanimli', () => {
    for (const s of servicesForPhase('v1')) expect(SERVICES[s].unit).toBeTruthy();
  });
});

describe('petSizeForKg', () => {
  it('kiloyu dogru kademeye koyar', () => {
    expect(petSizeForKg(3)).toBe('small');
    expect(petSizeForKg(12)).toBe('medium');
    expect(petSizeForKg(30)).toBe('large');
    expect(petSizeForKg(60)).toBe('giant');
  });

  it('kademe siniri ALT kademeye ait', () => {
    // 7 kiloluk bir kopek "kucuk". Sinirin iki kademeye birden ait
    // olmasi, aramada ayni kopegi iki farkli kumede aratirdi.
    expect(petSizeForKg(7)).toBe('small');
    expect(petSizeForKg(18)).toBe('medium');
    expect(petSizeForKg(45)).toBe('large');
  });

  it('en ust kademenin ustu yine dev', () => {
    // 100 kg tablodaki ust sinir ama bundan agir bir hayvan da
    // aramayi bosa dusurmemeli: kademesiz kalirsa hicbir bakiciyla
    // eslesmezdi.
    expect(petSizeForKg(120)).toBe('giant');
  });
});

describe('normalizePetSizes', () => {
  it('HER ZAMAN kademe sirasinda donuyor', () => {
    // Form verisi kutucuklarin tiklanma sirasiyla geliyor; profildeki
    // siluet listesi buyukten kucuge kaymasin diye sira burada
    // sabitleniyor.
    expect(normalizePetSizes(['giant', 'small'])).toEqual(['small', 'giant']);
  });

  it('kesintisiz olmayan kume KORUNUYOR', () => {
    // Asil mesele bu: kendi iri kopegi olan bakici "buyuk alirim ama
    // uc kiloluk yavru alamam" diyebiliyor. Eski tavan modeli bu
    // cevabi kuramiyordu.
    expect(normalizePetSizes(['medium', 'giant'])).toEqual(['medium', 'giant']);
  });

  it('tanimsiz anahtar ve tekrar atiliyor', () => {
    expect(normalizePetSizes(['small', 'small', 'huge'])).toEqual(['small']);
  });

  it('bos ve tanimsiz girdi bos dizi', () => {
    expect(normalizePetSizes([])).toEqual([]);
    expect(normalizePetSizes(null)).toEqual([]);
  });
});
