'use client';

import { useMemo, useState } from 'react';
import type { Locale } from '@havre/i18n';
import { Select } from './Select';

/**
 * DOGUM TARIHI — gun / ay / yil olarak uc secim kutusu.
 *
 * NEDEN TAKVIM DEGIL: takvimle dogum tarihi girmek, otuz yil geriye aya ay
 * tiklamak demek. Uc kutu hem daha hizli hem de tarayicinin kendi tarih
 * secicisini tamamen devre disi birakiyor.
 *
 * Deger tek bir gizli alanda YYYY-MM-DD olarak tutuluyor; sunucu tarafi
 * (validateAbout) degismiyor.
 */
export function DateOfBirthField({
  locale,
  name,
  value,
  onChange,
  id,
}: {
  locale: Locale;
  name: string;
  /** YYYY-MM-DD ya da bos */
  value: string;
  onChange: (value: string) => void;
  id?: string | undefined;
}) {
  /*
    PARCALAR AYRI STATE'TE TUTULUYOR — bilincli.
    Ilk surumde uc parca `value`'dan turetiliyordu; ama value ancak UCU DE
    dolunca olusuyor. Kullanici gunu sectiginde value bos kaliyor, sonra ayi
    sectiginde gun bilgisi zaten kaybolmus oluyordu. Sonuc: uc kutuyu da
    doldurup bos bir alan elde ediyordunuz.
  */
  const initial = value ? value.split('-') : [];
  const [parts, setParts] = useState({
    y: initial[0] ?? '',
    mo: initial[1] ?? '',
    d: initial[2] ?? '',
  });
  const { y, mo, d } = parts;

  const months = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: 'long' });
    return Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1).padStart(2, '0'),
      label: fmt.format(new Date(2024, i, 1)),
    }));
  }, [locale]);

  const thisYear = new Date().getFullYear();
  // 18 yas siniri sunucuda; burada 16'ya kadar gosteriyoruz ki kullanici
  // "yilim listede yok" diye takilmasin, red gerekcesini acikca gorsun.
  const years = Array.from({ length: 90 }, (_, i) => String(thisYear - 16 - i));

  const daysInMonth = y && mo ? new Date(Number(y), Number(mo), 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));

  function emit(next: Partial<typeof parts>) {
    const merged = { ...parts, ...next };

    if (merged.d && merged.mo && merged.y) {
      // Ay kisalinca gun tasabilir: 31 Mart secilip sonra Subat'a gecilirse 28'e cek.
      const max = new Date(Number(merged.y), Number(merged.mo), 0).getDate();
      merged.d = String(Math.min(Number(merged.d), max)).padStart(2, '0');
    }

    setParts(merged);
    onChange(merged.d && merged.mo && merged.y
      ? `${merged.y}-${merged.mo}-${merged.d}`
      : '');
  }

  const labels = locale === 'fr-CA'
    ? { day: 'Jour', month: 'Mois', year: 'Année' }
    : { day: 'Day', month: 'Month', year: 'Year' };

  return (
    <div className="dob-field" id={id}>
      <input type="hidden" name={name} value={value} />
      <Select
        name={`${name}-day`} ariaLabel={labels.day} value={d} placeholder={labels.day}
        options={days.map((x) => ({ value: x, label: String(Number(x)) }))}
        onChange={(next) => emit({ d: next })}
      />
      <Select
        name={`${name}-month`} ariaLabel={labels.month} value={mo} placeholder={labels.month}
        options={months}
        onChange={(next) => emit({ mo: next })}
      />
      <Select
        name={`${name}-year`} ariaLabel={labels.year} value={y} placeholder={labels.year}
        options={years.map((x) => ({ value: x, label: x }))}
        onChange={(next) => emit({ y: next })}
      />
    </div>
  );
}
