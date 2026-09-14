import Link from 'next/link';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { SERVICES } from '@havre/core';
import type { BookingSummary } from '@/lib/data';
import { Avatar } from './Avatar';
import { money, dateFmt } from '@/lib/format';

/** Durum -> rozet rengi. Renk tek tasiyici degil; metin de yaziyor (WCAG 1.4.1). */
const TONE: Record<string, { bg: string; fg: string }> = {
  requested: { bg: 'var(--color-tile-apricot)', fg: 'var(--color-tile-apricot-ink)' },
  confirmed: { bg: 'var(--color-accent-subtle)', fg: 'var(--color-accent-hover)' },
  completed: { bg: 'var(--color-accent-subtle)', fg: 'var(--color-accent-hover)' },
  declined: { bg: 'var(--color-surface-sunken)', fg: 'var(--color-ink-secondary)' },
  cancelled: { bg: 'var(--color-surface-sunken)', fg: 'var(--color-ink-secondary)' },
  expired: { bg: 'var(--color-surface-sunken)', fg: 'var(--color-ink-secondary)' },
};

export function StatusBadge({ status, locale }: { status: string; locale: Locale }) {
  const m = getMessages(locale);
  const tone = TONE[status] ?? TONE.declined!;
  const label = (m.booking[`status.${status}` as keyof typeof m.booking] as string) ?? status;
  return <span className="badge" style={{ background: tone.bg, color: tone.fg }}>{label}</span>;
}

export function BookingCard({
  booking, locale, viewerRole,
}: {
  booking: BookingSummary;
  locale: Locale;
  viewerRole: 'owner' | 'sitter';
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const unit = SERVICES[booking.serviceType].unit;
  const name = `${booking.counterpartFirstName} ${booking.counterpartInitial}.`;

  return (
    <Link href={`/${seg}/account/bookings/${booking.id}/`} className="card card-hover booking-card">
      <Avatar src={booking.counterpartAvatarUrl} size={44}
        initials={`${booking.counterpartFirstName.slice(0, 1)}${booking.counterpartInitial}`} />

      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 600 }}>
          {interpolate(viewerRole === 'owner' ? m.booking.withSitter : m.booking.forOwner, { name })}
        </p>
        <p className="text-body-sm muted">
          {m.service[booking.serviceType]} · {dateFmt(booking.startAt, locale)} – {dateFmt(booking.endAt, locale)}
        </p>
        <p className="text-body-sm dim tabular">
          {booking.units} {m.unit[unit]}
        </p>
      </div>

      <div className="booking-card-end">
        <StatusBadge status={booking.status} locale={locale} />
        <p className="tabular" style={{ fontWeight: 600 }}>
          {money(viewerRole === 'owner' ? booking.ownerTotalCents : booking.sitterPayoutCents, locale)}
        </p>
        <p className="text-body-sm dim">
          {viewerRole === 'owner' ? m.account.youPay : m.account.youEarn}
        </p>
      </div>
    </Link>
  );
}
