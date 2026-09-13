import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment } from '@havre/i18n';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);

  return (
    <>
      <h1 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{m.auth.forgotTitle}</h1>
      <ForgotPasswordForm locale={locale} />
    </>
  );
}
