'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@havre/auth/client';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { Alert, Divider, EmailField, PasswordField, SocialButtons, messageForError } from './shared';

type Mode = 'magic' | 'password';

export function SignInForm({
  locale, providers, callbackURL,
}: {
  locale: Locale;
  providers: { google: boolean; apple: boolean };
  callbackURL: string;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  /**
   * VARSAYILAN SIHIRLI BAGLANTI.
   * Sifre destegi var ama one cikan yol degil: sifresiz giris hem destek
   * yukunu hem de sizinti riskini dusuruyor. Sifre isteyen kullanici tek
   * tikla geciyor.
   */
  const [mode, setMode] = useState<Mode>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError(m.auth['error.emailRequired']); return; }
    setBusy(true);
    const res = await authClient.signIn.magicLink({ email: email.trim(), callbackURL });
    setBusy(false);
    if (res.error) { setError(messageForError(m, res.error.code, res.error.status)); return; }
    setSent(true);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await authClient.signIn.email({ email: email.trim(), password, callbackURL });
    setBusy(false);
    if (res.error) { setError(messageForError(m, res.error.code, res.error.status)); return; }
    window.location.assign(callbackURL);
  }

  async function handleProvider(provider: 'google' | 'apple') {
    setBusy(true);
    await authClient.signIn.social({ provider, callbackURL });
  }

  if (sent) {
    return <Alert kind="ok">{interpolate(m.auth.magicLinkSent, { email: email.trim() })}</Alert>;
  }

  return (
    <div className="auth-form">
      {error && <Alert kind="error">{error}</Alert>}

      <SocialButtons m={m} google={providers.google} apple={providers.apple}
        onProvider={handleProvider} busy={busy} />
      {(providers.google || providers.apple) && <Divider label={m.auth.orDivider} />}

      {mode === 'magic' ? (
        <form className="auth-form" onSubmit={handleMagic} noValidate>
          <EmailField m={m} value={email} onChange={setEmail} autoFocus />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? m.auth.submitting : m.auth.magicLink}
          </button>
          <button type="button" className="btn btn-ghost btn-block"
            onClick={() => { setMode('password'); setError(null); }}>
            {m.auth.withPassword}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handlePassword} noValidate>
          <EmailField m={m} value={email} onChange={setEmail} autoFocus />
          <PasswordField m={m} value={password} onChange={setPassword}
            autoComplete="current-password" />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? m.auth.submitting : m.auth.signIn}
          </button>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-ghost" style={{ padding: 0 }}
              onClick={() => { setMode('magic'); setError(null); }}>
              {m.auth.magicLink}
            </button>
            <Link href={`/${seg}/account/forgot-password`} className="text-body-sm muted">
              {m.auth.forgotPassword}
            </Link>
          </div>
        </form>
      )}

      <p className="text-body-sm muted" style={{ textAlign: 'center' }}>
        {m.auth.noAccount}{' '}
        <Link href={`/${seg}/account/sign-up`} style={{ fontWeight: 600, color: 'var(--color-primary-active)' }}>
          {m.auth.signUp}
        </Link>
      </p>
    </div>
  );
}
