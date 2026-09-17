import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Dogrulama baglantisinin indigi sayfa.
 * Jetonu BU SAYFA dogrulamiyor — /api/auth/verify-email dogruluyor ve buraya
 * yonlendiriyor. Boylece jeton tarayici gecmisinde bir sayfa URL'si olarak
 * kalmiyor.
 */
export default async function VerifyEmailPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const { error } = await searchParams;
  const session = await getSession();

  /*
    UC DURUM — IKI DEGIL. DUZELTILEN HATA.

    Once `const ok = !error` yaziyordu: "hata parametresi yoksa
    onaylanmistir". Sayfayi jetonsuz acan HERKES yesil kutuda "Your email
    is confirmed." goruyordu — hesap gercekte dogrulanmamisken. Kullanici
    neden giris yapamadigini anlayamazdi.

    Sayfa jetonu kendisi dogrulamiyor (/api/auth/verify-email doguruyor ve
    buraya yonlendiriyor), o yuzden basariyi TAHMIN etmek yerine
    OLCUYORUZ: oturumdaki kullanicinin `emailVerified` alani. Baglanti
    baska bir tarayicida acildiysa burada oturum olmaz; o durumda
    bilmedigimizi soyluyoruz.
  */
  const state: 'ok' | 'invalid' | 'unknown' = error
    ? 'invalid'
    : session?.user?.emailVerified ? 'ok' : 'unknown';

  const text = state === 'ok' ? m.auth.verifyDone
    : state === 'invalid' ? m.auth.verifyInvalid
    : m.auth.verifyUnknown;

  return (
    <>
      <h1 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>{m.auth.verifyTitle}</h1>
      <p
        className={`alert ${state === 'ok' ? 'alert-ok' : state === 'invalid' ? 'alert-error' : 'alert-info'}`}
        role="status"
      >
        {text}
      </p>
      <div style={{ marginTop: 'var(--space-6)' }}>
        <Link
          href={state === 'ok' ? `/${segmentFor(locale)}` : `/${segmentFor(locale)}/account/sign-in`}
          className="btn btn-primary btn-block"
        >
          {state === 'ok' ? m.nav.search : m.auth.signIn}
        </Link>
      </div>
    </>
  );
}
