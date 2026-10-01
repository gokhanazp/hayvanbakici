'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@havre/auth/client';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';
import { Avatar } from '@/components/Avatar';
import { Sym } from '@/components/Sym';

/**
 * Basliktaki hesap alani.
 *
 * Oturum ISTEMCIDE okunuyor: sunucuda okumak cerez erisimi demek, o da tum
 * sayfalari dinamik yapar ve landing sayfalarinin statik uretimini bitirirdi.
 *
 * GORUNUM — tasarimdaki hesap cipi: yuvarlak avatar + iki satir (ustte ad
 * kalin, altinda ikincil bilgi yesil) bir hapin icinde; hap zemini
 * surface-container, kenarligi surface-container-highest.
 *
 * CIP BIR MENU. Tasarimda cip tiklanabilir duruyor ama acildiginda ne
 * cikacagi cizilmemis. Bizde cikmasi SART olan bir sey var: oturumu
 * kapatmak. Hesap sayfasinda cikis yok, tasarimin basliginda da yok —
 * yani cip menu olmazsa genis ekranda cikis yolu kalmiyor. Menu yine
 * <details>, JavaScript yok.
 *
 * IKINCI SATIR E-POSTA. Tasarimda orada "2 Pets" yaziyor. Bizde evcil
 * hayvan sayisi istemcide yok ve yalnizca bu satir icin bir uc nokta
 * acmak hesap bilgisi dagitmak olurdu (bkz. api/me yorumu). E-posta
 * zaten oturumda var, kullanicinin KENDI bilgisi ve "hangi hesaptayim"
 * sorusunu cevapliyor — uydurma bir sayi yazmaktan iyi.
 *
 * IKI GORUNUM:
 *  - 'bar'    : genis ekrandaki baslik cubugu. 1180px altinda GIZLI.
 *  - 'drawer' : mobil cekmecenin icinde, tam genislikte satirlar.
 *
 * Iki kopya da DOM'da duruyor ama her genislikte yalnizca biri
 * goruntuleniyor (display:none erisilebilirlik agacindan da cikarir),
 * yani ekran okuyucu tek bir "Cikis" duyuyor.
 */
export function HeaderAccount({
  locale, variant = 'bar',
}: {
  locale: Locale;
  variant?: 'bar' | 'drawer';
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const { data } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  const drawer = variant === 'drawer';

  async function signOut() {
    setBusy(true);
    await authClient.signOut();
    window.location.assign(`/${seg}`);
  }

  /*
    Yuklenirken YER TUTUCU cizmiyoruz; "giris" baglantisi duruyor ve
    oturum gelirse degisiyor. Iki durumun hap genisligi yakin, yani
    yerine oturdugunda sayfa ziplamiyor.
  */
  if (!data) {
    if (drawer) {
      return <Link href={`/${seg}/account/sign-in`} className="nav-drawer-item">{m.nav.signIn}</Link>;
    }
    return (
      <Link href={`/${seg}/account/sign-in`} className="hd-user-chip hd-user-guest">
        <span className="hd-user-mark" aria-hidden="true"><Sym name="user" size={18} /></span>
        <span className="hd-user-name">{m.nav.signIn}</span>
      </Link>
    );
  }

  const firstName = data.user.name?.split(' ')[0] ?? m.nav.account;

  if (drawer) {
    return (
      <>
        {/* Hesabin girisi OZET sayfasi: rezervasyon listesine dusmek,
            "ben bakici miyim" sorusunu cevapsiz birakiyordu. */}
        <Link href={`/${seg}/account/`} className="nav-drawer-item">{m.nav.account}</Link>
        <button
          type="button"
          className="nav-drawer-item nav-drawer-button"
          disabled={busy}
          onClick={signOut}
        >
          {m.auth.signOut}
        </button>
      </>
    );
  }

  return (
    <details className="hd-user">
      <summary className="hd-user-chip">
        <Avatar src={data.user.image} initials={firstName.charAt(0).toUpperCase()} size={32} />
        <span className="hd-user-text">
          <span className="hd-user-name">{firstName}</span>
          <span className="hd-user-sub">{data.user.email}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
          strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </summary>
      <div className="hd-panel hd-user-panel">
        <Link href={`/${seg}/account/`} className="hd-user-item">{m.nav.account}</Link>
        <Link href={`/${seg}/account/bookings/`} className="hd-user-item">{m.account.myBookings}</Link>
        <Link href={`/${seg}/account/messages/`} className="hd-user-item">{m.messages.tab}</Link>
        <Link href={`/${seg}/favourites/`} className="hd-user-item">{m.favourites.tab}</Link>
        <button type="button" className="hd-user-item hd-user-out" disabled={busy} onClick={signOut}>
          {m.auth.signOut}
        </button>
      </div>
    </details>
  );
}
