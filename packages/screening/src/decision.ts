import type { ProviderOutcome, Province, VerificationStatus } from './types.js';

/**
 * SAGLAYICI SONUCUNU BIZIM KARARIMIZA CEVIRIR.
 *
 * BU DOSYANIN TEK KURALI: OLUMSUZ SONUC ASLA OTOMATIK REDDE DONMEZ.
 *
 * Gerekce (yol haritasi §8.5):
 *  - Quebec Charter s.18.2: bir kisi, isle BAGLANTISI OLMAYAN bir sabika
 *    nedeniyle reddedilemez. Baglanti degerlendirmesi bir INSAN isidir;
 *    "kayit var -> red" kurali dogrudan ihlaldir.
 *  - Law 25 s.12.1: karar MUNHASIRAN otomatik islemeye dayaniyorsa karar
 *    aninda bildirim, talep uzerine aciklama ve INSANA gorus sunma kanali
 *    zorunlu.
 *  - Ontario Human Rights Code: affa ugramis kayitlar korumali alanda.
 *
 * Bu yuzden 'flagged' -> 'manual_review'. Kod duzeyinde 'failed' donduren
 * TEK bir yol yok; red yalnizca bir insanin elle yazdigi karardan cikar.
 */

export interface ScreeningDecision {
  readonly status: VerificationStatus;
  /** Karar munhasiran otomatik mi — Law 25 s.12.1 kaydi icin */
  readonly automated: boolean;
  /** Insan incelemesi gerekiyor mu */
  readonly needsHumanReview: boolean;
  /** Bakiciya gosterilecek mesajin anahtari (metin arayuzde) */
  readonly messageKey:
    | 'screening.pending'
    | 'screening.passed'
    | 'screening.underReview'
    | 'screening.error';
}

export function decide(outcome: ProviderOutcome, _province: Province): ScreeningDecision {
  switch (outcome) {
    case 'pending':
      return {
        status: 'pending',
        automated: false,
        needsHumanReview: false,
        messageKey: 'screening.pending',
      };

    case 'clear':
      /**
       * Otomatik GECIS serbest: kimsenin aleyhine bir karar degil.
       * Yine de automated:true olarak kaydediliyor, cunku Law 25 s.12.1
       * kaydi kararin YONUNE degil, otomatik olup olmadigina bakiyor.
       */
      return {
        status: 'passed',
        automated: true,
        needsHumanReview: false,
        messageKey: 'screening.passed',
      };

    case 'flagged':
      /**
       * BURASI KRITIK. Eyalet fark etmeksizin insan incelemesi.
       * Quebec zorunlu kiliyor; geri kalaninda da ayni kurali uyguluyoruz —
       * eyalete gore ayrisan bir kod yolu, gun gelip yanlis dallanir.
       */
      return {
        status: 'manual_review',
        automated: false,
        needsHumanReview: true,
        messageKey: 'screening.underReview',
      };

    case 'error':
      return {
        status: 'manual_review',
        automated: false,
        needsHumanReview: true,
        messageKey: 'screening.error',
      };
  }
}

/** Bakicinin rozet seviyesi — 0=yok, 1=kimlik, 2=adli sicil, 3=lisansli, 4=pro */
export function badgeLevelFor(checks: {
  identityPassed: boolean;
  criminalPassed: boolean;
  licencePassed: boolean;
  certificationPassed: boolean;
}): number {
  if (checks.certificationPassed) return 4;
  if (checks.licencePassed) return 3;
  if (checks.criminalPassed) return 2;
  if (checks.identityPassed) return 1;
  return 0;
}
