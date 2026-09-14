import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { Avatar } from '@/components/Avatar';
import { VerificationBadge } from '@/components/VerificationBadge';
import { AskSitterForm } from '@/components/AskSitterForm';
import { getSitterProfile } from '@/lib/data';
import { askSitterAction } from '@/app/[locale]/account/messages/actions';

/** Kisiye ozel ve her istekte taze — indekslenmez. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * REZERVASYON ONCESI SORU SAYFASI.
 *
 * Rezervasyon sayfasiyla ayni kaliplari kullaniyor (sehir dogrulamasi,
 * giris yonlendirmesi) cunku ikisi de ayni profilden aciliyor; farkli
 * davranmalari kullaniciya sebepsiz bir tutarsizlik olarak gorunurdu.
 *
 * Fark: burada hizmet listesi ARANMIYOR. Soru sormak icin bakicinin
 * yayinda bir hizmeti olmasi gerekmiyor — "musait misiniz" sorusu zaten
 * hizmet gorunmedigi zaman da anlamli.
 */
export default async function AskPage({
  params,
}: {
  params: Promise<{ locale: string; city: string; slug: string }>;
}) {
  const { locale: seg, city, slug } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const sitter = await getSitterProfile(slug, locale);
  if (!sitter) notFound();

  const expectedCity = locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn;
  if (city !== expectedCity) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/${seg}/account/sign-in/?next=/${seg}/${city}/sitter/${slug}/ask/`);
  }

  // Kendine mesaj atma denemesi: eylem de reddediyor ama forma hic
  // getirmemek daha durust — reddedilecek bir kutu gostermiyoruz.
  if (session.user.id === sitter.userId) {
    redirect(`/${seg}/${city}/sitter/${slug}/`);
  }

  const m = getMessages(locale);
  const title = interpolate(m.messages.askTitle, { name: sitter.firstName });

  return (
    <>
      <section className="band band-blush band-round-b">
        <div className="container" style={{ paddingBlock: 'var(--space-6) var(--space-8)' }}>
          <Link href={`/${seg}/${city}/sitter/${slug}/`} className="text-body-sm muted">
            ← {sitter.firstName} {sitter.lastNameInitial}.
          </Link>
          <div className="row" style={{ gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
            <Avatar src={sitter.avatarUrl} initials={sitter.photoInitials} size={64} />
            <div>
              <h1 className="text-h2" style={{ margin: 0 }}>{title}</h1>
              <div className="row" style={{ marginTop: 'var(--space-2)' }}>
                <VerificationBadge level={sitter.badgeLevel} locale={locale} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
        <div style={{ maxWidth: '38rem' }}>
          <p className="muted" style={{ marginBottom: 'var(--space-6)' }}>{m.messages.askLead}</p>
          <AskSitterForm
            locale={locale}
            sitterId={sitter.userId}
            label={title}
            action={askSitterAction}
          />
        </div>
      </div>
    </>
  );
}
