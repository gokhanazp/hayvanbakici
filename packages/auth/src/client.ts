import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

/**
 * TARAYICI ISTEMCISI.
 *
 * MOBIL UYUMU (Faz 4): ayni kutuphanenin better-auth/client girisi React
 * Native'de de calisiyor. Bu dosya React'e ozel; mobil kendi ince sarmalayicisini
 * yazacak ama SUNUCU tarafi (server.ts) aynen paylasiliyor. Yol haritasindaki
 * "web ve mobil uyumlu olmali" sarti kimlik katmaninda boyle karsilanryor.
 */
/*
  TARAYICIDA ADRES YOK — BULUNDUGU YERE KONUSUYOR.

  Burada `baseURL: process.env.NEXT_PUBLIC_SITE_URL` yaziyordu. O deger
  derleme aninda tarayici paketine GOMULUYOR, yani istemci hangi
  adreste acilirsa acilsin kimlik isteklerini oraya gonderiyordu.

  Sonucu: `.env.example`'i kopyalayan herkes (deger orada
  https://havre.ca) localhost'ta calistirdiginda tarayici
  https://havre.ca/api/auth/get-session'i cagiriyor, istek dusuyor ve
  oturum HIC OKUNAMIYOR. Ekranda gorunen sey: giris yapmis olsaniz bile
  baslikta "Giris yap" duruyor; tikladiginizda sunucu cerezi goruyor ve
  sizi ana sayfaya geri atiyor. Ayni sey kanonik adres disindaki her
  dagitimda da olurdu (Vercel onizleme adresleri).

  Tarayicida dogru taban HER ZAMAN sayfanin kendi kaynagi, ve Better
  Auth verilmediginde tam olarak onu kullaniyor. NEXT_PUBLIC_SITE_URL
  SUNUCU tarafinin isi: e-posta baglantilari ve kanonik adresler.
*/
export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
