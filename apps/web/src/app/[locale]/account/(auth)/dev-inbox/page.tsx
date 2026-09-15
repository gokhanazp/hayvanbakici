import { notFound } from 'next/navigation';
import { readDevInbox } from '@havre/auth';
import { localeFromSegment } from '@havre/i18n';

/**
 * GELISTIRME POSTA KUTUSU — yalnizca gelistirmede.
 *
 * Gelistirmede e-posta gonderilmiyor (RESEND_API_KEY yok). Dogrulama ve
 * sifre sifirlama baglantilarini terminal ciktisinda aramak zorunda
 * kalmamak icin son e-postalar burada listeleniyor.
 *
 * URETIMDE KAPALI: NODE_ENV=production oldugunda sayfa 404 veriyor. Ayrica
 * uretimde ConsoleMailer hic kullanilmadigi icin kutu zaten bos olurdu —
 * iki bagimsiz kilit.
 */
export const dynamic = 'force-dynamic';

export default async function DevInboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();

  const { locale: seg } = await params;
  if (!localeFromSegment(seg)) notFound();

  const mails = readDevInbox();

  return (
    <>
      <h1 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>
        Dev inbox
      </h1>
      <p className="muted text-body-sm" style={{ marginBottom: 'var(--space-6)' }}>
        Gerçekte gönderilmeyen e-postalar. Bağlantıya tıklayın. Yeni bir e-posta
        gönderdiyseniz sayfayı yenileyin.
      </p>

      {mails.length === 0 ? (
        <p className="alert alert-ok" role="status">
          Henüz e-posta yok. Kayıt olun ya da şifre sıfırlama isteyin, sonra bu
          sayfayı yenileyin.
        </p>
      ) : (
        <div className="grid" style={{ gap: 'var(--space-4)' }}>
          {mails.map((mail, i) => (
            <div key={`${mail.at}-${i}`} className="card card-pad">
              <div className="text-body-sm dim tabular" style={{ marginBottom: 'var(--space-1)' }}>
                {new Date(mail.at).toLocaleTimeString('tr-TR')} · {mail.locale}
              </div>
              <div className="text-h4" style={{ marginBottom: 'var(--space-1)' }}>
                {mail.subject}
              </div>
              <div className="text-body-sm muted" style={{ marginBottom: 'var(--space-4)' }}>
                {mail.to}
              </div>
              {mail.link ? (
                <a href={mail.link} className="btn btn-primary btn-block">
                  Bağlantıyı aç
                </a>
              ) : (
                <p className="text-body-sm dim">Bu e-postada bağlantı yok.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
