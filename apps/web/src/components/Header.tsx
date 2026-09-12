import Link from 'next/link';
import { getMessages, LOCALES, segmentFor, type Locale } from '@havre/i18n';

export function Header({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href={`/${seg}`} className="wordmark">{m.brand.name.toLowerCase()}</Link>

        <nav className="site-nav">
          <Link href={`/${seg}/how-it-works`} className="muted">{m.nav.howItWorks}</Link>
          <Link href={`/${seg}/protection`} className="muted">{m.nav.protection}</Link>
          {/* Ucret seffafligi sayfasi ana menude — rakiplere karsi en guclu hamle */}
          <Link href={`/${seg}/pricing`}>{m.nav.pricing}</Link>
        </nav>

        <div className="row" style={{ gap: 'var(--space-3)' }}>
          {/*
            DIL SECIMI: IP tabanli otomatik yonlendirme YOK (yol haritasi §7.2).
            Googlebot cogunlukla ABD IP'sinden gelir; otomatik yonlendirme
            fr-CA sayfalarinin hic taranmamasina yol acar.
          */}
          <div className="row text-body-sm" style={{ gap: 0 }}>
            {LOCALES.map((l, i) => (
              <span key={l}>
                {i > 0 && <span aria-hidden="true" className="dim"> / </span>}
                <Link
                  href={`/${segmentFor(l)}`}
                  hrefLang={l}
                  className={l === locale ? undefined : 'dim'}
                  style={{ fontWeight: l === locale ? 600 : 400 }}
                >
                  {segmentFor(l).toUpperCase()}
                </Link>
              </span>
            ))}
          </div>
          <Link href={`/${seg}/become-a-sitter`} className="btn btn-ink">
            {m.nav.becomeSitter}
          </Link>
        </div>
      </div>
    </header>
  );
}
