'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@havre/auth/client';
import { checkPassword, PASSWORD_RULES } from '@havre/auth/password';
import { getMessages, interpolate, segmentFor, type Locale, type Messages } from '@havre/i18n';
import { Alert, PasswordField, messageForError } from './shared';

function passwordMessages(m: Messages, problems: string[]): string[] {
  return problems.map((p) => {
    const key = `password.${p}` as keyof Messages['auth'];
    const text = m.auth[key] as string | undefined;
    return interpolate(text ?? m.auth['error.generic'], {
      min: PASSWORD_RULES.minLength,
      max: PASSWORD_RULES.maxLength,
    });
  });
}

export function ResetPasswordForm({ locale, token }: { locale: Locale; token: string | null }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  if (!token) return <Alert kind="error">{m.auth.resetInvalid}</Alert>;

  if (done) {
    return (
      <div className="auth-form">
        <Alert kind="ok">{m.auth.resetDone}</Alert>
        <Link href={`/${seg}/account/sign-in`} className="btn btn-primary btn-block">
          {m.auth.signIn}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const found = checkPassword(password);
    setProblems(found);
    if (found.length) return;

    setBusy(true);
    const res = await authClient.resetPassword({ newPassword: password, token: token as string });
    setBusy(false);
    if (res.error) { setError(messageForError(m, res.error.code, res.error.status)); return; }
    setDone(true);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      {error && <Alert kind="error">{error}</Alert>}
      <PasswordField
        m={m}
        value={password}
        onChange={(v) => { setPassword(v); if (problems.length) setProblems(checkPassword(v)); }}
        autoComplete="new-password"
        hint={interpolate(m.auth.passwordHint, { min: PASSWORD_RULES.minLength })}
        errors={problems.length ? passwordMessages(m, problems) : undefined}
      />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? m.auth.submitting : m.auth.continue}
      </button>
    </form>
  );
}
