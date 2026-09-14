'use client';

import { useActionState, useEffect, useState } from 'react';
import { getMessages, interpolate, type Locale } from '@havre/i18n';
import { MAX_MESSAGE } from '@havre/core';
import type { MessageState } from '@/app/[locale]/account/messages/actions';

type AskState = MessageState & { redirectTo?: string };

/**
 * REZERVASYON ONCESI SORU.
 *
 * Basarili olunca konusmaya yonlendiriyoruz. Yonlendirme sunucu
 * eyleminde `redirect()` ile de yapilabilirdi; burada yapilmasinin sebebi
 * `useActionState` ile birlikte redirect'in atilan hata olarak gelip
 * hata kutusunu tetiklemesi. Adres eylemden donuyor, gecisi istemci
 * yapiyor.
 */
export function AskSitterForm({
  locale, sitterId, label, action,
}: {
  locale: Locale;
  sitterId: string;
  /** Baslikla ayni metin: ekranda h1 olarak zaten var, burada sadece
   *  ekran okuyucu icin tekrarlaniyor. */
  label: string;
  action: (prev: AskState, form: FormData) => Promise<AskState>;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<AskState, FormData>(action, {});
  const [body, setBody] = useState('');

  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  const errorKey = state.error ? `error.${state.error}` : null;
  const errorText = errorKey
    ? (m.messages[errorKey as keyof typeof m.messages] as string | undefined)
    : undefined;
  const tooLong = body.length > MAX_MESSAGE;

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="sitterId" value={sitterId} />
      <input type="hidden" name="locale" value={locale} />

      {errorText && <p className="alert alert-error" role="alert">{errorText}</p>}

      <div className="field-block">
        <label htmlFor="ask-body" className="sr-only">{label}</label>
        <textarea
          id="ask-body" name="body" rows={5} className="textarea"
          value={body} onChange={(e) => setBody(e.target.value)}
          placeholder={m.messages.askPlaceholder}
          maxLength={MAX_MESSAGE + 200}
        />
        <span className="field-hint tabular">
          {interpolate(m.messages.lengthHint, { count: body.length, max: MAX_MESSAGE })}
        </span>
      </div>

      <button
        type="submit" className="btn btn-primary"
        disabled={busy || body.trim().length === 0 || tooLong || Boolean(state.redirectTo)}
      >
        {busy || state.redirectTo ? m.messages.sending : m.messages.askSend}
      </button>
    </form>
  );
}
