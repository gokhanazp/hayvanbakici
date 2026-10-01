import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, serviceFromSlug } from '@havre/i18n';
import { primaryService, servicesForPhase, type ServiceType } from '@havre/core';
import { getSession } from '@/lib/auth';
import { BookingForm, type BookableService } from '@/components/BookingForm';
import { Avatar } from '@/components/Avatar';
import { VerificationBadge } from '@/components/VerificationBadge';
import { getSitterProfile, listPets, getCommission } from '@/lib/data';
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
  const [pets, commission] = await Promise.all([
    listPets(session.user.id),
    /* Ekran ve sunucu AYNI orani kullansin diye tek kaynak. */
    getCommission(),
  ]);

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
      {/*
        BASLIK — tasarimdaki rezervasyon ekraninin ustu: kucuk bir
        durum cipi, buyuk baslik, tek satirlik aciklama.

        Tasarimdaki "ADIM 2 / 3" ilerleme hapi ALINMADI: bizde uc
        adimli bir akis yok, istek tek sayfada olusuyor ve odeme
        bakici kabul ettikten sonra. Olmayan adimlari cizmek,
        kullaniciya daha iki ekran daha var dedirtirdi.
      */}
      <div className="bk-top">
        <div className="st-wrap">
          <Link href={`/${seg}/${city}/sitter/${slug}/`} className="bk-back">
            ← {sitter.firstName} {sitter.lastNameInitial}.
          </Link>
          <span className="bk-step">{m.booking.stepLabel}</span>
          <h1 className="bk-h1">
            {interpolate(m.booking.requestTitle, { name: sitter.firstName })}
          </h1>
          <p className="bk-lead">{m.booking.noPayment}</p>
        </div>
      </div>

      <div className="st-wrap book-page">
        <div>
          <BookingForm
            sitterAvatarUrl={sitter.avatarUrl}
            sitterInitials={sitter.photoInitials}
            sitterLastInitial={sitter.lastNameInitial}
            sitterBadgeLevel={sitter.badgeLevel}
            sitterNeighbourhood={locale === 'fr-CA' ? sitter.neighbourhoodFr : sitter.neighbourhoodEn}
            locale={locale}
            sitterId={sitter.userId}
            sitterFirstName={sitter.firstName}
            services={services}
            initialService={initialService}
            pets={pets}
            province={sitter.province}
            commission={commission.config}
            action={requestBookingAction}
          />
        </div>
      </div>
    </>
  );
}
