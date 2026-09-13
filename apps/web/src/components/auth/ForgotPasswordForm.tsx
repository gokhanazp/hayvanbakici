'use client';

import { useState } from 'react';
import { authClient } from '@havre/auth/client';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { Alert, DevInboxLink, EmailField } from './shared';

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `/${seg}/account/reset-password`,
    });
    setBusy(false);
    /**
     * HER ZAMAN AYNI CEVAP — hata olsa bile.
     * Aksi halde bu form bir "bu e-posta kayitli mi" sorgulama araci olurdu
     * (kullanici numaralandirma). Kayit YOK ise e-posta da gitmiyor.
     */
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-form">
        <Alert kind="ok">{interpolate(m.auth.forgotSent, { email: email.trim() })}</Alert>
        <DevInboxLink locale={locale} />
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <p className="muted">{m.auth.forgotBody}</p>
      <EmailField m={m} value={email} onChange={setEmail} autoFocus />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? m.auth.submitting : m.auth.continue}
      </button>
    </form>
  );
}
