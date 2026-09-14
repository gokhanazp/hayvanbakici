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
 */
export function HeaderAccount({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const { data } = authClient.useSession();
  const [busy, setBusy] = useState(false);

  if (!data) {
    return (
      <Link href={`/${seg}/account/sign-in`} className="text-body-sm muted">
        {m.nav.signIn}
      </Link>
    );
  }

  const firstName = data.user.name?.split(' ')[0];

  return (
    <>
      {/* Hesabin girisi artik OZET sayfasi: rezervasyon listesine dusmek,
          "ben bakici miyim" sorusunu cevapsiz birakiyordu. */}
      <Link href={`/${seg}/account/`} className="text-body-sm muted">
        {firstName || m.nav.account}
      </Link>
      <button
        type="button"
        className="btn btn-ghost text-body-sm"
        style={{ padding: 'var(--space-2) var(--space-3)', minHeight: 'auto' }}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await authClient.signOut();
          window.location.assign(`/${seg}`);
        }}
      >
        {m.auth.signOut}
      </button>
    </>
  );
}
