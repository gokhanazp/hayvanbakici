import Link from 'next/link';
import { headers } from 'next/headers';
import { getMessages, localeFromSegment, segmentFor, type Locale } from '@havre/i18n';
import { PATH_HEADER } from '@/middleware';

/**
 * SITE ICINDEKI 404 — MARKALI VE ILGILI DILDE.
 *
 * Onceden bu dosya yoktu ve Next'in ciplak varsayilani ciziliyordu:
 * baslik yok, gezinme yok, alt bilgi yok, meta aciklama yok ve /fr/
 * altindaki bir 404 bile INGILIZCE "This page could not be found."
 * diyordu. Hatanin oldugu an, markanin en cok gerektigi andir.
 *
 * DIL NEREDEN GELIYOR: `not-found.tsx` parametre ALMIYOR (Next'in
 * kurali). Ama middleware istenen yolu bir baslikta tasiyor —
 * yonetici korumasi da bunu kullaniyor. Ilk dilimi oradan okuyoruz.
 * Okunamazsa Ingilizceye dusuyoruz; yanlis dil, hic sayfa
 * olmamasindan iyidir.
 *
 * NOT: burasi GECERLI bir dil altindaki eksik sayfalar icin. Dilin
 * kendisi taninmiyorsa (/rastgele/) duzen zaten notFound() atiyor ve
 * kok `app/not-found.tsx` devreye giriyor.
 */
export default async function LocaleNotFound() {
  const h = await headers();
  const path = h.get(PATH_HEADER) ?? '';
  const first = path.split('/').filter(Boolean)[0] ?? '';
  const locale: Locale = localeFromSegment(first) ?? 'en-CA';
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  return (
    <section className="container section" style={{ maxWidth: '38rem' }}>
      <h1 className="text-display" style={{ marginBottom: 'var(--space-4)' }}>
        {m.oops.notFoundTitle}
      </h1>
      <p className="text-body-lg muted" style={{ textWrap: 'pretty' }}>
        {m.oops.notFoundBody}
      </p>
      <div className="row" style={{ marginTop: 'var(--space-7)' }}>
        <Link href={`/${seg}/search/`} className="btn btn-primary">
          {m.oops.notFoundSitters}
        </Link>
        <Link href={`/${seg}`} className="btn btn-secondary">
          {m.oops.notFoundHome}
        </Link>
      </div>
    </section>
  );
}
