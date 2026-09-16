import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { servicesForPhase, calculateCommission, compareToRover, dollars, SERVICES } from '@havre/core';
import { SearchBar } from '@/components/SearchBar';
import { TrustStrip } from '@/components/TrustStrip';
import { ServiceTiles } from '@/components/ServiceTiles';
import { SitterStrip } from '@/components/SitterStrip';
import { Testimonials } from '@/components/Testimonials';
import { FeatureCards } from '@/components/FeatureCards';
import { Photo } from '@/components/Photo';
import { Avatar } from '@/components/Avatar';
import { HeroDoodles, SectionDoodles } from '@/components/Doodles';
import { ShieldIcon } from '@/components/VerificationBadge';
import { cityName, citySlug, getDefaultCity, getFeaturedReviews, getLandingData } from '@/lib/data';
import { money, numberFmt } from '@/lib/format';

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const services = servicesForPhase('v1');
  const city = await getDefaultCity();
  const [data, reviews] = await Promise.all([
    getLandingData(city, 'boarding', locale),
    getFeaturedReviews(3),
  ]);

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
  const zero = ours.sitterPct;

  return (
    <>
      {/*
        ---- Kahraman ----
        BANT: sayfanin geri kalanindan farkli bir sicaklikta (blush -> kayisi).
        Tek krem zeminde kahraman ile govde birbirine giriyordu; renkli bant
        sayfanin ilk ekranini kendi basina bir yer haline getiriyor.
        Alt kose kavisi, arama kartinin banda binmesiyle birlikte bolum
        gecisini yumusatiyor.
      */}
      <section className="band band-blush band-round-b hero-band">
        <div className="container hero">
          <HeroDoodles />

          <div className="hero-grid">
            <div className="hero-copy">
              <span className="badge hero-in hero-in-1" style={{
                background: 'var(--color-surface)',
                color: 'var(--color-accent-hover)',
                gap: 'var(--space-2)',
              }}>
                <ShieldIcon size={13} />
                {fr ? 'Antécédents vérifiés pour chaque gardien' : 'Every sitter background-checked'}
              </span>

              {/*
                LCP ADAYI: SOLUKLANMA YOK, yalnizca kayma.

                opacity: 0 ile baslayan bir oge tarayici tarafindan
                "boyanmis" sayilmaz; basligi solduraraak getirmek LCP'yi
                animasyon suresi kadar geriye atiyor. Sayfanin en buyuk
                iki ogesi (baslik ve ilk fotograf) bu yuzden yalnizca
                transform ile geliyor — ilk karede gorunurler.
              */}
              <h1 className="text-display hero-in-solid hero-in-2"
                  style={{ margin: 'var(--space-5) 0 var(--space-4)' }}>
                {m.home.heroTitle}
              </h1>
              <p className="text-body-lg muted hero-in hero-in-3"
                 style={{ textWrap: 'pretty', maxWidth: '32rem' }}>
                {m.home.heroSubtitle}
              </p>

              {/*
                Uc madde, ucu de sitede KARSILIGI OLAN iddialar: adli sicil
                kontrolu (screening), tam fiyat (drip pricing yasagi), konaklama
                sirasindaki mesaj/fotograf. "7/24 destek" gibi henuz kurmadigimiz
                bir sey yazmiyoruz — Competition Act, iddianin ispatlanabilir
                olmasini istiyor.
              */}
              <ul className="hero-points hero-in hero-in-4">
                {(fr
                  ? ['Vérification approfondie des antécédents et de l’identité',
                     'Tous les frais affichés avant la réservation',
                     'Messagerie avec votre gardien, avant et pendant']
                  : ['Enhanced criminal record and identity checks',
                     'Every fee shown before you book',
                     'Message your sitter, before and during']
                ).map((t) => (
                  <li key={t}>
                    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"
                         fill="none" stroke="var(--color-accent-hover)" strokeWidth="2"
                         strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 8.4 3.2 3.2L13 4.8" />
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero-media">
              {/*
                Fotograf kolaji. Metin fotografin UZERINDE DEGIL yaninda:
                hangi fotograf gelirse gelsin basligin kontrasti degismiyor.
                Ilk fotograf `priority` — LCP ogesi bu (yol haritasi §7).
              */}
              <div className="hero-photos">
                {/* Ilk fotograf da LCP adayi — o da yalnizca transform ile geliyor. */}
                <div className="photo-frame hero-in-solid hero-in-2">
                  <Photo id="hero-primary" locale={locale} priority
                         sizes="(min-width: 1100px) 24rem, (min-width: 900px) 15rem, 55vw" />
                </div>
                <div className="photo-frame hero-in hero-in-3">
                  <Photo id="hero-side-a" locale={locale} sizes="(min-width: 1100px) 15rem, (min-width: 900px) 11rem, 40vw" />
                </div>
                <div className="photo-frame hero-in hero-in-4">
                  <Photo id="hero-side-b" locale={locale} sizes="(min-width: 1100px) 15rem, (min-width: 900px) 11rem, 40vw" />
                </div>
              </div>

              {/* Canli veri — uydurma "10.000 mutlu musteri" degil, sorgudan gelen sayi */}
              <div className="hero-float hero-in hero-in-5">
                <span className="avatar-stack">
                  {data.sitters.slice(0, 3).map((s) => (
                    <Avatar key={s.id} src={s.avatarUrl} initials={s.photoInitials} size={30} />
                  ))}
                </span>
                <span className="text-body-sm" style={{ lineHeight: '1.1rem' }}>
                  <strong className="tabular">{numberFmt(data.sitterCount, locale)}</strong>{' '}
                  {fr ? `gardiens vérifiés à ${cityName(city, locale)}` : `verified sitters in ${cityName(city, locale)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Kahramanin altina binen arama karti ---- */}
      <section className="container hero-search">
        <SearchBar locale={locale} />
        <div className="row" style={{ justifyContent: 'center', marginTop: 'var(--space-5)' }}>
          {/* Veri konaklama hizmetinden geliyor (yukarida getLandingData) —
              birim de ondan; sabit "/gece" yazmak baska bir hizmette yalan olur. */}
          <TrustStrip
            locale={locale}
            cityName={cityName(city, locale)}
            sitterCount={data.sitterCount}
            medianPriceCents={data.medianPriceCents}
            bookingCount={data.bookingCount}
            unit={SERVICES.boarding.unit}
          />
        </div>
      </section>

      {/* ---- Hizmetler ---- */}
      <section className="container section has-doodles">
        <SectionDoodles set="services" />
        <div className="section-head">
          <h2 className="text-h2">{fr ? 'De quoi avez-vous besoin?' : 'What do you need?'}</h2>
        </div>
        <ServiceTiles locale={locale} services={services} citySlug={citySlug(city, locale)} />
      </section>

      {/* ---- Ne yapiyoruz — adacayi bant ---- */}
      <section className="band band-sage band-round-t band-round-b has-doodles">
        <SectionDoodles set="features" />
        <FeatureCards locale={locale} />
      </section>

      {/* ---- Bakici seridi: gercek profiller, gercek fotograflar ---- */}
      <SitterStrip
        locale={locale}
        sitters={data.sitters}
        citySlug={citySlug(city, locale)}
        cityName={cityName(city, locale)}
      />

      {/* ---- Referanslar: sitede yazilmis yorumlardan ---- */}
      <Testimonials locale={locale} reviews={reviews} />

      {/* ---- Bakici banneri: urunun en guclu hamlesi ---- */}
      <section className="container section">
        <div className="banner-photo">
          <span className="photo-fill" aria-hidden="true">
            <Photo id="sitter-banner" locale={locale} decorative sizes="100vw" />
          </span>

          <div className="banner-card">
            <span className="badge" style={{
              background: 'var(--color-accent-subtle)', color: 'var(--color-accent-hover)',
            }}>
              {fr ? 'Pour les gardiens' : 'For sitters'}
            </span>

            <h2 className="text-h1" style={{ margin: 'var(--space-4) 0 0' }}>
              {fr ? 'Amenez vos propres clients.' : 'Bring your own clients.'}
              <br />
              {fr ? 'Gardez ' : 'Keep '}
              <span style={{ color: 'var(--color-primary)' }}>{100 - zero}%</span>
              {fr ? ' de ce qu’ils paient.' : ' of what they pay.'}
            </h2>

            <p className="text-body-lg muted" style={{ marginTop: 'var(--space-4)' }}>
              {fr
                ? 'Invitez un client avec votre propre code et nous ne prenons rien sur ses réservations — de façon permanente, pas pour un mois d’essai.'
                : 'Invite a client with your own code and we take nothing on their bookings — permanently, not for a trial month.'}
            </p>

            <div className="row" style={{ marginTop: 'var(--space-6)' }}>
              <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary">
                {m.nav.becomeSitter}
              </Link>
              <Link href={`/${seg}/pricing/`} className="btn btn-secondary">
                {fr ? 'Voir nos frais' : 'See how our fees work'}
              </Link>
            </div>

            {/*
              Rakamla desteklenen iddia. Competition Act: dayanak
              packages/core/commission.ts icindeki compareToRover().
            */}
            <p className="text-body-sm dim" style={{ marginTop: 'var(--space-5)' }}>
              {fr
                ? `Sur une réservation de ${money(sample, locale)}, un gardien garde jusqu’à ${money(vsRover.sitterSavesCents, locale)} de plus qu’ailleurs.`
                : `On a ${money(sample, locale)} booking, a sitter keeps up to ${money(vsRover.sitterSavesCents, locale)} more than elsewhere.`}
            </p>
          </div>
        </div>
      </section>

      {/* ---- Ucret defteri: uc oran, tek tabloda ---- */}
      <section className="container section has-doodles" style={{ paddingTop: 0 }}>
        <SectionDoodles set="fees" />
        <div className="section-head">
          <h2 className="text-h2">{fr ? 'Trois taux, publiés.' : 'Three rates, published.'}</h2>
          <p className="muted">
            {fr
              ? 'C’est toute la page de tarification. Aucun frais caché, ni pour vous ni pour le gardien.'
              : 'That is the whole pricing page. No hidden fees, for you or your sitter.'}
          </p>
        </div>

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
