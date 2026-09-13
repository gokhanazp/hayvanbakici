import { getMessages, interpolate, type Locale } from '@havre/i18n';
import { numberFmt } from '@/lib/format';

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
    interpolate(m.home.trustStripPrice, { price: Math.round(medianPriceCents / 100) }),
    interpolate(m.home.trustStripBookings, { count: numberFmt(bookingCount, locale) }),
  ];

  /*
    Ayiraci noktalar YALNIZCA genis ekranda. Dar ekranda seritteki uc madde
    alt alta diziliyor ve nokta her satirin BASINDA kaliyordu — madde
    isareti gibi gorunuyor ve yanlis okunuyordu.
  */
  return (
    <div className="trust-strip">
      {items.map((text, i) => (
        <span key={i} className="trust-strip-item">
          {i > 0 && <span aria-hidden="true" className="trust-strip-sep">·</span>}
          <span>{text}</span>
        </span>
      ))}
    </div>
  );
}
