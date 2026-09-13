import Link from 'next/link';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';
import { SERVICES, type ServiceType } from '@havre/core';
import type { SitterSummary } from '@/lib/data';
import { money, responseTime } from '@/lib/format';
import { VerificationBadge } from './VerificationBadge';

export function SitterCard({
  sitter,
  serviceType,
  locale,
  citySlug,
}: {
  sitter: SitterSummary;
  serviceType: ServiceType;
  locale: Locale;
  /** Profil adresi sehir altinda: /en/toronto/sitter/camille-b-7f3a */
  citySlug: string;
}) {
  const m = getMessages(locale);
  const unit = m.unit[SERVICES[serviceType].unit];

  return (
    <Link
      href={`/${segmentFor(locale)}/${citySlug}/sitter/${sitter.slug}/`}
      className="card card-hover sitter-card">
      {/* Fotograf yerine gecen blok — gercek gorseller Faz 1'de */}
      <div className="sitter-photo" aria-hidden="true">{sitter.photoInitials}</div>

      <div className="sitter-body">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <div style={{ minWidth: 0 }}>
            <h3 className="text-h4">{sitter.firstName} {sitter.lastNameInitial}.</h3>
            <p className="dim text-body-sm">{sitter.neighbourhood}</p>
          </div>
          {/* Drip pricing yasagi: gosterilen fiyat TAM fiyattir */}
          <div className="tabular" style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 600 }}>{money(sitter.priceCents, locale)}</div>
            <div className="dim text-body-sm">/ {unit}</div>
          </div>
        </div>

        <p className="muted text-body-sm tabular">
          ★ {sitter.rating.toFixed(1)} ({sitter.reviewCount}) · {responseTime(sitter.responseMinutes, locale)}
        </p>

        <div><VerificationBadge level={sitter.badgeLevel} locale={locale} /></div>

        <p className="dim text-body-sm">
          {locale === 'fr-CA'
            ? `${sitter.repeatClients} clients réguliers`
            : `${sitter.repeatClients} repeat clients`}
        </p>
      </div>
    </Link>
  );
}
