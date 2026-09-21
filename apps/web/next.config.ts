import path from 'node:path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

/**
 * Monorepo kokundeki .env'i yukle.
 * Next varsayilan olarak YALNIZCA uygulama dizinindeki .env'i okur; monorepo'da
 * DATABASE_URL kokte durdugu icin build ve dev onu goremiyordu (turbo ayrica
 * bildirilmemis ortam degiskenlerini goreve gecirmez — bkz. turbo.json env).
 */
loadEnvConfig(path.resolve(process.cwd(), '../..'));

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // canonical URL'lerimiz sonu slash'li: sunucu da ayni davranmali,
  // aksi halde canonical bir 308'e isaret eder (SEO hatasi)
  trailingSlash: true,
  /*
    Otomatik slash yonlendirmesini KAPATIYORUZ ve isi middleware'e aliyoruz.
    Sebep olculdu: trailingSlash:true, /api/auth/sign-in/email istegini de
    308 ile /api/auth/sign-in/email/ adresine yonlendiriyordu. Her kimlik
    cagrisi iki tura cikiyor ve bazi istemciler yonlendirmede govdeyi ya da
    basliklari dusuruyor. Middleware yalnizca SAYFA yollarini yonlendiriyor,
    /api dokunulmadan geciyor.
  */
  skipTrailingSlashRedirect: true,
  // Core Web Vitals hedefleri (yol haritasi §7): LCP <2,0s · INP <150ms · CLS <0,05
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  /*
    @sentry/node PAKETLENMIYOR, CALISMA ANINDA YUKLENIYOR.

    Sentry Node SDK, otomatik enstrumentasyon icin `require-in-the-middle`
    ve `import-in-the-middle` kullaniyor; bunlar `node:child_process` gibi
    yalnizca Node'da olan seyleri istiyor. Webpack `instrumentation.ts`'i
    KENAR (edge) calisma zamani icin de derledigi icin, dinamik `import()`
    bile olsa paketlemeye calisiyor ve derleme "Can't resolve 'path'" ile
    kiriliyor. Bu liste onlari harici birakiyor: sunucuda `require` ile
    okunuyorlar, paketin icine girmiyorlar.
  */
  serverExternalPackages: ['@sentry/node', 'import-in-the-middle', 'require-in-the-middle'],
  /*
    ...ve KENAR ile TARAYICI derlemesinde paket HIC COZULMUYOR.

    `instrumentation.ts` Next tarafindan her calisma zamani icin
    derleniyor. Kodun icinde `NEXT_RUNTIME !== 'nodejs'` ise cikan bir
    kosul var ama webpack bunu calismadan bilemez ve dosyayi yine de
    cozmeye calisir — kenar derlemesinde `node:child_process` cikinca
    derleme kiriliyor. Burada paketi yalnizca o derlemelerde bos module
    esliyoruz; node tarafinda dokunulmuyor.
  */
  webpack: (config: { resolve?: { alias?: Record<string, unknown> } }, { nextRuntime }: { nextRuntime?: string }) => {
    if (nextRuntime !== 'nodejs') {
      config.resolve ??= {};
      config.resolve.alias = { ...(config.resolve.alias ?? {}), '@sentry/node': false };
    }
    return config;
  },
  transpilePackages: ['@havre/core', '@havre/i18n', '@havre/tokens', '@havre/auth', '@havre/screening'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Law 25 / PIPEDA: gereksiz tarayici API erisimi kapali
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=(self)' },
        ],
      },
    ];
  },
};

export default config;
