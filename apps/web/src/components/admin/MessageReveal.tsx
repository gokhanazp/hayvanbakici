'use client';

import { useActionState } from 'react';
import type { RevealState } from '@/app/admin/actions';

/**
 * SIKAYET EDILEN MESAJI ACMA.
 *
 * Mesaj EKRANDA DEGIL, tiklayinca geliyor. Fark onemli: sayfayi acan
 * herkesin gozune bir ozel yazismanin dusmesi ile, "bu mesaji acacagim"
 * diye bilerek tiklamak ayni sey degil — ve tiklama denetim kaydina
 * yaziliyor.
 *
 * Ekran ne yaptigini SOYLUYOR: acilmadan once kaydin tutulacagi, acildik-
 * tan sonra tutuldugu yaziyor. Sessiz goruntuleme, goruntulemenin en
 * kotu halidir.
 */
export function MessageReveal({
  reportId, messageId, action,
}: {
  reportId: string;
  messageId: string;
  action: (prev: RevealState, form: FormData) => Promise<RevealState>;
}) {
  const [state, formAction, busy] = useActionState<RevealState, FormData>(action, {});

  if (state.message) {
    const m = state.message;
    return (
      <div className="a-reveal" style={{ marginTop: 12 }}>
        <p className="a-hint">
          Opened — this is on the audit log under your name.
        </p>
        <p className="a-sec" style={{ marginTop: 8 }}>
          {m.senderName ?? 'unknown sender'} · {new Date(m.createdAt).toLocaleString('en-CA')}
        </p>
        <p style={{ whiteSpace: 'pre-wrap', marginTop: 6 }}>{m.body}</p>
        {m.redacted !== m.body && (
          <p className="a-hint" style={{ marginTop: 8 }}>
            {/* Iki tarafin GORDUGU hali: sikayet cogu zaman "maskeleme ise
                yaradi mi" sorusudur, cevabi yan yana koymadan verilemez. */}
            Both people saw: “{m.redacted}”
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} style={{ marginTop: 12 }}>
      <input type="hidden" name="reportId" value={reportId} />
      <input type="hidden" name="messageId" value={messageId} />
      {state.error && (
        <p className="a-alert is-bad" role="alert">
          {state.error === 'not_found'
            ? 'That message no longer exists.'
            /*
              KENDI ACTIGIN SIKAYETLE ACAMAZSIN. Sebebi ekranda yaziyor:
              operator neyin engellendigini bilmeli ki ne yapacagini
              bilsin — mesaji baska bir yonetici acacak.
            */
            : state.error === 'own_report'
              ? 'You filed this report yourself, so you cannot open the message from it. Another admin has to.'
              : 'You cannot open this message from this report.'}
        </p>
      )}
      <button type="submit" className="a-btn a-btn-ghost" disabled={busy}>
        {busy ? 'Opening…' : 'Show the message'}
      </button>
      <p className="a-hint" style={{ marginTop: 6 }}>
        One message, from this report only. Opening it is recorded.
      </p>
    </form>
  );
}
