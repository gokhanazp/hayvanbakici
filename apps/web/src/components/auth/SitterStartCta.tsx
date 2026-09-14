'use client';

import Link from 'next/link';
import { getMessages, type Locale, type Messages } from '@havre/i18n';
import { segmentFor } from '@havre/i18n';
import { useSitterState, useSignedIn } from './sitter-state';

/**
 * BAKICI DAVET SAYFASININ DUGMELERI.
 *
 * Sayfanin kendisi herkese acik ve STATIK uretiliyor — oturumu sunucuda
 * okumak bu sayfanin statikligini bitirirdi. Bu yuzden kisisellestirme
 * yalnizca dugmelerde ve istemcide.
 *
 * Basvurusu olan biri bu sayfaya geldiginde "Basvuruyu baslat" demek
 * yanlisti: ya ayni basvuruyu ikinci kez yapmaya calisiyor ya da
 * yayinda olup olmadigini bilmiyor demekti. Simdi durum tek satirda
 * yaziyor ve dugme onun icin dogru yere goturuyor.
 *
 * Ilk cizim daima varsayilan davet: durum gelene kadar farkli bir sey
 * gostermek yer kaymasi olur.
 */
export function SitterStartCta({
  locale, showSignIn = false,
}: {
  locale: Locale;
  /** Kahramanda ikinci dugme ("zaten basladiysan gir") gosteriliyor */
  showSignIn?: boolean | undefined;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const { status, nextStep } = useSitterState();
  const signedIn = useSignedIn();

  const key = (k: string) => m.account[k as keyof Messages['account']] as string;

  if (status && status !== 'draft') {
    return (
      <div className="stack" style={{ gap: 'var(--space-3)' }}>
        <p style={{ fontWeight: 600 }}>
          {m.account.sitterHeading}: <span className="muted">{key(`sitter.${status}`)}</span>
        </p>
        <div className="row">
          <Link href={`/${seg}/account/sitter/`} className="btn btn-primary">
            {m.nav.sitterPanel}
          </Link>
          <Link href={`/${seg}/account/`} className="btn btn-secondary">
            {m.account.overview}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="row">
      <Link
        href={`/${seg}/become-a-sitter/${status === 'draft' ? (nextStep ?? 'about') : 'about'}/`}
        className="btn btn-primary"
      >
        {status === 'draft' ? m.nav.finishApplication : m.onboarding.startCta}
      </Link>
      {showSignIn && !signedIn && (
        <Link
          href={`/${seg}/account/sign-in/?next=/${seg}/become-a-sitter/about/`}
          className="btn btn-secondary"
        >
          {m.onboarding.continueCta}
        </Link>
      )}
    </div>
  );
}
