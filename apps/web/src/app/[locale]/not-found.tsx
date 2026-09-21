import Link from 'next/link';
import { getMessages } from '@havre/i18n';

/**
 * SITE ICINDEKI 404 — MARKALI VE IKI DILDE.
 *
 * Onceden bu dosya yoktu ve Next'in ciplak varsayilani ciziliyordu:
 * baslik yok, gezinme yok, alt bilgi yok. Hatanin oldugu an, markanin
 * en cok gerektigi andir.
 *
 * NEDEN TEK DIL DEGIL DE IKI DIL:
 *
 * `not-found.tsx` parametre ALMIYOR (Next'in kurali), yani hangi dilde
 * oldugumuzu buradan bilemiyoruz. Onceki surum bunu middleware'in
 * yazdigi bir baslikla cozuyordu — `headers()` okuyarak. O CAGRI
 * URETIMDE HER SEYI KIRDI:
 *
 *   Error: Page changed from static to dynamic at runtime
 *   /en/toronto/dog-boarding, reason: headers
 *
 * `headers()` bu agactaki BUTUN sayfalari dinamige zorluyor; ISR ile
 * uretilen sehir/hizmet sayfalari ilk istekte 500 veriyordu. Uretim
 * derlemesiyle olculdu: cagri kaldirilinca ayni adres 200 donuyor.
 *
 * Cozum dili TAHMIN ETMEK degil, IKISINI DE yazmak. Kanada'da zaten
 * iki resmi dil var; "sayfa yok" cumlesini iki dilde soylemek bir
 * eksiklik degil. Boylece sayfa tamamen statik kaliyor ve altindaki
 * hicbir sayfayi dinamige zorlamiyor.
 *
 * NOT: burasi GECERLI bir dil altindaki eksik sayfalar icin. Dilin
 * kendisi taninmiyorsa (/rastgele/) duzen notFound() atiyor ve kok
 * `app/not-found.tsx` devreye giriyor.
 */
export default function LocaleNotFound() {
  const en = getMessages('en-CA');
  const fr = getMessages('fr-CA');

  return (
    <section className="container section" style={{ maxWidth: '38rem' }}>
      <h1 className="text-display" style={{ marginBottom: 'var(--space-3)' }}>
        {en.oops.notFoundTitle}
      </h1>
      <p className="text-body-lg muted" style={{ textWrap: 'pretty' }}>
        {en.oops.notFoundBody}
      </p>
      <div className="row" style={{ marginTop: 'var(--space-5)' }}>
        <Link href="/en/search/" className="btn btn-primary">
          {en.oops.notFoundSitters}
        </Link>
        <Link href="/en" className="btn btn-secondary">
          {en.oops.notFoundHome}
        </Link>
      </div>

      <hr style={{ margin: 'var(--space-7) 0', border: 0, borderTop: '1px solid var(--color-border)' }} />

      <h2 className="text-title" lang="fr" style={{ marginBottom: 'var(--space-3)' }}>
        {fr.oops.notFoundTitle}
      </h2>
      <p className="text-body-lg muted" lang="fr" style={{ textWrap: 'pretty' }}>
        {fr.oops.notFoundBody}
      </p>
      <div className="row" style={{ marginTop: 'var(--space-5)' }}>
        <Link href="/fr/search/" className="btn btn-primary" lang="fr">
          {fr.oops.notFoundSitters}
        </Link>
        <Link href="/fr" className="btn btn-secondary" lang="fr">
          {fr.oops.notFoundHome}
        </Link>
      </div>
    </section>
  );
}
