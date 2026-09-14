import type { ReactNode } from 'react';
import Link from 'next/link';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';

/**
 * HESAP EKRANLARININ ORTAK CERCEVESI — baslik bandi + yan gezinme.
 *
 * Bakici sekmeleri yalnizca gercekten bakici olan kullaniciya cizilir:
 * herkese "Bakici paneli" gostermek, tiklayinca bos sayfa demek olurdu.
 */
export function AccountShell({
  locale, title, lead, active, isSitter, isAdmin, children, actions,
}: {
  locale: Locale;
  title: string;
  lead?: string | undefined;
  active: 'bookings' | 'sitter' | 'calendar';
  isSitter: boolean;
  /** Yonetici sekmesi: panelin adresi hicbir yerde duyurulmuyor,
      yoneticinin kendi hesabindan girebilmesi icin tek kapi bu. */
  isAdmin?: boolean | undefined;
  children: ReactNode;
  actions?: ReactNode | undefined;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  const tabs = [
    { key: 'bookings' as const, href: `/${seg}/account/bookings/`, label: m.account.myBookings },
    ...(isSitter
      ? [
          { key: 'sitter' as const, href: `/${seg}/account/sitter/`, label: m.account.requests },
          { key: 'calendar' as const, href: `/${seg}/account/sitter/calendar/`, label: m.account.calendar },
        ]
      : []),
    ...(isAdmin
      ? [{ key: 'admin' as const, href: '/admin/', label: locale === 'fr-CA' ? 'Interne' : 'Internal' }]
      : []),
  ];

  return (
    <>
      <section className="band band-blush band-round-b">
        <div className="container" style={{ paddingBlock: 'var(--space-8) var(--space-8)' }}>
          <h1 className="text-h1">{title}</h1>
          {lead && (
            <p className="text-body-lg muted" style={{ marginTop: 'var(--space-3)', maxWidth: '40rem' }}>
              {lead}
            </p>
          )}
          <nav className="account-tabs" aria-label={m.account.title}>
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                className={`account-tab${t.key === active ? ' is-active' : ''}`}
                aria-current={t.key === active ? 'page' : undefined}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
        {actions && <div className="row" style={{ marginBottom: 'var(--space-6)' }}>{actions}</div>}
        {children}
      </div>
    </>
  );
}
