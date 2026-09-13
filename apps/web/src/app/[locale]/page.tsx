import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor, serviceSlug } from '@havre/i18n';
import { servicesForPhase, calculateCommission, compareToRover, dollars } from '@havre/core';
import { SearchBar } from '@/components/SearchBar';
import { TrustStrip } from '@/components/TrustStrip';
import { ShieldIcon } from '@/components/VerificationBadge';
import { cityName, citySlug, getDefaultCity, getLandingData } from '@/lib/data';
import { money } from '@/lib/format';

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);
  const services = servicesForPhase('v1');
  const city = await getDefaultCity();
  const data = await getLandingData(city, 'boarding', locale);

  /**
   * Ucret seffafligi bolumu icin canli karsilastirma.
   *
   * COMPETITION ACT (yol haritasi §8.6): reklam iddialari ISPATLANABILIR olmali.
   * Karsilastirma Rover'in KANADA GENELINDE gecerli STANDART orani (%20) uzerinden
   * yapilir; Tier 1 (%30) yalnizca 7 sehirde pilot ve Toronto/Montreal'de gecerli degil.
   */
  const sample = dollars(500);
  const ours = calculateCommission({ subtotalCents: sample, attribution: 'sitter_referral' });
  const vsRover = compareToRover(sample, ours, 'standard');

  return (
    <>
      {/* ---- Hero: fotograf + scrim. Koyuluk TEK bloga hapsedilir. ---- */}
      <section className="container" style={{ paddingBlock: 'var(--space-4) 0' }}>
        <div className="hero">
          {/*
            Gercek fotograf geldiginde bu blok next/image ile degistirilir:
            <Image className="hero-media" src={hero} alt="" priority placeholder="blur" fill />
            Spec: 2.2:1, >=1760x800, konu SAG yarida (sol yari metne ayrildi).
          */}
          <div className="hero-media-placeholder" aria-hidden="true" />

          <div className="hero-body">
            <span className="eyebrow">
              <span style={{ color: 'var(--color-panel-primary)', display: 'inline-flex' }}>
                <ShieldIcon size={14} />
              </span>
              {locale === 'fr-CA' ? "Fait ici, au Canada · en-CA & fr-CA" : 'Built in Canada · en-CA & fr-CA'}
            </span>

            <h1 className="text-display" style={{ margin: 'var(--space-5) 0 var(--space-4)' }}>
              {m.home.heroTitle}
            </h1>
            <p className="text-body-lg muted" style={{ marginBottom: 'var(--space-8)', maxWidth: '28rem' }}>
              {m.home.heroSubtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBlock: 'var(--space-6)' }}>
        <SearchBar locale={locale} />
        <div style={{ marginTop: 'var(--space-5)' }}>
          <TrustStrip
            locale={locale}
            cityName={cityName(city, locale)}
            sitterCount={data.sitterCount}
            medianPriceCents={data.medianPriceCents}
            bookingCount={data.bookingCount}
          />
        </div>
      </section>

      {/* ---- Hizmetler ---- */}
      <section className="container" style={{ paddingBlock: 'var(--space-10)' }}>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>
          {locale === 'fr-CA' ? 'Ce que vous pouvez réserver' : 'What you can book'}
        </h2>
        <div className="grid grid-4">
          {services.map((s) => (
            <Link
              key={s}
              href={`/${segmentFor(locale)}/${citySlug(city, locale)}/${serviceSlug(s, locale)}`}
              className="card card-hover card-pad"
            >
              <h3 className="text-h4" style={{ marginBottom: 'var(--space-1)' }}>{m.service[s]}</h3>
              <p className="dim text-body-sm">{m.serviceDescription[s]}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---- Ucret seffafligi: rakiplere karsi en guclu hamle ---- */}
      <section className="container" style={{ paddingBlock: 'var(--space-10)' }}>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>
          {locale === 'fr-CA'
            ? 'Amenez votre propre client. Nous ne prenons rien.'
            : 'Bring your own client. We take nothing.'}
        </h2>
        <p className="muted" style={{ marginBottom: 'var(--space-6)', maxWidth: '38rem' }}>
          {locale === 'fr-CA'
            ? 'Trois taux, publiés. C’est toute la page de tarification.'
            : 'Three rates, published. That is the whole pricing page.'}
        </p>

        <div className="grid grid-3">
          {(['platform', 'sitter_referral', 'repeat'] as const).map((a) => {
            const c = calculateCommission({ subtotalCents: sample, attribution: a });
            const highlighted = a === 'sitter_referral';
            return (
              <div
                key={a}
                className={highlighted ? 'panel card-pad' : 'card card-pad'}
                style={highlighted ? { borderRadius: 'var(--radius-lg)' } : undefined}
              >
                <div
                  className="text-h1 tabular"
                  style={{
                    color: highlighted ? 'var(--color-panel-accent)' : 'var(--color-primary)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  {c.sitterPct}%
                </div>
                <p className="text-body-sm" style={highlighted ? { fontWeight: 500 } : { color: 'var(--color-ink-secondary)' }}>
                  {m.commission[a]}
                </p>
              </div>
            );
          })}
        </div>

        <p className="dim text-body-sm tabular" style={{ marginTop: 'var(--space-5)' }}>
          {locale === 'fr-CA'
            ? `Sur une réservation de ${money(sample, locale)}, un gardien garde jusqu’à ${money(vsRover.sitterSavesCents, locale)} de plus qu’ailleurs.`
            : `On a ${money(sample, locale)} booking, a sitter keeps up to ${money(vsRover.sitterSavesCents, locale)} more than elsewhere.`}
        </p>
      </section>
    </>
  );
}
