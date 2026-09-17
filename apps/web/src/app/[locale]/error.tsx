'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor, type Locale } from '@havre/i18n';

/**
 * SITE ICINDEKI HATA SINIRI.
 *
 * Onceden hicbir `error.tsx` yoktu: sunucuda atilan her hata Next'in
 * ciplak varsayilan ekranini veriyordu — marka yok, gezinme yok, dil yok.
 *
 * ISTEMCI BILESENI OLMAK ZORUNDA (Next'in kurali: hata siniri `reset`
 * fonksiyonunu tasiyor). O yuzden dili basliktan degil ADRESTEN okuyoruz;
 * istemcide `headers()` yok.
 *
 * `reset()` AYNI SAYFAYI YENIDEN CIZIYOR. Kalici bir hata icin ise
 * yaramaz ama gecici olanlarda (bir sorgunun zaman asimi) kullaniciyi
 * sayfadan atmadan ikinci bir sans veriyor. Ekranda da bunu soyluyoruz:
 * "tekrar deneyin; surerse biz duzeltene kadar boyle kalir".
 */
export default function LocaleError({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const path = usePathname();
  const first = path.split('/').filter(Boolean)[0] ?? '';
  const locale: Locale = localeFromSegment(first) ?? 'en-CA';
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  useEffect(() => {
    /* Sunucu tarafi zaten kaydediyor; burada yalnizca tarayici konsoluna
       dusuyor ki gelistirici gordugunu bilsin. Sentry eklenince buraya
       bagliyor. */
    console.error('[havre] sayfa hatasi', error.digest ?? '', error);
  }, [error]);

  return (
    <section className="container section" style={{ maxWidth: '38rem' }}>
      <h1 className="text-h1" style={{ marginBottom: 'var(--space-4)' }}>
        {m.oops.errorTitle}
      </h1>
      <p className="text-body-lg muted" style={{ textWrap: 'pretty' }}>
        {m.oops.errorBody}
      </p>
      <div className="row" style={{ marginTop: 'var(--space-7)' }}>
        <button type="button" className="btn btn-primary" onClick={reset}>
          {m.oops.errorRetry}
        </button>
        <a href={`/${seg}`} className="btn btn-secondary">{m.oops.notFoundHome}</a>
      </div>
      {error.digest && (
        /* Destek icin: kullanicidan tek isteyecegimiz sey bu kod. */
        <p className="text-body-sm dim tabular" style={{ marginTop: 'var(--space-6)' }}>
          {error.digest}
        </p>
      )}
    </section>
  );
}
