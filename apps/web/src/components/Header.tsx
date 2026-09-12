import Link from 'next/link';
import { getMessages, LOCALES, segmentFor, type Locale } from '@havre/i18n';

export function Header({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href={`/${seg}`} className="brand">{m.brand.name}</Link>

        <nav className="row" style={{ gap: 'var(--space-5)', fontSize: '0.875rem' }}>
          <Link href={`/${seg}/how-it-works`} className="muted">{m.nav.howItWorks}</Link>
          <Link href={`/${seg}/protection`} className="muted">{m.nav.protection}</Link>
          {/* Ucret seffafligi sayfasi ana menude — rakiplere karsi en guclu hamle */}
          <Link href={`/${seg}/pricing`} className="muted">{m.nav.pricing}</Link>
        </nav>

        <div className="row" style={{ gap: 'var(--space-2)' }}>
          {/*
            DIL SECIMI: IP tabanli otomatik yonlendirme YOK (yol haritasi §7.2).
            Googlebot cogunlukla ABD IP'sinden gelir; otomatik yonlendirme
            fr-CA sayfalarinin hic taranmamasina yol acar.
          */}
          <div className="row" style={{ gap: 0, fontSize: '0.8125rem' }}>
            {LOCALES.map((l, i) => (
              <span key={l}>
                {i > 0 && <span aria-hidden="true" className="muted"> / </span>}
                <Link
                  href={`/${segmentFor(l)}`}
                  hrefLang={l}
                  className={l === locale ? '' : 'muted'}
                  style={{ fontWeight: l === locale ? 600 : 400 }}
                >
                  {segmentFor(l).toUpperCase()}
                </Link>
              </span>
            ))}
          </div>
          <Link href={`/${seg}/become-a-sitter`} className="btn btn-secondary">
            {m.nav.becomeSitter}
          </Link>
        </div>
      </div>
    </header>
  );
}
