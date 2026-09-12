import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor, serviceSlug } from '@havre/i18n';
import { servicesForPhase, calculateCommission, compareToRover, dollars } from '@havre/core';
import { SearchBar } from '@/components/SearchBar';
import { TrustStrip } from '@/components/TrustStrip';
import { CITIES, cityName, citySlug, getLandingData } from '@/lib/data';
import { money } from '@/lib/format';

export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);
  const services = servicesForPhase('v1');
  const toronto = CITIES[0]!;
  const data = await getLandingData(toronto, 'boarding', locale);

  // Ucret seffafligi bolumu icin canli karsilastirma.
  //
  // ⚠️ COMPETITION ACT (yol haritasi §8.6): Reklam iddialari ISPATLANABILIR olmali;
  // ceza sirketler icin 10M CAD'e veya dunya brut gelirinin %3'une kadar cikar ve
  // 20 Haz 2025'ten beri ozel taraflar dogrudan Tribunal'a basvurabiliyor.
  //
  // Bu yuzden karsilastirmayi Rover'in KANADA GENELINDE gecerli STANDART orani
  // (%20) uzerinden yapiyoruz. Tier 1 (%30) yalnizca 7 sehirde pilot ve
  // Toronto/Montreal'de gecerli degil — onu iddiaya dayanak yapmak yaniltici olur.
  const sample = dollars(500);
  const ours = calculateCommission({ subtotalCents: sample, attribution: 'sitter_referral' });
  const vsRover = compareToRover(sample, ours, 'standard');

  return (
    <>
      <section className="container" style={{ paddingBlock: 'var(--space-16)' }}>
        <div style={{ maxWidth: '42rem' }}>
          <h1 className="text-display" style={{ marginBottom: 'var(--space-4)' }}>
            {m.home.heroTitle}
          </h1>
          <p className="text-body-lg muted" style={{ marginBottom: 'var(--space-8)' }}>
            {m.home.heroSubtitle}
          </p>
        </div>

        <SearchBar locale={locale} />

        <div style={{ marginTop: 'var(--space-6)' }}>
          <TrustStrip
            locale={locale}
            cityName={cityName(toronto, locale)}
            sitterCount={data.sitterCount}
            medianPriceCents={data.medianPriceCents}
            bookingCount={data.bookingCount}
          />
        </div>
      </section>

      <section className="container" style={{ paddingBlock: 'var(--space-12)' }}>
        <h2 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>
          {locale === 'fr-CA' ? 'Nos services' : 'Our services'}
        </h2>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {services.map((s) => (
            <Link
              key={s}
              href={`/${segmentFor(locale)}/${citySlug(toronto, locale)}/${serviceSlug(s, locale)}`}
              className="card"
              style={{ padding: 'var(--space-5)', display: 'block' }}
            >
              <h3 className="text-h4" style={{ marginBottom: 'var(--space-2)' }}>{m.service[s]}</h3>
              <p className="muted" style={{ fontSize: '0.875rem' }}>{m.serviceDescription[s]}</p>
            </Link>
          ))}
        </div>
      </section>

      {/*
        UCRET SEFFAFLIGI — rakiplere karsi en guclu pazarlama hamlesi (yol haritasi §4.6).
        Komisyon tablosunu acikca yayinliyoruz. Rover ve Pawshake bunu yapmiyor.
      */}
      <section className="container" style={{ paddingBlock: 'var(--space-12)' }}>
        <div
          className="card"
          style={{ padding: 'var(--space-8)', background: 'var(--color-surface-sunken)' }}
        >
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-3)' }}>
            {locale === 'fr-CA' ? 'Nos frais, sans surprise' : 'Our fees, in plain sight'}
          </h2>
          <p className="muted" style={{ marginBottom: 'var(--space-6)', maxWidth: '38rem' }}>
            {locale === 'fr-CA'
              ? "Vous amenez votre propre client ? Nous prenons 0 %. C'est aussi simple que ça."
              : 'Bring your own client? We take 0%. That simple.'}
          </p>

          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {(['platform', 'sitter_referral', 'repeat'] as const).map((a) => {
              const c = calculateCommission({ subtotalCents: sample, attribution: a });
              return (
                <div key={a} className="card" style={{ padding: 'var(--space-5)' }}>
                  <div
                    className="text-h1 tabular"
                    style={{ color: 'var(--color-primary)', marginBottom: 'var(--space-2)' }}
                  >
                    {c.sitterPct}%
                  </div>
                  <p style={{ fontSize: '0.875rem' }}>{m.commission[a]}</p>
                </div>
              );
            })}
          </div>

          <p className="muted tabular" style={{ marginTop: 'var(--space-6)', fontSize: '0.8125rem' }}>
            {locale === 'fr-CA'
              ? `Sur une réservation de ${money(sample, locale)}, un gardien garde jusqu'à ${money(vsRover.sitterSavesCents, locale)} de plus qu'ailleurs.`
              : `On a ${money(sample, locale)} booking, a sitter keeps up to ${money(vsRover.sitterSavesCents, locale)} more than elsewhere.`}
          </p>
        </div>
      </section>
    </>
  );
}
