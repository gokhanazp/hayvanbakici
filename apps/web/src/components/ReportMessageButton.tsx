'use client';

import { useActionState, useState } from 'react';
import { getMessages, type Locale, type Messages } from '@havre/i18n';
import type { ReportState } from '@/app/[locale]/account/messages/actions';

/**
 * MESAJI BILDIR.
 *
 * Kapali duruyor, tiklayinca aciliyor: her balonun yaninda duran bir
 * "bildir" dugmesi, normal bir yazismayi supheli bir yere cevirir.
 *
 * GEREKCE ZORUNLU. Gerekcesiz bildirim, paneldeki kisiye sadece "birine
 * bir sey oldu" der; o kisi de yazismayi acmak zorunda kalir. Tek satir
 * aciklama, acilmasi gereken mesaj sayisini dusuruyor.
 */
export function ReportMessageButton({
  locale, messageId, action,
}: {
  locale: Locale;
  messageId: string;
  action: (prev: ReportState, form: FormData) => Promise<ReportState>;
}) {
  const m = getMessages(locale);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [state, formAction, busy] = useActionState<ReportState, FormData>(action, {});

  if (state.done) {
    return <p className="field-hint" role="status">{m.messages.reportDone}</p>;
  }

  if (!open) {
    return (
      <button type="button" className="bubble-report"
              onClick={() => setOpen(true)}>
        {m.messages.report}
      </button>
    );
  }

  const errorText = state.error
    ? ((m.messages[`error.${state.error}` as keyof Messages['messages']] as string | undefined)
        ?? state.error)
    : undefined;

  return (
    <form action={formAction} className="stack report-box">
      <input type="hidden" name="messageId" value={messageId} />
      <p style={{ fontWeight: 600 }}>{m.messages.reportTitle}</p>
      <p className="field-hint">{m.messages.reportHint}</p>
      {errorText && <p className="alert alert-error" role="alert">{errorText}</p>}
      <textarea
        name="reason" rows={3} className="textarea" value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={m.messages.reportPlaceholder}
        maxLength={500}
      />
      <div className="row">
        <button type="submit" className="btn btn-secondary"
                disabled={busy || reason.trim().length < 3}>
          {m.messages.reportSend}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          {m.messages.reportCancel}
        </button>
      </div>
    </form>
  );
}
