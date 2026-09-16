import { getMessages, interpolate, type Locale } from '@havre/i18n';
import type { CalendarDay } from '@/lib/data';
/* dateFmt AY+YIL veriyor ("Eylul 2026"); burada GUN gerekiyor —
   "takvimden Eylul 2026'da okundu" diye bir cumle cikmisti. */
import { dayFmt } from '@/lib/format';

/**
 * BAKICI PROFILINDEKI MUSAITLIK TAKVIMI — SALT OKUNUR.
 *
 * NEDEN VAR: sahibin sayfaya gelirken sordugu ilk soru "benim
 * tarihlerimde musait mi". Cevap yalnizca "onumuzdeki ay 24 gun acik"
 * diye bir SAYI olarak duruyordu; hangi gunler oldugu bakiciya soru
 * sormadan ogrenilemiyordu. Veri zaten vardi (sitter_availability),
 * yalnizca cizilmiyordu.
 *
 * SUNUCUDA CIZILIYOR, JS YOK. Sayfa ISR ile uretiliyor (revalidate
 * 3600), yani takvim en fazla bir saat eski olabilir. Bunu bilincli
 * kabul ediyoruz ve EKRANDA SOYLUYORUZ ("takvimden ... tarihinde
 * okundu"), cunku:
 *   - Yanlis bir rezervasyona yol acamaz: istek gonderilirken sunucu
 *     araligin tamamini yeniden kontrol ediyor (createBookingRequest
 *     icindeki musaitlik sorgusu) ve dolu gune 'dates_unavailable'
 *     donuyor.
 *   - Canli takvim icin bir istemci adasi + API ucu gerekirdi; bir
 *     saatlik tazelik farki bunun bedeline degmiyor.
 *
 * GECMIS GUNLER CIZILIYOR ama solgun: ayin ilk yarisinda takvimin
 * yarisini bos birakmak "bu bakici hic musait degil" gibi okunuyordu.
 */

/** YYYY-MM-DD — yerel saatle, UTC kaymasi olmadan. */
function iso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Pazartesi baslangicli 6x7 izgara — CalendarEditor ile ayni kural. */
function monthGrid(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function AvailabilityCalendar({
  locale, name, days, months = 2, today = new Date(),
}: {
  locale: Locale;
  name: string;
  days: CalendarDay[];
  months?: number;
  today?: Date;
}) {
  const m = getMessages(locale);
  const status = new Map(days.map((d) => [d.date, d.status]));
  const todayIso = iso(today);

  const monthList = Array.from({ length: months }, (_, i) =>
    new Date(today.getFullYear(), today.getMonth() + i, 1));

  const weekdays = (() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'narrow' });
    /* 2024-01-01 bir Pazartesi — izgaranin ilk sutunu. */
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  })();

  return (
    <section className="pubcal">
      <h2 className="text-h2">{m.calendar.publicHeading}</h2>
      <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
        {interpolate(m.calendar.publicLead, { name })}
      </p>

      <div className="pubcal-months">
        {monthList.map((month) => (
          <div key={iso(month)} className="pubcal-month">
            <p className="pubcal-title">
              {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)}
            </p>
            <div className="pubcal-grid" role="presentation">
              {weekdays.map((w, i) => (
                <span key={i} className="pubcal-head" aria-hidden="true">{w}</span>
              ))}
              {monthGrid(month).map((d) => {
                const key = iso(d);
                const out = d.getMonth() !== month.getMonth();
                const past = key < todayIso;
                const st = status.get(key) ?? 'open';
                const cls = out ? 'is-out'
                  : past ? 'is-past'
                  : st === 'open' ? 'is-open'
                  : st === 'booked' ? 'is-booked' : 'is-blocked';
                /*
                  Her hucrede metin karsiligi var: renk TEK TASIYICI
                  degil. Ekran okuyucu "14 Eylul, acik" duyuyor.
                */
                const label = out ? undefined
                  : `${dayFmt(key, locale)}, ${past ? m.calendar.past
                    : st === 'open' ? m.calendar.open
                    : st === 'booked' ? m.calendar.booked : m.calendar.blocked}`;
                return (
                  <span key={key} className={`pubcal-day ${cls}`} title={label} aria-label={label}>
                    {out ? '' : d.getDate()}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="cal-legend">
        <span><i className="cal-swatch pubcal-sw-open" aria-hidden="true" />{m.calendar.open}</span>
        <span><i className="cal-swatch pubcal-sw-blocked" aria-hidden="true" />{m.calendar.blocked}</span>
        <span><i className="cal-swatch pubcal-sw-booked" aria-hidden="true" />{m.calendar.booked}</span>
      </div>

      <p className="text-body-sm dim" style={{ marginTop: 'var(--space-4)' }}>
        {interpolate(m.calendar.publicAsOf, { date: dayFmt(todayIso, locale) })}
      </p>
    </section>
  );
}
