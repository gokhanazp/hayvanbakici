import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession, providers } from '@/lib/auth';
import { readAnonFavourites } from '@/lib/favourites';
import { SignUpForm } from '@/components/auth/SignUpForm';

export const dynamic = 'force-dynamic';

export default async function SignUpPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  const { next } = await searchParams;
  const target = next && next.startsWith('/') && !next.startsWith('//')
    ? next
    : `/${segmentFor(locale)}`;

  if (session) redirect(target);

  /*
    GIRISTEN SONRA FAVORILERI TASI.

    Tarayicida favori varsa donus adresi once tasima rotasindan geciyor;
    yoksa hicbir sey degismiyor. Uc giris yolu (sifre, sihirli baglanti,
    sosyal) da callbackURL kullaniyor, dolayisiyla tek yerde duran bu
    yonlendirme ucunu birden kapsiyor.
  */
  const anonFavourites = await readAnonFavourites();
  const claim = (next: string) => (anonFavourites.length > 0
    ? `/api/favourites/claim?next=${encodeURIComponent(next)}`
    : next);
  const callbackURL = claim(target);
  const verifyURL = claim(`/${segmentFor(locale)}/account/verify-email/`);

  const m = getMessages(locale);

  return (
    <>
      <h1 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{m.auth.signUp}</h1>
      <SignUpForm locale={locale} providers={providers()} callbackURL={callbackURL} verifyURL={verifyURL} />
    </>
  );
}
