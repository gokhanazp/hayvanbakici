import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { servicesForPhase, calculateCommission, compareToRover, dollars } from '@havre/core';
import { SearchBar } from '@/components/SearchBar';
import { TrustStrip } from '@/components/TrustStrip';
import { ServiceTiles } from '@/components/ServiceTiles';
import { GalleryStrip } from '@/components/GalleryStrip';
import { FeatureCards } from '@/components/FeatureCards';
import { HeroArt } from '@/components/HeroArt';
import { BannerDoodles, HeroDoodles } from '@/components/Doodles';
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
  const zero = calculateCommission({ subtotalCents: sample, attribution: 'sitter_referral' }).sitterPct;

  return (
    <>
      {/* ---- Kahraman: krem zemin, kesilmis gorsel, el cizimi konturlar ---- */}
      <section className="container hero">
        <HeroDoodles />

        <div className="hero-grid">
          <div className="hero-copy">
            <span className="badge" style={{
              background: 'var(--color-accent-subtle)',
              color: 'var(--color-accent-hover)',
              gap: 'var(--space-2)',
            }}>
              <ShieldIcon size={13} />
              {locale === 'fr-CA'
                ? 'Antécédents vérifiés pour chaque gardien'
                : 'Every sitter background-checked'}
            </span>

            <h1 className="text-display" style={{ margin: 'var(--space-5) 0 var(--space-4)' }}>
              {m.home.heroTitle}
            </h1>
            <p className="text-body-lg muted" style={{ textWrap: 'pretty' }}>
              {m.home.heroSubtitle}
            </p>
          </div>

          <HeroArt />
        </div>
      </section>

      {/* ---- Kahramanin altina binen arama karti ---- */}
      <section className="container hero-search">
        <SearchBar locale={locale} />
        <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--space-5)' }}>
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
      <section className="container" style={{ paddingBlock: 'var(--space-16) var(--space-10)' }}>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>
          {locale === 'fr-CA' ? 'De quoi avez-vous besoin?' : 'What do you need?'}
        </h2>
        <ServiceTiles locale={locale} services={services} citySlug={citySlug(city, locale)} />
      </section>

      {/* ---- Ne yapiyoruz ---- */}
      <FeatureCards locale={locale} />

      {/*
        ---- Havre Anlari ----
        photos bos: gercek rezervasyon fotografi yok. Stokla doldurmak yerine
        kendi cizimlerimiz duruyor ve bunun gecici oldugu sayfada yaziyor.
      */}
      <GalleryStrip locale={locale} />

      {/* ---- Bakici banneri: urunun en guclu hamlesi, tek blokta ---- */}
      <section className="container" style={{ paddingBlock: 'var(--space-6) var(--space-16)' }}>
        <div className="banner">
          <BannerDoodles />
          <div className="banner-body">
            <span className="badge" style={{ background: 'var(--color-surface)', color: 'var(--color-accent-hover)' }}>
              {locale === 'fr-CA' ? 'Pour les gardiens' : 'For sitters'}
            </span>

            <h2 className="text-h1" style={{ margin: 'var(--space-4) 0 0' }}>
              {locale === 'fr-CA' ? 'Amenez vos propres clients.' : 'Bring your own clients.'}
              <br />
              {locale === 'fr-CA' ? 'Gardez ' : 'Keep '}
              <span style={{ color: 'var(--color-primary)' }}>{100 - zero}%</span>
              {locale === 'fr-CA' ? ' de ce qu’ils paient.' : ' of what they pay.'}
            </h2>

            <p className="text-body-lg muted" style={{ marginTop: 'var(--space-4)', maxWidth: '32rem' }}>
              {locale === 'fr-CA'
                ? 'Invitez un client avec votre propre code et nous ne prenons rien sur ses réservations — de façon permanente, pas pour un mois d’essai.'
                : 'Invite a client with your own code and we take nothing on their bookings — permanently, not for a trial month.'}
            </p>

            <div className="row" style={{ marginTop: 'var(--space-6)' }}>
              <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary">
                {m.nav.becomeSitter}
              </Link>
              <Link href={`/${seg}/pricing/`} className="btn btn-secondary">
                {locale === 'fr-CA' ? 'Voir nos frais' : 'See how our fees work'}
              </Link>
            </div>

            {/*
              Rakamla desteklenen iddia. Competition Act: dayanak
              packages/core/commission.ts icindeki compareToRover().
            */}
            <p className="text-body-sm dim" style={{ marginTop: 'var(--space-5)' }}>
              {locale === 'fr-CA'
                ? `Sur une réservation de ${money(sample, locale)}, un gardien garde jusqu’à ${money(vsRover.sitterSavesCents, locale)} de plus qu’ailleurs.`
                : `On a ${money(sample, locale)} booking, a sitter keeps up to ${money(vsRover.sitterSavesCents, locale)} more than elsewhere.`}
            </p>
          </div>
        </div>
      </section>

      {/* ---- Ucret defteri: uc oran, tek tabloda ---- */}
      <section className="container" style={{ paddingBlock: '0 var(--space-16)' }}>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-2)' }}>
          {locale === 'fr-CA' ? 'Trois taux, publiés.' : 'Three rates, published.'}
        </h2>
        <p className="muted" style={{ marginBottom: 'var(--space-6)', maxWidth: '38rem' }}>
          {locale === 'fr-CA'
            ? 'C’est toute la page de tarification. Aucun frais caché, ni pour vous ni pour le gardien.'
            : 'That is the whole pricing page. No hidden fees, for you or your sitter.'}
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
                    color: highlighted ? 'var(--color-panel-primary)' : 'var(--color-primary)',
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
      </section>
    </>
  );
}
