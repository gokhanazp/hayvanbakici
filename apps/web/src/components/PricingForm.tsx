'use client';

import { useActionState, useState } from 'react';
import { getMessages, segmentFor, type Locale, type Messages } from '@havre/i18n';
import {
  MAX_EXTRA_PET_CENTS, MAX_HOLIDAY_PCT, MAX_PRICE_CENTS, MIN_PRICE_CENTS,
  SERVICES, type CommissionConfig, type ProvinceCode, type ServiceType,
} from '@havre/core';
import type { PriceRange } from '@havre/db';
import { Select } from '@/components/ui/Select';
import { NetEarnings, rangeHint } from '@/components/onboarding/StepForms';
import { ServiceIcon, SERVICE_TILE } from '@/components/ServiceIcon';
import type { PricesState } from '@/app/[locale]/account/sitter/prices/actions';

/**
 * UCRET DUZENLEME — bakici panelinde.
 *
 * Bakici ucretlerini yalnizca BASVURU SIHIRBAZINDA belirleyebiliyordu.
 * Onaylandiktan sonra fiyatini degistirmek icin "Bakici olun"
 * sihirbazina geri donmesi gerekiyordu: ust bandinda "Adim 3 / 6",
 * sonunda "Basvurumu gonder" yazan bir akis. Zaten yayinda olan biri
 * icin hem yanlis hem urkutucu — ve bir pazar yerinde fiyat
 * degistirmek istisna degil, rutin.
 *
 * NET KAZANC SATIRI AYNI BILESEN (`NetEarnings`). Sihirbazda gosterilen
 * rakamla burada gosterilen rakamin ayni koddan gelmesi sart; iki ayri
 * hesap, ayni bakiciya iki farkli net kazanc gosterirdi.
 *
 * HIZMET EKLEME/CIKARMA BURADA YOK. O karar profilin bicimini
 * degistiriyor (kabul edilen turler, kilo kademeleri, dogrulama) ve
 * sihirbazda kaliyor. Fiyat degistirmek isteyen bakicinin yanlislikla
 * bir hizmeti kapatmasi bu formda mumkun degil.
 */
interface Row {
  serviceType: string;
  priceCents: number;
  extraPetPriceCents: number;
  holidaySurchargePct: number;
  cancellationPolicy: string;
}

interface Draft {
  price: string;
  extraPet: string;
  holiday: string;
  cancellation: string;
}

function toDraft(r: Row): Draft {
  return {
    price: String(r.priceCents / 100),
    /* 0 BOS gosteriliyor: "0" yazili bir kutu doldurulmasi gereken bir
       alan gibi duruyor, bosluk "bir sey istemiyorum" demek. */
    extraPet: r.extraPetPriceCents ? String(r.extraPetPriceCents / 100) : '',
    holiday: r.holidaySurchargePct ? String(r.holidaySurchargePct) : '',
    cancellation: r.cancellationPolicy,
  };
}

export function PricingForm({
  locale, rows, ranges, province, promoEndsAt, commission, action, setupHref,
}: {
  locale: Locale;
  rows: Row[];
  ranges: Record<string, PriceRange>;
  province: ProvinceCode | null;
  promoEndsAt: string | null;
  commission: CommissionConfig;
  action: (prev: PricesState, form: FormData) => Promise<PricesState>;
  setupHref: string;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<PricesState, FormData>(action, {});
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(rows.map((r) => [r.serviceType, toDraft(r)])),
  );

  function patch(type: string, change: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [type]: { ...(prev[type] as Draft), ...change } }));
  }

  const err = (k: string): string | undefined => {
    const code = state.errors?.[k];
    if (!code) return undefined;
    return (m.prices[`error.${code}` as keyof Messages['prices']] as string) ?? code;
  };

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      {/*
        YURUYEN REZERVASYONLARIN SABIT OLDUGU, KAYDETMEDEN ONCE yaziyor.
        Rezervasyon satiri kendi fiyatini talep aninda yaziyor ve her
        ekran o satirdan okuyor — yani bekleyen bir talep, sahibinin
        gordugu fiyatla kaliyor. Bunu soylemezsek bakici, bekleyen
        talepleri bozmaktan korkup fiyatina hic dokunmaz.
      */}
      <p className="notice">{m.prices.frozenNote}</p>

      {state.error && (
        <p className="alert alert-error" role="alert">
          {(m.prices[`error.${state.error}` as keyof Messages['prices']] as string) ?? state.error}
        </p>
      )}
      {state.saved && (
        <p className="alert alert-success" role="status">{m.prices.saved}</p>
      )}

      <div className="grid" style={{ gap: 'var(--space-3)' }}>
        {rows.map((r, i) => {
          const type = r.serviceType as ServiceType;
          const d = drafts[r.serviceType] as Draft;
          const unit = m.unit[SERVICES[type].unit];

          return (
            <div key={r.serviceType} className="service-card price-card">
              <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
                <span className={`tile tile-sm ${SERVICE_TILE[i % SERVICE_TILE.length]}`}>
                  <ServiceIcon service={type} size={20} />
                </span>
                <h2 className="text-h4" style={{ margin: 0 }}>{m.service[type]}</h2>
              </div>

              <div className="service-detail">
                <div className="field-block">
                  <label htmlFor={`price-${type}`}>{m.prices.price}</label>
                  <span className="price-input">
                    <span aria-hidden="true">$</span>
                    <input
                      id={`price-${type}`} name={`price.${type}`} type="number"
                      min={MIN_PRICE_CENTS / 100} max={MAX_PRICE_CENTS / 100} step="1"
                      inputMode="decimal" required
                      value={d.price}
                      onChange={(e) => patch(r.serviceType, { price: e.target.value })}
                      aria-describedby={`price-hint-${type}`}
                    />
                    <span className="dim text-body-sm">/ {unit}</span>
                  </span>
                  {/* Piyasa araligi GERCEK veriden; ornek kucukse hicbir
                      rakam yazmiyor (bkz. rangeHint). */}
                  <span className="field-hint" id={`price-hint-${type}`}>
                    {rangeHint(m, locale, ranges[r.serviceType])}
                  </span>
                  <NetEarnings
                    locale={locale} type={type} price={d.price}
                    province={province} promoEndsAt={promoEndsAt} commission={commission}
                  />
                  {err(`price.${type}`) && (
                    <span className="field-error" role="alert">{err(`price.${type}`)}</span>
                  )}
                </div>

                <div className="field-row extra-fees">
                  <div className="field-block">
                    <label htmlFor={`extra-${type}`}>{m.prices.extraPet}</label>
                    <span className="price-input">
                      <span aria-hidden="true">$</span>
                      <input
                        id={`extra-${type}`} name={`extraPet.${type}`} type="number"
                        min={0} max={MAX_EXTRA_PET_CENTS / 100} step="1" inputMode="decimal"
                        value={d.extraPet}
                        onChange={(e) => patch(r.serviceType, { extraPet: e.target.value })}
                      />
                      <span className="dim text-body-sm">/ {unit}</span>
                    </span>
                    {err(`extraPet.${type}`) && (
                      <span className="field-error" role="alert">{err(`extraPet.${type}`)}</span>
                    )}
                  </div>

                  <div className="field-block">
                    <label htmlFor={`hol-${type}`}>{m.prices.holiday}</label>
                    <span className="price-input">
                      <input
                        id={`hol-${type}`} name={`holiday.${type}`} type="number"
                        min={0} max={MAX_HOLIDAY_PCT} step="1" inputMode="numeric"
                        value={d.holiday}
                        onChange={(e) => patch(r.serviceType, { holiday: e.target.value })}
                      />
                      <span aria-hidden="true">%</span>
                    </span>
                    {err(`holiday.${type}`) && (
                      <span className="field-error" role="alert">{err(`holiday.${type}`)}</span>
                    )}
                  </div>
                </div>

                <div className="field-block">
                  <label htmlFor={`cxl-${type}`}>{m.prices.cancellation}</label>
                  <Select
                    id={`cxl-${type}`} name={`cancellation.${type}`} value={d.cancellation}
                    onChange={(next) => patch(r.serviceType, { cancellation: next })}
                    options={(['flexible', 'moderate', 'strict'] as const).map((p) => ({
                      value: p,
                      label: m.onboarding[`cancellation.${p}` as keyof Messages['onboarding']] as string,
                    }))}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/*
        KAYDET DUGMESI YAPISKAN.

        Dort hizmeti olan bir bakicide form iki ekran boyu suruyor ve
        dugme en altta kaliyordu: ilk karttaki fiyati degistiren kisi
        kaydetmek icin sayfayi sonuna kadar kaydirmak zorundaydi. Simdi
        dugme ekranin altinda duruyor, hangi karta bakiyorsaniz bakin.
      */}
      <div className="price-save">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? m.prices.saving : m.prices.save}
        </button>
      </div>

      {/*
        Hizmet EKLEYIP CIKARMAK buradan degil sihirbazdan. Baglantinin
        yaninda NEDEN oyle oldugu yaziyor — yoksa "neden burada yok"
        sorusu cevapsiz kalir.
      */}
      <p className="field-hint" style={{ marginTop: 'var(--space-6)' }}>
        {m.prices.changeServicesHint}{' '}
        <a href={setupHref}>{m.prices.changeServices}</a>
      </p>
    </form>
  );
}
