'use client';

import { useActionState, useState } from 'react';
import { getMessages, interpolate, segmentFor, unitLabel, type Locale, type Messages } from '@havre/i18n';
import {
  SERVICES, calculateQuote, holidayUnitsBetween, type ProvinceCode, type ServiceType,
} from '@havre/core';
import { petLabel } from './PetLine';
import { Select } from '@/components/ui/Select';
import { DateRangeField } from '@/components/ui/DateRangeField';
import { money } from '@/lib/format';
import type { RequestState } from '@/app/[locale]/[city]/sitter/[slug]/book/actions';

export interface BookableService {
  serviceType: ServiceType;
  priceCents: number;
  extraPetPriceCents: number;
  holidaySurchargePct: number;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
}

/**
 * FIYAT DOKUMU TABLOSU.
 *
 * Iki yerde ayni sekilde cizilyor: tarih secildikten sonraki GERCEK
 * tutar ve tarih secilmeden gosterilen ORNEK. Ikisinin ayni tabloyu
 * paylasmasi bilincli — ornekte gizli kalem olmadigini kullanici
 * bicimden de goruyor (drip pricing yasagi, Competition Act).
 */
function QuoteTable({
  locale, quote, units, petCount, unitPriceCents, unit, heading, note, muted = false,
}: {
  locale: Locale;
  quote: ReturnType<typeof calculateQuote>;
  units: number;
  petCount: number;
  unitPriceCents: number;
  unit: keyof Messages['unit'];
  heading: string;
  note: string;
  /** Ornek hesap: gercek tutarla karistirilmasin diye daha soluk */
  muted?: boolean;
}) {
  const m = getMessages(locale);
  const line = (key: string) => quote.lines.find((l) => l.key === key)?.amountCents ?? 0;

  return (
    <div className={`card card-pad${muted ? ' card-muted' : ''}`}>
      <h2 className="text-h4">{heading}</h2>
      <table style={{ width: '100%', marginTop: 'var(--space-4)', fontSize: '0.875rem' }}>
        <tbody>
          <tr>
            <td style={{ padding: 'var(--space-1) 0' }}>
              {money(unitPriceCents, locale)} × {units} {unitLabel(locale, unit, units)}
            </td>
            <td className="tabular" style={{ textAlign: 'right' }}>
              {money(line('quote.base'), locale)}
            </td>
          </tr>
          {petCount > 1 && (
            <tr>
              <td style={{ padding: 'var(--space-1) 0' }}>{m.quote.extraPets}</td>
              <td className="tabular" style={{ textAlign: 'right' }}>
                {money(line('quote.extraPets'), locale)}
              </td>
            </tr>
          )}
          {/*
            TATIL ZAMMI SATIRI. Yoktu: tutar toplama giriyordu ama
            dokumde gorunmuyordu, yani ekrandaki kalemler toplami ile
            "Toplam" tutmuyordu. Competition Act §8.6'nin yasakladigi sey
            tam olarak bu — toplamda olup dokumde olmayan ucret.
          */}
          {line('quote.holidaySurcharge') > 0 && (
            <tr>
              <td style={{ padding: 'var(--space-1) 0' }}>{m.quote.holidaySurcharge}</td>
              <td className="tabular" style={{ textAlign: 'right' }}>
                {money(line('quote.holidaySurcharge'), locale)}
              </td>
            </tr>
          )}
          <tr>
            <td style={{ padding: 'var(--space-1) 0' }}>{m.quote.serviceFee}</td>
            <td className="tabular" style={{ textAlign: 'right' }}>{money(quote.ownerFeeCents, locale)}</td>
          </tr>
          <tr>
            <td className="dim" style={{ padding: 'var(--space-1) 0' }}>{m.quote.tax}</td>
            <td className="tabular dim" style={{ textAlign: 'right' }}>{money(quote.ownerTaxCents, locale)}</td>
          </tr>
          <tr style={{ borderTop: '1px solid var(--color-border)' }}>
            <th scope="row" style={{ padding: 'var(--space-3) 0', textAlign: 'left' }}>{m.quote.total}</th>
            <td className="tabular text-h4" style={{ textAlign: 'right' }}>
              {money(quote.ownerTotalCents, locale)}
            </td>
          </tr>
        </tbody>
      </table>
      <p className="field-hint" style={{ marginTop: 'var(--space-3)' }}>{note}</p>
    </div>
  );
}

/**
 * REZERVASYON TALEBI FORMU.
 *
 * Fiyat CANLI hesaplaniyor (packages/core/calculateQuote) — Competition
 * Act'in drip pricing yasagi: kullanici talebi gondermeden ONCE odeyecegi
 * TAM tutari gormeli, sonradan eklenen kalem olmamali.
 *
 * Hesap istemcide yapiliyor ama BAGLAYICI DEGIL: sunucu ayni hesabi
 * bakicinin guncel fiyatiyla tekrar yapiyor ve kaydedilen tutar o.
 * Musteri tarafindaki toplam komisyon oranindan BAGIMSIZ (komisyon
 * bakicidan kesilir), bu yuzden istemcinin atif oranini bilmesi gerekmiyor.
 */
export function BookingForm({
  locale, sitterId, sitterFirstName, services, initialService, pets, province, action,
}: {
  locale: Locale;
  sitterId: string;
  sitterFirstName: string;
  services: BookableService[];
  /**
   * Formun ACILDIGI hizmet — sunucuda karara baglaniyor.
   *
   * Once ziyaretcinin niyeti (?service=), yoksa vitrin hizmeti. Burada
   * services[0] almak, listenin sirasina gore rastgele bir hizmetle
   * acmak demekti.
   */
  initialService?: ServiceType | undefined;
  pets: Array<{ id: string; name: string; species: string; weightKg: number | null }>;
  province: string;
  action: (prev: RequestState, form: FormData) => Promise<RequestState>;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<RequestState, FormData>(action, {});

  const [serviceType, setServiceType] = useState<ServiceType>(
    initialService ?? services[0]?.serviceType ?? 'boarding',
  );
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [petIds, setPetIds] = useState<string[]>(pets[0] ? [pets[0].id] : []);
  const [addingPet, setAddingPet] = useState(pets.length === 0);

  const svc = services.find((s) => s.serviceType === serviceType) ?? services[0];
  const unit = SERVICES[serviceType].unit;

  // Gece mi gun mu — veri katmanindaki unitsBetween ile AYNI kural
  const units = (() => {
    if (!start || !end) return 0;
    const a = Date.parse(`${start}T00:00:00Z`);
    const b = Date.parse(`${end}T00:00:00Z`);
    if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
    const days = Math.round((b - a) / 86400000);
    return unit === 'night' ? days : days + 1;
  })();

  const petCount = Math.max(petIds.length + (addingPet ? 1 : 0), 1);

  const priceFor = (n: number) =>
    svc
      ? calculateQuote({
          serviceType,
          unitPriceCents: svc.priceCents,
          units: n,
          petCount,
            extraPetPriceCents: svc.extraPetPriceCents,
          holidaySurchargePct: svc.holidaySurchargePct,
          /*
            Tatil zammi YALNIZCA tatile denk gelen birimlerden aliniyor.
            Tarih secilmeden 0 — ornek hesapta tatil zammi gorunmuyor ve
            gorunmemeli de, hangi gunler oldugu belli degil.
          */
          holidayUnits: holidayUnitsBetween(start, end, unit, province as ProvinceCode),
          attribution: 'platform',
          province: province as never,
        })
      : null;

  const quote = units > 0 ? priceFor(units) : null;

  /*
    TARIH SECILMEDEN ORNEK HESAP.

    Sitenin vaadi "her ucreti rezervasyondan ONCE gorursunuz" ama tarih
    secilene kadar ekranda tek bir rakam yoktu — bos bir form ve sonunda
    devre disi bir dugme. Ornek hesap vaadi tarih secmeden tutuyor.

    Ornek birim sayisi hizmetin dogasina gore: cok gunluk hizmetlerde
    uc gece, tek seferliklerde bir. ORNEK OLDUGU acikca yaziyor.
  */
  const sampleUnits = SERVICES[serviceType].multiDay ? 3 : 1;
  const sample = quote ? null : priceFor(sampleUnits);

  const errorText = state.error
    ? ((m.booking[`error.${state.error}` as keyof Messages['booking']] as string) ?? state.error)
    : undefined;

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="sitterId" value={sitterId} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />
      <input type="hidden" name="service" value={serviceType} />

      {errorText && <p className="alert alert-error" role="alert">{errorText}</p>}

      {services.length > 1 && (
        <div className="field-block">
          <label htmlFor="svc">{m.search.service}</label>
          <Select
            id="svc" name="serviceLabel" value={serviceType}
            onChange={(v) => setServiceType(v as ServiceType)}
            options={services.map((s) => ({
              value: s.serviceType,
              label: `${m.service[s.serviceType]} — ${money(s.priceCents, locale)} / ${m.unit[SERVICES[s.serviceType].unit]}`,
            }))}
          />
        </div>
      )}

      <div className="field-block">
        <span className="field-label-static">{m.booking.dates}</span>
        <DateRangeField
          locale={locale} startName="start" endName="end" label={m.booking.dates}
          onChange={(r) => { setStart(r.start ?? ''); setEnd(r.end ?? ''); }}
        />
      </div>

      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="field-label-static" style={{ marginBottom: 'var(--space-2)' }}>
          {m.booking.pets}
        </legend>
        <div className="stack">
          {pets.map((p) => (
            <label key={p.id} className="checkbox-row">
              <input
                type="checkbox" name="petId" value={p.id}
                checked={petIds.includes(p.id)}
                onChange={(e) => setPetIds((cur) =>
                  e.target.checked ? [...cur, p.id] : cur.filter((x) => x !== p.id))}
              />
              <span>{petLabel(p, locale)}</span>
            </label>
          ))}

          {!addingPet && (
            <button type="button" className="btn btn-ghost" onClick={() => setAddingPet(true)}>
              + {m.booking.addPet}
            </button>
          )}
        </div>

        {addingPet && (
          <div className="field-row" style={{ marginTop: 'var(--space-4)' }}>
            <div className="field-block">
              <label htmlFor="newPetName">{m.booking.petName}</label>
              <input id="newPetName" name="newPetName" required />
            </div>
            <div className="field-block field-narrow">
              <label htmlFor="newPetWeight">{m.booking.petWeight}</label>
              <input id="newPetWeight" name="newPetWeight" type="number" min="0" max="120" step="0.5" />
            </div>
            <div className="field-block">
              <label htmlFor="newPetSpecies">{m.booking.petSpecies}</label>
              <Select
                id="newPetSpecies" name="newPetSpecies" value="dog"
                options={[
                  { value: 'dog', label: m.onboarding['services.dogs'] },
                  { value: 'cat', label: m.onboarding['services.cats'] },
                  { value: 'other', label: m.onboarding['services.other'] },
                ]}
              />
            </div>
          </div>
        )}
      </fieldset>

      <div className="field-block">
        <label htmlFor="notes">{m.booking.notes}</label>
        <textarea id="notes" name="notes" rows={4} className="textarea" />
        <span className="field-hint">{m.booking.notesHint}</span>
      </div>

      {/* --- Fiyat: gonder dugmesinin USTUNDE --- */}
      {quote && (
        <QuoteTable
          locale={locale} quote={quote} units={units} petCount={petCount}
          unitPriceCents={svc!.priceCents} unit={unit}
          heading={m.booking.priceHeading} note={m.booking.priceNote}
        />
      )}
      {sample && (
        <QuoteTable
          locale={locale} quote={sample} units={sampleUnits} petCount={petCount}
          unitPriceCents={svc!.priceCents} unit={unit}
          heading={interpolate(m.booking.sampleHeading, {
            units: sampleUnits, unit: unitLabel(locale, unit, sampleUnits),
          })}
          note={m.booking.sampleNote}
          muted
        />
      )}

      <div className="notice notice-warning">
        <p>{m.booking.noPayment}</p>
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={busy || units === 0}>
        {busy ? m.booking.submitting : m.booking.submit}
      </button>
      {/*
        DEVRE DISI DUGME NEDENINI SOYLUYOR. Eskiden tarih secilmeden
        dugme sessizce tiklanamiyordu; kullanici neyin eksik oldugunu
        bilmiyordu.
      */}
      {units === 0 && <p className="field-hint">{m.booking.needDates}</p>}
      <p className="field-hint">
        {sitterFirstName} · {m.booking.policy}:{' '}
        {m.onboarding[`cancellation.${svc?.cancellationPolicy ?? 'moderate'}` as keyof Messages['onboarding']] as string}
      </p>
    </form>
  );
}
