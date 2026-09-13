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
  transpilePackages: ['@havre/core', '@havre/i18n', '@havre/tokens', '@havre/auth'],
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
