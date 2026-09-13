import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment } from '@havre/i18n';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const { token, error } = await searchParams;

  return (
    <>
      <h1 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{m.auth.resetTitle}</h1>
      <ResetPasswordForm locale={locale} token={error ? null : (token ?? null)} />
    </>
  );
}
