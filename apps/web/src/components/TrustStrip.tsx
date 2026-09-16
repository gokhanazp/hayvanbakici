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

  /*
    RAKAM VE ETIKET AYRI — TEK METIN DEGIL.

    Once uc tam cumleydi ("42 verified sitters in Toronto") ve dar
    ekranda alt alta sol hizali duruyordu: kutu en uzun cumle kadar
    genisliyor, ortalandigi icin arama kartiyla hizalanmiyor ve
    sayfanin altina yapistirilmis pembe bir leke gibi duruyordu.

    Parcalanmis hali ayni veriyi IKI DUZENDE gosterebiliyor: genis
    ekranda tek satirlik hap, dar ekranda uc sutunluk sayi tablosu.
    Metin ayni kaliyor, yalnizca yerlesim degisiyor — ekranda iki ayri
    kopya yok (ne arama motoru ne ekran okuyucu ikisini birden gorur).
  */
  const items = [
    { value: numberFmt(sitterCount, locale), label: interpolate(m.home.statSittersIn, { city: cityName }) },
    { value: `$${price}`, label: `${m.home.statPrice} / ${unitText}` },
    { value: numberFmt(bookingCount, locale), label: m.home.statBookings },
  ];

  return (
    <dl className="trust-strip">
      {items.map((it) => (
        <div key={it.label} className="trust-strip-item">
          <dd className="trust-strip-value tabular">{it.value}</dd>
          <dt className="trust-strip-label">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}
