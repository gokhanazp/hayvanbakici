import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  completedSteps, isOnboardingStep, missingRequiredSteps, ONBOARDING_STEPS, photoTotal,
  type OnboardingStep, type ProvinceCode,
} from '@havre/core';
import { getMessages, localeFromSegment, segmentFor, type Messages } from '@havre/i18n';
import {
  getDb, getOnboardingState, listCities, listNeighbourhoods, listSitterPhotos,
  servicePriceRanges, MAX_SITTER_PHOTOS, MAX_PET_PHOTOS,
} from '@havre/db';
import { getSession } from '@/lib/auth';
import { Progress } from '@/components/onboarding/Progress';
import {
  AboutForm, HomeForm, LocationForm, ReviewForm, ScreeningForm, ServicesForm,
} from '@/components/onboarding/StepForms';
import { PhotoStep } from '@/components/onboarding/PhotoStep';
import {
  saveAboutAction, saveHomeAction, saveLocationAction, saveServicesAction,
  startScreeningAction, submitApplicationAction,
} from './actions';

/** Sihirbaz kisiye ozel: onbellege alinamaz, indekslenmez. */
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function OnboardingStepPage({
  params,
}: {
  params: Promise<{ locale: string; step: string }>;
}) {
  const { locale: seg, step } = await params;
  const locale = localeFromSegment(seg);
  if (!locale || !isOnboardingStep(step)) notFound();

  const session = await getSession();
  if (!session) {
    redirect(`/${seg}/account/sign-in/?next=/${seg}/become-a-sitter/${step}/`);
  }

  const db = getDb();
  const state = await getOnboardingState(db, session.user.id);
  if (!state) notFound();

  const m = getMessages(locale);

  const allPhotos = await listSitterPhotos(db, session.user.id);
  /*
    EV ve HAYVAN fotograflari AYRI sayiliyor. Ilerleme ve tavan
    hesaplari ev fotografina bakiyor; hayvan fotografi "evimde hayvan
    var" iddiasini tasiyor ve kendi tavani var.
  */
  const photos = allPhotos.filter((p) => p.kind === 'home');
  const petPhotos = allPhotos.filter((p) => p.kind === 'pet');
  const done = completedSteps({
    hasAbout: Boolean(state.bio && state.dateOfBirth && state.phone),
    hasLocation: Boolean(state.cityId && state.hasExactAddress),
    serviceCount: state.services.length,
    hasHome: Boolean(state.homeType),
    screeningStarted: Boolean(state.screening),
    photoCount: photoTotal({ hasAvatar: Boolean(state.avatarUrl), homePhotoCount: photos.length }),
  });

  const key = (k: string) => m.onboarding[k as keyof Messages['onboarding']] as string;
  const heading = key(`step.${step}`);

  return (
    <>
      {/*
        Baslik bandi: hangi adimdayiz, ne kadar kaldi, bu adim ne icin.
        Sihirbaz once bunlarin hicbirini soylemiyordu — kullanici formu
        doldururken kac adim kaldigini bilmiyordu.
      */}
      <section className="band band-blush band-round-b">
        <div className="container wizard-head">
          <Link href={`/${seg}/become-a-sitter/`} className="text-body-sm muted">
            ← {m.onboarding.backToStart}
          </Link>
          <h1 className="text-h1">{heading}</h1>
          <p className="text-body-lg muted" style={{ marginTop: 'var(--space-3)', maxWidth: '38rem' }}>
            {key(`intro.${step}`)}
          </p>
          <Progress locale={locale} current={step as OnboardingStep} completed={done} />
        </div>
      </section>

      <div className="container wizard-body">
        <div className="wizard-card">

      {step === 'about' && (
        <AboutForm
          locale={locale}
          action={saveAboutAction}
          initial={{
            firstName: state.firstName ?? '',
            lastNameInitial: state.lastNameInitial ?? '',
            bio: state.bio ?? '',
            phone: state.phone ?? '',
            dateOfBirth: state.dateOfBirth ?? '',
          }}
        />
      )}

      {step === 'location' && (await renderLocation())}

      {step === 'services' && (
        <ServicesForm
          locale={locale}
          action={saveServicesAction}
          initial={state.services}
          /* Fiyat onerisi yalnizca sehir secildiyse anlamli */
          ranges={state.cityId ? await servicePriceRanges(db, state.cityId) : {}}
          /* Net kazanc satiri: vergi ile bagli, promosyon varsa komisyon sifir */
          province={(state.province as ProvinceCode | null) ?? null}
          promoEndsAt={state.promoEndsAt}
        />
      )}

      {step === 'home' && (
        <HomeForm
          locale={locale}
          action={saveHomeAction}
          initial={{
            homeType: state.homeType ?? '',
            hasYard: state.hasYard,
            yardFenced: state.yardFenced,
            hasOwnPets: state.hasOwnPets,
            smokeFree: state.smokeFree,
            maxConcurrentPets: state.maxConcurrentPets,
            /* Uc durumlu alanlar: null = "henuz cevaplanmadi" */
            hasChildren: state.hasChildren,
            petsOnBed: state.petsOnBed,
            petsOnFurniture: state.petsOnFurniture,
            pottyBreakHours: state.pottyBreakHours,
            scheduleText: state.scheduleText ?? '',
            typicalDayText: state.typicalDayText ?? '',
            safetyText: state.safetyText ?? '',
            ownerPrefsText: state.ownerPrefsText ?? '',
          }}
        />
      )}

      {/*
        FOTOGRAF ADIMI. Formlar hesap ekranindakilerin AYNISI — ayni
        sunucu eylemleri, ayni dogrulama. Iki ayri yukleme yolu yazmak,
        birinde guvenlik kontrolunu unutmanin kestirme yoluydu.
      */}
      {step === 'photos' && (
        <PhotoStep
          locale={locale}
          photos={photos}
          petPhotos={petPhotos}
          max={MAX_SITTER_PHOTOS}
          petMax={MAX_PET_PHOTOS}
          hasOwnPets={state.hasOwnPets}
          avatarUrl={state.avatarUrl ?? null}
          firstName={state.firstName ?? ''}
        />
      )}

      {step === 'screening' && (
        <ScreeningForm
          locale={locale}
          action={startScreeningAction}
          status={state.screening?.status ?? null}
        />
      )}

      {step === 'review' && (
        <ReviewForm
          locale={locale}
          action={submitApplicationAction}
          submitted={state.status === 'pending'}
          missing={missingRequiredSteps(done)}
          /*
            OZET. Once bu ekranda yalnizca bir dugme vardi: "son bir kez
            bakin" diyip bakilacak hicbir sey gostermiyordu. On bes
            dakikalik bir formun sonunda kullanici ne gonderdigini
            gormeli ve yanlisi buradan duzeltebilmeli.
          */
          summary={{
            name: `${state.firstName ?? ''} ${state.lastNameInitial ?? ''}`.trim(),
            phone: state.phone,
            cityName: state.cityId
              ? (await listCities(db)).find((c) => c.id === state.cityId)?.[
                  locale === 'fr-CA' ? 'nameFr' : 'nameEn'
                ] ?? null
              : null,
            postalCode: state.postalCode,
            hasExactAddress: state.hasExactAddress,
            services: state.services.map((svc) => ({
              serviceType: svc.serviceType,
              priceCents: svc.priceCents,
            })),
            homeType: state.homeType,
            maxConcurrentPets: state.maxConcurrentPets,
            photoCount: photos.length,
            hasAvatar: Boolean(state.avatarUrl),
            screeningStarted: Boolean(state.screening),
          }}
        />
      )}

        </div>

        {/*
          "Neden soruyoruz" sutunu. Sihirbazdaki en sik terk sebebi
          dogum tarihi ve adres gibi alanlar; gerekce YANINDA yazili
          olmazsa kullanici formu birakip cikiyor.
        */}
        <aside className="wizard-aside">
          <div className="card card-pad">
            <h2 className="text-h4">{m.onboarding['aside.heading']}</h2>
            <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
              {key(`aside.${step}`)}
            </p>
          </div>
          <p className="field-hint">{m.onboarding.timeNote}</p>
          <p className="field-hint">{m.onboarding.savedNote}</p>
        </aside>
      </div>
    </>
  );

  async function renderLocation() {
    const cityRows = await listCities(db);
    const hoodRows = await Promise.all(
      cityRows.map(async (c) => {
        const hoods = await listNeighbourhoods(db, c.id);
        return hoods.map((h) => ({
          id: h.id,
          cityId: c.id,
          name: locale === 'fr-CA' ? h.nameFr : h.nameEn,
        }));
      }),
    );

    return (
      <LocationForm
        locale={locale!}
        action={saveLocationAction}
        cities={cityRows.map((c) => ({
          id: c.id,
          name: locale === 'fr-CA' ? c.nameFr : c.nameEn,
        }))}
        neighbourhoods={hoodRows.flat()}
        initial={{
          cityId: state!.cityId ?? '',
          neighbourhoodId: state!.neighbourhoodId ?? '',
          postalCode: state!.postalCode ?? '',
        }}
      />
    );
  }
}

export function generateStaticParams() {
  return ONBOARDING_STEPS.map((step) => ({ step }));
}

export const dynamicParams = false;

void segmentFor;
