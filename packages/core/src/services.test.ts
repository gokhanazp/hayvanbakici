import { describe, it, expect } from 'vitest';
import { primaryService, servicesForPhase, SERVICES } from './services.js';

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
