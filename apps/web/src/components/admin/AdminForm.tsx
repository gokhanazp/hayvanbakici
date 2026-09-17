'use client';

import { useActionState, useState, type ReactNode } from 'react';
import type { ActionState } from '@/components/admin/ReasonAction';

/**
 * SESSIZ FORMLARIN SONU.
 *
 * Panelde uc form `Promise<void>` donduruyordu: "Internal notes",
 * "File a report" ve "End it now". Girdi kisaysa ya da kimlik bozuksa
 * sunucu sessizce `return` ediyordu — hata yok, onay yok, bekleme
 * durumu yok. Operator dugmeye basiyor, hicbir sey olmuyor ve bunun
 * bir hata mi yoksa basari mi oldugunu bilmiyor. Not eklenmedigini
 * ancak listeye bakip fark ediyor; sikayet acilmadigini belki hic.
 *
 * Bu bilesen uc seyi garanti ediyor: gonderilirken dugme kapali,
 * hatada sebep yazili, basarida onay gorunur.
 */
const ERRORS: Record<string, string> = {
  not_allowed: 'You cannot do that.',
  invalid: 'Something in the form was not valid.',
  not_found: 'Record not found.',
  too_short: 'Too short — write at least a few words.',
  invalid_subject: 'Pick what the report is about.',
  invalid_id: 'That identifier does not look like a record id.',
};

function message(state: ActionState): { text: string; ok: boolean } | null {
  if (state.error) return { text: ERRORS[state.error] ?? state.error, ok: false };
  if (state.done) return { text: state.done, ok: true };
  return null;
}

export function AdminForm({
  action, hidden, children, submitLabel, busyLabel = 'Saving…', tone = 'ghost',
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  hidden?: Record<string, string>;
  children: ReactNode;
  submitLabel: string;
  busyLabel?: string;
  tone?: 'primary' | 'ghost' | 'danger';
}) {
  const [state, formAction, busy] = useActionState<ActionState, FormData>(action, {});
  const msg = message(state);

  return (
    <form action={formAction}>
      {Object.entries(hidden ?? {}).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {children}
      <button type="submit" className={`a-btn a-btn-${tone}`} disabled={busy}>
        {busy ? busyLabel : submitLabel}
      </button>
      {msg && (
        <p className={`a-alert ${msg.ok ? 'is-ok' : 'is-bad'}`} role="status">
          {msg.text}
        </p>
      )}
    </form>
  );
}

/**
 * IKI ADIMLI DUGME — geri donusu olmayan tek tiklik islemler icin.
 *
 * "End it now" paneldeki TEK parayi etkileyen dugme ve tek tikla,
 * onaysiz calisiyordu: yanlislikla degen biri yurumekte olan bir
 * kampanyayi bitiriyor ve haberi bile olmuyordu. Kampanya kaydi
 * silinmiyor (yalnizca isaretleniyor) ama oran aninda geri donuyor.
 *
 * Tarayicinin `confirm()` kutusu KULLANILMADI: bu uygulamada modal
 * diyalog sayfayi kilitliyor ve otomatik testlerde butun oturumu
 * durduruyor. Iki adim ayni yerde, ayni formda.
 */
export function ConfirmButton({
  action, hidden, label, question, confirmLabel, cancelLabel = 'Cancel',
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  hidden: Record<string, string>;
  label: string;
  question: string;
  confirmLabel: string;
  cancelLabel?: string;
}) {
  const [state, formAction, busy] = useActionState<ActionState, FormData>(action, {});
  const [asking, setAsking] = useState(false);
  const msg = message(state);

  if (msg?.ok) return <p className="a-alert is-ok" role="status">{msg.text}</p>;

  if (!asking) {
    return (
      <>
        <button type="button" className="a-btn a-btn-ghost" onClick={() => setAsking(true)}>
          {label}
        </button>
        {msg && <p className="a-alert is-bad" role="alert">{msg.text}</p>}
      </>
    );
  }

  return (
    <form action={formAction}>
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <p className="a-hint" style={{ marginBottom: 8 }}>{question}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="submit" className="a-btn a-btn-danger" disabled={busy}>
          {busy ? 'Ending…' : confirmLabel}
        </button>
        <button type="button" className="a-btn a-btn-ghost" onClick={() => setAsking(false)}>
          {cancelLabel}
        </button>
      </div>
      {msg && <p className="a-alert is-bad" role="alert">{msg.text}</p>}
    </form>
  );
}
