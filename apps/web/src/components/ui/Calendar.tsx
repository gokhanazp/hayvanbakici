'use client';

import { useMemo, useRef, useState } from 'react';
import type { Locale } from '@havre/i18n';

/**
 * TAKVIM IZGARASI.
 *
 * <input type="date"> tarayicinin kendi takvimini aciyor: bicimlendirilemiyor,
 * dili isletim sisteminden aliyor (Fransizca arayuzde Ingilizce takvim
 * cikabiliyor) ve aralik secimini hic desteklemiyor.
 *
 * ERISILEBILIRLIK: role="grid" + gridcell, ok tuslariyla gun, PageUp/PageDown
 * ile ay gezinmesi, Esc ile kapanma. Odaklanabilir TEK hucre var (roving
 * tabindex) — 42 gunu Tab ile gezmek kullanilamaz olurdu.
 */

export interface DayRange {
  start: string | null;
  end: string | null;
}

/** YYYY-MM-DD — saat dilimi kaymasi olmadan. new Date().toISOString() UTC'ye
 *  kayiyor ve yerel saatle 22:00'den sonra gunu bir geri aliyordu. */
export function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromISODate(s: string | null): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Pazartesi baslangicli 6x7 izgara — Kanada takvimleri Pazar da baslayabilir
 *  ama fr-CA ve en-CA'da Pazartesi yaygin ve iki dilde tek izgara tutuyoruz. */
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function Calendar({
  locale,
  range,
  onSelect,
  minDate,
  onEscape,
}: {
  locale: Locale;
  range: DayRange;
  onSelect: (range: DayRange) => void;
  minDate?: Date | undefined;
  onEscape?: (() => void) | undefined;
}) {
  const startDate = fromISODate(range.start);
  const [month, setMonth] = useState<Date>(() => startOfMonth(startDate ?? new Date()));
  const [focusDay, setFocusDay] = useState<Date>(() => startDate ?? new Date());
  const gridRef = useRef<HTMLDivElement>(null);

  const days = useMemo(() => monthGrid(month), [month]);
  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month);
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    // 2024-01-01 bir Pazartesi
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const min = minDate ? toISODate(minDate) : null;
  const todayISO = toISODate(new Date());

  function pick(d: Date) {
    const iso = toISODate(d);
    if (min && iso < min) return;

    // Ilk tiklama baslangici koyar; ikinci tiklama bitisi. Bitis baslangictan
    // onceyse yeni baslangic sayilir — kullanici fikir degistirmistir.
    if (!range.start || (range.start && range.end)) {
      onSelect({ start: iso, end: null });
    } else if (iso < range.start) {
      onSelect({ start: iso, end: null });
    } else {
      onSelect({ start: range.start, end: iso });
    }
  }

  function moveFocus(days: number) {
    const next = new Date(focusDay);
    next.setDate(next.getDate() + days);
    setFocusDay(next);
    if (next.getMonth() !== month.getMonth() || next.getFullYear() !== month.getFullYear()) {
      setMonth(startOfMonth(next));
    }
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
    });
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowLeft': e.preventDefault(); moveFocus(-1); break;
      case 'ArrowRight': e.preventDefault(); moveFocus(1); break;
      case 'ArrowUp': e.preventDefault(); moveFocus(-7); break;
      case 'ArrowDown': e.preventDefault(); moveFocus(7); break;
      case 'PageUp': e.preventDefault(); setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)); break;
      case 'PageDown': e.preventDefault(); setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)); break;
      case 'Enter':
      case ' ': e.preventDefault(); pick(focusDay); break;
      case 'Escape': e.preventDefault(); onEscape?.(); break;
    }
  }

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="calendar-nav"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          aria-label={locale === 'fr-CA' ? 'Mois précédent' : 'Previous month'}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
            strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="M12 4 6 10l6 6" /></svg>
        </button>
        <span className="calendar-month" aria-live="polite">{monthLabel}</span>
        <button type="button" className="calendar-nav"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          aria-label={locale === 'fr-CA' ? 'Mois suivant' : 'Next month'}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
            strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><path d="m8 4 6 6-6 6" /></svg>
        </button>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        {weekdays.map((w, i) => <span key={i}>{w.slice(0, 2)}</span>)}
      </div>

      <div className="calendar-grid" role="grid" ref={gridRef} onKeyDown={onKeyDown}>
        {days.map((d) => {
          const iso = toISODate(d);
          const outside = d.getMonth() !== month.getMonth();
          const disabled = Boolean(min && iso < min);
          const isStart = iso === range.start;
          const isEnd = iso === range.end;
          const inRange = Boolean(range.start && range.end && iso > range.start && iso < range.end);
          const isFocus = iso === toISODate(focusDay);

          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              className="calendar-day"
              data-outside={outside}
              data-edge={isStart || isEnd}
              data-inrange={inRange}
              data-today={iso === todayISO}
              aria-selected={isStart || isEnd}
              aria-disabled={disabled}
              disabled={disabled}
              // Roving tabindex: izgarada odaklanabilir tek hucre
              tabIndex={isFocus ? 0 : -1}
              onFocus={() => setFocusDay(d)}
              onClick={() => pick(d)}
            >
              <time dateTime={iso}>{d.getDate()}</time>
            </button>
          );
        })}
      </div>
    </div>
  );
}
