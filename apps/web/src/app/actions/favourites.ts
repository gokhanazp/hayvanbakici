'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import {
  addFavourite, removeFavourite, favouriteIds,
  claimFavourites, existingSitterIds,
} from '@/lib/data';
import {
  FAV_COOKIE, FAV_COOKIE_MAX_AGE, MAX_ANON_FAVOURITES,
  parseFavCookie, serializeFavCookie,
} from '@/lib/favourites';

/**
 * FAVORIYE EKLE / CIKAR.
 *
 * TEK EYLEM, IKI DEPO: giris yapmissa veritabani, yapmamissa cerez.
 * Cagiran taraf hangisi oldugunu bilmiyor ve bilmesine gerek yok —
 * ikisini ayri eylem yapsaydik kartin hangisini cagiracagina karar
 * vermesi gerekirdi.
 *
 * JS GEREKTIRMEZ: dugme duz bir <form> icinde. JS kapali tarayicida
 * sayfa yeniden ciziliyor, kalp doluyor; acikken Next eylemi yerinde
 * calistirip yalnizca degisen parcayi tazeliyor.
 */
export async function toggleFavouriteAction(form: FormData): Promise<void> {
  const sitterId = String(form.get('sitterId') ?? '');
  if (!sitterId) return;

  /*
    NEREYE DONULECEGI FORMDAN GELIYOR ama yalnizca yol olarak: disaridan
    tam URL kabul etseydik, baska siteye yonlendiren bir favori dugmesi
    kurulabilirdi. Tek slash ile baslayan, cift slash icermeyen yol.
  */
  const rawPath = String(form.get('path') ?? '');
  const path = /^\/(?!\/)[\w\-./[\]%]*$/.test(rawPath) ? rawPath : '/';

  const session = await getSession();

  if (session) {
    /*
      DURUMU SUNUCU OKUYOR, forma GUVENMIYOR. "su an favoride" bilgisini
      gizli alandan alsaydik, iki sekmede acik duran ayni sayfa
      birbirinin durumunu bozardi: eskimis formu gonderen sekme favoriyi
      geri ekler ya da siler.
    */
    const current = await favouriteIds(session.user.id);
    if (current.has(sitterId)) await removeFavourite(session.user.id, sitterId);
    else await addFavourite(session.user.id, sitterId);
  } else {
    const jar = await cookies();
    const ids = parseFavCookie(jar.get(FAV_COOKIE)?.value);
    const next = ids.includes(sitterId)
      ? ids.filter((i) => i !== sitterId)
      /* Yeni olan BASA: liste "en son eklenen ustte" siralaniyor ve
         tavan dolunca dusen EN ESKI olsun. */
      : [sitterId, ...ids].slice(0, MAX_ANON_FAVOURITES);

    jar.set(FAV_COOKIE, serializeFavCookie(next), {
      maxAge: FAV_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  revalidatePath(path);
}

/**
 * TARAYICIDAKI FAVORILERI HESABA TASI.
 *
 * Giristen hemen sonra otomatik cagriliyor (sign-in/sign-up ekranlari),
 * ayrica favoriler sayfasinda acik bir dugme var: sosyal girisle gelen
 * kullanici bizim ekranimizdan gecmiyor, otomatik yol onda islemiyor.
 * Iki kapi da ayni eylemi cagiriyor.
 *
 * Cerez HER DURUMDA temizleniyor — tasinamayan kimlik zaten artik
 * yayinda olmayan bir bakiciya ait, tarayicida tutmanin faydasi yok.
 */
export async function claimFavouritesAction(): Promise<{ moved: number }> {
  const session = await getSession();
  const jar = await cookies();
  const ids = parseFavCookie(jar.get(FAV_COOKIE)?.value);
  if (!session || ids.length === 0) return { moved: 0 };

  const moved = await claimFavourites(session.user.id, ids);
  jar.delete(FAV_COOKIE);
  return { moved };
}

/**
 * Cerezdeki kimliklerden HALA GECERLI olanlar.
 *
 * Sayfalar bunu dogrudan cagirmiyor; kalp cizilirken cerez listesi
 * oldugu gibi kullaniliyor (tek bir gecersiz kimlik yalnizca hicbir
 * karta denk gelmez). Favori LISTESINDE ise suzuluyor.
 */
export async function validAnonFavourites(ids: readonly string[]): Promise<string[]> {
  return existingSitterIds(ids);
}
