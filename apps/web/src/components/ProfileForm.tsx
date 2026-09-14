'use client';

import { useActionState, useState } from 'react';
import { getMessages, type Locale, type Messages } from '@havre/i18n';
import { Select } from '@/components/ui/Select';
import type { UploadState } from '@/app/[locale]/account/profile/actions';

/**
 * AD VE DIL.
 *
 * SOYADIN YALNIZCA BAS HARFI isteniyor — profil sayfasinda tam soyad
 * hicbir zaman gorunmuyor, dolayisiyla toplamiyoruz da. Alanin yaninda
 * bunun NEDENI yaziyor: aciklamasiz bir "soyadinizin bas harfi" alani,
 * kullaniciya eksik bir form gibi gorunuyor.
 *
 * Dil secimi hesabin dili: e-postalar bu dilde gidiyor (Bill 96).
 */
export function ProfileForm({
  locale, firstName, lastNameInitial, locales, action,
}: {
  locale: Locale;
  firstName: string;
  lastNameInitial: string;
  locales: readonly Locale[];
  action: (prev: UploadState, form: FormData) => Promise<UploadState>;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<UploadState, FormData>(action, {});

  // React 19: form gonderiminden sonra kontrolsuz alanlar sifirlaniyor
  const [name, setName] = useState(firstName);
  const [initial, setInitial] = useState(lastNameInitial);
  const [lang, setLang] = useState<string>(locale);

  const text = (k: string) =>
    (m.profile[k as keyof Messages['profile']] as string | undefined) ?? k;

  return (
    <form action={formAction} className="stack">
      <h2 className="text-h4">{m.profile.title}</h2>

      {state.error && (
        <p className="alert alert-error" role="alert">{text(`error.${state.error}`)}</p>
      )}
      {state.done === 'profile' && (
        <p className="alert alert-ok" role="status">{m.profile.saved}</p>
      )}

      <div className="field-row" style={{ marginTop: 'var(--space-4)' }}>
        <div className="field-block" style={{ flex: 2 }}>
          <label htmlFor="firstName">{m.profile.name}</label>
          <input id="firstName" name="firstName" value={name} required maxLength={60}
                 onChange={(e) => setName(e.target.value)} />
          <span className="field-hint">{m.profile.nameHint}</span>
        </div>
        <div className="field-block field-narrow">
          <label htmlFor="lastNameInitial">{m.profile.initial}</label>
          <input id="lastNameInitial" name="lastNameInitial" value={initial} required maxLength={1}
                 onChange={(e) => setInitial(e.target.value)} />
        </div>
      </div>

      <div className="field-block">
        <label htmlFor="locale">{m.profile.language}</label>
        <Select
          id="locale" name="locale" value={lang} onChange={setLang}
          options={locales.map((l) => ({
            value: l, label: l === 'fr-CA' ? 'Français' : 'English',
          }))}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? m.profile.saving : m.profile.save}
      </button>
    </form>
  );
}
