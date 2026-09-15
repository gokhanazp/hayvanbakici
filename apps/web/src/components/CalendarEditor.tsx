'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import type { CalendarDay } from '@/lib/data';
import type { CalendarState } from '@/app/[locale]/account/sitter/calendar/actions';

/**
 * MUSAITLIK TAKVIMI — JS'siz de calisan bir form.
 *
 * Her gun bir onay kutusu; kaydetme iki ayri gonder dugmesiyle ("ac" /
 * "kapat"). Surukle-birak YOK: kutu isaretlemek klavyeyle, ekran
 * okuyucuyla ve dokunmayla calisir, surukleme hicbirinde iyi calismaz.
 *
 * JS YUKLENDIGINDE USTUNE EKLENENLER (temel form bozulmadan):
 *  - Shift + tiklama ile ARALIK secimi. Iki haftalik bir tatili kapatmak
 *    14 tiklama aliyordu; en cok sikayet edilen sey buydu.
 *  - Hazir secimler: tum acik gunler / hafta sonlari / temizle.
 *  - Kac gun secildigi ve hicbir sey secilmeden kaydet dugmelerinin
 *    devre disi kalmasi.
 *
 * REZERVE gunler devre disi: onlari buradan acmak iptal anlamina gelirdi
 * ve iptalin kendi akisi var. GECMIS gunler de devre disi: dun icin
 * musaitlik yazmanin hicbir karsiligi yok.
 */
export function CalendarEditor({
  locale, days, action, monthLabel, today,
}: {
  locale: Locale;
  days: CalendarDay[];
  action: (prev: CalendarState, form: FormData) => Promise<CalendarState>;
  monthLabel: string;
  /**
   * Bugunun tarihi (UTC, YYYY-AA-GG) — SUNUCUDAN geliyor.
   *
   * Istemcide new Date() ile hesaplansa kullanicinin saat dilimine gore
   * kayabilir ve sunucunun gecmis saydigi bir gun ekranda tiklanabilir
   * gorunurdu.
   */
  today: string;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<CalendarState, FormData>(action, {});

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  /** Shift+tiklamanin baslangic noktasi */
  const anchor = useRef<number | null>(null);

  /*
    Hazir secim dugmeleri yalnizca JS baglandiktan SONRA ciziliyor:
    JS yoksa hicbir sey yapmayan dugmeler gostermek, bozuk bir arayuzdur.
  */
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);

  /*
    KAYITTAN SONRA SECIM TEMIZLENIYOR.

    Kutular artik React durumunda tutuluyor; temizlenmezse kaydettikten
    sonra ayni gunler isaretli kaliyor ve bakici yeni gelen durumu
    (taranmis "kapali" zemini) isaretin altinda goremiyordu.
  */
  useEffect(() => {
    if (state.saved) setSelected(new Set());
  }, [state]);

  const first = days[0];
  if (!first) return null;

  // Ayin ilk gunu haftanin hangi gunu — oncesine bos hucre (Pzt = 0)
  const firstDow = (new Date(`${first.date}T00:00:00Z`).getUTCDay() + 6) % 7;

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.UTC(2024, 0, 1 + i)); // 1 Ocak 2024 = Pazartesi
    return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(d);
  });

  const isPast = (d: CalendarDay) => d.date < today;
  const editable = (d: CalendarDay) => d.status !== 'booked' && !isPast(d);
  const isWeekend = (d: CalendarDay) => {
    const dow = new Date(`${d.date}T00:00:00Z`).getUTCDay();
    return dow === 0 || dow === 6;
  };

  function apply(next: Iterable<string>) {
    setSelected(new Set(next));
  }

  function toggle(index: number, shiftKey: boolean) {
    const day = days[index];
    if (!day || !editable(day)) return;

    const next = new Set(selected);

    // Shift: son tiklanan gunden buraya kadar olan ARALIK
    if (shiftKey && anchor.current !== null) {
      const [lo, hi] = anchor.current <= index
        ? [anchor.current, index]
        : [index, anchor.current];
      // Aralik her zaman EKLER, cikarmaz: "su iki haftayi kapat" niyeti bu.
      for (let i = lo; i <= hi; i += 1) {
        const d = days[i];
        if (d && editable(d)) next.add(d.date);
      }
    } else if (next.has(day.date)) {
      next.delete(day.date);
    } else {
      next.add(day.date);
    }

    anchor.current = index;
    setSelected(next);
  }

  const count = selected.size;

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      <h2 className="text-h4" style={{ marginBottom: 'var(--space-4)' }}>{monthLabel}</h2>

      {state.saved && <p className="alert alert-ok" role="status">{m.calendar.saved}</p>}
      {state.error && <p className="alert alert-error" role="alert">{m.booking['error.invalid']}</p>}

      {enhanced && (
        <div className="cal-quick">
          <button type="button" className="btn btn-ghost btn-sm"
            onClick={() => apply(days.filter((d) => editable(d) && d.status === 'open').map((d) => d.date))}>
            {m.calendar.selectOpen}
          </button>
          <button type="button" className="btn btn-ghost btn-sm"
            onClick={() => apply(days.filter((d) => editable(d) && isWeekend(d)).map((d) => d.date))}>
            {m.calendar.selectWeekends}
          </button>
          <button type="button" className="btn btn-ghost btn-sm"
            onClick={() => { apply([]); anchor.current = null; }} disabled={count === 0}>
            {m.calendar.clear}
          </button>
        </div>
      )}

      <div className="cal-grid" role="group" aria-label={monthLabel}>
        {weekdays.map((w) => <div key={w} className="cal-head">{w}</div>)}
        {Array.from({ length: firstDow }, (_, i) => (
          <div key={`pad-${i}`} className="cal-day cal-day-out"><span /></div>
        ))}
        {days.map((d, i) => {
          const day = Number(d.date.slice(8, 10));
          const past = isPast(d);
          const locked = !editable(d);
          const status = past ? 'past' : d.status;
          const note = d.status === 'booked'
            ? m.calendar.booked
            : past ? '' : d.status === 'blocked' ? m.calendar.blocked : '';

          return (
            <label
              key={d.date}
              className={`cal-day cal-day-${status}${d.date === today ? ' cal-day-today' : ''}`}
            >
              <input
                type="checkbox" name="day" value={d.date} disabled={locked}
                checked={selected.has(d.date)}
                onClick={(e) => toggle(i, e.shiftKey)}
                /* React kontrollu input icin onChange istiyor; secimi
                   onClick yapiyor (shiftKey yalnizca orada var). */
                onChange={() => undefined}
                aria-label={`${d.date} — ${past ? m.calendar.past : m.calendar[d.status]}`}
              />
              <span>
                {day}
                <small className="dim" style={{ fontSize: '0.625rem' }}>{note}</small>
              </span>
            </label>
          );
        })}
      </div>

      <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>
        {enhanced ? m.calendar.rangeHint : m.calendar.selectHint}
      </p>

      <div className="row" style={{ marginTop: 'var(--space-5)' }}>
        <button type="submit" name="status" value="open" className="btn btn-secondary"
          disabled={busy || (enhanced && count === 0)}>
          {m.calendar.makeOpen}
        </button>
        <button type="submit" name="status" value="blocked" className="btn btn-primary"
          disabled={busy || (enhanced && count === 0)}>
          {m.calendar.makeBlocked}
        </button>
      </div>

      {/*
        KAC GUN SECILI. Otuz kutunun icinde dokuz tanesini isaretledikten
        sonra kac tane oldugunu saymak zor; yanlis sayida gunu kapatmak
        da pahali bir hata.
      */}
      {enhanced && (
        <p className="field-hint" role="status" style={{ marginTop: 'var(--space-2)' }}>
          {count === 0
            ? m.calendar.noneSelected
            : interpolate(count === 1 ? m.calendar.selectedOne : m.calendar.selectedMany, { count })}
        </p>
      )}

      <div className="cal-legend">
        <span><i className="cal-swatch cal-swatch-open" />{m.calendar.open}</span>
        <span><i className="cal-swatch cal-swatch-blocked" />{m.calendar.blocked}</span>
        <span><i className="cal-swatch cal-swatch-booked" />{m.calendar.booked}</span>
        <span><i className="cal-swatch cal-swatch-past" />{m.calendar.past}</span>
      </div>
      <p className="field-hint" style={{ marginTop: 'var(--space-3)' }}>{m.calendar.bookedNote}</p>
    </form>
  );
}
