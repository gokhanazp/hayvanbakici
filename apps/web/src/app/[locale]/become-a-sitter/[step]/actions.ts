'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getDb, getOnboardingState, saveAbout, saveHome, saveLocation, saveServices,
  recordScreeningConsent, upsertVerification, recordAutomatedDecision,
  setBadgeLevel, submitForReview, listSitterPhotos,
} from '@havre/db';
import {
  nextStep, photoTotal, profileCompleteness, completedSteps, missingRequiredSteps,
  validateAbout, validateLocation, validateServices,
  type FieldErrors, type ServiceType, SERVICES,
} from '@havre/core';
import { createScreeningProvider, decide, badgeLevelFor, type Province } from '@havre/screening';
import { getSession } from '@/lib/auth';

export interface StepState {
  errors: FieldErrors;
  message?: string | undefined;
}

/*
  DIKKAT: 'use server' dosyasi YALNIZCA async fonksiyon disari verebilir.
  Buraya bir sabit ya da nesne export etmek derlemeyi kirar
  ("A 'use server' file can only export async functions"). Baslangic
  durumu istemci tarafinda tanimli (StepForms.tsx icindeki EMPTY).
*/

/** Adli sicil riza metninin surumu. Metin degisirse ARTIRILMALI. */
const SCREENING_CONSENT_VERSION = '2026-09-1';

async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) redirect('/en/account/sign-in/?next=/en/become-a-sitter/about/');
  return session.user.id;
}

function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function bool(form: FormData, key: string): boolean {
  return form.get(key) === 'on' || form.get(key) === 'true';
}

export async function saveAboutAction(
  _prev: StepState, form: FormData,
): Promise<StepState> {
  const userId = await requireUserId();
  const locale = str(form, 'locale') || 'en';

  const input = {
    firstName: str(form, 'firstName'),
    lastNameInitial: str(form, 'lastNameInitial'),
    bio: str(form, 'bio'),
    phone: str(form, 'phone'),
    dateOfBirth: str(form, 'dateOfBirth'),
  };

  const errors = validateAbout(input);
  if (Object.keys(errors).length) return { errors };

  await saveAbout(getDb(), userId, input);
  redirect(`/${locale}/become-a-sitter/${nextStep('about')}/`);
}

export async function saveLocationAction(
  _prev: StepState, form: FormData,
): Promise<StepState> {
  const userId = await requireUserId();
  const locale = str(form, 'locale') || 'en';

  const input = {
    cityId: str(form, 'cityId'),
    neighbourhoodId: str(form, 'neighbourhoodId'),
    postalCode: str(form, 'postalCode'),
    exactAddress: str(form, 'exactAddress'),
  };

  const errors = validateLocation(input);
  if (Object.keys(errors).length) return { errors };

  await saveLocation(getDb(), userId, input);
  redirect(`/${locale}/become-a-sitter/${nextStep('location')}/`);
}

export async function saveServicesAction(
  _prev: StepState, form: FormData,
): Promise<StepState> {
  const userId = await requireUserId();
  const locale = str(form, 'locale') || 'en';

  const chosen = form.getAll('service').filter((v): v is string => typeof v === 'string');

  const input = chosen.map((type) => {
    const t = type as ServiceType;
    // Fiyat dolar olarak giriliyor, kuruş olarak saklaniyor: para hesabi
    // her yerde TAM SAYI kurus uzerinden (packages/core/money.ts).
    const dollars = Number(str(form, `price.${type}`).replace(',', '.'));
    return {
      serviceType: t,
      priceCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : NaN,
      priceUnit: SERVICES[t].unit,
      cancellationPolicy: (str(form, `cancellation.${type}`) || 'moderate') as 'flexible' | 'moderate' | 'strict',
      acceptsDogs: bool(form, `dogs.${type}`),
      acceptsCats: bool(form, `cats.${type}`),
      acceptsOther: bool(form, `other.${type}`),
    };
  });

  const errors = validateServices(input);
  if (Object.keys(errors).length) return { errors };

  await saveServices(getDb(), userId, input);
  redirect(`/${locale}/become-a-sitter/${nextStep('services')}/`);
}

export async function saveHomeAction(
  _prev: StepState, form: FormData,
): Promise<StepState> {
  const userId = await requireUserId();
  const locale = str(form, 'locale') || 'en';

  const homeType = str(form, 'homeType');
  if (!homeType) return { errors: { homeType: 'error.required' } };

  await saveHome(getDb(), userId, {
    homeType: homeType as 'house',
    hasYard: bool(form, 'hasYard'),
    yardFenced: bool(form, 'yardFenced'),
    hasOwnPets: bool(form, 'hasOwnPets'),
    smokeFree: bool(form, 'smokeFree'),
    maxConcurrentPets: Number(str(form, 'maxConcurrentPets')) || 1,
  });

  redirect(`/${locale}/become-a-sitter/${nextStep('home')}/`);
}

/**
 * ADLI SICIL KONTROLU.
 *
 * Sira onemli ve degistirilmemeli:
 *   1) riza KAYDEDILIR  2) kontrol baslatilir  3) sonuc karara cevrilir
 * Tersi olsaydi, riza kaydi yazilamadigi bir durumda elimizde rizasiz
 * yapilmis bir sabika sorgusu kalirdi.
 *
 * Karar kurali packages/screening/decision.ts icinde: OLUMSUZ SONUC HICBIR
 * KOSULDA OTOMATIK REDDE DONMEZ (Quebec Charter s.18.2, Law 25 s.12.1).
 */
export async function startScreeningAction(
  _prev: StepState, form: FormData,
): Promise<StepState> {
  const userId = await requireUserId();
  const locale = str(form, 'locale') || 'en';

  if (!bool(form, 'consent')) {
    return { errors: { consent: 'screening.mustConsent' } };
  }

  const db = getDb();
  const state = await getOnboardingState(db, userId);
  if (!state) return { errors: { consent: 'error.generic' } };
  if (!state.dateOfBirth || !state.province) {
    // Dogum tarihi ve eyalet olmadan basvuru yapilamaz — o adimlara don.
    redirect(`/${locale}/become-a-sitter/${state.dateOfBirth ? 'location' : 'about'}/`);
  }

  const h = await headers();

  // 1) RIZA
  await recordScreeningConsent(db, {
    userId,
    localeShown: locale === 'fr' ? 'fr-CA' : 'en-CA',
    version: SCREENING_CONSENT_VERSION,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: h.get('user-agent') ?? null,
  });

  // 2) KONTROL
  const provider = createScreeningProvider();
  const result = await provider.submit({
    sitterId: userId,
    firstName: state.firstName ?? '',
    lastName: state.lastNameInitial ?? '',
    email: state.email,
    dateOfBirth: state.dateOfBirth,
    province: state.province as Province,
  });

  // 3) KARAR
  const decision = decide(result.outcome, state.province as Province);

  await upsertVerification(db, {
    sitterId: userId,
    type: 'criminal',
    status: decision.status,
    provider: provider.name,
    providerRef: result.providerRef,
    automatedDecision: decision.automated,
    // Yalnizca karar ozeti — ham rapor ASLA saklanmaz
    decision: decision.messageKey,
  });

  if (decision.automated) {
    await recordAutomatedDecision(db, {
      userId,
      decisionType: 'criminal_record_check',
      outcome: decision.status,
      factors: {
        provider: provider.name,
        providerRef: result.providerRef,
        // Kullanilan kisisel veri — talep uzerine kullaniciya aciklanir
        personalDataUsed: ['first_name', 'last_name', 'date_of_birth', 'province', 'email'],
      },
    });
  }

  if (decision.status === 'passed') {
    await setBadgeLevel(db, userId, badgeLevelFor({
      identityPassed: true,
      criminalPassed: true,
      licencePassed: false,
      certificationPassed: false,
    }));
  }

  redirect(`/${locale}/become-a-sitter/screening/`);
}

export async function submitApplicationAction(
  _prev: StepState, form: FormData,
): Promise<StepState> {
  const userId = await requireUserId();
  const locale = str(form, 'locale') || 'en';

  const db = getDb();
  const state = await getOnboardingState(db, userId);
  if (!state) return { errors: { submit: 'error.generic' } };

  const photos = await listSitterPhotos(db, userId);
  const input = {
    hasAbout: Boolean(state.bio && state.dateOfBirth && state.phone),
    hasLocation: Boolean(state.cityId && state.hasExactAddress),
    serviceCount: state.services.length,
    hasHome: Boolean(state.homeType),
    screeningStarted: Boolean(state.screening),
    photoCount: photoTotal({ hasAvatar: Boolean(state.avatarUrl), homePhotoCount: photos.length }),
  };
  const completeness = profileCompleteness(input);

  /*
    KAPIYI ZORUNLU ADIMLAR TUTUYOR, doluluk orani DEGIL. Eskiden kosul
    "doluluk = 1" idi; fotograf adimi eklenince bu, fotografsiz hicbir
    basvurunun gonderilememesi anlamina gelirdi. Fotograf profili
    guclendiriyor ama basvuruyu engellememeli.
  */
  const missing = missingRequiredSteps(completedSteps(input));
  if (missing.length > 0) return { errors: { submit: 'review.missing' } };

  await submitForReview(db, userId, completeness);
  redirect(`/${locale}/become-a-sitter/review/`);
}
