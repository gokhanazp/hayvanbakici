import { getMessages, type Locale } from '@havre/i18n';
import type { ServiceType } from '@havre/core';
import { SERVICES } from '@havre/core';
import type { SitterSummary } from '@/lib/data';
import { money, responseTime } from '@/lib/format';
import { VerificationBadge } from './VerificationBadge';

export function SitterCard({
  sitter,
  serviceType,
  locale,
}: {
  sitter: SitterSummary;
  serviceType: ServiceType;
  locale: Locale;
}) {
  const m = getMessages(locale);
  const unit = m.unit[SERVICES[serviceType].unit];

  return (
    <article className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        aria-hidden="true"
        style={{
          aspectRatio: '4 / 3',
          background: 'linear-gradient(135deg, var(--color-primary-subtle), var(--color-accent-subtle))',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          color: 'var(--color-primary)',
        }}
      >
        {sitter.photoInitials}
      </div>

      <div style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
              {sitter.firstName} {sitter.lastNameInitial}.
            </h3>
            <p className="muted" style={{ fontSize: '0.8125rem' }}>{sitter.neighbourhood}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {/* Drip pricing yasagi: gosterilen fiyat TAM fiyattir */}
            <div className="tabular" style={{ fontWeight: 600 }}>
              {money(sitter.priceCents, locale)}
            </div>
            <div className="muted tabular" style={{ fontSize: '0.75rem' }}>/ {unit}</div>
          </div>
        </div>

        <div className="row" style={{ gap: 'var(--space-2)', fontSize: '0.8125rem' }}>
          <span className="tabular" aria-label={`${sitter.rating} / 5`}>
            ★ {sitter.rating.toFixed(1)}
          </span>
          <span className="muted tabular">({sitter.reviewCount})</span>
          <span className="muted">·</span>
          <span className="muted">{responseTime(sitter.responseMinutes, locale)}</span>
        </div>

        <div className="row" style={{ gap: 'var(--space-1)' }}>
          <VerificationBadge level={sitter.badgeLevel} locale={locale} />
        </div>

        <p className="muted" style={{ fontSize: '0.8125rem' }}>
          {locale === 'fr-CA'
            ? `${sitter.repeatClients} clients réguliers`
            : `${sitter.repeatClients} repeat clients`}
        </p>
      </div>
    </article>
  );
}
