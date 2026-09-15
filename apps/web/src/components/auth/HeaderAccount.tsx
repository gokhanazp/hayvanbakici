'use client';

import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@havre/auth/client';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';

/**
 * Basliktaki hesap alani.
 *
 * Oturum ISTEMCIDE okunuyor: sunucuda okumak cerez erisimi demek, o da tum
 * sayfalari dinamik yapar ve landing sayfalarinin statik uretimini bitirirdi.
 *
 * Yuklenirken YER TUTUCU cizmiyoruz; bunun yerine "giris" baglantisi duruyor
 * ve oturum gelirse degisiyor. Bos bir kutu goruntusu (layout shift) CLS'i
 * bozar — sabit genislikli bir alan kullanmiyoruz, metin dogrudan yer degistiriyor.
 *
 * IKI GORUNUM:
 *  - 'bar'    : genis ekrandaki baslik cubugu. 1000px altinda GIZLI.
 *  - 'drawer' : mobil cekmecenin icinde, tam genislikte satirlar.
 *
 * NEDEN: 390px'de cubuk logo + EN/FR + isim + "Se deconnecter" +
 * hamburger tasiyordu; cikis dugmesi iki satira bolunuyor ve baslik
 * ekrandan tasiyordu. Hesap islemleri artik cekmecede.
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

  if (!data) {
    return (
      <Link
        href={`/${seg}/account/sign-in`}
        className={drawer ? 'nav-drawer-item' : 'text-body-sm muted'}
      >
        {m.nav.signIn}
      </Link>
    );
  }

  const firstName = data.user.name?.split(' ')[0];

  return (
    <>
      {/* Hesabin girisi artik OZET sayfasi: rezervasyon listesine dusmek,
          "ben bakici miyim" sorusunu cevapsiz birakiyordu. */}
      <Link
        href={`/${seg}/account/`}
        className={drawer ? 'nav-drawer-item' : 'text-body-sm muted'}
      >
        {drawer ? m.nav.account : (firstName || m.nav.account)}
      </Link>
      <button
        type="button"
        className={drawer ? 'nav-drawer-item nav-drawer-button' : 'btn btn-ghost text-body-sm'}
        style={drawer ? undefined : { padding: 'var(--space-2) var(--space-3)', minHeight: 'auto' }}
        disabled={busy}
        onClick={signOut}
      >
        {m.auth.signOut}
      </button>
    </>
  );
}
