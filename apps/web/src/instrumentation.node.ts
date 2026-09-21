import * as Sentry from '@sentry/node';
import { scrubEvent, scrubUrl } from '@/lib/observability';

/**
 * SENTRY'NIN NODE TARAFI. Buraya YALNIZCA `SENTRY_DSN` varken ve
 * yalnizca `nodejs` calisma zamaninda giriliyor (bkz. instrumentation.ts).
 */

let started = false;

export async function start(): Promise<void> {
  if (started) return;
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    ...(process.env.SENTRY_RELEASE ? { release: process.env.SENTRY_RELEASE } : {}),

    /*
      Performans izleme KAPALI. Hata izlemek istiyoruz; her istegin izini
      tutmak hem kotayi hem gonderilen veriyi buyutur.
    */
    tracesSampleRate: 0,

    /*
      Bu iki satir guvenlik acisindan en onemlileri.

      sendDefaultPii: IP adresi, cerez ve baslik gondermeyi kapatir.

      includeLocalVariables: acik olsaydi yigin cercevelerindeki YEREL
      DEGISKENLER gonderilirdi — giris akisinda patlayan bir hata,
      kullanicinin ACIK METIN sifresini hata kaydina yazardi.
    */
    sendDefaultPii: false,
    includeLocalVariables: false,

    beforeSend: (event) => scrubEvent(event),
  });
  started = true;
}

/**
 * Next 15, istek sirasinda olusan her hatayi buraya veriyor: sunucu
 * bileseni, sunucu eylemi, rota isleyicisi, veri getirme.
 *
 * Etiket `routePath` KALIBI — ornegin `/[locale]/[city]/sitter/[slug]`.
 * Kalip gruplamaya yariyor; gercek adres ise kime ait oldugunu soyluyor.
 */
export async function report(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; routeType?: string },
): Promise<void> {
  if (!started) return;
  Sentry.captureException(error, {
    tags: {
      router: context.routerKind ?? 'unknown',
      route_type: context.routeType ?? 'unknown',
      route: context.routePath ?? 'unknown',
    },
    extra: {
      method: request.method ?? 'unknown',
      path: request.path ? scrubUrl(request.path) : 'unknown',
    },
  });
}
