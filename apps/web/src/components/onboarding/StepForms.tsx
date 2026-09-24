'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import {
  MAX_EXTRA_PET_CENTS, MAX_HOLIDAY_PCT,
  MAX_PRICE_CENTS, MIN_PRICE_CENTS, MIN_RANGE_SAMPLE, SERVICES, servicesForPhase,
  PET_SIZE_STEPS,
  type CommissionConfig,
  netPerUnit, previousStep,
  type OnboardingStep, type PriceRange, type ProvinceCode, type ServiceType,
} from '@havre/core';
import { getMessages, interpolate, segmentFor, type Locale, type Messages } from '@havre/i18n';
import { ServiceIcon, SERVICE_TILE } from '@/components/ServiceIcon';
import { Select } from '@/components/ui/Select';
import { DateOfBirthField } from '@/components/ui/DateOfBirthField';
import type { StepState } from '@/app/[locale]/become-a-sitter/[step]/actions';

type Action = (prev: StepState, form: FormData) => Promise<StepState>;

const EMPTY: StepState = { errors: {} };

/**
 * ALANLAR NEDEN KONTROLLU (defaultValue degil, value + onChange)?
 *
 * React 19, bir form action'i tamamlandiktan sonra KONTROLSUZ alanlari
 * SIFIRLIYOR. Dogrulama hatasi donduren bir adimda bu, kullanicinin yazdigi
 * her seyin silinmesi demekti — adres alaninda bizzat yasandi. Kontrollu
 * alanlar degeri React state'inde tuttugu icin hata sonrasi form oldugu gibi
 * kaliyor.
 */
function useFields<T extends Record<string, string | boolean | number>>(initial: T) {
  const [values, setValues] = useState<T>(initial);
  const set = <K extends keyof T>(key: K, value: T[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  return [values, set] as const;
}

/** Hata kodunu metne cevirir; kod bulunamazsa genel mesaj. */
function err(m: Messages, code: string | undefined): string | undefined {
  if (!code) return undefined;
  const fromOnboarding = m.onboarding[code as keyof Messages['onboarding']] as string | undefined;
  return fromOnboarding ?? (m.auth['error.generic'] as string);
}

function Field({
  id, label, hint, error, children,
}: {
  id: string; label: string; hint?: string | undefined; error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="field-block">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  );
}

function Actions({
  locale, step, busy, label, disabled = false,
}: {
  locale: Locale; step: OnboardingStep; busy: boolean; label: string;
  /** Ozet adiminda: eksik adim varken gonder dugmesi kapali */
  disabled?: boolean | undefined;
}) {
  const m = getMessages(locale);
  const prev = previousStep(step);
  return (
    <div className="wizard-actions">
      <button type="submit" className="btn btn-primary" disabled={busy || disabled}>
        {busy ? m.auth.submitting : label}
      </button>
      {prev && (
        <Link href={`/${segmentFor(locale)}/become-a-sitter/${prev}/`} className="btn btn-ghost">
          {m.onboarding.back}
        </Link>
      )}
    </div>
  );
}

/** Medyan fiyat, kutunun icinde soluk ornek olarak. */
function suggestion(r: { count: number; medianCents: number } | undefined): string | undefined {
  if (!r || r.count < MIN_RANGE_SAMPLE) return undefined;
  return String(Math.round(r.medianCents / 100));
}

/** "Yakinindaki bakicilar 45-65 $ aliyor · medyan 53 $" — yoksa zorunluluk notu. */
/*
  DISARI ACILDI. Bakicinin ucret sayfasi (account/sitter/prices) AYNI
  yardimciyi kullaniyor: piyasa araligini iki yerde iki ayri sekilde
  hesaplamak, iki ekranin ayni bakiciya farkli rakam gostermesi demekti.
*/
export function rangeHint(
  m: Messages, locale: Locale,
  r: { count: number; p25Cents: number; medianCents: number; p75Cents: number } | undefined,
): string {
  if (!r || r.count < MIN_RANGE_SAMPLE) return m.onboarding['services.priceRequired'];
  const money = (cents: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })
      .format(cents / 100);
  return interpolate(m.onboarding['services.priceRange'], {
    low: money(r.p25Cents), high: money(r.p75Cents), median: money(r.medianCents),
  });
}

/**
 * "SIZ $65 YAZDINIZ — SIZE NE KALIR?"
 *
 * Havre'nin tek gercek farki komisyon seffafligi ama bakici kendi
 * ekraninda net kazancini goremiyordu: fiyat kutusunun yaninda yalnizca
 * "/ gece" yaziyordu. Rakamlar netPerUnit'ten geliyor, o da
 * calculateQuote'u cagiriyor — ekranin soyledigi ile rezervasyonda
 * kesilen AYNI kod.
 *
 * Bos ya da gecersiz fiyatta hicbir sey cizilmiyor: sifirlarla dolu bir
 * tablo, yazmaya yeni baslayan birini urkutur.
 */
export function NetEarnings({
  locale, type, price, province, promoEndsAt, commission,
}: {
  locale: Locale;
  type: ServiceType;
  price: string;
  province: ProvinceCode | null;
  promoEndsAt: string | null;
  /* O an gecerli oran — kampanya varken bakici indirimli kazancini
     gormeli, kaydettikten sonra degil. */
  commission: CommissionConfig;
}) {
  const m = getMessages(locale);
  if (!province) return null;

  const dollarsTyped = Number(price);
  if (!Number.isFinite(dollarsTyped) || dollarsTyped <= 0) return null;
  const cents = Math.round(dollarsTyped * 100);
  if (cents < MIN_PRICE_CENTS || cents > MAX_PRICE_CENTS) return null;

  const promoActive = promoEndsAt !== null && new Date(promoEndsAt).getTime() > Date.now();
  const rows = netPerUnit({
    serviceType: type, unitPriceCents: cents, province, promoActive,
    config: commission,
  });

  const money = (c: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD' }).format(c / 100);
  const unit = m.unit[SERVICES[type].unit];

  return (
    <div className="net-earnings">
      <p className="text-body-sm" style={{ fontWeight: 600, margin: 0 }}>
        {interpolate(m.onboarding['services.net.heading'], { unit })}
      </p>

      {promoActive ? (
        <p className="field-hint" style={{ marginTop: 'var(--space-2)' }}>
          {interpolate(m.onboarding['services.net.promo'], {
            date: new Date(promoEndsAt).toLocaleDateString(locale, {
              year: 'numeric', month: 'long', day: 'numeric',
            }),
          })}
        </p>
      ) : null}

      <dl className="net-list">
        {rows.map((r) => (
          <div key={r.attribution} className="net-row">
            <dt>
              {m.onboarding[`services.net.${r.attribution}` as keyof Messages['onboarding']] as string}
              <span className="dim">
                {' · '}
                {r.commissionPct === 0
                  ? m.onboarding['services.net.noFee']
                  : interpolate(m.onboarding['services.net.fee'], { pct: r.commissionPct })}
              </span>
            </dt>
            <dd>{money(r.netCents)}</dd>
          </div>
        ))}
      </dl>

      <p className="field-hint">{m.onboarding['services.net.tax']}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- hakkinda */

export function AboutForm({
  locale, action, initial,
}: {
  locale: Locale;
  action: Action;
  initial: { firstName: string; lastNameInitial: string; bio: string; phone: string; dateOfBirth: string };
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState(action, EMPTY);
  const [v, set] = useFields(initial);

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      {/* Ad ve bas harf ayni satirda: ikisi tek bir bilgi (isim) ve alt
          alta konunca form gereksiz uzuyordu. */}
      <div className="field-row">
        <Field id="firstName" label={m.auth.name} error={err(m, state.errors.firstName)}>
          <input id="firstName" name="firstName" value={v.firstName} autoComplete="given-name" required
            onChange={(e) => set('firstName', e.target.value)} />
        </Field>

        <div className="field-narrow">
          <Field
            id="lastNameInitial"
            label={m.onboarding['about.lastNameInitial']}
            error={err(m, state.errors.lastNameInitial)}
          >
            <input id="lastNameInitial" name="lastNameInitial" value={v.lastNameInitial}
              maxLength={1} required
              onChange={(e) => set('lastNameInitial', e.target.value)} />
          </Field>
        </div>
      </div>
      <p className="field-hint" style={{ marginTop: 'calc(var(--space-3) * -1)' }}>
        {m.auth.namePrivacy}
      </p>

      <Field
        id="bio"
        label={m.onboarding['about.bio']}
        hint={m.onboarding['about.bioHint']}
        error={err(m, state.errors.bio)}
      >
        <textarea id="bio" name="bio" value={v.bio} rows={5} required className="textarea"
          onChange={(e) => set('bio', e.target.value)} />
      </Field>

      <Field
        id="phone"
        label={m.onboarding['about.phone']}
        hint={m.onboarding['about.phoneHint']}
        error={err(m, state.errors.phone)}
      >
        <input id="phone" name="phone" type="tel" value={v.phone} autoComplete="tel" required
          style={{ maxWidth: '16rem' }}
          onChange={(e) => set('phone', e.target.value)} />
      </Field>

      <Field
        id="dateOfBirth"
        label={m.onboarding['about.dateOfBirth']}
        hint={m.onboarding['about.dateOfBirthHint']}
        error={err(m, state.errors.dateOfBirth)}
      >
        <DateOfBirthField
          locale={locale}
          id="dateOfBirth"
          name="dateOfBirth"
          value={v.dateOfBirth}
          onChange={(next) => set('dateOfBirth', next)}
        />
      </Field>

      <Actions locale={locale} step="about" busy={busy} label={m.onboarding.saveAndContinue} />
    </form>
  );
}

/* ------------------------------------------------------------------ konum */

export interface CityOption { id: string; name: string }
export interface HoodOption { id: string; cityId: string; name: string }

export function LocationForm({
  locale, action, cities, neighbourhoods, initial,
}: {
  locale: Locale;
  action: Action;
  cities: CityOption[];
  neighbourhoods: HoodOption[];
  initial: { cityId: string; neighbourhoodId: string; postalCode: string };
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState(action, EMPTY);
  const [v, set] = useFields({ ...initial, exactAddress: '' });

  const hoods = neighbourhoods.filter((h) => h.cityId === v.cityId);

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      <Field id="cityId" label={m.onboarding['location.city']} error={err(m, state.errors.cityId)}>
        <Select
          id="cityId"
          name="cityId"
          value={v.cityId}
          required
          placeholder="—"
          options={cities.map((c) => ({ value: c.id, label: c.name }))}
          onChange={(next) => {
            set('cityId', next);
            // Sehir degisince mahalle secimi gecersiz kalir; temizlenmezse
            // baska sehrin mahallesi gonderilir ve sunucu reddeder.
            set('neighbourhoodId', '');
          }}
        />
      </Field>

      <Field id="neighbourhoodId" label={m.onboarding['location.neighbourhood']}
        error={err(m, state.errors.neighbourhoodId)}>
        <Select
          id="neighbourhoodId"
          name="neighbourhoodId"
          value={v.neighbourhoodId}
          required
          placeholder="—"
          disabled={hoods.length === 0}
          options={hoods.map((h) => ({ value: h.id, label: h.name }))}
          onChange={(next) => set('neighbourhoodId', next)}
        />
      </Field>

      <Field id="postalCode" label={m.onboarding['location.postalCode']}
        error={err(m, state.errors.postalCode)}>
        <input id="postalCode" name="postalCode" value={v.postalCode}
          autoComplete="postal-code" style={{ maxWidth: '10rem' }} required
          onChange={(e) => set('postalCode', e.target.value)} />
      </Field>

      <Field
        id="exactAddress"
        label={m.onboarding['location.address']}
        hint={m.onboarding['location.addressHint']}
        error={err(m, state.errors.exactAddress)}
      >
        {/* Kayitli adres SIFRELI duruyor ve geri doldurulmuyor — bilincli.
            Cozup tarayiciya gondermek, gereksiz bir sizma yuzeyi acardi. */}
        <input id="exactAddress" name="exactAddress" value={v.exactAddress}
          autoComplete="street-address" required
          onChange={(e) => set('exactAddress', e.target.value)} />
      </Field>

      <p className="notice">{m.onboarding['location.mapNote']}</p>

      <Actions locale={locale} step="location" busy={busy} label={m.onboarding.saveAndContinue} />
    </form>
  );
}

/* --------------------------------------------------------------- hizmetler */

interface ServiceDraft {
  on: boolean;
  price: string;
  cancellation: string;
  dogs: boolean;
  cats: boolean;
  other: boolean;
  /** Bos string = ek ucret yok. "0" yazmakla bos birakmak ayni sey. */
  extraPet: string;
  holiday: string;
  /** Kabul edilen en buyuk kilo — kademe sinirlarindan biri */
  maxKg: string;
}

export function ServicesForm({
  locale, action, initial, ranges = {}, province = null, promoEndsAt = null, commission,
}: {
  locale: Locale;
  action: Action;
  initial: Array<{
    serviceType: string; priceCents: number; cancellationPolicy: string;
    acceptsDogs: boolean; acceptsCats: boolean; acceptsOther: boolean;
    extraPetPriceCents: number; holidaySurchargePct: number;
    acceptedSizeMaxKg: number;
  }>;
  /** Net kazanc satirinin vergisi ile icin — konum adimi bundan once geliyor */
  province?: ProvinceCode | null | undefined;
  /** Lansman promosyonu bitisi; null ise promosyon yok */
  promoEndsAt?: string | null | undefined;
  /**
   * Bakicinin sehrindeki fiyat araliklari.
   *
   * Ekran zaten "cevrenize gore bir aralik oneriyoruz" diyordu ama
   * HICBIR aralik gostermiyordu — tutulmayan bir sozdu. Ornek kucukse
   * (MIN_RANGE_SAMPLE) hicbir sey gosterilmiyor: iki kisinin fiyatindan
   * "cevrenizde su kadar aliniyor" cumlesi kurmak veri degil tahmindir.
   */
  ranges?: Record<string, PriceRange> | undefined;
  /** O an gecerli komisyon — net kazanc satiri bundan hesaplaniyor */
  commission: CommissionConfig;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState(action, EMPTY);

  // Yalnizca v1 hizmetleri. day_care/training/grooming sonraki fazlarda acilacak
  // (packages/core/services.ts icindeki faz tablosu).
  const available = servicesForPhase('v1');

  const [drafts, setDrafts] = useState<Record<string, ServiceDraft>>(() => {
    const saved = new Map(initial.map((s) => [s.serviceType, s]));
    const out: Record<string, ServiceDraft> = {};
    for (const type of available) {
      const row = saved.get(type);
      out[type] = {
        on: Boolean(row),
        price: row ? String(row.priceCents / 100) : '',
        cancellation: row?.cancellationPolicy ?? 'moderate',
        dogs: row?.acceptsDogs ?? true,
        cats: row?.acceptsCats ?? false,
        other: row?.acceptsOther ?? false,
        // 0 BOS gosteriliyor: "0" yazili bir kutu, doldurulmasi gereken
        // bir alan gibi duruyor; bosluk "bir sey istemiyorum" demek.
        extraPet: row?.extraPetPriceCents ? String(row.extraPetPriceCents / 100) : '',
        holiday: row?.holidaySurchargePct ? String(row.holidaySurchargePct) : '',
        /*
          VARSAYILAN EN BUYUK KADEME DEGIL. Sutunun veritabani
          varsayilani 100 kg ve bu, hicbir bakicinin vermedigi bir
          sozdu: yeni her profil "dev kopek alirim" diye ilan
          ediyordu. Yeni hizmette secim BOS basliyor ve alan zorunlu.
        */
        maxKg: row ? String(Math.round(row.acceptedSizeMaxKg)) : '',
      };
    }
    return out;
  });

  function patch(type: string, change: Partial<ServiceDraft>) {
    setDrafts((prev) => ({ ...prev, [type]: { ...(prev[type] as ServiceDraft), ...change } }));
  }

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      <p className="notice">{m.onboarding['services.priceNote']}</p>
      {state.errors.services && (
        <p className="alert alert-error" role="alert">{err(m, state.errors.services)}</p>
      )}

      <div className="grid" style={{ gap: 'var(--space-3)' }}>
        {available.map((type, i) => {
          const d = drafts[type] as ServiceDraft;
          const label = m.service[type as ServiceType];
          const r = ranges[type];

          return (
            <div key={type} className={`service-card${d.on ? ' service-card-on' : ''}`}>
              {/*
                KARTIN ICI BOSTU: yalnizca hizmetin adi ve bir kutu vardi.
                Bakici "drop-in ne kadar eder" bilmeden secim yapiyordu.
                Simdi ikon + ne oldugu + cevredeki tipik fiyat. Ikon ana
                sayfadakiyle AYNI kaynaktan (components/ServiceIcon).
              */}
              <div className="checkbox-row service-head">
                <input
                  id={`svc-${type}`}
                  type="checkbox"
                  name="service"
                  value={type}
                  checked={d.on}
                  onChange={(e) => patch(type, { on: e.target.checked })}
                />
                <span className="service-head-text">
                  <span className="row" style={{ gap: 'var(--space-3)', alignItems: 'center' }}>
                    <span className={`tile tile-sm ${SERVICE_TILE[i % SERVICE_TILE.length]}`}>
                      <ServiceIcon service={type as ServiceType} size={20} />
                    </span>
                    <label htmlFor={`svc-${type}`} className="text-h4">{label}</label>
                  </span>
                  <span className="field-hint" style={{ display: 'block' }}>
                    {m.serviceDescription[type as ServiceType]}
                  </span>
                  {/*
                    TIPIK FIYAT SATIRI KALDIRILDI.
                    Ayni bilgi fiyat alaninin ALTINDA, hem aralik hem
                    medyan olarak zaten yaziyordu: "Sitters near you
                    charge $45-$60 - median $55". Iki farkli cumleyle
                    ayni seyi iki kez soylemek, karti kalabaliklastiran
                    seylerden biriydi.
                  */}
                </span>
              </div>

              {d.on && (
                <div className="service-detail">
                  <div className="field-block">
                    <label htmlFor={`price-${type}`}>{m.onboarding['services.price']}</label>
                    <span className="price-input">
                      <span aria-hidden="true">$</span>
                      <input
                        id={`price-${type}`}
                        name={`price.${type}`}
                        type="number"
                        min={MIN_PRICE_CENTS / 100}
                        max={MAX_PRICE_CENTS / 100}
                        step="1"
                        inputMode="decimal"
                        value={d.price}
                        onChange={(e) => patch(type, { price: e.target.value })}
                        placeholder={suggestion(ranges[type])}
                        required
                        aria-describedby={`price-hint-${type}`}
                      />
                      {/* m.unit[...] — ham anahtar Ingilizce: FR ekranda "/ night" yaziyordu */}
                      <span className="dim text-body-sm">
                        / {m.unit[SERVICES[type as ServiceType].unit]}
                      </span>
                    </span>
                    {/*
                      ZORUNLULUK YAZIYOR. Bos birakip kaydete basinca alan
                      kirmizi cerceve aliyordu ama NE oldugunu soyleyen bir
                      metin yoktu; tarayicinin baloncugu da kayboluyor.
                    */}
                    <span className="field-hint" id={`price-hint-${type}`}>
                      {rangeHint(m, locale, ranges[type])}
                    </span>
                    <NetEarnings
                      locale={locale} type={type as ServiceType} price={d.price}
                      province={province} promoEndsAt={promoEndsAt}
                      commission={commission}
                    />
                    {state.errors[`price.${type}`] && (
                      <span className="field-error" role="alert">{err(m, state.errors[`price.${type}`])}</span>
                    )}
                  </div>

                  {/*
                    EN BUYUK KABUL EDILEN BOYUT.

                    Alan yoktu: sutun veritabaninda 100 kg varsayiliyla
                    duruyordu ve her profilde "0-100 kg" yaziyordu —
                    bakicinin vermedigi bir soz. Arama da bu sayidan
                    filtreliyor, yani yanlis olmasi yalnizca gorsel
                    degil: kucuk bir daireye dev kopek istegi gidiyordu.
                  */}
                  <div className="field-block">
                    <label htmlFor={`size-${type}`}>{m.onboarding['services.maxSize']}</label>
                    <Select
                      id={`size-${type}`}
                      name={`size.${type}`}
                      value={d.maxKg}
                      required
                      placeholder="—"
                      onChange={(next) => patch(type, { maxKg: next })}
                      options={PET_SIZE_STEPS.map((step) => ({
                        value: String(step.maxKg),
                        label: interpolate(
                          m.onboarding[`services.size.${step.key}` as keyof Messages['onboarding']] as string,
                          { min: step.minKg, max: step.maxKg },
                        ),
                      }))}
                    />
                    <span className="field-hint">{m.onboarding['services.maxSizeHint']}</span>
                    {state.errors[`size.${type}`] && (
                      <span className="field-error" role="alert">{err(m, state.errors[`size.${type}`])}</span>
                    )}
                  </div>

                  <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
                    <legend className="field-hint" style={{ marginBottom: 'var(--space-2)' }}>
                      {m.onboarding['services.accepts']}
                    </legend>
                    <div className="row">
                      <label className="chip">
                        <input type="checkbox" name={`dogs.${type}`} checked={d.dogs}
                          onChange={(e) => patch(type, { dogs: e.target.checked })} />
                        {m.onboarding['services.dogs']}
                      </label>
                      <label className="chip">
                        <input type="checkbox" name={`cats.${type}`} checked={d.cats}
                          onChange={(e) => patch(type, { cats: e.target.checked })} />
                        {m.onboarding['services.cats']}
                      </label>
                      <label className="chip">
                        <input type="checkbox" name={`other.${type}`} checked={d.other}
                          onChange={(e) => patch(type, { other: e.target.checked })} />
                        {m.onboarding['services.other']}
                      </label>
                    </div>
                    {state.errors[`accepts.${type}`] && (
                      <span className="field-error" role="alert">{err(m, state.errors[`accepts.${type}`])}</span>
                    )}
                  </fieldset>

                  {/*
                    ISTEGE BAGLI OLANLAR KAPALI GELIYOR.

                    Kart tek ekranda dokuz karar soruyordu: fiyat, ek
                    hayvan, tatil farki, iptal politikasi, en buyuk
                    hayvan, tur secimi... Hepsi ayni gorsel agirlikta
                    duruyordu ve fiyat karari — bakicinin gercekten
                    dusunmesi gereken tek sey — arada kayboluyordu.

                    Ucu de MAKUL BIR VARSAYILANA sahip: ek ucret yok,
                    tatil farki yok, iptal politikasi orta. Bu yuzden
                    acilir bir blokta duruyorlar. SAKLANMIYORLAR:
                    baslik ne oldugunu yaziyor ve tek tikla aciliyor.
                  */}
                  <details className="service-extras">
                    <summary>
                      <span className="service-extras-text">
                        <span className="service-extras-title">
                          {m.onboarding['services.extrasTitle']}
                        </span>
                        <span className="field-hint">
                          {m.onboarding['services.extrasHint']}
                        </span>
                      </span>
                    </summary>
                  {/*
                    EK UCRETLER.

                    Alanlar veritabaninda ve rezervasyon hesabinda vardi
                    ama hicbir ekrandan yazilamiyordu: iki hayvanli bir
                    rezervasyonda bakici ek ucret alamiyordu.

                    Ikisi de ISTEGE BAGLI ve bos birakilabilir; bos =
                    "istemiyorum". Ust sinirlar yaninda yaziyor cunku
                    sinirin varligini ancak hata alinca ogrenmek kotu.
                  */}
                  <div className="field-row extra-fees">
                    <div className="field-block">
                      <label htmlFor={`extra-${type}`}>{m.onboarding['services.extraPet']}</label>
                      <span className="price-input">
                        <span aria-hidden="true">$</span>
                        <input
                          id={`extra-${type}`}
                          name={`extraPet.${type}`}
                          type="number" min={0} max={MAX_EXTRA_PET_CENTS / 100} step="1"
                          inputMode="decimal"
                          value={d.extraPet}
                          onChange={(e) => patch(type, { extraPet: e.target.value })}
                          aria-describedby={`extra-hint-${type}`}
                        />
                        <span className="dim text-body-sm">
                          / {m.unit[SERVICES[type as ServiceType].unit]}
                        </span>
                      </span>
                      <span className="field-hint" id={`extra-hint-${type}`}>
                        {m.onboarding['services.extraPetHint']}
                      </span>
                      {state.errors[`extraPet.${type}`] && (
                        <span className="field-error" role="alert">{err(m, state.errors[`extraPet.${type}`])}</span>
                      )}
                    </div>

                    <div className="field-block">
                      <label htmlFor={`hol-${type}`}>{m.onboarding['services.holiday']}</label>
                      <span className="price-input">
                        <input
                          id={`hol-${type}`}
                          name={`holiday.${type}`}
                          type="number" min={0} max={MAX_HOLIDAY_PCT} step="1"
                          inputMode="numeric"
                          value={d.holiday}
                          onChange={(e) => patch(type, { holiday: e.target.value })}
                          aria-describedby={`hol-hint-${type}`}
                        />
                        <span aria-hidden="true">%</span>
                      </span>
                      <span className="field-hint" id={`hol-hint-${type}`}>
                        {interpolate(m.onboarding['services.holidayHint'], { max: MAX_HOLIDAY_PCT })}
                      </span>
                      {state.errors[`holiday.${type}`] && (
                        <span className="field-error" role="alert">{err(m, state.errors[`holiday.${type}`])}</span>
                      )}
                    </div>
                  </div>
                  <div className="field-block">
                    <label htmlFor={`cxl-${type}`}>{m.onboarding['services.cancellation']}</label>
                    <Select
                      id={`cxl-${type}`}
                      name={`cancellation.${type}`}
                      value={d.cancellation}
                      onChange={(next) => patch(type, { cancellation: next })}
                      options={[
                        { value: 'flexible', label: m.onboarding['cancellation.flexible'] },
                        { value: 'moderate', label: m.onboarding['cancellation.moderate'] },
                        { value: 'strict', label: m.onboarding['cancellation.strict'] },
                      ]}
                    />
                  </div>
                  </details>

                </div>
              )}
            </div>
          );
        })}
      </div>

      <Actions locale={locale} step="services" busy={busy} label={m.onboarding.saveAndContinue} />
    </form>
  );
}

/* -------------------------------------------------------------------- ev */

/**
 * UC DURUMLU SORU — evet / hayir / cevapsiz.
 *
 * Onay kutusu YETMIYOR: isaretlenmemis bir kutu, "hayir" ile "bu soruyu
 * hic gormedim"i ayirt edemez. Bu cevaplar profilde CUMLE olarak
 * cikiyor ("Evde cocuk yok"), yani cevapsiz bir soruyu varsayilanla
 * doldurmak, bakicinin vermedigi bir sozu ona soyletmek olurdu.
 * Bos birakilirsa profilde o satir HIC cizilmiyor.
 */
function TriField({
  id, label, hint, value, onChange, yes, no, skip,
}: {
  id: string; label: string; hint?: string | undefined;
  value: string; onChange: (v: string) => void;
  yes: string; no: string; skip: string;
}) {
  return (
    <Field id={id} label={label} hint={hint}>
      <Select
        id={id}
        name={id}
        value={value}
        placeholder={skip}
        onChange={onChange}
        options={[{ value: 'yes', label: yes }, { value: 'no', label: no }]}
      />
    </Field>
  );
}

export function HomeForm({
  locale, action, initial,
}: {
  locale: Locale;
  action: Action;
  initial: {
    homeType: string; hasYard: boolean; yardFenced: boolean; hasOwnPets: boolean;
    smokeFree: boolean; maxConcurrentPets: number;
    hasChildren: boolean | null; petsOnBed: boolean | null; petsOnFurniture: boolean | null;
    pottyBreakHours: number | null;
    spayedNeuteredOnly: boolean; noFemalesInHeat: boolean; houseTrainedOnly: boolean;
    minPetAgeMonths: number | null;
    scheduleText: string; typicalDayText: string; safetyText: string; ownerPrefsText: string;
  };
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState(action, EMPTY);
  /* Uc durum forma 'yes' | 'no' | '' olarak giriyor; bos deger
     sunucuda tekrar null'a donuyor (actions.ts -> triState). */
  const tri = (v: boolean | null) => (v === null ? '' : v ? 'yes' : 'no');
  const [v, set] = useFields({
    homeType: initial.homeType,
    hasYard: initial.hasYard,
    yardFenced: initial.yardFenced,
    hasOwnPets: initial.hasOwnPets,
    smokeFree: initial.smokeFree,
    maxConcurrentPets: String(initial.maxConcurrentPets),
    hasChildren: tri(initial.hasChildren),
    petsOnBed: tri(initial.petsOnBed),
    petsOnFurniture: tri(initial.petsOnFurniture),
    pottyBreakHours: initial.pottyBreakHours === null ? '' : String(initial.pottyBreakHours),
    spayedNeuteredOnly: initial.spayedNeuteredOnly,
    noFemalesInHeat: initial.noFemalesInHeat,
    houseTrainedOnly: initial.houseTrainedOnly,
    minPetAgeMonths: initial.minPetAgeMonths === null ? '' : String(initial.minPetAgeMonths),
    scheduleText: initial.scheduleText,
    typicalDayText: initial.typicalDayText,
    safetyText: initial.safetyText,
    ownerPrefsText: initial.ownerPrefsText,
  });

  const types = ['house', 'townhouse', 'apartment', 'condo', 'farm'] as const;
  const yes = m.onboarding['home.yes'];
  const no = m.onboarding['home.no'];
  const skip = m.onboarding['home.unanswered'];

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      {/*
        ADIM UC BOLUME AYRILDI. Once ondort alan alt alta duruyordu ve
        hangisinin zorunlu hangisinin istege bagli oldugu okunmuyordu:
        ev (zorunlu), kurallar (istege bagli), kendi cumlelerin (istege
        bagli). Basliklar h2 DEGIL h3 — sayfanin kendi basligi h1,
        adimin basligi h2.
      */}
      <h3 className="text-h4 step-group-title">{m.onboarding['home.groupPlace']}</h3>

      <Field id="homeType" label={m.onboarding['home.type']} error={err(m, state.errors.homeType)}>
        <Select
          id="homeType"
          name="homeType"
          value={v.homeType}
          required
          placeholder="—"
          onChange={(next) => set('homeType', next)}
          options={types.map((t) => ({
            value: t,
            label: m.onboarding[`home.${t}` as keyof Messages['onboarding']] as string,
          }))}
        />
      </Field>

      <div className="checkbox-row">
        <input id="hasYard" type="checkbox" name="hasYard" checked={v.hasYard}
          onChange={(e) => set('hasYard', e.target.checked)} />
        <label htmlFor="hasYard">{m.onboarding['home.hasYard']}</label>
      </div>

      {/* Bahce yoksa "cevrili bahce" secenegi de olmamali — yanlis iddiaya
          zemin hazirlar, ki bu Competition Act acisindan risklidir. */}
      {v.hasYard && (
        <div className="checkbox-row">
          <input id="yardFenced" type="checkbox" name="yardFenced" checked={v.yardFenced}
            onChange={(e) => set('yardFenced', e.target.checked)} />
          <label htmlFor="yardFenced">{m.onboarding['home.yardFenced']}</label>
        </div>
      )}

      <div className="checkbox-row">
        <input id="hasOwnPets" type="checkbox" name="hasOwnPets" checked={v.hasOwnPets}
          onChange={(e) => set('hasOwnPets', e.target.checked)} />
        <label htmlFor="hasOwnPets">{m.onboarding['home.hasOwnPets']}</label>
      </div>

      <div className="checkbox-row">
        <input id="smokeFree" type="checkbox" name="smokeFree" checked={v.smokeFree}
          onChange={(e) => set('smokeFree', e.target.checked)} />
        <label htmlFor="smokeFree">{m.onboarding['home.smokeFree']}</label>
      </div>

      <div className="field-row">
        <Field id="maxConcurrentPets" label={m.onboarding['home.maxPets']}>
          <input id="maxConcurrentPets" name="maxConcurrentPets" type="number" min={1} max={10}
            value={v.maxConcurrentPets}
            onChange={(e) => set('maxConcurrentPets', e.target.value)} />
        </Field>

        <TriField
          id="hasChildren"
          label={m.onboarding['home.hasChildren']}
          hint={m.onboarding['home.hasChildrenHint']}
          value={v.hasChildren}
          onChange={(next) => set('hasChildren', next)}
          yes={yes} no={no} skip={skip}
        />
      </div>

      <h3 className="text-h4 step-group-title">{m.onboarding['home.groupRules']}</h3>
      <p className="field-hint step-group-lead">{m.onboarding['home.groupRulesLead']}</p>

      <div className="field-row">
        <TriField
          id="petsOnBed"
          label={m.onboarding['home.petsOnBed']}
          value={v.petsOnBed}
          onChange={(next) => set('petsOnBed', next)}
          yes={yes} no={no} skip={skip}
        />
        <TriField
          id="petsOnFurniture"
          label={m.onboarding['home.petsOnFurniture']}
          value={v.petsOnFurniture}
          onChange={(next) => set('petsOnFurniture', next)}
          yes={yes} no={no} skip={skip}
        />
      </div>

      <Field
        id="pottyBreakHours"
        label={m.onboarding['home.pottyBreak']}
        hint={m.onboarding['home.pottyBreakHint']}
      >
        <input id="pottyBreakHours" name="pottyBreakHours" type="number" min={1} max={24}
          value={v.pottyBreakHours} style={{ maxWidth: '7rem' }}
          onChange={(e) => set('pottyBreakHours', e.target.value)} />
      </Field>

      {/*
        KABUL KOSULLARI — "hangi hayvana BAKMAM".

        Onay kutusu burada DOGRU secim (ev ozelliklerindeki uc durumlu
        listelerden farkli olarak): isaretsiz kutu "boyle bir sartim
        yok" demek ve profilde hicbir satir cizilmiyor, yani
        isaretlemeden hicbir iddia uretilmiyor.

        Sahip bu cevaplari bugune kadar mesajla soruyor ve cogu zaman
        rezervasyon reddedildikten sonra ogreniyordu.
      */}
      <h3 className="text-h4 step-group-title">{m.onboarding['home.groupPets']}</h3>
      <p className="field-hint step-group-lead">{m.onboarding['home.groupPetsLead']}</p>

      <div className="checkbox-row">
        <input id="spayedNeuteredOnly" type="checkbox" name="spayedNeuteredOnly"
          checked={v.spayedNeuteredOnly}
          onChange={(e) => set('spayedNeuteredOnly', e.target.checked)} />
        <label htmlFor="spayedNeuteredOnly">{m.onboarding['home.spayedOnly']}</label>
      </div>

      <div className="checkbox-row">
        <input id="noFemalesInHeat" type="checkbox" name="noFemalesInHeat"
          checked={v.noFemalesInHeat}
          onChange={(e) => set('noFemalesInHeat', e.target.checked)} />
        <label htmlFor="noFemalesInHeat">{m.onboarding['home.noHeat']}</label>
      </div>

      <div className="checkbox-row">
        <input id="houseTrainedOnly" type="checkbox" name="houseTrainedOnly"
          checked={v.houseTrainedOnly}
          onChange={(e) => set('houseTrainedOnly', e.target.checked)} />
        <label htmlFor="houseTrainedOnly">{m.onboarding['home.houseTrained']}</label>
      </div>

      <Field
        id="minPetAgeMonths"
        label={m.onboarding['home.minAge']}
        hint={m.onboarding['home.minAgeHint']}
      >
        <input id="minPetAgeMonths" name="minPetAgeMonths" type="number" min={0} max={120}
          value={v.minPetAgeMonths} style={{ maxWidth: '7rem' }}
          onChange={(e) => set('minPetAgeMonths', e.target.value)} />
      </Field>

      <h3 className="text-h4 step-group-title">{m.onboarding['home.groupWords']}</h3>
      <p className="field-hint step-group-lead">{m.onboarding['home.groupWordsLead']}</p>

      <Field
        id="scheduleText"
        label={m.onboarding['home.schedule']}
        hint={m.onboarding['home.scheduleHint']}
      >
        <textarea id="scheduleText" name="scheduleText" value={v.scheduleText} rows={3}
          maxLength={1200} className="textarea"
          onChange={(e) => set('scheduleText', e.target.value)} />
      </Field>

      <Field
        id="typicalDayText"
        label={m.onboarding['home.typicalDay']}
        hint={m.onboarding['home.typicalDayHint']}
      >
        <textarea id="typicalDayText" name="typicalDayText" value={v.typicalDayText} rows={4}
          maxLength={1200} className="textarea"
          onChange={(e) => set('typicalDayText', e.target.value)} />
      </Field>

      <Field
        id="safetyText"
        label={m.onboarding['home.safety']}
        hint={m.onboarding['home.safetyHint']}
      >
        <textarea id="safetyText" name="safetyText" value={v.safetyText} rows={3}
          maxLength={1200} className="textarea"
          onChange={(e) => set('safetyText', e.target.value)} />
      </Field>

      {/*
        "SIZDEN BILMEK ISTEDIKLERIM" — bu adimin en degerli alani.

        Bakici neyi merak ettigini BIR KEZ yaziyor; sahip rezervasyon
        istegini gonderirken bunu okuyor. Oncesinde her bakici ayni uc
        soruyu her sahibe ayri ayri mesajla soruyordu.
      */}
      <Field
        id="ownerPrefsText"
        label={m.onboarding['home.ownerPrefs']}
        hint={m.onboarding['home.ownerPrefsHint']}
      >
        <textarea id="ownerPrefsText" name="ownerPrefsText" value={v.ownerPrefsText} rows={4}
          maxLength={1200} className="textarea"
          onChange={(e) => set('ownerPrefsText', e.target.value)} />
      </Field>

      <Actions locale={locale} step="home" busy={busy} label={m.onboarding.saveAndContinue} />
    </form>
  );
}

/* --------------------------------------------------------------- kontrol */

export function ScreeningForm({
  locale, action, status,
}: {
  locale: Locale;
  action: Action;
  status: string | null;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState(action, EMPTY);
  const seg = segmentFor(locale);

  if (status) {
    const key = status === 'passed' ? 'screening.passed'
      : status === 'pending' ? 'screening.pending'
      : status === 'manual_review' ? 'screening.underReview'
      : 'screening.error';

    return (
      <div className="auth-form">
        <p className={`alert ${status === 'passed' ? 'alert-ok' : 'alert-error'}`} role="status">
          {m.onboarding[key as keyof Messages['onboarding']] as string}
        </p>
        {/* Law 25 s.12.1: otomatik karar verildiyse insana gorus sunma kanali
            gorunur olmali. Buradaki metin o kanalin varligini soyluyor. */}
        <p className="field-hint">{m.onboarding['screening.humanReview']}</p>
        <Link href={`/${seg}/become-a-sitter/review/`} className="btn btn-primary">
          {m.onboarding.saveAndContinue}
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={seg} />

      <p>{m.onboarding['screening.body']}</p>
      <p className="notice">{m.onboarding['screening.whatWeKeep']}</p>
      <p className="field-hint">{m.onboarding['screening.humanReview']}</p>
      {/* Yasal: "vulnerable sector check" IDDIASI KULLANILAMAZ — o kontrolu
          yalnizca polis, kisinin kendi basvurusuyla yapar. */}
      <p className="field-hint">{m.onboarding['screening.noClaim']}</p>

      <div className="checkbox-row">
        <input id="consent" type="checkbox" name="consent" />
        <label htmlFor="consent">{m.onboarding['screening.consentLabel']}</label>
      </div>
      {state.errors.consent && (
        <p className="alert alert-error" role="alert">{err(m, state.errors.consent)}</p>
      )}

      <Actions locale={locale} step="screening" busy={busy} label={m.onboarding['screening.start']} />
    </form>
  );
}

/* ----------------------------------------------------------------- ozet */

export interface ApplicationSummary {
  name: string;
  phone: string | null;
  cityName: string | null;
  postalCode: string | null;
  hasExactAddress: boolean;
  services: Array<{ serviceType: string; priceCents: number }>;
  homeType: string | null;
  maxConcurrentPets: number;
  photoCount: number;
  hasAvatar: boolean;
  screeningStarted: boolean;
}

export function ReviewForm({
  locale, action, missing, submitted, summary,
}: {
  locale: Locale;
  action: Action;
  missing: OnboardingStep[];
  submitted: boolean;
  summary: ApplicationSummary;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const [state, formAction, busy] = useActionState(action, EMPTY);

  if (submitted) {
    return <p className="alert alert-ok" role="status">{m.onboarding['review.submitted']}</p>;
  }

  const money = (cents: number) =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'CAD' }).format(cents / 100);

  /*
    OZET SATIRLARI. Her satirin yaninda DUZENLE bagi var: yanlisi
    gordugu yerde duzeltemeyen kullanici, basa donup adimlari tek tek
    aramak zorunda kaliyor.

    Eksik olan alan "—" ile gosteriliyor, gizlenmiyor: bos birakilmis
    bir alan, hic sorulmamis bir alandan farkli.
  */
  const rows: Array<{ step: OnboardingStep; label: string; value: string }> = [
    {
      step: 'about',
      label: m.onboarding['step.about'],
      value: [summary.name, summary.phone].filter(Boolean).join(' · ') || '—',
    },
    {
      step: 'location',
      label: m.onboarding['step.location'],
      value: [
        summary.cityName,
        summary.postalCode,
        summary.hasExactAddress ? m.onboarding['review.addressOnFile'] : null,
      ].filter(Boolean).join(' · ') || '—',
    },
    {
      step: 'services',
      label: m.onboarding['step.services'],
      value: summary.services.length === 0
        ? '—'
        : summary.services
            .map((svc) => `${m.service[svc.serviceType as ServiceType]} ${money(svc.priceCents)}`)
            .join(' · '),
    },
    {
      step: 'home',
      label: m.onboarding['step.home'],
      value: summary.homeType
        ? `${m.onboarding[`home.${summary.homeType}` as keyof Messages['onboarding']] as string
           ?? summary.homeType} · ${summary.maxConcurrentPets === 1
             ? m.onboarding['review.petCountOne']
             : interpolate(m.onboarding['review.petCount'], {
               count: summary.maxConcurrentPets,
             })}`
        : '—',
    },
    {
      step: 'photos',
      label: m.onboarding['step.photos'],
      value: summary.photoCount === 0 && !summary.hasAvatar
        ? m.onboarding['review.noPhotos']
        : interpolate(m.onboarding['review.photoCount'], {
            avatar: summary.hasAvatar ? '1' : '0',
            home: String(summary.photoCount),
          }),
    },
    {
      step: 'screening',
      label: m.onboarding['step.screening'],
      value: summary.screeningStarted
        ? m.onboarding['review.screeningStarted']
        : m.onboarding['review.screeningMissing'],
    },
  ];

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="locale" value={seg} />

      <dl className="review-list">
        {rows.map((row) => (
          <div key={row.step} className="review-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
            <Link href={`/${seg}/become-a-sitter/${row.step}/`} className="review-edit">
              {m.onboarding['review.edit']}
            </Link>
          </div>
        ))}
      </dl>

      {missing.length > 0 && (
        <div className="alert alert-error" role="alert">
          <p style={{ marginBottom: 'var(--space-2)' }}>{m.onboarding['review.missing']}</p>
          <ul style={{ margin: 0, paddingInlineStart: '1.2rem' }}>
            {missing.map((step) => (
              <li key={step}>
                <Link href={`/${seg}/become-a-sitter/${step}/`} style={{ textDecoration: 'underline' }}>
                  {m.onboarding[`step.${step}` as keyof Messages['onboarding']] as string}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.errors.submit && (
        <p className="alert alert-error" role="alert">{err(m, state.errors.submit)}</p>
      )}

      {/*
        Eksik adim varken gonder dugmesi KAPALI. Sunucu zaten reddediyor
        ama acik bir dugme "gonderebilirim" diyor ve kullanici tikladiktan
        sonra hatayla karsilasiyordu; eksik listesi zaten hemen ustunde.
      */}
      <Actions
        locale={locale} step="review" busy={busy}
        label={m.onboarding['review.submit']}
        disabled={missing.length > 0}
      />
    </form>
  );
}
