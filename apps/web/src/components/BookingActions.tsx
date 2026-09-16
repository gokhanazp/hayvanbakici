'use client';

import { useActionState, useEffect } from 'react';
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

/**
 * Iptal — iki taraf da kullanabilir.
 *
 * NEDEN CERCEVELI, "hayalet" DEGIL: dugme once yalnizca metindi ve
 * eylem sutununda basligi olmayan, cercevesi olmayan bir satir olarak
 * duruyordu — tiklanabilir oldugu anlasilmiyordu. Yikici bir eylem
 * GORUNMEZ degil, AYIRT EDILEBILIR olmali: kirmizi cerceve ve kirmizi
 * yazi, ama dolu degil; dolu kirmizi bir dugme sayfanin en dikkat
 * ceken ogesi olurdu ve burada en az tiklanmasi gereken sey o.
 */
export function CancelButton({
  locale, bookingId, action,
}: {
  locale: Locale; bookingId: string; action: Action;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />
      {state.error && (
        <p className="alert alert-error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>
          {message(m, state.error)}
        </p>
      )}
      <button type="submit" className="btn btn-danger-outline btn-block" disabled={busy}>
        {m.booking.cancel}
      </button>
      {/* Uyari dugmenin ALTINDA ve ona bagli: once iki ayri satir gibi
          duruyordu ve neyin geri alinamayacagi belirsizdi. */}
      <p className="field-hint" style={{ marginTop: 'var(--space-2)', textAlign: 'center' }}>
        {m.booking.cancelConfirm}
      </p>
    </form>
  );
}

/**
 * "Mesaj gonder" — rezervasyon sayfasindan konusmaya gecis.
 *
 * Neden DUGME, neden duz bir bag degil: konusma henuz yoksa bu tiklama
 * bir kayit OLUSTURUYOR. Yan etkisi olan bir isi GET bagiyla yapmak,
 * tarayici on yuklemesiyle kendiliginden tetiklenebiliyor.
 *
 * Yonlendirme eylemden donen adresle istemcide yapiliyor; sebebi
 * AskSitterForm'un basindaki notla ayni.
 */
export function MessageCounterpartButton({
  locale, bookingId, label, action,
}: {
  locale: Locale;
  bookingId: string;
  label: string;
  action: (prev: ActionState, form: FormData) => Promise<ActionState & { redirectTo?: string }>;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<
    ActionState & { redirectTo?: string }, FormData
  >(action, {});

  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="id" value={bookingId} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />
      {state.error && (
        <p className="alert alert-error" role="alert">
          {(m.messages[`error.${state.error}` as keyof Messages['messages']] as string)
            ?? message(m, state.error)}
        </p>
      )}
      <button type="submit" className="btn btn-secondary btn-block"
              disabled={busy || Boolean(state.redirectTo)}>
        {busy || state.redirectTo ? m.messages.sending : label}
      </button>
    </form>
  );
}
