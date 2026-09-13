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

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'CERTN_API_KEY / CERTN_WEBHOOK_SECRET tanimli degil. Uretimde sahte ' +
        'adli sicil saglayicisi kullanilamaz — "dogrulanmis bakici" iddiasi ' +
        'dayanaksiz kalirdi.',
    );
  }

  return new MockScreeningProvider(env.CERTN_WEBHOOK_SECRET ?? undefined);
}
