'use client';

import { useActionState } from 'react';
import { getMessages, segmentFor, type Locale, type Messages } from '@havre/i18n';
import type { ActionState } from '@/app/[locale]/account/bookings/[id]/actions';

type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

function message(m: Messages, code: string | undefined): string | undefined {
  if (!code) return undefined;
  return (m.booking[`error.${code}` as keyof Messages['booking']] as string) ?? code;
}

/** Bakicinin onay/ret dugmeleri. */
export function RespondButtons({
  locale, bookingId, action,
}: {
  locale: Locale; bookingId: string; action: Action;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<ActionState, FormData>(action, {});

  /*
    IKI AYRI FORM, her birinde GIZLI bir `decision` alani.
    Tek formda iki gonder dugmesi denendi ve tiklanan dugmenin adi/degeri
    FormData'ya GIRMEDI: eylem bos bir karar aliyor ve "gecersiz" donuyordu.
    Gizli alan hem bu belirsizligi kaldiriyor hem de JS olmadan calisiyor.
  */
  const hidden = (
    <>
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />
    </>
  );

  return (
    <div className="stack">
      {state.error && <p className="alert alert-error" role="alert">{message(m, state.error)}</p>}
      <div className="row">
        <form action={formAction}>
          {hidden}
          <input type="hidden" name="decision" value="confirmed" />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {m.booking.accept}
          </button>
        </form>
        <form action={formAction}>
          {hidden}
          <input type="hidden" name="decision" value="declined" />
          <button type="submit" className="btn btn-secondary" disabled={busy}>
            {m.booking.decline}
          </button>
        </form>
      </div>
    </div>
  );
}

/** Iptal — iki taraf da kullanabilir. */
export function CancelButton({
  locale, bookingId, action,
}: {
  locale: Locale; bookingId: string; action: Action;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />
      {state.error && <p className="alert alert-error" role="alert">{message(m, state.error)}</p>}
      <button type="submit" className="btn btn-ghost" disabled={busy}>
        {m.booking.cancel}
      </button>
      <p className="field-hint">{m.booking.cancelConfirm}</p>
    </form>
  );
}
