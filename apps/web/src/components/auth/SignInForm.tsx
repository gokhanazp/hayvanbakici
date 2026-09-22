'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authClient } from '@havre/auth/client';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { Alert, DevInboxLink, Divider, EmailField, PasswordField, SocialButtons, messageForError } from './shared';

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
  /*
    "E-posta ve sifre eslesmiyor" UCUNCU bir durumu da kapsiyor:
    hesap VAR, dogrulanmis, ama sifresi YOK — daha once sihirli
    baglantiyla girilmis. Kullanici dogru sifreyi bildigini sanip
    donup duruyor (bizzat yasandi).

    Ipucu HERKESE ayni sekilde gosteriliyor, yani hangi adresin kayitli
    oldugunu ele vermiyor — kimlik sayimina kapi acmadan cikis yolunu
    soyluyor.
  */
  const [noPasswordHint, setNoPasswordHint] = useState(false);
  const [sent, setSent] = useState(false);
  const [resent, setResent] = useState(false);
  /* Yeniden gonderme kilidi — saniye saniye eriyor. */
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function resend(): Promise<void> {
    setBusy(true);
    setError(null);
    const res = await authClient.signIn.magicLink({ email: email.trim(), callbackURL });
    setBusy(false);
    if (res.error) { setError(res.error.message ?? m.auth['error.generic']); return; }
    setResent(true);
    setCooldown(30);
  }


  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError(m.auth['error.emailRequired']); return; }
    setBusy(true);
    const res = await authClient.signIn.magicLink({ email: email.trim(), callbackURL });
    setBusy(false);
    if (res.error) { setError(messageForError(m, res.error.code, res.error.status)); return; }
    setSent(true);
    setCooldown(30);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNoPasswordHint(false);
    setBusy(true);
    const res = await authClient.signIn.email({ email: email.trim(), password, callbackURL });
    setBusy(false);
    if (res.error) {
      setError(messageForError(m, res.error.code, res.error.status));
      setNoPasswordHint((res.error.code ?? '').toUpperCase().includes('INVALID_EMAIL_OR_PASSWORD'));
      return;
    }
    window.location.assign(callbackURL);
  }

  async function handleProvider(provider: 'google' | 'apple') {
    setBusy(true);
    await authClient.signIn.social({ provider, callbackURL });
  }

  /*
    GONDERDIKTEN SONRAKI EKRAN.

    Once yalnizca "gonderildi" yaziyordu ve kullanici orada kaliyordu:
    gelmezse ne yapacagi, nereye bakacagi, adresi yanlis yazdiysa nasil
    donecegi yazili degildi. Bir akisin en kirilgan yeri, kullanicinin
    BEKLEMEK zorunda oldugu yerdir; orada ne olacagini soylemek
    arayuzun isi.

    Yeniden gonderme 30 saniye kilitli: arka arkaya basmak hem yeni
    baglantilar uretip eskisini gecersiz kilar (kullanici en eski
    postayi acarsa calismaz) hem de saglayici kotasini yer.
  */
  if (sent) {
    return (
      <div className="auth-form">
        <Alert kind="ok">
          {resent
            ? m.auth.magicLinkResent
            : interpolate(m.auth.magicLinkSent, { email: email.trim() })}
        </Alert>
        <ul className="text-body-sm muted auth-next">
          <li>{m.auth.magicLinkSpam}</li>
          <li>{m.auth.magicLinkDevice}</li>
        </ul>
        <div className="row">
          <button type="button" className="btn btn-secondary"
            disabled={busy || cooldown > 0}
            onClick={() => { void resend(); }}>
            {cooldown > 0
              ? interpolate(m.auth.magicLinkWait, { seconds: String(cooldown) })
              : m.auth.magicLinkResend}
          </button>
          <button type="button" className="btn btn-ghost"
            onClick={() => { setSent(false); setResent(false); setError(null); }}>
            {m.auth.magicLinkOther}
          </button>
        </div>
        <DevInboxLink locale={locale} />
      </div>
    );
  }

  return (
    <div className="auth-form">
      {error && (
        <Alert kind="error">
          {error}
          {noPasswordHint && (
            <>
              {' '}
              <span style={{ fontWeight: 400 }}>{m.auth['error.invalidCredentialsHint']}</span>
            </>
          )}
        </Alert>
      )}

      <SocialButtons m={m} google={providers.google} apple={providers.apple}
        onProvider={handleProvider} busy={busy} />
      {(providers.google || providers.apple) && <Divider label={m.auth.orDivider} />}

      {mode === 'magic' ? (
        <form className="auth-form" method="post" onSubmit={handleMagic} noValidate>
          <EmailField m={m} value={email} onChange={setEmail} autoFocus />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? m.auth.submitting : m.auth.magicLink}
          </button>
          <button type="button" className="btn btn-ghost btn-block"
            onClick={() => { setMode('password'); setError(null); setNoPasswordHint(false); }}>
            {m.auth.withPassword}
          </button>
        </form>
      ) : (
        <form className="auth-form" method="post" onSubmit={handlePassword} noValidate>
          <EmailField m={m} value={email} onChange={setEmail} autoFocus />
          <PasswordField m={m} value={password} onChange={setPassword}
            autoComplete="current-password" />
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? m.auth.submitting : m.auth.signIn}
          </button>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn btn-ghost" style={{ padding: 0 }}
              onClick={() => { setMode('magic'); setError(null); setNoPasswordHint(false); }}>
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
