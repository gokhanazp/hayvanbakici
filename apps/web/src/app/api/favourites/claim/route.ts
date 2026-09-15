import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { claimFavourites } from '@/lib/data';
import { FAV_COOKIE, parseFavCookie } from '@/lib/favourites';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GIRISTEN SONRAKI DURAK — tarayicidaki favorileri hesaba tasir, sonra
 * kullaniciyi gitmek istedigi yere birakir.
 *
 * NEDEN BIR ROTA, neden giris formunda bir satir kod DEGIL: girisin uc
 * yolu var (sifre, sihirli baglanti, sosyal) ve ikisi bizim ekranimizdan
 * cikip geri donuyor — form icindeki kod yalnizca sifreli girise
 * yetisirdi. Ucunun de ORTAK noktasi callbackURL; bu rota oraya
 * yerlestiriliyor.
 *
 * Cerez ancak SUNUCU EYLEMI ya da ROTA yaniti ile silinebilir; sayfa
 * cizimi sirasinda cerez yazilamiyor. Tasimanin burada olmasinin teknik
 * sebebi de bu.
 *
 * KIMLIK DOGRULANMAMISSA hicbir sey yapilmiyor ve cerez DURUYOR: giris
 * basarisiz olduysa kullanicinin favorilerini silmek, hem veriyi kaybetmek
 * hem de bu adresi herhangi birinin favori silme dugmesi haline getirmek
 * olurdu.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const raw = req.nextUrl.searchParams.get('next') ?? '/';
  // Acik yonlendirme korumasi — sign-in sayfasindaki kuralin aynisi.
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
  const res = NextResponse.redirect(new URL(next, req.nextUrl.origin), 303);

  const session = await getSession();
  if (!session) return res;

  const ids = parseFavCookie(req.cookies.get(FAV_COOKIE)?.value);
  if (ids.length === 0) return res;

  try {
    await claimFavourites(session.user.id, ids);
  } catch (err) {
    /*
      TASIMA BASARISIZSA GIRIS YINE DE TAMAMLANIR ve cerez DURUR:
      kullaniciyi giris ekraninda birakmak, favori listesinden cok daha
      buyuk bir kayip. Cerez durdugu icin favoriler sayfasindaki serit
      ikinci bir sans veriyor.
    */
    console.error('[favourites] tasima basarisiz', err);
    return res;
  }

  res.cookies.delete(FAV_COOKIE);
  return res;
}
