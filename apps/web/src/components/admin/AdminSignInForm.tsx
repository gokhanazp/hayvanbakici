'use client';

import { useState } from 'react';
import { authClient } from '@havre/auth/client';

/**
 * YONETICI GIRISI.
 *
 * Musteri giris ekranindan AYRI bir form; ayni kimlik dogrulama, farkli
 * bir kapi. Uc fark var ve ucu de bilincli:
 *
 *  1. SIFRE ONE CIKIYOR. Musteri tarafinda varsayilan sihirli baglanti
 *     (sifresiz giris destek yukunu dusuruyor). Panelde varsayilan sifre:
 *     bir yonetici hesabina erisim, e-posta kutusuna erisimle ayni sey
 *     olmamali. Sihirli baglanti yine de duruyor, cunku sifresi olmayan
 *     bir hesabin panele hic giremiyor olmasi daha kotu.
 *  2. GOOGLE/APPLE YOK. Ic bir arac icin ucuncu taraf kimlik saglayici
 *     zincire bir halka daha ekler.
 *  3. "Hesap ac" baglantisi YOK. Yonetici hesabi acilmaz, VERILIR.
 *
 * HATA MESAJLARI BILEREK GENEL: "boyle bir kullanici yok" demek, bir
 * e-postanin sistemde olup olmadigini soylemektir. Yanlis sifre ile
 * olmayan hesap ayni cumleyi alir.
 */
export function AdminSignInForm({ next }: { next: string }) {
  /*
    GIRISTEN SONRA DOGRUDAN PANELE GITMIYORUZ, KAPIYA DONUYORUZ.

    Once `next` adresine gidiliyordu; yonetici olmayan bir hesapla dogru
    sifreyi girince kisi 404 goruyordu — giris basarili olmustu ama ekran
    bunu soylemiyordu (bizzat yasandi). Simdi giris ekranina donuyoruz:
    orasi sunucuda yetkiyi kontrol edip ya panele gonderiyor ya da
    "bu hesabin erisimi yok" diyor. Korunan sayfalar disaridan gelen
    birine hala 404 donuyor; degisen tek sey, kendi kapisindan gelenin
    ne oldugunu ogrenmesi.
  */
  const gate = `/admin/sign-in/?next=${encodeURIComponent(next)}`;

  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function explain(code: string | undefined, status: number | undefined): string {
    if (status === 429) {
      return 'Too many attempts. Wait a minute and try again.';
    }
    if (code === 'EMAIL_NOT_VERIFIED') {
      return 'This address has not been verified yet. Open the link in your inbox first.';
    }
    return 'That email and password do not match an account.';
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setBusy(true);
    const res = await authClient.signIn.email({
      email: email.trim(), password, callbackURL: gate,
    });
    setBusy(false);
    if (res.error) { setError(explain(res.error.code, res.error.status)); return; }
    /*
      Tam sayfa yonlendirme (router.push degil): oturum cerezi yeni
      yazildi ve panelin butun sayfalari sunucuda ciziliyor. Istemci
      tarafi gecis, eski onbellekten bir kare gosterebilirdi.
    */
    window.location.assign(gate);
  }

  async function submitLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Enter your email.'); return; }
    setBusy(true);
    const res = await authClient.signIn.magicLink({ email: email.trim(), callbackURL: gate });
    setBusy(false);
    if (res.error) { setError(explain(res.error.code, res.error.status)); return; }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="a-note" role="status">
        If <strong>{email.trim()}</strong> has an account, a sign-in link is on its way.
        The link works once and expires shortly.
      </div>
    );
  }

  return (
    <>
      {error && <p className="a-alert" role="alert">{error}</p>}

      {mode === 'password' ? (
        <form onSubmit={submitPassword} noValidate>
          <label className="a-field">
            <span>Email</span>
            <input
              className="a-input" type="email" name="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username" autoFocus spellCheck={false}
            />
          </label>
          <label className="a-field">
            <span>Password</span>
            <input
              className="a-input" type={show ? 'text' : 'password'} name="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="a-check">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <span>Show password</span>
          </label>

          <button type="submit" className="a-btn a-btn-block" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <button
            type="button" className="a-btn a-btn-ghost a-btn-block"
            style={{ marginTop: 'var(--space-2)' }}
            onClick={() => { setMode('link'); setError(null); }}
          >
            Email me a sign-in link
          </button>
        </form>
      ) : (
        <form onSubmit={submitLink} noValidate>
          <label className="a-field">
            <span>Email</span>
            <input
              className="a-input" type="email" name="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username" autoFocus spellCheck={false}
            />
          </label>
          <button type="submit" className="a-btn a-btn-block" disabled={busy}>
            {busy ? 'Sending…' : 'Send the link'}
          </button>
          <button
            type="button" className="a-btn a-btn-ghost a-btn-block"
            style={{ marginTop: 'var(--space-2)' }}
            onClick={() => { setMode('password'); setError(null); }}
          >
            Use a password instead
          </button>
        </form>
      )}
    </>
  );
}

/** Yetkisi olmayan bir hesapla girilmisse: cikis yapip tekrar denemek. */
export function AdminSignOut() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button" className="a-btn a-btn-block" disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        window.location.assign('/admin/sign-in/');
      }}
    >
      {busy ? 'Signing out…' : 'Sign out and use another account'}
    </button>
  );
}
