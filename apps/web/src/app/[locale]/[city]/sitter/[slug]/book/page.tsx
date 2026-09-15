import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, serviceFromSlug } from '@havre/i18n';
import { primaryService, servicesForPhase, type ServiceType } from '@havre/core';
import { getSession } from '@/lib/auth';
import { BookingForm, type BookableService } from '@/components/BookingForm';
import { Avatar } from '@/components/Avatar';
import { VerificationBadge } from '@/components/VerificationBadge';
import { getSitterProfile, listPets } from '@/lib/data';
import { requestBookingAction } from './actions';

/** Kisiye ozel ve her istekte taze — indekslenmez. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

const V1 = new Set(servicesForPhase('v1'));

export default async function BookPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string; city: string; slug: string }>;
  /**
   * ?service=dog-boarding — ziyaretcinin NIYETI.
   *
   * Profildeki her hizmetin kendi rezervasyon baglantisi var. Bu
   * parametre olmadan form hep ayni hizmetle aciliyordu: konaklama
   * arayan kisi gezdirme formunu buluyor ve fiyat farkini ancak
   * dokumde goruyordu.
   *
   * Sayfa zaten force-dynamic (kisiye ozel), searchParams okumak
   * onbellek acisindan bir sey kaybettirmiyor.
   */
  searchParams: Promise<{ service?: string }>;
}) {
  const { locale: seg, city, slug } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const sitter = await getSitterProfile(slug, locale);
  if (!sitter) notFound();

  // Profil sayfasiyla ayni sehir dogrulamasi — ayni bakici iki adresten acilmasin
  const expectedCity = locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn;
  if (city !== expectedCity) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/${seg}/account/sign-in/?next=/${seg}/${city}/sitter/${slug}/book/`);
  }

  const m = getMessages(locale);
  const pets = await listPets(session.user.id);

  const services: BookableService[] = sitter.services
    .filter((s) => V1.has(s.serviceType))
    .map((s) => ({
      serviceType: s.serviceType,
      priceCents: s.priceCents,
      extraPetPriceCents: s.extraPetPriceCents,
      holidaySurchargePct: s.holidaySurchargePct,
      cancellationPolicy: s.cancellationPolicy,
    }));

  if (services.length === 0) notFound();

  /*
    Istenen hizmet bu bakicida yoksa sessizce vitrin hizmetine
    dusuluyor — 404 vermek asiri sert: adres elle yazilmis ya da bakici
    o hizmeti kapatmis olabilir.
  */
  const { service: wanted } = await searchParams;
  const requested = wanted ? serviceFromSlug(wanted, locale) : null;
  const initialService: ServiceType =
    (requested && services.some((s) => s.serviceType === requested) ? requested : null)
    ?? primaryService(services)?.serviceType
    ?? services[0]!.serviceType;

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
              <h1 className="text-h2" style={{ margin: 0 }}>
                {interpolate(m.booking.requestTitle, { name: sitter.firstName })}
              </h1>
              <div className="row" style={{ marginTop: 'var(--space-2)' }}>
                <VerificationBadge level={sitter.badgeLevel} locale={locale} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
        <div style={{ maxWidth: '38rem' }}>
          <BookingForm
            locale={locale}
            sitterId={sitter.userId}
            sitterFirstName={sitter.firstName}
            services={services}
            initialService={initialService}
            pets={pets}
            province={sitter.province}
            action={requestBookingAction}
          />
        </div>
      </div>
    </>
  );
}
