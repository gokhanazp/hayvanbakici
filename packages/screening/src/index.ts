import { isDemoEnv } from '@havre/core';
import { CertnScreeningProvider } from './certn.js';
import { MockScreeningProvider } from './mock.js';
import type { ScreeningProvider } from './types.js';

export * from './types.js';
export * from './decision.js';
export { MockScreeningProvider } from './mock.js';
export { CertnScreeningProvider } from './certn.js';

/**
 * Saglayici secimi TEK YERDE.
 *
 * Certn anahtari varsa gercek saglayici, yoksa sahte. Uretimde anahtar
 * yoksa ACILISTA hata: sahte saglayici ile canliya cikmak, "adli sicil
 * kontrolu yapilmis" demek olur ki bu Competition Act anlaminda
 * dogrulanamaz bir iddiadir ve urunun temel guven vaadidir.
 */
export function createScreeningProvider(
  env: NodeJS.ProcessEnv = process.env,
): ScreeningProvider {
  const key = env.CERTN_API_KEY;
  const secret = env.CERTN_WEBHOOK_SECRET;

  if (key && secret) return new CertnScreeningProvider(key, secret);

  /*
    TEK ISTISNA: DEMO YAYINI.

    Kural degismedi — sahte saglayiciyla GERCEK bir siteye cikilamaz.
    Ama demo yayininda site zaten her sayfanin tepesinde "buradaki
    bakicilar, yorumlar ve rezervasyonlar uydurma" diyor ve arama
    motorlarina tamamen kapali. Orada "dogrulanmis bakici" rozetinin
    kimseyi yaniltma ihtimali yok; iddia zaten uydurma veriye ait.

    Bayrak paylasilan tek tanimdan geliyor (@havre/core): uyari seridi
    ile bu izin AYNI anahtara bagli. Ayri iki tanim olsaydi en kotu
    bileşim mumkun olurdu — seridi olmayan ama sahte dogrulama yapan
    bir site.
  */
  if (env.NODE_ENV === 'production' && !isDemoEnv(env)) {
    throw new Error(
      'CERTN_API_KEY / CERTN_WEBHOOK_SECRET tanimli degil. Uretimde sahte ' +
        'adli sicil saglayicisi kullanilamaz — "dogrulanmis bakici" iddiasi ' +
        'dayanaksiz kalirdi. (Demo yayini icin: DEMO_MODE=1)',
    );
  }

  return new MockScreeningProvider(env.CERTN_WEBHOOK_SECRET ?? undefined);
}
