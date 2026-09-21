'use client';

import { useActionState } from 'react';
import { MAX_SITTER_PCT, MAX_OWNER_PCT } from '@havre/core';

export type SettingsState = {
  errors?: Record<string, string> | undefined;
  saved?: boolean | undefined;
};

type Action = (prev: SettingsState, form: FormData) => Promise<SettingsState>;

/**
 * KOMISYON FORMLARI.
 *
 * Panelin geri kalani sunucu bileseni; bu iki form istemci cunku
 * `useActionState` hata haritasini alanlarin YANINA koyabilmemiz icin
 * gerekiyor. Ust taraftaki tek satirlik "bir sey yanlis" uyarisi, alti
 * alanli bir formda hangi alanin yanlis oldugunu soylemiyor.
 */

const MESSAGES: Record<string, string> = {
  'error.pctRange': `A percentage between 0 and ${MAX_SITTER_PCT}.`,
  'error.capRange': 'A cap between $0 and $200.',
  'error.promoRange': 'Between 0 and 36 months.',
  'error.required': 'Required.',
  'error.endBeforeStart': 'The end must be after the start.',
  'error.notLower': 'A campaign can only lower a rate, never raise it.',
  'error.noDiscount': 'Nothing is lowered — this campaign would do nothing.',
  'error.overlap': 'Another campaign already covers part of this period. End it first.',
  not_allowed: 'You cannot do that.',
};

/*
  HATA SATIRI.

  Burada tanimsiz bir CSS degiskeni cagriliyordu; sozlukte karsiligi
  olmadigi icin renk her zaman yanindaki elle yazilmis yedekten
  geliyordu — tasarim sisteminin disinda bir kirmizi, koyu temada da
  degismiyor. Artik tanimli token kullaniliyor.

  Token sozlugu testi bunu yakaliyor ama turbo onbellegi temizlenene
  kadar gorunmuyordu: onbellekten gelen yesil, yesil degildir.

  NOT: test dosya metnini ham okuyor, YORUMLAR DAHIL. Bu yuzden burada
  eski cagrinin kendisi ORNEK OLARAK YAZILAMAZ — yazarsam test yine
  kirilir. (Bir kez yazdim, kirildi.)
*/
function Err({ code }: { code: string | undefined }) {
  if (!code) return null;
  return (
    <span className="a-hint" style={{ color: 'var(--color-danger-strong)' }}>
      {MESSAGES[code] ?? code}
    </span>
  );
}

function Num({
  name, label, value, hint, error, step = '0.5', max,
}: {
  name: string; label: string; value: string | number;
  hint?: string | undefined; error?: string | undefined;
  step?: string; max?: number | undefined;
}) {
  return (
    <label className="a-field">
      <span>{label}</span>
      <input
        className="a-input" type="number" name={name} defaultValue={value}
        step={step} min={0} {...(max === undefined ? {} : { max })}
      />
      {hint && !error && <span className="a-hint">{hint}</span>}
      <Err code={error} />
    </label>
  );
}

export function BaseRatesForm({
  action, initial,
}: {
  action: Action;
  initial: {
    platform: number; repeat: number; referral: number;
    ownerPct: number; ownerFeeCapDollars: number; launchPromoMonths: number;
  };
}) {
  const [state, formAction, busy] = useActionState<SettingsState, FormData>(action, {});
  const e = state.errors ?? {};

  return (
    <form action={formAction}>
      {state.saved && <p className="a-alert" role="status">Saved. New bookings use these rates from now on.</p>}

      <div className="a-grid a-grid-3">
        <Num name="platform" label="Client we introduced (%)" value={initial.platform}
          max={MAX_SITTER_PCT} error={e['sitterPct.platform']} />
        <Num name="repeat" label="Repeat booking (%)" value={initial.repeat}
          max={MAX_SITTER_PCT} error={e['sitterPct.repeat']} />
        <Num name="referral" label="Sitter’s own client (%)" value={initial.referral}
          max={MAX_SITTER_PCT} error={e['sitterPct.sitter_referral']}
          hint="0% is the strategy — think twice." />
      </div>

      <div className="a-grid a-grid-3" style={{ marginTop: 12 }}>
        <Num name="ownerPct" label="Owner service fee (%)" value={initial.ownerPct}
          max={MAX_OWNER_PCT} error={e.ownerPct} />
        <Num name="ownerFeeCap" label="Owner fee cap ($)" value={initial.ownerFeeCapDollars}
          step="1" max={200} error={e.ownerFeeCapCents} />
        <Num name="launchPromoMonths" label="Launch promo (months at 0%)" value={initial.launchPromoMonths}
          step="1" max={36} error={e.launchPromoMonths} />
      </div>

      <div className="a-row" style={{ marginTop: 16 }}>
        <button className="a-btn" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save rates'}
        </button>
      </div>
    </form>
  );
}

/**
 * KAMPANYA KURMA.
 *
 * Bos birakilan oran alani "bu atif icin indirim yok" demek — sifir ile
 * ayni sey degil. Sifir "komisyon almiyoruz" demek ve bu kasitli bir
 * karar; bos birakmak ise dokunmamak.
 */
export function CampaignForm({
  action, base,
}: {
  action: Action;
  base: { platform: number; repeat: number; referral: number };
}) {
  const [state, formAction, busy] = useActionState<SettingsState, FormData>(action, {});
  const e = state.errors ?? {};

  return (
    <form action={formAction}>
      {state.saved && <p className="a-alert" role="status">Campaign saved.</p>}
      <Err code={e.form} />

      <label className="a-field">
        <span>Name</span>
        <input className="a-input" name="name" placeholder="Winter launch" maxLength={80} />
        <span className="a-hint">Sitters and owners see this name on the fees page.</span>
        <Err code={e.name} />
      </label>

      <div className="a-grid a-grid-3" style={{ marginTop: 12 }}>
        <Num name="cPlatform" label={`Client we introduced (now ${base.platform}%)`} value=""
          max={base.platform} error={e['campaignPct.platform']} hint="Leave blank to keep it." />
        <Num name="cRepeat" label={`Repeat booking (now ${base.repeat}%)`} value=""
          max={base.repeat} error={e['campaignPct.repeat']} hint="Leave blank to keep it." />
        <Num name="cReferral" label={`Sitter’s own client (now ${base.referral}%)`} value=""
          max={base.referral} error={e['campaignPct.sitter_referral']} hint="Leave blank to keep it." />
      </div>
      <Err code={e.sitterPct} />

      <div className="a-grid a-grid-2" style={{ marginTop: 12 }}>
        <label className="a-field">
          <span>Starts</span>
          <input className="a-input" type="date" name="startsAt" />
          <Err code={e.startsAt} />
        </label>
        <label className="a-field">
          <span>Ends</span>
          <input className="a-input" type="date" name="endsAt" />
          <span className="a-hint">The last day is not included — a campaign ending on the 1st stops at midnight.</span>
          <Err code={e.endsAt} />
        </label>
      </div>

      <div className="a-row" style={{ marginTop: 16 }}>
        <button className="a-btn" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Schedule campaign'}
        </button>
      </div>
    </form>
  );
}
