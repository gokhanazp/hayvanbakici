'use client';

import { useActionState, useState } from 'react';

export type ActionState = { error?: string | undefined; done?: string | undefined };

/**
 * GEREKCELI KARAR KUTUSU.
 *
 * Panelde geri donusu olan/olmayan her karar bu bilesenden geciyor:
 * basvuru onayi/reddi, askiya alma, yorum gizleme, rezervasyon
 * mudahalesi, sikayet kapatma.
 *
 * IKI TASARIM KARARI:
 *
 * 1. Gerekce isteyen dugme, gerekce yazilana kadar KAPALI. Sunucu zaten
 *    reddediyor; kapali dugme niyeti ekranda anlatiyor: bu metin bir form
 *    alani degil, karsi tarafa soylenecek soz.
 *
 * 2. HER DUGME KENDI FORMU, secim gizli input'ta.
 *    Tek formda iki submit dugmesi denendi ve calismadi: useActionState
 *    altinda tiklanan dugmenin name/value'su FormData'ya ULASMIYOR, bu
 *    yuzden her karar "gecersiz" donuyordu. Bir daha denemeyin.
 */
export interface ActionButton {
  value: string;
  label: string;
  tone?: 'primary' | 'ghost' | 'danger';
  requireReason?: boolean;
  /** Islem sonrasi gosterilecek metin */
  done?: string;
}

const ERRORS: Record<string, string> = {
  not_allowed: 'You cannot do that.',
  invalid: 'Invalid action.',
  not_found: 'Record not found.',
  invalid_state: 'The record changed — reload the page and look again.',
  self_action: 'You cannot do this to your own account.',
  reason_required: 'Write a reason first — at least a sentence. It goes on the record and the person is entitled to it.',
};

export function ReasonAction({
  action, hidden, buttons, label, hint, placeholder, minLength = 10, done, doneNote,
  collapse, collapseLabel,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  buttons: ActionButton[];
  label?: string | undefined;
  hint?: string | undefined;
  placeholder?: string | undefined;
  minLength?: number | undefined;
  /** Karar zaten verilmisse kutu yerine bu metin gorunur */
  done?: string | undefined;
  doneNote?: string | undefined;
  /**
   * Liste ekranlarinda kutuyu KAPALI baslatir: yirmi kartin her birinde
   * acik duran bir gerekce kutusu, ekrani okunmaz yapiyordu. Once niyet
   * (dugme), sonra gerekce.
   */
  collapse?: boolean | undefined;
  collapseLabel?: string | undefined;
}) {
  const [state, formAction, busy] = useActionState<ActionState, FormData>(action, {});
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(!collapse);

  if (done || state.done) {
    const hit = buttons.find((b) => b.value === state.done);
    return (
      <p className="a-note" role="status">
        {hit?.done ?? done ?? 'Done.'}
        {doneNote && <span className="a-dim"> {doneNote}</span>}
      </p>
    );
  }

  const short = reason.trim().length < minLength;

  if (!open) {
    return (
      <button type="button" className="a-btn a-btn-ghost" onClick={() => setOpen(true)}>
        {collapseLabel ?? buttons[0]?.label ?? 'Act'}
      </button>
    );
  }

  return (
    <div>
      {state.error && (
        <p className="a-alert" role="alert">{ERRORS[state.error] ?? state.error}</p>
      )}

      <label className="a-field">
        <span>{label ?? 'Reason'}</span>
        <textarea
          className="a-textarea" value={reason} rows={3}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder ?? 'In plain words — this is what the person will be told.'}
        />
      </label>
      {hint && <p className="a-hint" style={{ marginTop: -4, marginBottom: 10 }}>{hint}</p>}

      <div className="a-row">
        {buttons.map((b) => (
          <form key={b.value} action={formAction}>
            {Object.entries(hidden).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <input type="hidden" name="reason" value={reason} />
            <input type="hidden" name="decision" value={b.value} />
            <button
              type="submit"
              className={`a-btn${b.tone === 'ghost' ? ' a-btn-ghost' : b.tone === 'danger' ? ' a-btn-danger' : ''}`}
              disabled={busy || (b.requireReason !== false && short)}
            >
              {b.label}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
