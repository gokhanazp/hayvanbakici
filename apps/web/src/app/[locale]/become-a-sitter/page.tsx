import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, segmentFor } from '@havre/i18n';
import {
  ONBOARDING_STEPS, calculateCommission, compareToRover, dollars,
} from '@havre/core';
import { Photo } from '@/components/Photo';
import { SitterStartCta } from '@/components/auth/SitterStartCta';
import { Faq } from '@/components/Faq';
import { ShieldIcon } from '@/components/VerificationBadge';
import { money, dayFmt } from '@/lib/format';
import { getCommission } from '@/lib/data';

/**
 * Bakici davet sayfasi — HERKESE ACIK ve INDEKSLENEBILIR.
 *
 * Arz once gelir (yol haritasi §9): bakici olmadan hicbir sehir sayfasi
 * yayina giremiyor. Bu yuzden bu sayfa sihirbazin disinda tutuldu; giris
 * gerektirmiyor ve statik uretilebiliyor.
 *
 * Sayfadaki HER RAKAM kodun kendisinden geliyor (DEFAULT_COMMISSION,
 * calculateCommission, ONBOARDING_STEPS). Elle yazilmis bir oran, oran
 * degistiginde sessizce yalan haline gelirdi.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const m = getMessages(locale);
  return { title: m.onboarding.title, description: m.sitterLanding.heroBody };
}

export const revalidate = 300;

export default async function BecomeSitterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const s = m.sitterLanding;
  const { config: c, campaignName, campaignEndsAt } = await getCommission();
  const fr = locale === 'fr-CA';

  const sample = dollars(500);
  const ours = calculateCommission({ subtotalCents: sample, attribution: 'sitter_referral' });
  const vs = compareToRover(sample, ours, 'standard');
  // Bakiciya kalan = hizmet bedeli eksi BAKICIDAN alinan komisyon.
  // (Sahip ucreti ayri kalemdir, bakicinin cebinden cikmaz.)
  const oursPayout = sample - ours.sitterCommissionCents;
  const roverPayout = oursPayout - vs.sitterSavesCents;

  const rates = [
    { pct: c.sitterPct.sitter_referral, label: m.commission.sitter_referral },
    { pct: c.sitterPct.repeat, label: m.commission.repeat },
    { pct: c.sitterPct.platform, label: m.commission.platform },
  ];

  const faqs = [
    { q: s['faq.clients'], a: s['faq.clientsA'] },
    { q: s['faq.time'], a: s['faq.timeA'] },
    { q: s['faq.check'], a: s['faq.checkA'] },
    { q: s['faq.address'], a: s['faq.addressA'] },
  ];

  return (
    <>
      {/* ---- Kahraman bandi ---- */}
      <section className="band band-blush band-round-b">
        <div className="container page-head">
          <div className="page-head-grid">
            <div>
              <span className="badge" style={{
                background: 'var(--color-surface)', color: 'var(--color-accent-hover)',
              }}>
                {s.eyebrow}
              </span>
              <h1 className="text-display" style={{ margin: 'var(--space-5) 0 var(--space-4)' }}>
                {s.heroTitle}
              </h1>
              <p className="text-body-lg muted" style={{ maxWidth: '34rem', textWrap: 'pretty' }}>
                {s.heroBody}
              </p>

              {/* Dugmeler oturuma gore konusuyor; sayfa statik kaliyor */}
              <div style={{ marginTop: 'var(--space-7)' }}>
                <SitterStartCta locale={locale} showSignIn />
              </div>
            </div>

            <div className="photo-frame" style={{ aspectRatio: '4 / 5' }}>
              <Photo id="care-a" locale={locale} priority sizes="(min-width: 900px) 24rem, 100vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Oranlar ---- */}
      <section className="container section">
        <div className="section-head">
          <h2 className="text-h1">{s.ratesHeading}</h2>
          <p className="text-body-lg muted">{s.ratesNote}</p>
        </div>

        {/*
          KAMPANYA BANDI. Bakicinin en cok baktigi rakam bu sayfada;
          indirimli oldugunu ve NE ZAMAN bittigini soylememek, kampanya
          bitince orani sessizce artirmak olurdu.
        */}
        {campaignName && campaignEndsAt && (
          <div className="notice notice-accent" style={{ marginBottom: 'var(--space-5)' }}>
            <p>
              <strong>{campaignName}</strong>{' — '}
              {locale === 'fr-CA'
                ? `commission réduite jusqu’au ${dayFmt(campaignEndsAt, locale)}.`
                : `lower commission until ${dayFmt(campaignEndsAt, locale)}.`}
            </p>
          </div>
        )}

        {/*
          UCRETLER ACIKCA YAZILI.
          Competition Act'in drip-pricing yasagi tuketici tarafinda; ama
          bakiciya karsi seffaflik bu urunun ana iddiasi. Rakipte bu rakam
          sozlesmenin icinde; burada giris sayfasinda.
        */}
        <div className="grid grid-3">
          {rates.map((r, i) => (
            <div key={r.pct} className={i === 0 ? 'panel card-pad' : 'card card-pad'}
                 style={i === 0 ? { borderRadius: 'var(--radius-lg)' } : undefined}>
              <p className="text-numeral" style={{
                color: i === 0 ? 'var(--color-panel-primary)' : 'var(--color-primary)',
              }}>
                {r.pct}%
              </p>
              <p className="muted" style={{ marginTop: 'var(--space-3)' }}>{r.label}</p>
            </div>
          ))}
        </div>

        {/* Rakamla desteklenen karsilastirma — dayanak compareToRover() */}
        <div className="card card-pad" style={{ marginTop: 'var(--space-6)' }}>
          <h3 className="text-h4">{interpolate(s.exampleHeading, { amount: money(sample, locale) })}</h3>
          <dl className="rate-compare">
            <div>
              <dt className="dim text-body-sm">{s.exampleOurs}</dt>
              <dd className="text-h3 tabular" style={{ color: 'var(--color-primary)' }}>
                {money(oursPayout, locale)}
              </dd>
            </div>
            <div>
              <dt className="dim text-body-sm">{s.exampleRover}</dt>
              <dd className="text-h3 tabular">{money(roverPayout, locale)}</dd>
            </div>
            <div>
              <dt className="dim text-body-sm">{s.exampleDiff}</dt>
              <dd className="text-h3 tabular" style={{ color: 'var(--color-accent-hover)' }}>
                +{money(vs.sitterSavesCents, locale)}
              </dd>
            </div>
          </dl>
          <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>{s.exampleNote}</p>
        </div>
      </section>

      {/* ---- Basvuru adimlari + gereklilikler ---- */}
      <section className="band band-sage band-round-t band-round-b">
        <div className="container section">
          <div className="grid" style={{ gap: 'var(--space-10)', gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <div>
              <h2 className="text-h2" style={{ marginBottom: 'var(--space-3)' }}>{s.stepsHeading}</h2>
              <p className="muted" style={{ marginBottom: 'var(--space-6)', maxWidth: '38rem' }}>
                {s.stepsNote}
              </p>
              {/* Adimlar KODDAN: ONBOARDING_STEPS degisirse sayfa da degisir */}
              <ol className="step-list">
                {ONBOARDING_STEPS.map((step, i) => (
                  <li key={step}>
                    <span className="step-num tabular">{i + 1}</span>
                    <span>{m.onboarding[`step.${step}` as const]}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{s.requirementsHeading}</h2>
              <ul className="req-list">
                {(['age', 'check', 'sin', 'bank'] as const).map((k) => (
                  <li key={k}>
                    <ShieldIcon size={15} />
                    <span>{s[`req.${k}` as const]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---- SSS ---- */}
      <section className="container section">
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{s.faqHeading}</h2>
        <div style={{ maxWidth: '48rem' }}>
          <Faq items={faqs} locale={locale} />
        </div>

        <div className="card card-pad" style={{
          marginTop: 'var(--space-10)', background: 'var(--color-primary-subtle)', borderColor: 'transparent',
        }}>
          <h2 className="text-h3">{s.ctaHeading}</h2>
          <div className="row" style={{ marginTop: 'var(--space-5)' }}>
            <SitterStartCta locale={locale} />
            <Link href={`/${seg}/pricing/`} className="btn btn-secondary">
              {fr ? 'Voir nos frais' : 'See how our fees work'}
            </Link>
          </div>
          <p className="field-hint" style={{ marginTop: 'var(--space-5)' }}>
            {m.verification.disclaimer}
          </p>
        </div>
      </section>
    </>
  );
}
