'use client';

import { useActionState, useState } from 'react';
import { segmentFor, type Locale } from '@havre/i18n';
import type { DecisionState } from '@/app/[locale]/admin/applications/[id]/actions';

const MESSAGES: Record<string, { en: string; fr: string }> = {
  not_allowed: { en: 'You cannot do that.', fr: 'Action impossible.' },
  invalid: { en: 'Invalid decision.', fr: 'Décision invalide.' },
  not_found: { en: 'Application not found.', fr: 'Candidature introuvable.' },
  invalid_state: {
    en: 'This application has already been decided.',
    fr: 'Cette candidature a déjà été tranchée.',
  },
  reason_required: {
    en: 'A refusal needs a written reason — at least a sentence. The applicant is entitled to it.',
    fr: 'Un refus exige un motif écrit — au moins une phrase. Le candidat y a droit.',
  },
};

/**
 * ONAY / RET.
 *
 * Ret dugmesi, gerekce yazilana kadar KAPALI. Sunucu zaten reddediyor
 * (decideApplication) ama kapali dugme niyeti ekranda anlatiyor: bu
 * gerekce kullaniciya gonderilecek bir metin, bir form alani degil.
 */
export function AdminDecision({
  locale, userId, action, decided,
}: {
  locale: Locale;
  userId: string;
  action: (prev: DecisionState, form: FormData) => Promise<DecisionState>;
  decided: boolean;
}) {
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  const [state, formAction, busy] = useActionState<DecisionState, FormData>(action, {});
  const [reason, setReason] = useState('');

  if (decided || state.done) {
    return (
      <p className="alert alert-ok" role="status">
        {state.done === 'approve'
          ? t('Approved. The sitter is now live.', 'Approuvée. Le gardien est maintenant en ligne.')
          : state.done === 'reject'
            ? t('Refused, with the reason on record.', 'Refusée, motif consigné.')
            : t('Already decided.', 'Déjà tranchée.')}
      </p>
    );
  }

  const err = state.error ? MESSAGES[state.error] : undefined;
  const hidden = (
    <>
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />
      <input type="hidden" name="reason" value={reason} />
    </>
  );

  return (
    <div className="stack">
      {err && <p className="alert alert-error" role="alert">{fr ? err.fr : err.en}</p>}

      <div className="field-block">
        <label htmlFor="reason">
          {t('Reason (required to refuse)', 'Motif (obligatoire pour refuser)')}
        </label>
        <textarea
          id="reason" rows={4} className="textarea" value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t(
            'What the applicant will be told, in plain words.',
            'Ce qui sera dit au candidat, en mots simples.',
          )}
        />
        <span className="field-hint">
          {t(
            'Kept with the decision and disclosed to the applicant on request.',
            'Conservé avec la décision et communiqué au candidat sur demande.',
          )}
        </span>
      </div>

      <div className="row">
        <form action={formAction}>
          {hidden}
          <input type="hidden" name="decision" value="approve" />
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {t('Approve', 'Approuver')}
          </button>
        </form>
        <form action={formAction}>
          {hidden}
          <input type="hidden" name="decision" value="reject" />
          <button type="submit" className="btn btn-secondary" disabled={busy || reason.trim().length < 10}>
            {t('Refuse', 'Refuser')}
          </button>
        </form>
      </div>
    </div>
  );
}
