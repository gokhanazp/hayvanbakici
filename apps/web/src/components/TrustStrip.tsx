import { getMessages, interpolate, unitLabel, type Locale, type Messages } from '@havre/i18n';
import { numberFmt } from '@/lib/format';

/**
 * Canli guven seridi — sayfanin benzersizligini saglayan veri (yol haritasi §7.7).
 * Somut sayi + tarih birlikte verilir: AI Overviews bu formati alintilar,
 * "fiyatlar degisir" cumlesini alintilamaz.
 *
 * BIRIM ARTIK PARAMETRE — DUZELTILEN HATA.
 * Metin sabit olarak "/gece" yaziyordu. Kisa ziyaret sayfasinda ekranda
 * "Median $24/night" goruluyordu, oysa o hizmet ZIYARET basina
 * fiyatlaniyor ve ayni sayfanin meta aciklamasi dogru sekilde "per
 * visit" diyordu. Yani sayfa kendi kendisiyle celisiyordu. Birim artik
 * hizmetin kendi birimi (packages/core/services.ts).
 *
 * IKI GORUNUM:
 *   pill  — tek satirlik hap; ana sayfada arama kartinin altinda.
 *   stats — sayi + etiket bloklari; ic sayfa kahramaninda, orada bu
 *           veriler sayfanin tek somut kanıtı ve buyuk okunmali.
 */
export type TrustUnit = keyof Messages['unit'];

export function TrustStrip({
  locale,
  cityName,
  sitterCount,
  medianPriceCents,
  bookingCount,
  unit = 'night',
  variant = 'pill',
}: {
  locale: Locale;
  cityName: string;
  sitterCount: number;
  medianPriceCents: number;
  bookingCount: number;
  /** Hizmetin fiyat birimi — gece / ziyaret / yuruyus */
  unit?: TrustUnit;
  variant?: 'pill' | 'stats';
}) {
  const m = getMessages(locale);
  const price = Math.round(medianPriceCents / 100);
  const unitText = unitLabel(locale, unit, 1);

  if (variant === 'stats') {
    /*
      SIFIR OLAN OLCU YAZILMIYOR. Yeni acilan bir sehirde "0 tamamlanmis
      rezervasyon" dogru ama buyuk puntoyla yazildiginda sayfanin
      soyledigi sey bu oluyor. Olcuyu atlamak bir sey gizlemek degil;
      olmayan bir basariyi ilan etmemek.
    */
    const stats = [
      { value: numberFmt(sitterCount, locale), label: m.home.statSitters, show: sitterCount > 0 },
      { value: `$${price}`, label: `${m.home.statPrice} / ${unitText}`, show: medianPriceCents > 0 },
      { value: numberFmt(bookingCount, locale), label: m.home.statBookings, show: bookingCount > 0 },
    ].filter((s) => s.show);

    if (stats.length === 0) return null;

    return (
      <dl className="stat-row">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <dt className="stat-label">{s.label}</dt>
            <dd className="stat-value text-numeral tabular">{s.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  const items = [
    interpolate(m.home.trustStripSitters, { count: numberFmt(sitterCount, locale), city: cityName }),
    interpolate(m.home.trustStripPrice, { price, unit: unitText }),
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
