import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  completedSteps, isOnboardingStep, missingRequiredSteps, ONBOARDING_STEPS,
  type OnboardingStep,
} from '@havre/core';
import { getMessages, localeFromSegment, segmentFor, type Messages } from '@havre/i18n';
import {
  getDb, getOnboardingState, listCities, listNeighbourhoods, listSitterPhotos,
  MAX_SITTER_PHOTOS,
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

  const photos = await listSitterPhotos(db, session.user.id);
  const done = completedSteps({
    hasAbout: Boolean(state.bio && state.dateOfBirth && state.phone),
    hasLocation: Boolean(state.cityId && state.hasExactAddress),
    serviceCount: state.services.length,
    hasHome: Boolean(state.homeType),
    screeningStarted: Boolean(state.screening),
    photoCount: photos.length,
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
        <ServicesForm locale={locale} action={saveServicesAction} initial={state.services} />
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
          max={MAX_SITTER_PHOTOS}
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
