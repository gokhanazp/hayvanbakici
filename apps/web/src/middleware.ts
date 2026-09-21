import { NextResponse, type NextRequest } from 'next/server';
import { LOCALES, segmentFor } from '@havre/i18n';
import { adminGate, clientIp, isAdminPath } from '@/lib/admin-gate';

/** 'en' | 'fr' — dil segmentleri, i18n paketinden tureniyor. */
const LOCALE_SEGMENTS: ReadonlySet<string> = new Set<string>(LOCALES.map(segmentFor));

/**
 * SAYFA YOLLARINDA SONDAKI SLASH.
 *
 * Canonical URL'lerimiz ve sitemap girdilerimiz slash ile bitiyor; ayni
 * icerigin iki adresten servis edilmesi yinelenen icerik sorunudur. Next'in
 * kendi yonlendirmesi bunu yapardi ama /api'yi de yonlendiriyordu (bkz.
 * next.config.ts). Bu yuzden kural burada ve YALNIZCA sayfalara uygulaniyor.
 */
/**
 * ISTENEN YOLU SUNUCU BILESENLERINE TASIYAN BASLIK.
 *
 * Next, sunucu bilesenlerine "hangi adres istendi" bilgisini vermiyor.
 * Yonetici korumasinin buna ihtiyaci var: giris ekranina yonlendirirken
 * kisinin NEREYE gitmek istedigini bilmezsek, girisden sonra herkesi
 * gosterge paneline atariz ve tikladigi baglanti kaybolur.
 */
export const PATH_HEADER = 'x-havre-path';

function withPath(req: NextRequest): Headers {
  const headers = new Headers(req.headers);
  headers.set(PATH_HEADER, req.nextUrl.pathname + req.nextUrl.search);
  return headers;
}

function pass(req: NextRequest) {
  return NextResponse.next({ request: { headers: withPath(req) } });
}

/**
 * DILI OLMAYAN ADRESLER — MARKASIZ 404'UN SON DELIGI.
 *
 * /rastgele/ gibi bir adresin ilk dilimi bir dil degil. Boyle bir istek
 * `[locale]` agacina hic girmiyor, Next kok sinira dusuyor ve orada
 * markasiz, tek dilli varsayilan ekran ciziliyor.
 *
 * YONLENDIRME DEGIL, YENIDEN YAZMA: adres cubugunda /rastgele/ kaliyor
 * (kullaniciyi olmayan bir adrese tasimak kafa karistirici olurdu ve
 * arama motoruna yanlis sinyal gonderirdi) ama istek /en/rastgele/
 * olarak isleniyor: yakala-hepsini rotasi `notFound()` atiyor ve markali
 * 404 Ingilizce ciziliyor. Durum kodu yine 404.
 *
 * Dil TAHMIN EDILMIYOR: IP'ye gore otomatik yonlendirme yol haritasinda
 * acikca reddedildi (§7.2). Varsayilan Ingilizce, sayfada da dil secimi
 * var.
 */
const RESERVED = new Set(['admin', 'api', 'media', '_next', 'actions']);

function hasKnownLocale(pathname: string): boolean {
  const first = pathname.split('/').filter(Boolean)[0] ?? '';
  return LOCALE_SEGMENTS.has(first) || RESERVED.has(first);
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  /*
    YONETICI KAPISI — OTURUM KONTROLUNDEN ONCE.

    Kurallar ve gerekceleri lib/admin-gate.ts icinde. Burada onemli olan
    iki sey:

    1. Kapi ISTEK SUNUCUYA GIRER GIRMEZ calisiyor. Oturum kontrolu
       sayfanin icinde, yani kapiyi gecemeyen istek veritabanina hic
       dokunmuyor.
    2. Reddedilen istek 403 degil 404 aliyor ve /admin'in var oldugunu
       ele vermeyen MARKALI 404 sayfasi ciziliyor: yakala-hepsini
       rotasina yeniden yaziliyor, adres cubugunda /admin kaliyor,
       durum kodu 404.
  */
  if (isAdminPath(pathname)) {
    const gate = adminGate({
      ip: clientIp(req.headers),
      allowlist: process.env.ADMIN_IP_ALLOWLIST,
      allowAny: process.env.ADMIN_ALLOW_ANY_IP,
      isProduction: process.env.NODE_ENV === 'production',
    });
    if (!gate.ok) {
      const url = new URL(req.url);
      url.pathname = '/en/not-found/';
      url.search = '';
      return NextResponse.rewrite(url, { request: { headers: withPath(req) } });
    }
  }

  if (pathname === '/' || pathname.endsWith('/')) {
    if (pathname !== '/' && !hasKnownLocale(pathname)) {
      const url = new URL(req.url);
      url.pathname = `/en${pathname}`;
      return NextResponse.rewrite(url, { request: { headers: withPath(req) } });
    }
    return pass(req);
  }

  // Dosya uzantisi olan istekler (robots.txt, sitemap.xml, .png) slash almaz.
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return pass(req);

  /*
    DIKKAT — req.nextUrl.clone() BURADA KULLANILAMAZ.
    skipTrailingSlashRedirect acikken Next, nextUrl'i serilestirirken sondaki
    slash'i tekrar kiripiyor; sonuc ayni adrese 308 veren SONSUZ DONGU oluyor
    (bizzat yasandi). req.url'den kurulan duz bir URL bu normallestirmeye
    tabi degil.
  */
  const url = new URL(req.url);
  url.pathname = `${pathname}/`;
  url.search = search;
  return NextResponse.redirect(url, 308);
}

export const config = {
  /**
   * /api, Next'in kendi varliklari ve statik dosyalar HARIC.
   * Negatif lookahead kullaniliyor cunku middleware'i calistirip icinde
   * elemek her istekte gereksiz bir fonksiyon cagrisi demek.
   */
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
