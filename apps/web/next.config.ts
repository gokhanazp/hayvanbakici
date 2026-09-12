import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // canonical URL'lerimiz sonu slash'li: sunucu da ayni davranmali,
  // aksi halde canonical bir 308'e isaret eder (SEO hatasi)
  trailingSlash: true,
  // Core Web Vitals hedefleri (yol haritasi §7): LCP <2,0s · INP <150ms · CLS <0,05
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  transpilePackages: ['@havre/core', '@havre/i18n', '@havre/tokens'],
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
