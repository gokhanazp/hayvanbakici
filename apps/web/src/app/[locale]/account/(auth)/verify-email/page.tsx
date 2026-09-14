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

  const ok = !error;

  return (
    <>
      <h1 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>{m.auth.verifyTitle}</h1>
      <p className={`alert ${ok ? 'alert-ok' : 'alert-error'}`} role="status">
        {ok ? m.auth.verifyDone : m.auth.verifyInvalid}
      </p>
      <div style={{ marginTop: 'var(--space-6)' }}>
        <Link
          href={session ? `/${segmentFor(locale)}` : `/${segmentFor(locale)}/account/sign-in`}
          className="btn btn-primary btn-block"
        >
          {session ? m.nav.search : m.auth.signIn}
        </Link>
      </div>
    </>
  );
}
