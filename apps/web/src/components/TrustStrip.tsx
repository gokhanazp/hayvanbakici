import { getMessages, interpolate, type Locale } from '@havre/i18n';
import { money, numberFmt } from '@/lib/format';

/**
 * Canli guven seridi — sayfanin benzersizligini saglayan veri (yol haritasi §7.7).
 * Somut sayi + tarih birlikte verilir: AI Overviews bu formati alintilar,
 * "fiyatlar degisir" cumlesini alintilamaz.
 */
export function TrustStrip({
  locale,
  cityName,
  sitterCount,
  medianPriceCents,
  bookingCount,
}: {
  locale: Locale;
  cityName: string;
  sitterCount: number;
  medianPriceCents: number;
  bookingCount: number;
}) {
  const m = getMessages(locale);
  const items = [
    interpolate(m.home.trustStripSitters, { count: numberFmt(sitterCount, locale), city: cityName }),
    interpolate(m.home.trustStripPrice, { price: (medianPriceCents / 100).toFixed(0) }),
    interpolate(m.home.trustStripBookings, { count: numberFmt(bookingCount, locale) }),
  ];

  return (
    <div
      className="row"
      style={{
        gap: 'var(--space-4)',
        padding: 'var(--space-4)',
        background: 'var(--color-primary-subtle)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        fontSize: '0.875rem',
      }}
    >
      {items.map((text, i) => (
        <span key={i} className="row" style={{ gap: 'var(--space-2)' }}>
          {i > 0 && <span aria-hidden="true" className="muted">·</span>}
          <span>{text}</span>
        </span>
      ))}
      <span className="sr-only">{money(medianPriceCents, locale)}</span>
    </div>
  );
}
