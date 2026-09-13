'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authClient } from '@havre/auth/client';
import { checkPassword, PASSWORD_RULES } from '@havre/auth/password';
import { getMessages, interpolate, segmentFor, type Locale, type Messages } from '@havre/i18n';
import { Alert, DevInboxLink, Divider, EmailField, PasswordField, SocialButtons, messageForError } from './shared';

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

export function SignUpForm({
  locale, providers, callbackURL,
}: {
  locale: Locale;
  providers: { google: boolean; apple: boolean };
  callbackURL: string;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /**
   * CASL: pazarlama izni ON ISARETLI OLAMAZ ve ispat yuku bizde.
   * Bu yuzden varsayilan false ve secim consent_records tablosuna yaziliyor.
   */
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pwProblems, setPwProblems] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError(m.auth['error.nameRequired']); return; }
    const problems = checkPassword(password, email);
    setPwProblems(problems);
    if (problems.length) return;

    setBusy(true);
    const res = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      /*
        Dogrulama baglantisi ONAY SAYFASINA donuyor, hedefe degil.
        Sebep: kullanici baglantiya bazen saatler sonra, bazen baska bir
        cihazda tikliyor. Dogrudan ana sayfaya dusurmek "oldu mu olmadi mi"
        sorusunu cevapsiz birakiyordu.
      */
      callbackURL: `/${seg}/account/verify-email/`,
    });
    setBusy(false);

    if (res.error) { setError(messageForError(m, res.error.code, res.error.status)); return; }

    // Pazarlama izni ayri bir uc noktaya yaziliyor: hesabin acilmasi
    // bu cagrinin basarisina bagli olmamali.
    if (marketing) {
      void fetch('/api/consent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'email_marketing', granted: true, localeShown: locale }),
      }).catch(() => undefined);
    }

    setDone(true);
  }

  async function handleProvider(provider: 'google' | 'apple') {
    setBusy(true);
    await authClient.signIn.social({ provider, callbackURL });
  }

  if (done) {
    return (
      <div className="auth-form">
        <Alert kind="ok">{interpolate(m.auth.verifySent, { email: email.trim() })}</Alert>
        <DevInboxLink locale={locale} />
      </div>
    );
  }

  return (
    <div className="auth-form">
      {error && <Alert kind="error">{error}</Alert>}

      <SocialButtons m={m} google={providers.google} apple={providers.apple}
        onProvider={handleProvider} busy={busy} />
      {(providers.google || providers.apple) && <Divider label={m.auth.orDivider} />}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <div className="field-block">
          <label htmlFor="signup-name">{m.auth.name}</label>
          <input id="signup-name" name="name" value={name} autoComplete="name" required
            onChange={(e) => setName(e.target.value)} aria-describedby="signup-name-hint" />
          <span id="signup-name-hint" className="field-hint">{m.auth.namePrivacy}</span>
        </div>

        <EmailField m={m} value={email} onChange={setEmail} />

        <PasswordField
          m={m}
          value={password}
          onChange={(v) => { setPassword(v); if (pwProblems.length) setPwProblems(checkPassword(v, email)); }}
          autoComplete="new-password"
          hint={interpolate(m.auth.passwordHint, { min: PASSWORD_RULES.minLength })}
          errors={pwProblems.length ? passwordMessages(m, pwProblems) : undefined}
        />

        <div className="checkbox-row">
          <input id="signup-marketing" type="checkbox" checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)} />
          <span>
            <label htmlFor="signup-marketing">{m.auth.consentEmail}</label>
            <span className="field-hint" style={{ display: 'block' }}>{m.auth.consentEmailNote}</span>
          </span>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? m.auth.submitting : m.auth.signUp}
        </button>

        <p className="field-hint">{m.auth.termsNotice}</p>
        {/*
          BILL 96 s.55: yapisma sozlesmesi once FRANSIZCA sunulmali; taraf
          acikca Ingilizce'yi sectiyse bu KAYDEDILMELI. Ingilizce arayuzde
          bu bildirim gorunuyor ve secim consent_records'a yaziliyor.
        */}
        {locale === 'en-CA' && <p className="field-hint">{m.legal.languageNotice}</p>}
      </form>

      <p className="text-body-sm muted" style={{ textAlign: 'center' }}>
        {m.auth.hasAccount}{' '}
        <Link href={`/${seg}/account/sign-in`} style={{ fontWeight: 600, color: 'var(--color-primary-active)' }}>
          {m.auth.signIn}
        </Link>
      </p>
    </div>
  );
}
