import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession, providers } from '@/lib/auth';
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

  const m = getMessages(locale);

  return (
    <>
      <h1 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{m.auth.signUp}</h1>
      <SignUpForm locale={locale} providers={providers()} callbackURL={target} />
    </>
  );
}
