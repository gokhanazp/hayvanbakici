/**
 * KOMISYON MOTORU — projenin stratejik kalbi (yol haritasi §2.2).
 *
 * Rover'in yapisal zaafi: yeni musteri edinimini CEZALANDIRIYOR (Tier 1 = %30,
 * musteri ucretiyle toplam take rate %41). Biz bunun tersini yapiyoruz.
 *
 *   platform        -> %18  (aramadan/kesiften gelen yeni musteri)
 *   sitter_referral -> %0   (bakicinin kendi getirdigi musteri) <- en kritik karar
 *   repeat          -> %10  (ayni bakici x ayni musteri, 2.+ rezervasyon)
 *
 * Musteri ucreti: %7, ust sinir CA$45 (Rover: %11, cap CA$65).
 *
 * Bu yapi ayni anda uc problemi cozer:
 *  1. Bakici edinimi  2. Platform disina kacis (disintermediation)  3. Cold-start talep
 */
import { applyPct, cap, dollars, type Cents } from './money.js';

/** Rezervasyonun nasil dogdugu — komisyon oranini belirleyen tek alan */
export type Attribution = 'platform' | 'sitter_referral' | 'repeat';

export interface CommissionConfig {
  readonly sitterPct: Readonly<Record<Attribution, number>>;
  readonly ownerPct: number;
  readonly ownerFeeCapCents: Cents;
  /** Lansman promosyonu: ilk N ay bakici komisyonu %0 */
  readonly launchPromoMonths: number;
}

export const DEFAULT_COMMISSION: CommissionConfig = {
  sitterPct: {
    platform: 18,
    sitter_referral: 0,
    repeat: 10,
  },
  ownerPct: 7,
  ownerFeeCapCents: dollars(45),
  launchPromoMonths: 12,
};

export interface AttributionInput {
  /** Bakicinin davet linki/kodu ile gelen musteri mi */
  readonly viaSitterReferral: boolean;
  /** Bu bakici-musteri cifti daha once tamamlanmis rezervasyon yapti mi */
  readonly previousCompletedBookings: number;
}

/**
 * Attribution KALICIDIR: bakicinin getirdigi bir musteri, tekrar rezervasyonlarda
 * da %0 kalir. Rover'in "her yeni musteride %30'a reset" mantiginin tam tersi.
 */
export function resolveAttribution(input: AttributionInput): Attribution {
  if (input.viaSitterReferral) return 'sitter_referral';
  if (input.previousCompletedBookings > 0) return 'repeat';
  return 'platform';
}

export interface CommissionResult {
  readonly attribution: Attribution;
  readonly sitterPct: number;
  readonly sitterCommissionCents: Cents;
  readonly ownerPct: number;
  readonly ownerFeeCents: Cents;
  readonly ownerFeeCapped: boolean;
  /** Seffaflik icin: bakiciya panelinde gosterilecek aciklama anahtari */
  readonly explanationKey: string;
  readonly promoApplied: boolean;
}

export interface CommissionInput {
  /** Bakicinin hizmet bedeli (ekstralar dahil, vergi haric) */
  readonly subtotalCents: Cents;
  readonly attribution: Attribution;
  /** Bakicinin lansman promosyonu kapsaminda olup olmadigi */
  readonly promoActive?: boolean;
  readonly config?: CommissionConfig;
}

export function calculateCommission(input: CommissionInput): CommissionResult {
  const cfg = input.config ?? DEFAULT_COMMISSION;
  const promoApplied = input.promoActive === true;

  const basePct = cfg.sitterPct[input.attribution];
  const sitterPct = promoApplied ? 0 : basePct;

  const sitterCommissionCents = applyPct(input.subtotalCents, sitterPct);

  const rawOwnerFee = applyPct(input.subtotalCents, cfg.ownerPct);
  const ownerFeeCents = cap(rawOwnerFee, cfg.ownerFeeCapCents);

  const explanationKey = promoApplied
    ? 'commission.promo'
    : `commission.${input.attribution}`;

  return {
    attribution: input.attribution,
    sitterPct,
    sitterCommissionCents,
    ownerPct: cfg.ownerPct,
    ownerFeeCents,
    ownerFeeCapped: rawOwnerFee > cfg.ownerFeeCapCents,
    explanationKey,
    promoApplied,
  };
}

/** Pazarlama/karsilastirma icin: Rover'in ayni rezervasyonda alacagi tutar */
export interface CompetitorComparison {
  readonly ourTakeCents: Cents;
  readonly roverTakeCents: Cents;
  readonly sitterSavesCents: Cents;
  readonly ownerSavesCents: Cents;
}

export function compareToRover(
  subtotalCents: Cents,
  ours: CommissionResult,
  roverTier: 'standard' | 'tier1' | 'tier3' = 'standard',
): CompetitorComparison {
  const roverSitterPct = roverTier === 'tier1' ? 30 : roverTier === 'tier3' ? 10 : 20;
  const roverSitterFee = applyPct(subtotalCents, roverSitterPct);
  const roverOwnerFee = cap(applyPct(subtotalCents, 11), dollars(65));

  return {
    ourTakeCents: ours.sitterCommissionCents + ours.ownerFeeCents,
    roverTakeCents: roverSitterFee + roverOwnerFee,
    sitterSavesCents: roverSitterFee - ours.sitterCommissionCents,
    ownerSavesCents: roverOwnerFee - ours.ownerFeeCents,
  };
}
