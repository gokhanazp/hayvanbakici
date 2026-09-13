'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

/**
 * SECIM KUTUSU.
 *
 * NEDEN KENDIMIZ YAZIYORUZ: tarayicinin <select> acilir listesi isletim
 * sisteminin cizdigi bir menudur — CSS ile bicimlendirilemez. macOS'ta koyu
 * gri zemin ve mavi secim rengiyle geliyordu; sayfanin geri kalaniyla hicbir
 * iliskisi yok.
 *
 * KAYNAK GERCEK HALA NATIVE <select>:
 * Gercek <select> DOM'da kaliyor ve `name` onun uzerinde. Ozel arayuz
 * yalnizca onun degerini yaziyor. Bunun iki faydasi var:
 *   1) Form gonderimi degismiyor — FormData ayni sekilde calisiyor.
 *   2) JavaScript yuklenmeden once (ya da hic yuklenmezse) native select
 *      gorunur ve calisir; ozel arayuz yalnizca bagland─▒ktan SONRA devreye
 *      giriyor. Onboarding sihirbazi boylece JS'siz de kullanilabilir kaliyor.
 *
 * ERISILEBILIRLIK (AODA, WCAG 2.2 AA): ARIA combobox/listbox kalibi —
 * roller, ok tuslari, Home/End, Esc, harfle arama ve odak yonetimi.
 * Yanlis yazilmis ozel bir acilir liste, native olandan DAHA kotudur;
 * bu yuzden kalibin tamami uygulandi.
 */

export interface SelectOption {
  value: string;
  label: string;
  /** Ikinci satir — hizmet aciklamasi gibi */
  description?: string | undefined;
  icon?: ReactNode | undefined;
}

export function Select({
  name,
  value,
  onChange,
  options,
  id,
  required,
  placeholder,
  disabled,
  ariaLabel,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  id?: string | undefined;
  required?: boolean | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  ariaLabel?: string | undefined;
}) {
  const fallbackId = useId();
  const selectId = id ?? fallbackId;
  const listId = `${selectId}-list`;

  /**
   * `enhanced` yalnizca baglandiktan (mount) sonra true oluyor.
   * Sunucuda uretilen HTML'de native select gorunur durumda — JS gelmezse
   * kullanici yine de secim yapabiliyor.
   */
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => setEnhanced(true), []);

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: '', at: 0 });

  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    setActive(selectedIndex);

    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, selectedIndex]);

  // Aktif secenek her zaman gorunur olmali — uzun listelerde klavye
  // gezinmesi aksi halde ekranin disina cikiyor.
  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setActive((i) => Math.min(options.length - 1, i + 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((i) => Math.max(0, i - 1));
        break;
      case 'Home':
        e.preventDefault();
        setActive(0);
        break;
      case 'End':
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        choose(active);
        break;
      case 'Tab':
        setOpen(false);
        break;
      default: {
        // Harfle arama — native select'in yaptigi sey; kullanici bekliyor.
        if (e.key.length !== 1) return;
        const now = Date.now();
        const t = typeahead.current;
        t.text = now - t.at > 600 ? e.key : t.text + e.key;
        t.at = now;
        const found = options.findIndex((o) =>
          o.label.toLowerCase().startsWith(t.text.toLowerCase()));
        if (found >= 0) setActive(found);
      }
    }
  }

  return (
    <div className="select-root" ref={rootRef}>
      {/*
        KAYNAK GERCEK. name burada; form bu elemani okuyor.
        JS baglandiktan sonra gizleniyor ama DOM'da kaliyor.
      */}
      <select
        id={selectId}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={enhanced ? 'select-native-hidden' : 'select-native'}
        aria-hidden={enhanced ? 'true' : undefined}
        tabIndex={enhanced ? -1 : undefined}
        aria-label={ariaLabel}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {enhanced && (
        <>
          <button
            ref={buttonRef}
            type="button"
            className="select-trigger"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-haspopup="listbox"
            aria-labelledby={ariaLabel ? undefined : `${selectId}-label`}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => setOpen((o) => !o)}
            onKeyDown={onKeyDown}
          >
            <span className={value ? undefined : 'select-placeholder'}>
              {value ? selected?.label : (placeholder ?? '—')}
            </span>
            <svg className="select-caret" width="16" height="16" viewBox="0 0 16 16" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </button>

          {open && (
            <ul
              ref={listRef}
              id={listId}
              role="listbox"
              className="select-list"
              tabIndex={-1}
              aria-activedescendant={`${selectId}-opt-${active}`}
            >
              {options.map((o, i) => {
                const isSelected = o.value === value;
                return (
                  <li
                    key={o.value}
                    id={`${selectId}-opt-${i}`}
                    role="option"
                    aria-selected={isSelected}
                    data-active={i === active}
                    className="select-option"
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(i)}
                  >
                    <span className={`select-check${isSelected ? ' select-check-on' : ''}`} aria-hidden="true">
                      {isSelected && (
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                          strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m3.5 8.5 3 3 6-7" />
                        </svg>
                      )}
                    </span>
                    <span className="select-option-body">
                      <span className="select-option-label">{o.label}</span>
                      {o.description && <span className="select-option-sub">{o.description}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
