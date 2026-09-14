'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { getMessages, type Locale } from '@havre/i18n';
import { Calendar, fromISODate, type DayRange } from './Calendar';

/**
 * TARIH ARALIGI ALANI.
 *
 * Iki native <input type="date"> DOM'da kaliyor ve `name` onlarin uzerinde —
 * form gonderimi degismiyor, JS gelmezse kullanici yine de tarih yazabiliyor.
 * Ozel arayuz yalnizca baglandiktan sonra devreye giriyor ve o inputlarin
 * degerini yaziyor.
 */
export function DateRangeField({
  locale,
  startName,
  endName,
  label,
  defaultStart,
  defaultEnd,
  onChange,
}: {
  locale: Locale;
  startName: string;
  endName: string;
  label: string;
  /** Sonuc sayfasinda aramanin tarihleri geri gosterilir (ISO: 2026-09-20) */
  defaultStart?: string | undefined;
  defaultEnd?: string | undefined;
  /**
   * Secim degisince haber verir. Rezervasyon formu bunu CANLI FIYAT icin
   * kullaniyor: gizli inputlarin degerini okumak yerine (form gonderilene
   * kadar okunamaz) degisikligi yukari bildiriyoruz.
   */
  onChange?: ((range: DayRange) => void) | undefined;
}) {
  const m = getMessages(locale);
  const baseId = useId();
  const [enhanced, setEnhanced] = useState(false);
  const [open, setOpen] = useState(false);
  const [range, setRangeState] = useState<DayRange>({
    start: defaultStart || null,
    end: defaultEnd || null,
  });
  const setRange = (next: DayRange) => {
    setRangeState(next);
    onChange?.(next);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setEnhanced(true), []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
  const startDate = fromISODate(range.start);
  const endDate = fromISODate(range.end);

  const summary = startDate
    ? endDate
      ? `${fmt.format(startDate)} – ${fmt.format(endDate)}`
      : fmt.format(startDate)
    : m.search.dates;

  // Gecmise rezervasyon yapilamaz.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="daterange-root" ref={rootRef}>
      <input type="hidden" name={startName} value={range.start ?? ''} />
      <input type="hidden" name={endName} value={range.end ?? ''} />

      {!enhanced && (
        // JS yokken: iki duz tarih alani. Native takvim acilir ama form calisir.
        <span className="daterange-fallback">
          <input type="date" name={startName} defaultValue={defaultStart ?? ''} aria-label={`${label} — 1`} />
          <input type="date" name={endName} defaultValue={defaultEnd ?? ''} aria-label={`${label} — 2`} />
        </span>
      )}

      {enhanced && (
        <>
          <button
            ref={triggerRef}
            type="button"
            className="select-trigger"
            aria-expanded={open}
            aria-haspopup="dialog"
            aria-label={label}
            onClick={() => setOpen((o) => !o)}
          >
            <span className={range.start ? undefined : 'select-placeholder'}>{summary}</span>
            {/* select-caret DEGIL: o sinif acilinca 180 derece donuyor,
                takvim ikonu icin anlamsiz. */}
            <svg className="field-icon" width="17" height="17" viewBox="0 0 20 20" fill="none"
              stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              <rect x="3" y="4.5" width="14" height="13" rx="2.4" />
              <path d="M3 8.5h14M7 3v3M13 3v3" strokeLinecap="round" />
            </svg>
          </button>

          {open && (
            <div className="daterange-panel" role="dialog" aria-label={label} id={`${baseId}-panel`}>
              <div className="daterange-fields">
                <span className="daterange-field">
                  <span className="daterange-field-label">
                    {locale === 'fr-CA' ? 'Arrivée' : 'Start'}
                  </span>
                  <span className="daterange-field-value">
                    {startDate ? fmt.format(startDate) : '—'}
                  </span>
                </span>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"
                  style={{ color: 'var(--color-ink-muted)' }}>
                  <path d="M4 10h12m-4-4 4 4-4 4" />
                </svg>
                <span className="daterange-field">
                  <span className="daterange-field-label">
                    {locale === 'fr-CA' ? 'Départ' : 'End'}
                  </span>
                  <span className="daterange-field-value">
                    {endDate ? fmt.format(endDate) : '—'}
                  </span>
                </span>
              </div>

              <Calendar
                locale={locale}
                range={range}
                minDate={today}
                onSelect={(next) => {
                  setRange(next);
                  // Aralik tamamlandiginda paneli kapat — kullanici bitirdi.
                  if (next.start && next.end) {
                    setOpen(false);
                    triggerRef.current?.focus();
                  }
                }}
                onEscape={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              />

              <div className="daterange-actions">
                <button type="button" className="btn btn-ghost"
                  onClick={() => setRange({ start: null, end: null })}>
                  {locale === 'fr-CA' ? 'Effacer' : 'Clear'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
