import { NextResponse, type NextRequest } from 'next/server';

/**
 * SAYFA YOLLARINDA SONDAKI SLASH.
 *
 * Canonical URL'lerimiz ve sitemap girdilerimiz slash ile bitiyor; ayni
 * icerigin iki adresten servis edilmesi yinelenen icerik sorunudur. Next'in
 * kendi yonlendirmesi bunu yapardi ama /api'yi de yonlendiriyordu (bkz.
 * next.config.ts). Bu yuzden kural burada ve YALNIZCA sayfalara uygulaniyor.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === '/' || pathname.endsWith('/')) return NextResponse.next();

  // Dosya uzantisi olan istekler (robots.txt, sitemap.xml, .png) slash almaz.
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return NextResponse.next();

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
