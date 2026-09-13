'use client';

import { useId, useState, type ReactNode } from 'react';
import type { Messages } from '@havre/i18n';

/** Hata ve basari kutulari — ekran okuyuculara da bildirilir (WCAG 4.1.3) */
export function Alert({ kind, children }: { kind: 'error' | 'ok'; children: ReactNode }) {
  return (
    <p
      className={`alert ${kind === 'error' ? 'alert-error' : 'alert-ok'}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}

export function EmailField({
  m, value, onChange, error, autoFocus,
}: {
  m: Messages;
  value: string;
  onChange: (v: string) => void;
  error?: string | undefined;
  autoFocus?: boolean | undefined;
}) {
  const id = useId();
  return (
    <div className="field-block">
      <label htmlFor={id}>{m.auth.email}</label>
      <input
        id={id}
        type="email"
        name="email"
        value={value}
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        autoFocus={autoFocus}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span id={`${id}-err`} className="field-error">{error}</span>}
    </div>
  );
}

export function PasswordField({
  m, value, onChange, label, hint, errors, autoComplete,
}: {
  m: Messages;
  value: string;
  onChange: (v: string) => void;
  label?: string | undefined;
  hint?: string | undefined;
  errors?: string[] | undefined;
  autoComplete: 'current-password' | 'new-password';
}) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const hasError = Boolean(errors?.length);

  return (
    <div className="field-block">
      <label htmlFor={id}>{label ?? m.auth.password}</label>
      <span className="password-wrap">
        <input
          id={id}
          /*
            Sifreyi gosterme dugmesi WCAG degil ama olcumu yapilmis bir
            kullanilabilirlik kazanci: mobilde yazim hatasi kaynakli basarisiz
            giris oranini belirgin dusuruyor.
          */
          type={shown ? 'text' : 'password'}
          name="password"
          value={value}
          autoComplete={autoComplete}
          required
          aria-invalid={hasError ? 'true' : undefined}
          aria-describedby={[hint ? `${id}-hint` : null, hasError ? `${id}-err` : null]
            .filter(Boolean).join(' ') || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
        >
          {shown ? m.auth.hidePassword : m.auth.showPassword}
        </button>
      </span>
      {hint && <span id={`${id}-hint`} className="field-hint">{hint}</span>}
      {hasError && (
        <span id={`${id}-err`} className="field-error">
          {errors?.join(' ')}
        </span>
      )}
    </div>
  );
}

export function Divider({ label }: { label: string }) {
  return <div className="auth-divider" aria-hidden="true"><span>{label}</span></div>;
}

/**
 * Sosyal giris dugmeleri.
 * Yalnizca sunucuda anahtari tanimli olan saglayicilar ciziliyor — calismayan
 * bir dugme gostermek, dugmeyi hic gostermemekten kotu.
 */
export function SocialButtons({
  m, google, apple, onProvider, busy,
}: {
  m: Messages;
  google: boolean;
  apple: boolean;
  onProvider: (p: 'google' | 'apple') => void;
  busy: boolean;
}) {
  if (!google && !apple) return null;
  return (
    <div className="grid" style={{ gap: 'var(--space-3)' }}>
      {google && (
        <button type="button" className="btn btn-secondary btn-block" disabled={busy}
          onClick={() => onProvider('google')}>
          {m.auth.withGoogle}
        </button>
      )}
      {apple && (
        <button type="button" className="btn btn-secondary btn-block" disabled={busy}
          onClick={() => onProvider('apple')}>
          {m.auth.withApple}
        </button>
      )}
    </div>
  );
}

/** Kutuphane hata kodunu kullanicinin dilindeki cumleye cevirir. */
export function messageForError(m: Messages, code: string | undefined, status?: number): string {
  const c = (code ?? '').toUpperCase();
  if (status === 429) return m.auth['error.rateLimited'];
  if (c.includes('EMAIL_NOT_VERIFIED')) return m.auth['error.emailNotVerified'];
  if (c.includes('INVALID_EMAIL_OR_PASSWORD') || c.includes('INVALID_PASSWORD')) {
    return m.auth['error.invalidCredentials'];
  }
  if (c.includes('USER_ALREADY_EXISTS') || c.includes('EMAIL_CAN_NOT_BE_UPDATED')) {
    return m.auth['error.userExists'];
  }
  if (c.includes('INVALID_TOKEN') || c.includes('EXPIRED')) return m.auth.resetInvalid;
  return m.auth['error.generic'];
}
