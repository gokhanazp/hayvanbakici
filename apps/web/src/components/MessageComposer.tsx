'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { MAX_MESSAGE } from '@havre/core';
import type { MessageState } from '@/app/[locale]/account/messages/actions';

/**
 * MESAJ YAZMA KUTUSU.
 *
 * Gonderildikten sonra kutuyu BIZ temizliyoruz. React 19'da form action
 * sonrasi kontrolsuz alanlar sifirlaniyor ama kontrollu alanlar
 * sifirlanmiyor (bu projede daha once yasandi); alan kontrollu cunku
 * karakter sayaci ona bagli.
 *
 * MASKELEME UYARISI gonderdikten SONRA cikiyor, once degil. Yazarken
 * "numaran gizlenecek" demek, yazmaktan vazgecirir; mesaj gitti ve
 * numara gizlendi demek ise dogru bilgi.
 */
export function MessageComposer({
  locale, conversationId, action, disabled, disabledNote,
}: {
  locale: Locale;
  conversationId: string;
  action: (prev: MessageState, form: FormData) => Promise<MessageState>;
  disabled?: boolean | undefined;
  disabledNote?: string | undefined;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<MessageState, FormData>(action, {});
  const [body, setBody] = useState('');
  const lastSent = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (state.sentAt && state.sentAt !== lastSent.current) {
      lastSent.current = state.sentAt;
      setBody('');
    }
  }, [state.sentAt]);

  if (disabled) {
    return <p className="alert alert-error" role="status">{disabledNote}</p>;
  }

  const tooLong = body.length > MAX_MESSAGE;
  const errorKey = state.error ? `error.${state.error}` : null;
  const errorText = errorKey
    ? (m.messages[errorKey as keyof typeof m.messages] as string | undefined)
    : undefined;

  return (
    <form action={formAction} className="composer">
      <input type="hidden" name="conversationId" value={conversationId} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />

      {errorText && <p className="alert alert-error" role="alert">{errorText}</p>}
      {state.redacted !== undefined && state.redacted > 0 && (
        <p className="alert alert-ok" role="status">{m.messages.redactedNotice}</p>
      )}

      <label htmlFor="body" className="sr-only">{m.messages.placeholder}</label>
      <textarea
        id="body" name="body" rows={3} className="textarea"
        value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={m.messages.placeholder}
        maxLength={MAX_MESSAGE + 200}
      />
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
        <span className="text-body-sm dim tabular"
          style={tooLong ? { color: 'var(--color-danger-strong)' } : undefined}>
          {interpolate(m.messages.lengthHint, { count: body.length, max: MAX_MESSAGE })}
        </span>
        <button
          type="submit" className="btn btn-primary"
          disabled={busy || body.trim().length === 0 || tooLong}
        >
          {busy ? m.messages.sending : m.messages.send}
        </button>
      </div>
    </form>
  );
}
