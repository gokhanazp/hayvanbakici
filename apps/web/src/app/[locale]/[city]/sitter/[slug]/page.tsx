import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SERVICES } from '@havre/core';
import {
  getMessages, interpolate, localeFromSegment, LOCALES, segmentFor, serviceSlug,
  type Locale, type Messages,
} from '@havre/i18n';
import { VerificationBadge, ShieldIcon } from '@/components/VerificationBadge';
import { getSitterProfile, getSitterSlugsForBuild, type SitterProfile } from '@/lib/data';
import { sitterJsonLd, urlFor } from '@/lib/seo';
import { money, responseTime, dateFmt, numberFmt } from '@/lib/format';

/**
 * BAKICI PROFIL SAYFASI.
 *
 * ISR: fiyat, musaitlik ve yorumlar degisiyor; her saat tazeleniyor.
 * Tier-1 sehirlerin ust siradaki bakicilari build'de uretiliyor, geri kalani
 * talep uzerine — 144 bakicinin hepsini build'de uretmek bugun mumkun ama
 * bakici sayisi buyudugunde deploy suresini patlatirdi.
 */
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const rows = await getSitterSlugsForBuild();
  return rows.flatMap((r) => [
    { locale: 'en', city: r.citySlugEn, slug: r.slug },
    { locale: 'fr', city: r.citySlugFr, slug: r.slug },
  ]);
}

async function resolve(params: Promise<{ locale: string; city: string; slug: string }>) {
  const { locale: seg, city, slug } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return null;
  const sitter = await getSitterProfile(slug, locale);
  if (!sitter) return null;

  /*
    SEHIR SEGMENTI DOGRULANIYOR.
    /en/montreal/sitter/camille-b-7f3a adresi, Camille Toronto'daysa
    404 donmeli. Aksi halde ayni profil her sehrin altinda acilir ve
    yinelenen icerik uretiriz.
  */
  const expected = locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn;
  if (city !== expected) return null;

  return { locale, sitter };
}

function cityName(s: SitterProfile, locale: Locale): string {
  return locale === 'fr-CA' ? s.cityNameFr : s.cityNameEn;
}
function hoodName(s: SitterProfile, locale: Locale): string {
  return locale === 'fr-CA' ? s.neighbourhoodFr : s.neighbourhoodEn;
}
function profileUrl(s: SitterProfile, locale: Locale): string {
  const city = locale === 'fr-CA' ? s.citySlugFr : s.citySlugEn;
  return urlFor(locale, city, 'sitter', s.slug);
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; city: string; slug: string }> },
): Promise<Metadata> {
  const found = await resolve(params);
  if (!found) return {};
  const { locale, sitter } = found;
  const m = getMessages(locale);

  const name = `${sitter.firstName} ${sitter.lastNameInitial}.`;
  const where = [hoodName(sitter, locale), cityName(sitter, locale)].filter(Boolean).join(', ');
  const services = sitter.services.map((s) => m.service[s.serviceType]).join(' · ');

  return {
    title: `${name} — ${where}`,
    description: sitter.bio?.slice(0, 155) ?? `${services} — ${where}.`,
    alternates: {
      canonical: profileUrl(sitter, locale),
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, profileUrl(sitter, l)])),
        'x-default': profileUrl(sitter, 'en-CA'),
      },
    },
    openGraph: { title: `${name} — ${where}`, url: profileUrl(sitter, locale), type: 'profile' },
  };
}

export default async function SitterPage({
  params,
}: {
  params: Promise<{ locale: string; city: string; slug: string }>;
}) {
  const found = await resolve(params);
  if (!found) notFound();
  const { locale, sitter } = found;

  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const name = `${sitter.firstName} ${sitter.lastNameInitial}.`;
  const where = [hoodName(sitter, locale), cityName(sitter, locale)].filter(Boolean).join(', ');
  const cheapest = sitter.services[0];

  return (
    <>
      <div className="container" style={{ paddingBlock: 'var(--space-6) 0' }}>
        <Link href={`/${seg}/${locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn}/${serviceSlug('boarding', locale)}/`}
          className="text-body-sm muted">
          ← {interpolate(m.sitter.backToCity, { city: cityName(sitter, locale) })}
        </Link>
      </div>

      <section className="container sitter-page">
        <div className="sitter-main">
          {/* --- Kimlik --- */}
          <header className="sitter-head">
            <span className="sitter-avatar" aria-hidden="true">{sitter.photoInitials}</span>
            <div style={{ minWidth: 0 }}>
              <h1 className="text-h1" style={{ margin: 0 }}>{name}</h1>
              <p className="muted" style={{ marginTop: 'var(--space-1)' }}>{where}</p>
              <div className="row" style={{ marginTop: 'var(--space-3)' }}>
                <VerificationBadge level={sitter.badgeLevel} locale={locale} />
                {sitter.reviewCount > 0 && (
                  <span className="text-body-sm tabular">
                    ★ {sitter.averageRating.toFixed(1)}{' '}
                    <span className="dim">({numberFmt(sitter.reviewCount, locale)})</span>
                  </span>
                )}
              </div>
            </div>
          </header>

          {/*
            Canli istatistikler — sayfanin benzersizligini tasiyan veri (§7.7).
            Etiketler AYRI anahtarlar: cumlelerden degeri cikarip kalanini
            etiket diye kullanmak ("Replies in about") Ingilizce'de yarim
            cumle, Fransizca'da ise dogrudan yanlis uretiyordu.
          */}
          <ul className="sitter-stats">
            <Stat value={numberFmt(sitter.completedBookings, locale)} label={m.sitter['stat.completed']} />
            <Stat value={numberFmt(sitter.repeatClients, locale)} label={m.sitter['stat.repeat']} />
            <Stat value={responseTime(sitter.medianResponseMinutes, locale)} label={m.sitter['stat.responds']} />
            <Stat value={`${Math.round(sitter.acceptanceRate * 100)}%`} label={m.sitter['stat.acceptance']} />
          </ul>

          {sitter.bio && (
            <section>
              <h2 className="text-h2">{interpolate(m.sitter.aboutHeading, { name: sitter.firstName })}</h2>
              <p className="text-body-lg" style={{ marginTop: 'var(--space-4)', maxWidth: '40rem' }}>
                {sitter.bio}
              </p>
              <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>
                {m.sitter.privacyNote}
              </p>
            </section>
          )}

          {/* --- Hizmetler ve fiyatlar --- */}
          <section>
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-5)' }}>
              {interpolate(m.sitter.servicesHeading, { name: sitter.firstName })}
            </h2>
            <div className="grid" style={{ gap: 'var(--space-3)' }}>
              {sitter.services.map((s) => (
                <article key={s.serviceType} className="card card-pad sitter-service">
                  <div>
                    <h3 className="text-h4">{m.service[s.serviceType]}</h3>
                    <p className="text-body-sm muted" style={{ marginTop: 'var(--space-1)' }}>
                      {m.serviceDescription[s.serviceType]}
                    </p>
                    <div className="row" style={{ marginTop: 'var(--space-3)', gap: 'var(--space-2)' }}>
                      {s.acceptsDogs && <span className="badge badge-outline">{m.onboarding['services.dogs']}</span>}
                      {s.acceptsCats && <span className="badge badge-outline">{m.onboarding['services.cats']}</span>}
                      {s.acceptsOther && <span className="badge badge-outline">{m.onboarding['services.other']}</span>}
                      <span className="badge badge-outline tabular">
                        {interpolate(m.sitter.sizeRange, {
                          min: Math.round(s.acceptedSizeMinKg),
                          max: Math.round(s.acceptedSizeMaxKg),
                        })}
                      </span>
                    </div>
                    {/*
                      IPTAL POLITIKASI SOZLESME KURULMADAN ONCE tam gosteriliyor
                      (Ontario/Quebec tuketici koruma mevzuati).
                    */}
                    <p className="text-body-sm dim" style={{ marginTop: 'var(--space-3)' }}>
                      {m.sitter.cancellationLabel}:{' '}
                      {m.onboarding[`cancellation.${s.cancellationPolicy}` as keyof Messages['onboarding']] as string}
                    </p>
                  </div>

                  {/* Drip pricing yasagi: gosterilen rakam bakicinin ucreti,
                      toplam ucret rezervasyon ekraninda kalem kalem acilir. */}
                  <div className="sitter-price tabular">
                    <span className="text-h3">{money(s.priceCents, locale)}</span>
                    <span className="dim text-body-sm">/ {m.unit[SERVICES[s.serviceType].unit]}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* --- Ev --- */}
          <section>
            <h2 className="text-h2" style={{ marginBottom: 'var(--space-5)' }}>{m.sitter.homeHeading}</h2>
            <ul className="sitter-facts">
              {sitter.homeType && (
                <Fact>{m.onboarding[`home.${sitter.homeType}` as keyof Messages['onboarding']] as string}</Fact>
              )}
              {sitter.hasYard && <Fact>{sitter.yardFenced ? m.sitter['home.yardFenced'] : m.sitter['home.yard']}</Fact>}
              <Fact>{sitter.hasOwnPets ? m.sitter['home.ownPets'] : m.sitter['home.noOwnPets']}</Fact>
              {sitter.smokeFree && <Fact>{m.sitter['home.smokeFree']}</Fact>}
              <Fact>{interpolate(m.sitter['home.maxPets'], { count: sitter.maxConcurrentPets })}</Fact>
            </ul>
          </section>

          {/* --- Yorumlar --- */}
          <section>
            <h2 className="text-h2">{m.sitter.reviewsHeading}</h2>
            {sitter.reviews.length === 0 ? (
              <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{m.sitter.noReviews}</p>
            ) : (
              <>
                <p className="muted tabular" style={{ marginTop: 'var(--space-2)' }}>
                  {interpolate(m.sitter.reviewCount, {
                    count: numberFmt(sitter.reviewCount, locale),
                    rating: sitter.averageRating.toFixed(1),
                  })}
                </p>
                <div className="grid" style={{ gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                  {sitter.reviews.map((r) => (
                    <article key={r.id} className="card card-pad">
                      <div className="row" style={{ justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>
                          {r.authorFirstName} {r.authorInitial}.
                        </span>
                        <span className="tabular text-body-sm">
                          {'★'.repeat(r.rating)}
                          <span className="dim">{'☆'.repeat(5 - r.rating)}</span>
                        </span>
                      </div>
                      {r.body && <p style={{ marginTop: 'var(--space-3)' }}>{r.body}</p>}
                      <p className="dim text-body-sm" style={{ marginTop: 'var(--space-3)' }}>
                        {dateFmt(r.publishedAt, locale)}
                      </p>
                      {r.responseBody && (
                        <div className="sitter-review-reply">
                          <p className="text-body-sm" style={{ fontWeight: 600 }}>
                            {interpolate(m.sitter.response, { name: sitter.firstName })}
                          </p>
                          <p className="text-body-sm" style={{ marginTop: 'var(--space-1)' }}>{r.responseBody}</p>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>

          <p className="field-hint tabular">
            {interpolate(m.sitter.dataAsOf, { date: dateFmt(sitter.dataAsOf, locale) })}
          </p>
        </div>

        {/* --- Rezervasyon kutusu --- */}
        <aside className="sitter-aside">
          <div className="card card-pad sitter-book">
            {cheapest && (
              <p className="tabular">
                <span className="text-h2">{money(cheapest.priceCents, locale)}</span>
                <span className="dim"> / {m.unit[SERVICES[cheapest.serviceType].unit]}</span>
              </p>
            )}

            <p className="text-body-sm muted">{m.sitter.feeNote}</p>

            <Link href={`/${seg}/account/sign-in/`} className="btn btn-primary btn-block">
              {m.sitter.bookCta}
            </Link>
            <Link href={`/${seg}/account/sign-in/`} className="btn btn-secondary btn-block">
              {m.sitter.messageCta}
            </Link>

            <ul className="sitter-facts" style={{ marginTop: 'var(--space-2)' }}>
              <Fact>{interpolate(m.sitter.openDays, { count: sitter.openDays })}</Fact>
              <Fact>{interpolate(m.sitter.memberSince, { date: dateFmt(sitter.memberSince, locale) })}</Fact>
            </ul>

            <p className="field-hint" style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <span style={{ color: 'var(--color-primary)', flex: '0 0 auto' }}><ShieldIcon size={13} /></span>
              {m.verification.disclaimer}
            </p>
          </div>
        </aside>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(sitterJsonLd({
            name: `${name} — Havre`,
            url: profileUrl(sitter, locale),
            cityName: cityName(sitter, locale),
            province: sitter.province,
            description: sitter.bio,
            rating: sitter.averageRating,
            reviewCount: sitter.reviewCount,
            services: sitter.services.map((s) => ({
              name: m.service[s.serviceType],
              priceCents: s.priceCents,
            })),
          })),
        }}
      />
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <li>
      <span className="text-numeral">{value}</span>
      <span className="text-body-sm muted">{label}</span>
    </li>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <li>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m3 8.5 3 3 7-7" />
      </svg>
      {children}
    </li>
  );
}
