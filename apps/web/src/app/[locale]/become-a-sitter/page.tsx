import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { DEFAULT_COMMISSION } from '@havre/core';

/**
 * Bakici davet sayfasi — HERKESE ACIK ve INDEKSLENEBILIR.
 *
 * Arz once gelir (yol haritasi §9): bakici olmadan hicbir sehir sayfasi
 * yayina giremiyor. Bu yuzden bu sayfa sihirbazin disinda tutuldu; giris
 * gerektirmiyor ve statik uretilebiliyor.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const m = getMessages(locale);
  return { title: m.onboarding.title, description: m.onboarding.intro };
}

export default async function BecomeSitterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const c = DEFAULT_COMMISSION;

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12) var(--space-16)' }}>
      <div style={{ maxWidth: '44rem' }}>
        <h1 className="text-h1">{m.onboarding.title}</h1>
        <p className="text-body-lg muted" style={{ marginTop: 'var(--space-4)' }}>
          {m.onboarding.intro}
        </p>

        {/*
          UCRETLER ACIKCA YAZILI.
          Competition Act'in drip-pricing yasagi tuketici tarafinda; ama
          bakiciya karsi seffaflik bu urunun ana iddiasi. Rakipte bu rakam
          sozlesmenin icinde; burada giris sayfasinda.
        */}
        <div className="grid grid-3" style={{ marginTop: 'var(--space-10)' }}>
          <div className="card card-pad">
            <p className="text-numeral">{c.sitterPct.sitter_referral}%</p>
            <p className="muted">
              {locale === 'fr-CA'
                ? 'sur les clients que vous amenez vous-même — pour toujours'
                : 'on clients you bring yourself — permanently'}
            </p>
          </div>
          <div className="card card-pad">
            <p className="text-numeral">{c.sitterPct.repeat}%</p>
            <p className="muted">
              {locale === 'fr-CA' ? 'sur les réservations répétées' : 'on repeat bookings'}
            </p>
          </div>
          <div className="card card-pad">
            <p className="text-numeral">{c.sitterPct.platform}%</p>
            <p className="muted">
              {locale === 'fr-CA'
                ? 'sur un client que nous vous envoyons'
                : 'on a client we send you'}
            </p>
          </div>
        </div>

        <div className="row" style={{ marginTop: 'var(--space-10)' }}>
          <Link href={`/${seg}/become-a-sitter/about/`} className="btn btn-primary">
            {m.onboarding.startCta}
          </Link>
          <Link href={`/${seg}/account/sign-in/?next=/${seg}/become-a-sitter/about/`} className="btn btn-ghost">
            {m.onboarding.continueCta}
          </Link>
        </div>

        <p className="field-hint" style={{ marginTop: 'var(--space-6)' }}>
          {m.verification.disclaimer}
        </p>
      </div>
    </div>
  );
}
