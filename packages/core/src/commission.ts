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

/* ------------------------------------------------------------------
   KAMPANYA — DONEMSEL KOMISYON INDIRIMI.

   TABAN ORANLAR ile KAMPANYA neden ayri iki sey:

   Taban oran kalici bir fiyat karari ve bakici sozlesmesinde yaziyor.
   Kampanya gecici bir indirim ve bir bitis tarihi var. Ikisini tek bir
   alanda tutup "sonra geri alirim" demek, geri almayi unutmanin ya da
   sozlesmede yazan orani sessizce degistirmenin kestirme yoluydu.

   KAMPANYA YALNIZCA BAKICI KOMISYONUNU indirir. Musteri hizmet bedeli
   (%7) ve ust siniri kapsam disi: musterinin gordugu rakam sabit
   kaldigi surece yayinlanan vaat sarsilmiyor, bir kampanyayi bitirmek
   de kimsenin odedigi bedeli ARTIRMIYOR.

   INDIRIM SADECE ASAGI DOGRU. `resolveCommissionConfig` kampanya orani
   tabandan buyukse tabani kullaniyor: "kampanya" adi altinda komisyon
   artirmak, bakiciya duyurulan seyin tersi olurdu.

   GECMISE DONUK DEGIL. Bir rezervasyonun komisyonu istegin
   OLUSTURULDUGU anda hesaplanip satira yaziliyor
   (bookings.sitter_commission_pct / _cents). Bu dosya yalnizca YENI
   hesaplar icin okunuyor; kampanya acmak ya da kapatmak gecmisteki
   hicbir rezervasyonu, hicbir odemeyi degistirmez.
   ------------------------------------------------------------------ */

export interface CommissionCampaign {
  readonly name: string;
  /** Kampanya oranlari — verilmeyen attribution tabanda kalir */
  readonly sitterPct: Partial<Readonly<Record<Attribution, number>>>;
  /** ISO tarih-saat */
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface ResolvedCommission {
  readonly config: CommissionConfig;
  /** Su anda uygulanan kampanya — yoksa null */
  readonly campaignName: string | null;
  readonly campaignEndsAt: string | null;
}

/** Kampanya penceresi su ani kapsiyor mu (baslangic dahil, bitis haric). */
export function campaignActiveAt(c: CommissionCampaign, now: Date): boolean {
  const start = Date.parse(c.startsAt);
  const end = Date.parse(c.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  const t = now.getTime();
  return t >= start && t < end;
}

/**
 * Taban + (varsa) kampanya -> o an gecerli yapilandirma.
 *
 * SAF FONKSIYON: saati disaridan aliyor. Kampanyanin acilis ve kapanis
 * aninin testi ancak boyle yazilabilir ve "bugun calisiyor, yarin
 * bozuluyor" turu hatalar boyle yakalanir.
 */
export function resolveCommissionConfig(
  base: CommissionConfig,
  campaign: CommissionCampaign | null,
  now: Date = new Date(),
): ResolvedCommission {
  if (!campaign || !campaignActiveAt(campaign, now)) {
    return { config: base, campaignName: null, campaignEndsAt: null };
  }

  const sitterPct = { ...base.sitterPct };
  let touched = false;
  for (const key of Object.keys(sitterPct) as Attribution[]) {
    const wanted = campaign.sitterPct[key];
    if (wanted === undefined) continue;
    /* Yalnizca ASAGI. Kampanya adi altinda komisyon artirilamaz. */
    if (wanted < sitterPct[key]) {
      sitterPct[key] = wanted;
      touched = true;
    }
  }

  /*
    Hicbir oran gercekten dusmediyse kampanya UYGULANMIS SAYILMAZ:
    ekranda "kampanya var" yazip hicbir sey degistirmemek, bakiciya
    tutulmayan bir soz vermektir.
  */
  if (!touched) return { config: base, campaignName: null, campaignEndsAt: null };

  return {
    config: { ...base, sitterPct },
    campaignName: campaign.name,
    campaignEndsAt: campaign.endsAt,
  };
}

/* ---------------------------------------------------- dogrulama */

/** Bakici komisyonu icin izin verilen ust sinir (%). */
export const MAX_SITTER_PCT = 40;
/** Musteri hizmet bedeli icin izin verilen ust sinir (%). */
export const MAX_OWNER_PCT = 20;
/** Musteri hizmet bedeli ust siniri icin izin verilen en buyuk tutar. */
export const MAX_OWNER_FEE_CAP_CENTS = dollars(200);

export type CommissionFieldErrors = Record<string, string>;

/**
 * Yonetici panelinden gelen taban oranlarin dogrulamasi.
 *
 * SINIRLAR KEYFI DEGIL: yayinlanan sayfalarda "Rover %20 aliyor, biz
 * %18" yaziyor. Paneldeki bir yazim hatasiyla (%180) hem o sayfa
 * saçmalar hem de o anda rezervasyon yapan bakicinin kazancindan
 * gercekten o kadar kesilir. Ust sinirlar bu iki seyi birden engelliyor.
 *
 * Hata KODU donduruluyor, metin degil — panel Ingilizce ama kural
 * projenin geri kalaniyla ayni.
 */
export function validateCommissionSettings(input: {
  sitterPct: Record<Attribution, number>;
  ownerPct: number;
  ownerFeeCapCents: number;
  launchPromoMonths: number;
}): CommissionFieldErrors {
  const e: CommissionFieldErrors = {};
  const pct = (v: number) => Number.isFinite(v) && v >= 0;

  for (const key of ['platform', 'repeat', 'sitter_referral'] as const) {
    const v = input.sitterPct[key];
    if (!pct(v) || v > MAX_SITTER_PCT) e[`sitterPct.${key}`] = 'error.pctRange';
  }
  if (!pct(input.ownerPct) || input.ownerPct > MAX_OWNER_PCT) e.ownerPct = 'error.pctRange';
  if (!Number.isInteger(input.ownerFeeCapCents)
    || input.ownerFeeCapCents < 0
    || input.ownerFeeCapCents > MAX_OWNER_FEE_CAP_CENTS) {
    e.ownerFeeCapCents = 'error.capRange';
  }
  if (!Number.isInteger(input.launchPromoMonths)
    || input.launchPromoMonths < 0 || input.launchPromoMonths > 36) {
    e.launchPromoMonths = 'error.promoRange';
  }
  return e;
}

/**
 * Kampanya dogrulamasi. Taban oranlar da veriliyor cunku "indirim"
 * olmayan bir kampanyayi kaydetmenin anlami yok — yonetici bunu
 * KAYDETMEDEN once ogrenmeli, kampanya sessizce etkisiz kalmamali.
 */
export function validateCampaign(input: {
  name: string;
  sitterPct: Partial<Record<Attribution, number>>;
  startsAt: string;
  endsAt: string;
}, base: CommissionConfig): CommissionFieldErrors {
  const e: CommissionFieldErrors = {};

  if (input.name.trim().length < 2) e.name = 'error.required';

  const start = Date.parse(input.startsAt);
  const end = Date.parse(input.endsAt);
  if (!Number.isFinite(start)) e.startsAt = 'error.required';
  if (!Number.isFinite(end)) e.endsAt = 'error.required';
  if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
    e.endsAt = 'error.endBeforeStart';
  }

  let lowersSomething = false;
  for (const key of ['platform', 'repeat', 'sitter_referral'] as const) {
    const v = input.sitterPct[key];
    if (v === undefined) continue;
    if (!Number.isFinite(v) || v < 0 || v > MAX_SITTER_PCT) {
      e[`campaignPct.${key}`] = 'error.pctRange';
      continue;
    }
    if (v < base.sitterPct[key]) lowersSomething = true;
    else e[`campaignPct.${key}`] = 'error.notLower';
  }
  if (!lowersSomething && !e.name) e.sitterPct = 'error.noDiscount';

  return e;
}
