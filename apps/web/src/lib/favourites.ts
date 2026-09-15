import { cookies } from 'next/headers';

/**
 * GIRIS YAPMAMIS ZIYARETCININ FAVORILERI — TARAYICIDA.
 *
 * NEDEN CEREZ, neden "once giris yap" degil: favorileme, kullanicinin
 * henuz karar vermedigi anda yaptigi bir sey. Tam o anda hesap acmasini
 * istemek, hem favoriyi hem de cogu zaman ziyareti kaybetmek demek. Giris
 * yaptiginda liste hesabina tasiniyor, yani kimse bir sey kaybetmiyor.
 *
 * NEDEN localStorage DEGIL: sayfalar sunucuda ciziliyor. localStorage
 * yalnizca tarayicida okunur, yani kalbin dolu mu bos mu oldugu ancak JS
 * yuklendikten sonra belli olurdu — once bos kalp cizilir, sonra
 * zipladigini gorursunuz. Cerez istekle birlikte geliyor, ilk cizimde
 * dogru.
 *
 * LAW 25: bu ISLEVSEL bir cerez — kullanicinin kendi istedigi bir
 * ozelligi calistiriyor, profilleme ya da olcum yapmiyor, ucuncu tarafa
 * gitmiyor. Yine de cerez sayfasinda ADIYLA yaziyor: "sizde ne
 * sakliyoruz" sorusunun cevabi eksiksiz olmali.
 *
 * httpOnly: JS'in okumasina gerek yok, dolayisiyla okumasin.
 */
const COOKIE = 'hv_fav';

/**
 * TAVAN. Cerez basligi sinirli (~4 KB) ve tasan bir cerez SESSIZCE
 * dusurulur — kullanici favorilerinin kayboldugunu gorurdu. Otuz kimlik
 * ~1,1 KB; hem rahat siga hem de gercek bir kullanim icin fazlasiyla
 * yeterli. Tavan dolunca EN ESKI dusuyor.
 */
export const MAX_ANON_FAVOURITES = 30;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cerezi ayristirir. Cerez KULLANICININ tarayicisindan geliyor, yani
 * disaridan gelen veri: bicim disi her sey atiliyor, tavan burada da
 * uygulaniyor. (Kimliklerin gercekten var olup olmadigi ayri bir soru —
 * ona veritabani bakiyor, bkz. existingSitterIds.)
 */
export function parseFavCookie(raw: string | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const part of raw.split(',')) {
    const id = part.trim().toLowerCase();
    if (UUID.test(id)) seen.add(id);
    if (seen.size >= MAX_ANON_FAVOURITES) break;
  }
  return [...seen];
}

export function serializeFavCookie(ids: readonly string[]): string {
  return ids.slice(0, MAX_ANON_FAVOURITES).join(',');
}

/** Sunucu bileseninden okuma. Yazma yalnizca sunucu eyleminde olur. */
export async function readAnonFavourites(): Promise<string[]> {
  return parseFavCookie((await cookies()).get(COOKIE)?.value);
}

export const FAV_COOKIE = COOKIE;

/** Bir yil: favori, oturumdan uzun yasamasi beklenen bir sey. */
export const FAV_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
