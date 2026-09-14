import type { ReactNode } from 'react';
import Link from 'next/link';
import { segmentFor, type Locale } from '@havre/i18n';

/**
 * YONETICI PANELI CERCEVESI.
 *
 * Panel bilincli olarak SADE: bu ekranlari gunde defalarca acan bir ekip
 * kullanacak, pazarlama sayfasi degil. Yine de site tasarimiyla ayni
 * bantlar ve kartlar — ayri bir "admin temasi" bakim yuku olur.
 */
export function AdminShell({
  locale, title, lead, active, children,
}: {
  locale: Locale;
  title: string;
  lead?: string | undefined;
  active: 'overview' | 'applications' | 'bookings' | 'audit';
  children: ReactNode;
}) {
  const seg = segmentFor(locale);
  const fr = locale === 'fr-CA';
  const tabs = [
    { key: 'overview' as const, href: `/${seg}/admin/`, label: fr ? 'Aperçu' : 'Overview' },
    { key: 'applications' as const, href: `/${seg}/admin/applications/`, label: fr ? 'Candidatures' : 'Applications' },
    { key: 'bookings' as const, href: `/${seg}/admin/bookings/`, label: fr ? 'Réservations' : 'Bookings' },
    { key: 'audit' as const, href: `/${seg}/admin/audit/`, label: fr ? 'Journal' : 'Audit log' },
  ];

  return (
    <>
      <section className="band band-blush band-round-b">
        <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
          <p className="badge" style={{ background: 'var(--color-panel)', color: 'var(--color-panel-ink)' }}>
            {fr ? 'Interne' : 'Internal'}
          </p>
          <h1 className="text-h1" style={{ marginTop: 'var(--space-3)' }}>{title}</h1>
          {lead && (
            <p className="text-body-lg muted" style={{ marginTop: 'var(--space-3)', maxWidth: '42rem' }}>
              {lead}
            </p>
          )}
          <nav className="account-tabs" aria-label={title}>
            {tabs.map((t) => (
              <Link key={t.key} href={t.href}
                className={`account-tab${t.key === active ? ' is-active' : ''}`}
                aria-current={t.key === active ? 'page' : undefined}>
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>
      <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
        {children}
      </div>
    </>
  );
}
