/**
 * BAKICI ONBOARDING — adimlar ve dogrulama.
 *
 * Bu dosya hem tarayicida (aninda geri bildirim) hem sunucuda (asil kontrol)
 * calisiyor. Guvenlik ve veri butunlugu siniri SUNUCUDUR; buradaki kontroller
 * kullanici kolayligi icin.
 *
 * Hata KODU donduruluyor, metin degil — ceviriyi arayuz yapiyor, boylece
 * Fransizca karsiligi unutulursa katalog testi yakaliyor (Bill 96).
 */

import { PET_SIZE_STEPS } from './services.js';

export const ONBOARDING_STEPS = [
  'about', 'location', 'services', 'home', 'photos', 'screening', 'review',
] as const;

/**
 * BASVURUNUN GONDERILEBILMESI icin zorunlu adimlar.
 *
 * FOTOGRAF LISTEDE YOK ve bu bilincli: fotograf profili belirgin sekilde
 * guclendiriyor (doluluk oranina giriyor, siralamayi etkiliyor) ama
 * elinde iyi bir kare olmayan birini adli sicil adimina bile
 * gecirmemek, arzi kaybetmenin en sessiz yolu. Ekran fotografi
 * ISTIYOR, kapiyi KAPATMIYOR.
 */
export const REQUIRED_STEPS = [
  'about', 'location', 'services', 'home', 'screening',
] as const satisfies readonly OnboardingStep[];

export function missingRequiredSteps(
  done: Record<OnboardingStep, boolean>,
): OnboardingStep[] {
  return REQUIRED_STEPS.filter((s) => !done[s]);
}

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function isOnboardingStep(v: string): v is OnboardingStep {
  return (ONBOARDING_STEPS as readonly string[]).includes(v);
}

export function stepIndex(step: OnboardingStep): number {
  return ONBOARDING_STEPS.indexOf(step);
}

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  return ONBOARDING_STEPS[stepIndex(step) + 1] ?? null;
}

export function previousStep(step: OnboardingStep): OnboardingStep | null {
  const i = stepIndex(step);
  return i > 0 ? (ONBOARDING_STEPS[i - 1] ?? null) : null;
}

/** alan adi -> hata kodu */
export type FieldErrors = Record<string, string>;

/**
 * Kanada posta kodu. Harf kumesi kasitli olarak dar: D, F, I, O, Q, U hic
 * kullanilmiyor; W ve Z ilk harf olamaz. Genis bir regex, yazim hatasini
 * gecirip aramayi bozar.
 */
const POSTAL = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ][ ]?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i;

export function isValidPostalCode(v: string): boolean {
  return POSTAL.test(v.trim());
}

/** Kuzey Amerika numarasi: 10 hane, ulke kodu opsiyonel */
export function isValidPhone(v: string): boolean {
  const digits = v.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}

export function ageOn(dateOfBirth: string, on: Date = new Date()): number | null {
  const d = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  let age = on.getUTCFullYear() - d.getUTCFullYear();
  const beforeBirthday =
    on.getUTCMonth() < d.getUTCMonth() ||
    (on.getUTCMonth() === d.getUTCMonth() && on.getUTCDate() < d.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const MIN_PRICE_CENTS = 500;
export const MAX_PRICE_CENTS = 50_000;

/**
 * EK HAYVAN UCRETI — birim basina, 0 = ucretsiz.
 *
 * Ust sinir ana fiyatin kendisi kadar: ikinci hayvan icin birincinin
 * fiyatindan fazlasini istemek, "ek" olmaktan cikar ve rezervasyon
 * ekraninda saklanmis ikinci bir fiyat gibi gorunur.
 */
export const MAX_EXTRA_PET_CENTS = MAX_PRICE_CENTS;

/**
 * TATIL EK UCRETI — yuzde, 0 = yok.
 *
 * %50 tavan keyfi degil: daha yukarisi, arama sonucunda gorunen fiyatla
 * odenen tutar arasinda savunulamayacak bir fark acar. Competition Act
 * §8.6 gizli ucret yasagi bunu dogrudan yasaklamiyor ama fiyatin
 * "ilanda gorulen fiyat" olmaktan cikmasi ayni sorunun kapisi.
 */
export const MAX_HOLIDAY_PCT = 50;
/** Bio bu uzunlugun altindaysa profil ise yaramiyor — olculmus bir esik degil,
 *  ama "Hayvanlari severim" tek satirini elemek icin yeterli. */
export const MIN_BIO_LENGTH = 40;

export function validateAbout(input: {
  firstName: string; lastNameInitial: string; bio: string; phone: string; dateOfBirth: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!input.firstName.trim()) e.firstName = 'error.required';
  if (!input.lastNameInitial.trim()) e.lastNameInitial = 'error.required';
  if (input.bio.trim().length < MIN_BIO_LENGTH) e.bio = 'error.required';
  if (!isValidPhone(input.phone)) e.phone = 'error.required';

  const age = ageOn(input.dateOfBirth);
  if (age === null) e.dateOfBirth = 'error.required';
  else if (age < 18) e.dateOfBirth = 'error.tooYoung';

  return e;
}

export function validateLocation(input: {
  cityId: string; neighbourhoodId: string; postalCode: string; exactAddress: string;
}): FieldErrors {
  const e: FieldErrors = {};
  if (!input.cityId) e.cityId = 'error.required';
  if (!input.neighbourhoodId) e.neighbourhoodId = 'error.required';
  if (!isValidPostalCode(input.postalCode)) e.postalCode = 'error.invalidPostalCode';
  if (input.exactAddress.trim().length < 5) e.exactAddress = 'error.required';
  return e;
}

export function validateServices(
  input: Array<{
    serviceType: string; priceCents: number;
    acceptsDogs: boolean; acceptsCats: boolean; acceptsOther: boolean;
    /** Istege bagli — verilmezse 0 (ucretsiz / ek ucret yok) */
    extraPetPriceCents?: number | undefined;
    holidaySurchargePct?: number | undefined;
    /** Kabul edilen en buyuk kilo — kademe sinirlarindan biri olmali */
    acceptedSizeMaxKg?: number | undefined;
  }>,
): FieldErrors {
  const e: FieldErrors = {};
  if (input.length === 0) {
    e.services = 'services.none';
    return e;
  }
  for (const s of input) {
    if (!Number.isFinite(s.priceCents) || s.priceCents < MIN_PRICE_CENTS || s.priceCents > MAX_PRICE_CENTS) {
      e[`price.${s.serviceType}`] = 'error.priceRange';
    }
    if (!s.acceptsDogs && !s.acceptsCats && !s.acceptsOther) {
      e[`accepts.${s.serviceType}`] = 'error.required';
    }

    /*
      BOYUT ZORUNLU ve kademe sinirlarindan biri olmali.

      Bos birakilirsa sutun varsayilani (100 kg) devreye girer ve
      profil "dev kopek alirim" diye ilan eder — bakicinin vermedigi
      bir soz. Kademe disinda bir sayi ise profildeki kutucuklari
      yarim birakir.
    */
    const size = s.acceptedSizeMaxKg;
    if (!size || !PET_SIZE_STEPS.some((step) => step.maxKg === size)) {
      e[`size.${s.serviceType}`] = 'error.required';
    }

    /*
      Ek ucretler ISTEGE BAGLI ama yazildiysa gecerli olmali. Bos
      birakmak "ucretsiz" demek, hata degil — bu yuzden undefined ve 0
      ayni kovada.
    */
    const extra = s.extraPetPriceCents ?? 0;
    if (!Number.isFinite(extra) || extra < 0 || extra > MAX_EXTRA_PET_CENTS) {
      e[`extraPet.${s.serviceType}`] = 'error.extraPetRange';
    }

    const holiday = s.holidaySurchargePct ?? 0;
    if (!Number.isFinite(holiday) || holiday < 0 || holiday > MAX_HOLIDAY_PCT) {
      e[`holiday.${s.serviceType}`] = 'error.holidayRange';
    }
  }
  return e;
}

export interface CompletenessInput {
  hasAbout: boolean;
  hasLocation: boolean;
  serviceCount: number;
  hasHome: boolean;
  screeningStarted: boolean;
  /**
   * KAC FOTOGRAF VAR — profil fotografi DAHIL.
   *
   * Uc yerde uc farkli tanim vardi: fotograf adimindaki dugme profil
   * fotografini sayiyor, ilerleme cubugu saymiyordu. Ayni bakici ayni
   * ekranda hem "Devam" hem "bu adim eksik" goruyordu. Tek tanim:
   * profil fotografi + ev fotograflari.
   *
   * Istege bagli — bkz. REQUIRED_STEPS.
   */
  photoCount?: number | undefined;
}

/** Tek yerden: profil fotografi da bir fotograftir. */
export function photoTotal(
  input: { hasAvatar: boolean; homePhotoCount: number },
): number {
  return (input.hasAvatar ? 1 : 0) + input.homePhotoCount;
}

/**
 * Profil doluluk orani.
 *
 * Siralama skorunun girdilerinden biri (yol haritasi §6.4) ve bakiciya
 * "neyi eksik biraktin" demenin yolu. Agirliklar esit degil: hizmet ve konum
 * olmadan bakici aramada HIC cikmaz, o yuzden daha agirlar.
 */
export function profileCompleteness(input: CompletenessInput): number {
  const parts: Array<[boolean, number]> = [
    [input.hasAbout, 0.2],
    [input.hasLocation, 0.25],
    [input.serviceCount > 0, 0.2],
    [input.hasHome, 0.1],
    [input.screeningStarted, 0.15],
    /* Fotograf zorunlu degil ama BEDAVA da degil: fotografsiz profil
       tam dolu sayilmiyor ve siralamada fotografli olanin gerisinde
       kaliyor. Sahibin karar verirken baktigi ilk sey bu. */
    [(input.photoCount ?? 0) > 0, 0.1],
  ];
  const score = parts.reduce((sum, [done, weight]) => sum + (done ? weight : 0), 0);
  return Number(score.toFixed(2));
}

/** Hangi adimlar tamamlandi — ilerleme cubugu ve "eksikler" listesi icin */
export function completedSteps(input: CompletenessInput): Record<OnboardingStep, boolean> {
  return {
    about: input.hasAbout,
    location: input.hasLocation,
    services: input.serviceCount > 0,
    home: input.hasHome,
    photos: (input.photoCount ?? 0) > 0,
    screening: input.screeningStarted,
    review: false,
  };
}
