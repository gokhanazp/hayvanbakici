'use client';

import { useId, useState } from 'react';
import type { Locale } from '@havre/i18n';
import { money } from '@/lib/format';

/**
 * UST FIYAT KAYDIRACI.
 *
 * Referans tasarimda fiyat bir KAYDIRAC ve secilen deger basligin
 * saginda canli yaziyor. Bizde ayrik haplar vardi (30/45/60/80/120):
 * calisiyordu ama tasarimdaki satirla alakasi yoktu.
 *
 * ILERLEMELI ZENGINLESTIRME. Alanin kendisi gercek bir
 * <input type="range">; JavaScript gelmeden de surukleniyor ve GET
 * formuyla gonderiliyor. JavaScript gelince yanindaki rakam
 * suruklerken canli degisiyor. Yani JS olmadan ISLEV kaybi yok,
 * yalnizca okuma kolayligi var.
 *
 * UST SINIR "VE USTU" DEMEK: kaydirac sonuna kadar itildiginde filtre
 * KALKIYOR (sunucu `price >= max` degerini sinirsiz sayiyor). "150 $'a
 * kadar" ile "sinir yok" ayni sey degil ve kaydiracin sonunda
 * kullanici sinir koymak degil kaldirmak istiyor.
 */
export function PriceRange({
  locale, value, min, max, step, unit, label, anyLabel,
}: {
  locale: Locale;
  /** Sunucudan gelen uygulanmis deger; 0 = sinir yok */
  value: number;
  min: number;
  max: number;
  step: number;
  /** "gece", "ziyaret" — fiyatin birimi */
  unit: string;
  label: string;
  /** "Fiyat siniri yok" */
  anyLabel: string;
}) {
  const id = useId();
  const [v, setV] = useState(value > 0 ? value : max);

  /*
    OLCEKTE KURUS YOK. `money()` her zaman iki hane yaziyor ve
    kaydiracin altinda "20,00 $ / 85,00 $ / 150,00 $+" uc kez
    gereksiz sifir demek. Ucundaki rakam bir fiyat degil bir SINIR.
  */
  const round = (cents: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency', currency: 'CAD', maximumFractionDigits: 0,
    }).format(cents / 100);

  return (
    <fieldset className="sr-fset">
      <div className="sr-range-head">
        <label className="sr-leg" htmlFor={id}>{label}</label>
        <span className="sr-range-value tabular">
          {v >= max ? anyLabel : `≤ ${money(v * 100, locale)} / ${unit}`}
        </span>
      </div>
      <input
        id={id}
        className="sr-range"
        type="range"
        name="price"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => setV(Number(e.target.value))}
      />
      {/*
        Olcek: kaydiracin ucu ve ortasi. Kaydirac tek basina "nereden
        nereye" sorusunu cevaplamiyor.
      */}
      <div className="sr-range-scale tabular" aria-hidden="true">
        <span>{round(min * 100)}</span>
        <span>{round(Math.round((min + max) / 2) * 100)}</span>
        <span>{round(max * 100)}+</span>
      </div>
    </fieldset>
  );
}
