import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import {
  completedSteps, isOnboardingStep, ONBOARDING_STEPS, type OnboardingStep,
} from '@havre/core';
import { getMessages, localeFromSegment, segmentFor, type Messages } from '@havre/i18n';
import { getDb, getOnboardingState, listCities, listNeighbourhoods } from '@havre/db';
import { getSession } from '@/lib/auth';
import { Progress } from '@/components/onboarding/Progress';
import {
  AboutForm, HomeForm, LocationForm, ReviewForm, ScreeningForm, ServicesForm,
} from '@/components/onboarding/StepForms';
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

  const done = completedSteps({
    hasAbout: Boolean(state.bio && state.dateOfBirth && state.phone),
    hasLocation: Boolean(state.cityId && state.hasExactAddress),
    serviceCount: state.services.length,
    hasHome: Boolean(state.homeType),
    screeningStarted: Boolean(state.screening),
  });

  const heading = m.onboarding[`step.${step}` as keyof Messages['onboarding']] as string;

  return (
    <div className="container wizard-shell">
      <Progress locale={locale} current={step as OnboardingStep} completed={done} />

      <h1 className="text-h2" style={{ marginBottom: 'var(--space-6)' }}>{heading}</h1>

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
          missing={ONBOARDING_STEPS.filter((s) => s !== 'review' && !done[s])}
        />
      )}

      <p className="field-hint" style={{ marginTop: 'var(--space-8)' }}>
        {m.onboarding.savedNote}
      </p>
    </div>
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
