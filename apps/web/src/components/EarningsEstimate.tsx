'use client';

import { useId, useState } from 'react';
import { getMessages, interpolate, unitLabel, type Locale, type Messages } from '@havre/i18n';
import { money } from '@/lib/format';

/**
 * KAZANC TAHMINI.
 *
 * Tasarimda ("become a sitter") sagda bir hesaplayici var ve
 * "tahmini aylik 3 240 $ CAD" yaziyor. O rakam UYDURMA olurdu:
 * henuz tek bir odeme yapmadik, ortalama diye gosterecek verimiz
 * yok ve bir kazanc rakami vaat etmek bakiciyi en kirilgan
 * yerinden yakalar. Kanada'da gelir iddialari ayrica
 * KANITLANABILIR olmak zorunda.
 *
 * Bu hesaplayici farkli: ekranda cikan rakam BIZIM degil,
 * KULLANICININ kendi varsayimi. Iki girdi var — kendi koydugu ucret
 * ve haftada kac is yapacagini dusundugu — ve ciktinin tek yaptigi
 * sey o iki sayiyi bizim GERCEK komisyon oranlarimizla carpmak.
 *
 * UC SATIR CIKIYOR, BIR TANE DEGIL. Ayni is, musterinin nereden
 * geldigine gore farkli oranda kesinti goruyor. Tek bir "aylik
 * kazanciniz" rakami en iyi senaryoyu secip digerlerini saklamak
 * olurdu; uc satir, sayfanin asil iddiasini da somutlastiriyor:
 * kendi musterinden hicbir sey almiyoruz.
 *
 * Oranlar SUNUCUDAN geliyor (yonetici panelinden degisebiliyor),
 * burada sabit yazilmadi: panelden oran degistiginde burasi eski
 * rakami gosterirse sayfa yalan soyler.
 *
 * Sayfadaki TEK istemci bileseni bu. Girdiler JS olmadan da
 * okunabilir durumda kaliyor (input'lar gercek form ogeleri,
 * baslangic degerleri sunucudan basili geliyor); yalnizca canli
 * yeniden hesaplama JS istiyor.
 */
export function EarningsEstimate({
  locale, unit, defaultRateCents, rates,
}: {
  locale: Locale;
  /** 'night' | 'walk' | ... — bakicinin hizmetinin birimi, cogullanabilir */
  unit: keyof Messages['unit'];
  /** Sehirdeki medyan fiyat: bos bir kutu yerine gercek bir baslangic */
  defaultRateCents: number;
  /** GERCEK komisyon oranlari — etiketiyle birlikte, sunucudan */
  rates: ReadonlyArray<{ pct: number; label: string }>;
}) {
  const m = getMessages(locale);
  const s = m.sitterLanding;
  const rateId = useId();
  const weekId = useId();

  const [rate, setRate] = useState(Math.max(1, Math.round(defaultRateCents / 100)));
  const [perWeek, setPerWeek] = useState(4);

  /* 52 hafta / 12 ay — ay basina ortalama 4,333 hafta. */
  const monthlyGross = Math.round(rate * perWeek * (52 / 12)) * 100;

  return (
    <div className="ee">
      <div className="ee-head">
        <h3 className="ee-title">{s['calc.title']}</h3>
        <p className="ee-lead">{s['calc.lead']}</p>
      </div>

      <div className="ee-fields">
        <div className="ee-field">
          <label htmlFor={rateId}>
            {interpolate(s['calc.rate'], { unit: unitLabel(locale, unit, 1) })}
          </label>
          {/*
            PARA ISARETI TARAFI DILE GORE. Fransizcada simge sayinin
            SONUNA gelir ("56 $"); kutunun soluna koymak sayfadaki
            butun diger tutarlarla celisiyordu.
          */}
          <div className={`ee-input${locale === 'fr-CA' ? ' ee-input-suffix' : ''}`}>
            {locale !== 'fr-CA' && <span aria-hidden="true">$</span>}
            <input
              id={rateId}
              type="number"
              inputMode="numeric"
              min={5}
              max={500}
              step={1}
              value={rate}
              onChange={(e) => setRate(Math.min(500, Math.max(0, Number(e.target.value) || 0)))}
            />
            {locale === 'fr-CA' && <span aria-hidden="true">$</span>}
          </div>
        </div>

        <div className="ee-field">
          <label htmlFor={weekId}>{s['calc.perWeek']}</label>
          <input
            id={weekId}
            className="ee-range"
            type="range"
            min={1}
            max={14}
            step={1}
            value={perWeek}
            onChange={(e) => setPerWeek(Number(e.target.value))}
          />
          <span className="ee-week-value tabular">
            {interpolate(s['calc.perWeekValue'], {
              count: perWeek,
              unit: unitLabel(locale, unit, perWeek),
            })}
          </span>
        </div>
      </div>

      {/*
        BRUT once, KESINTI sonra. Tersi (once "kazanciniz" yazip
        altina kucuk harfle kesintiyi koymak) rakami buyuk gosterme
        numarasidir; burada sayfanin iddiasi zaten kesintinin kendisi.

        aria-live: rakam girdi degisince yeniden hesaplaniyor ama
        odak girdide kaliyor — ekran okuyucu yoksa degisimi duymaz.
      */}
      <div className="ee-out" aria-live="polite">
        <div className="ee-gross">
          <span>{s['calc.gross']}</span>
          <strong className="tabular">{money(monthlyGross, locale)}</strong>
        </div>

        <p className="ee-keep">{s['calc.keep']}</p>
        <ul className="ee-rows">
          {rates.map((r) => (
            <li key={r.label} className={r.pct === 0 ? 'is-free' : undefined}>
              <span className="ee-row-label">
                {r.label}
                <span className="ee-row-pct tabular">
                  {r.pct === 0
                    ? s['calc.noFee']
                    : interpolate(s['calc.fee'], { pct: r.pct })}
                </span>
              </span>
              <strong className="tabular">
                {money(Math.round(monthlyGross * (1 - r.pct / 100)), locale)}
              </strong>
            </li>
          ))}
        </ul>
      </div>

      {/*
        UYARI SILINEMEZ. Rakam kullanicinin kendi varsayimindan
        cikiyor; bunu yazmazsak sayfa bir gelir vaadi gibi okunur.
      */}
      <p className="ee-note">{s['calc.note']}</p>
    </div>
  );
}
