import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import localFont from 'next/font/local';
import { getMessages, localeFromSegment, LOCALES, segmentFor } from '@havre/i18n';
import { Header } from '@/components/Header';
import { DemoNotice } from '@/components/DemoNotice';
import { isDemo } from '@/lib/demo';
import { Footer } from '@/components/Footer';
import { ChatDock } from '@/components/chat/ChatDock';
import { citySlug, getDefaultCity, getLinkableCities } from '@/lib/data';
import { organizationJsonLd, SITE_URL } from '@/lib/seo';

/**
 * Fontlar npm'den (@fontsource-variable) gelir ve next/font/local ile self-host edilir.
 *
 * Font dosyalari REPOYA GOMULU (apps/web/src/app/fonts/) — node_modules'tan
 * okunmuyor. Gerekce: next/font/local, src'yi uygulama sinirinin disina cikararak
 * cozmuyor (next build gecse bile next dev "Module not found" veriyor) ve goreli
 * yol npm'in hoisting kararina bagli olurdu. Kaynak/surum/lisans: fonts/README.md
 *
 * Neden next/font/google DEGIL: o, fontlari BUILD SIRASINDA Google'dan indirir.
 * Dis aga cikisi kisitli bir CI'da build kirilir (bu projede bizzat yasandi).
 * Vendor'lamak build'i deterministik yapar, ayrica:
 *  - LCP: harici baglanti yok, font preload edilir
 *  - Law 25: Google'a sinir otesi istek gitmez, PIA gerekmez
 *
 * Degisken (variable) fontlar: tek dosya tum agirliklari tasir.
 * Alt kume 'latin' — Fransizca aksanlar Latin-1 Supplement'te, yani kapsam icinde.
 * Turkce icin (Faz 7) 'latin-ext' dosyasi ayrica eklenecek.
 */
/*
  TEK AILE, IKI DEGISKEN.

  Tasarim her kademede Plus Jakarta Sans kullaniyor ve farki agirlikla
  kuruyor. Iki ayri aile yerine tek aile: ~46 kB daha az font indirmesi
  ve basliklarla govdenin birbirine oturmasi.

  Iki CSS degiskeni KALDI (--font-display-src / --font-ui-src) cunku
  token katmani ve tum CSS onlarin uzerinden yaziyor; ikisi de ayni
  dosyayi gosteriyor, next/font dosyayi bir kez yukluyor.
*/
const display = localFont({
  src: '../fonts/plus-jakarta-sans-latin-wght-normal.woff2',
  variable: '--font-display-src',
  display: 'swap',
  weight: '200 800',
});

const ui = localFont({
  src: '../fonts/plus-jakarta-sans-latin-wght-normal.woff2',
  variable: '--font-ui-src',
  display: 'swap',
  weight: '200 800',
});

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: segmentFor(l) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const m = getMessages(locale);

  return {
    metadataBase: new URL(SITE_URL),
    // Demo yayini: her sayfa noindex. robots.txt'e ek olarak, cunku
    // dogrudan baglanti verilen bir sayfa robots.txt'ten bagimsiz
    // indekslenebiliyor.
    ...(isDemo() ? { robots: { index: false, follow: false } } : {}),
    title: { default: `${m.brand.name} — ${m.brand.tagline}`, template: `%s · ${m.brand.name}` },
    description: m.home.heroSubtitle,
    openGraph: { siteName: m.brand.name, locale, type: 'website' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const [city, linkableCities] = await Promise.all([getDefaultCity(), getLinkableCities()]);

  return (
    <html lang={locale} className={`${display.variable} ${ui.variable}`}>
      <body>
        {/* WCAG 2.4.1 — icerige atlama baglantisi */}
        <a href="#main" className="sr-only">Skip to content</a>
        {isDemo() && <DemoNotice locale={locale} />}
        <Header locale={locale} citySlug={citySlug(city, locale)} />
        <main id="main">{children}</main>
        <Footer locale={locale} cities={linkableCities} />
        {/*
          Sohbet balonu: giris yapmis kullaniciya her sayfada sag altta
          duruyor. Istemci bileseni — oturumu sunucuda okumak tum
          sayfalari dinamik yapar ve ISR biterdi (bkz. HeaderAccount).
          Oturum yoksa hicbir sey cizmiyor.
        */}
        <ChatDock locale={locale} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </body>
    </html>
  );
}
