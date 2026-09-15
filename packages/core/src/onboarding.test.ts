import { describe, it, expect } from 'vitest';
import {
  ageOn, isValidPhone, isValidPostalCode, nextStep, previousStep,
  photoTotal, profileCompleteness, completedSteps, missingRequiredSteps,
  MAX_EXTRA_PET_CENTS, MAX_HOLIDAY_PCT,
  validateAbout, validateLocation, validateServices,
} from './onboarding.js';

describe('posta kodu', () => {
  it('gecerli Kanada kodlarini kabul eder', () => {
    for (const p of ['M5V 2T6', 'm5v2t6', 'H2T 1J5', 'V6B 1A1']) {
      expect(isValidPostalCode(p)).toBe(true);
    }
  });
  it('kullanilmayan harfleri reddeder', () => {
    // D, F, I, O, Q, U Kanada posta kodlarinda hic gecmez
    for (const p of ['D5V 2T6', 'I5V 2T6', 'M5V 2O6', '12345', 'M5V 2T'] ) {
      expect(isValidPostalCode(p)).toBe(false);
    }
  });
});

describe('telefon', () => {
  it('10 ve 11 haneyi kabul eder', () => {
    expect(isValidPhone('(416) 555-0142')).toBe(true);
    expect(isValidPhone('+1 514 555 0142')).toBe(true);
  });
  it('eksik numarayi reddeder', () => {
    expect(isValidPhone('555-0142')).toBe(false);
  });
});

describe('yas', () => {
  const on = new Date('2026-09-13T00:00:00Z');
  it('dogum gunu gelmemisse bir yas eksik sayar', () => {
    expect(ageOn('2008-09-14', on)).toBe(17);
    expect(ageOn('2008-09-13', on)).toBe(18);
  });
  it('18 yas alti bakici olamaz', () => {
    const e = validateAbout({
      firstName: 'Ali', lastNameInitial: 'Y',
      bio: 'Uzun yillardir kopeklerle ilgileniyorum ve iki kedim var.',
      phone: '4165550142', dateOfBirth: '2010-01-01',
    });
    expect(e.dateOfBirth).toBe('error.tooYoung');
  });
});

describe('hakkinda adimi', () => {
  it('cok kisa tanitimi reddeder', () => {
    const e = validateAbout({
      firstName: 'Ali', lastNameInitial: 'Y', bio: 'Hayvanlari severim',
      phone: '4165550142', dateOfBirth: '1990-01-01',
    });
    expect(e.bio).toBe('error.required');
  });
  it('dolu bir formu gecirir', () => {
    const e = validateAbout({
      firstName: 'Camille', lastNameInitial: 'B',
      bio: 'Le Plateau mahallesinde yasiyorum, on yildir kopek ve kedi bakiyorum.',
      phone: '5145550142', dateOfBirth: '1990-05-14',
    });
    expect(e).toEqual({});
  });
});

describe('konum adimi', () => {
  it('eksik alanlari isaretler', () => {
    const e = validateLocation({ cityId: '', neighbourhoodId: '', postalCode: 'xyz', exactAddress: '' });
    expect(e.cityId).toBe('error.required');
    expect(e.postalCode).toBe('error.invalidPostalCode');
  });
});

describe('hizmet adimi', () => {
  const ok = { serviceType: 'boarding', priceCents: 5400, acceptsDogs: true, acceptsCats: false, acceptsOther: false };

  it('hic hizmet secilmediyse ilerlemez', () => {
    expect(validateServices([]).services).toBe('services.none');
  });
  it('araligin disindaki fiyati reddeder', () => {
    expect(validateServices([{ ...ok, priceCents: 100 }])['price.boarding']).toBe('error.priceRange');
    expect(validateServices([{ ...ok, priceCents: 90_000 }])['price.boarding']).toBe('error.priceRange');
  });
  it('hicbir tur secilmediyse reddeder', () => {
    expect(validateServices([{ ...ok, acceptsDogs: false }])['accepts.boarding']).toBe('error.required');
  });
  it('gecerli hizmeti kabul eder', () => {
    expect(validateServices([ok])).toEqual({});
  });
});

describe('adim sirasi ve doluluk', () => {
  it('ileri geri gezinir', () => {
    expect(nextStep('about')).toBe('location');
    expect(previousStep('about')).toBeNull();
    expect(nextStep('review')).toBeNull();
  });
  it('bos profil 0, tam profil 1', () => {
    expect(profileCompleteness({ hasAbout: false, hasLocation: false, serviceCount: 0, hasHome: false, screeningStarted: false })).toBe(0);
    expect(profileCompleteness({
      hasAbout: true, hasLocation: true, serviceCount: 2, hasHome: true,
      screeningStarted: true, photoCount: 3,
    })).toBe(1);
  });

  /*
    FOTOGRAF ZORUNLU DEGIL AMA BEDAVA DA DEGIL. Basvuru fotografsiz
    gonderilebiliyor (REQUIRED_STEPS'te yok) ama profil tam dolu
    sayilmiyor — siralamada fotografli bakicinin gerisinde kaliyor.
  */
  it('fotograf basvuruyu engellemez, doluluga katilir', () => {
    const withoutPhotos = profileCompleteness({
      hasAbout: true, hasLocation: true, serviceCount: 2, hasHome: true, screeningStarted: true,
    });
    expect(withoutPhotos).toBeLessThan(1);
    expect(withoutPhotos).toBeGreaterThan(0.8);

    const done = completedSteps({
      hasAbout: true, hasLocation: true, serviceCount: 2, hasHome: true, screeningStarted: true,
    });
    expect(done.photos).toBe(false);
    expect(missingRequiredSteps(done)).toEqual([]);
  });

  it('zorunlu adim eksikse basvuru gonderilemez', () => {
    const done = completedSteps({
      hasAbout: true, hasLocation: false, serviceCount: 0, hasHome: true,
      screeningStarted: true, photoCount: 2,
    });
    expect(missingRequiredSteps(done)).toEqual(['location', 'services']);
  });
  it('konum ve hizmet en agir iki parca', () => {
    const onlyLocation = profileCompleteness({ hasAbout: false, hasLocation: true, serviceCount: 0, hasHome: false, screeningStarted: false });
    const onlyHome = profileCompleteness({ hasAbout: false, hasLocation: false, serviceCount: 0, hasHome: true, screeningStarted: false });
    expect(onlyLocation).toBeGreaterThan(onlyHome);
  });
});

/*
  FOTOGRAF SAYIMI TEK YERDEN.

  Uc ekran uc farkli sayiyordu: fotograf adimindaki dugme profil
  fotografini sayiyor, ilerleme cubugu ve hesap sayfasi saymiyordu.
*/
describe('photoTotal', () => {
  it('profil fotografi tek basina sayilir', () => {
    expect(photoTotal({ hasAvatar: true, homePhotoCount: 0 })).toBe(1);
  });

  it('ev fotograflari ve profil fotografi toplanir', () => {
    expect(photoTotal({ hasAvatar: true, homePhotoCount: 3 })).toBe(4);
  });

  it('hicbiri yoksa sifir — adim eksik sayilir', () => {
    expect(photoTotal({ hasAvatar: false, homePhotoCount: 0 })).toBe(0);
    expect(completedSteps({
      hasAbout: true, hasLocation: true, serviceCount: 1, hasHome: true,
      screeningStarted: true,
      photoCount: photoTotal({ hasAvatar: false, homePhotoCount: 0 }),
    }).photos).toBe(false);
  });

  it('yalnizca profil fotografi varken adim TAMAM sayilir', () => {
    expect(completedSteps({
      hasAbout: true, hasLocation: true, serviceCount: 1, hasHome: true,
      screeningStarted: true,
      photoCount: photoTotal({ hasAvatar: true, homePhotoCount: 0 }),
    }).photos).toBe(true);
  });
});

/*
  EK UCRETLER.

  Alanlar veritabaninda ve rezervasyon hesabinda vardi ama hicbir
  ekrandan yazilamiyordu. Kural: ISTEGE BAGLI ama yazildiysa gecerli.
  Bos birakmak hata DEGIL — ek ucret istemeyen bakiciyi bir karara
  zorlamak yanlis olurdu.
*/
describe('ek ucret dogrulamasi', () => {
  const base = {
    serviceType: 'boarding', priceCents: 6000,
    acceptsDogs: true, acceptsCats: false, acceptsOther: false,
  };

  it('verilmemis ek ucretler HATA DEGIL', () => {
    expect(validateServices([base])).toEqual({});
  });

  it('sifir gecerli — "ucretsiz" demek', () => {
    expect(validateServices([{ ...base, extraPetPriceCents: 0, holidaySurchargePct: 0 }])).toEqual({});
  });

  it('gecerli degerler kabul ediliyor', () => {
    expect(validateServices([{
      ...base, extraPetPriceCents: 1500, holidaySurchargePct: MAX_HOLIDAY_PCT,
    }])).toEqual({});
  });

  it('negatif ek hayvan ucreti reddediliyor', () => {
    expect(validateServices([{ ...base, extraPetPriceCents: -1 }]))
      .toHaveProperty('extraPet.boarding', 'error.extraPetRange');
  });

  it('ana fiyat tavanini asan ek ucret reddediliyor', () => {
    expect(validateServices([{ ...base, extraPetPriceCents: MAX_EXTRA_PET_CENTS + 1 }]))
      .toHaveProperty('extraPet.boarding', 'error.extraPetRange');
  });

  it('tatil yuzdesi tavani asamaz', () => {
    expect(validateServices([{ ...base, holidaySurchargePct: MAX_HOLIDAY_PCT + 1 }]))
      .toHaveProperty('holiday.boarding', 'error.holidayRange');
  });

  it('sayi olmayan girdi hata veriyor — sessizce sifira dusmuyor', () => {
    expect(validateServices([{ ...base, extraPetPriceCents: Number.NaN }]))
      .toHaveProperty('extraPet.boarding', 'error.extraPetRange');
  });
});
