'use client';

import { useActionState } from 'react';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';
import type { CalendarDay } from '@/lib/data';
import type { CalendarState } from '@/app/[locale]/account/sitter/calendar/actions';

/**
 * MUSAITLIK TAKVIMI — JS'siz de calisan bir form.
 *
 * Her gun bir onay kutusu; kaydetme iki ayri gonder dugmesiyle ("ac" /
 * "kapat"). Tarih secimi icin ozel bir surukle-birak arayuzu YOK: kutu
 * isaretlemek klavyeyle, ekran okuyucuyla ve dokunmayla calisir, surukleme
 * hicbirinde iyi calismaz.
 *
 * REZERVE gunler devre disi: onlari buradan acmak iptal anlamina gelirdi ve
 * iptalin kendi akisi var.
 */
export function CalendarEditor({
  locale, days, action, monthLabel,
}: {
  locale: Locale;
  days: CalendarDay[];
  action: (prev: CalendarState, form: FormData) => Promise<CalendarState>;
  monthLabel: string;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<CalendarState, FormData>(action, {});

  // Ayin ilk gunu haftanin hangi gunu — oncesine bos hucre
  const first = days[0];
  if (!first) return null;
  const firstDow = (new Date(`${first.date}T00:00:00Z`).getUTCDay() + 6) % 7; // Pzt = 0

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2024, 0, 1 + i)); // 1 Ocak 2024 = Pazartesi
    return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(d);
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      <h2 className="text-h4" style={{ marginBottom: 'var(--space-4)' }}>{monthLabel}</h2>

      {state.saved && <p className="alert alert-ok" role="status">{m.calendar.saved}</p>}
      {state.error && <p className="alert alert-error" role="alert">{m.booking['error.invalid']}</p>}

      <div className="cal-grid" role="group" aria-label={monthLabel}>
        {weekdays.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {Array.from({ length: firstDow }, (_, i) => (
          <div key={`pad-${i}`} className="cal-day cal-day-out"><span /></div>
        ))}
        {days.map((d) => {
          const day = Number(d.date.slice(8, 10));
          const booked = d.status === 'booked';
          return (
            <label key={d.date} className={`cal-day cal-day-${d.status}`}>
              <input type="checkbox" name="day" value={d.date} disabled={booked}
                aria-label={`${d.date} — ${m.calendar[d.status]}`} />
              <span>
                {day}
                <small className="dim" style={{ fontSize: '0.625rem' }}>
                  {booked ? m.calendar.booked : d.status === 'blocked' ? m.calendar.blocked : ''}
                </small>
              </span>
            </label>
          );
        })}
      </div>

      <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>{m.calendar.selectHint}</p>

      <div className="row" style={{ marginTop: 'var(--space-5)' }}>
        <button type="submit" name="status" value="open" className="btn btn-secondary" disabled={busy}>
          {m.calendar.makeOpen}
        </button>
        <button type="submit" name="status" value="blocked" className="btn btn-primary" disabled={busy}>
          {m.calendar.makeBlocked}
        </button>
      </div>

      <div className="cal-legend">
        <span><i className="cal-swatch" style={{ background: 'var(--color-surface)' }} />{m.calendar.open}</span>
        <span><i className="cal-swatch" style={{ background: 'var(--color-surface-sunken)' }} />{m.calendar.blocked}</span>
        <span><i className="cal-swatch" style={{ background: 'var(--color-accent-subtle)' }} />{m.calendar.booked}</span>
      </div>
      <p className="field-hint" style={{ marginTop: 'var(--space-3)' }}>{m.calendar.bookedNote}</p>
    </form>
  );
}
