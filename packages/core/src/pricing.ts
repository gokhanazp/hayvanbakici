/**
 * FIYAT TEKLIFI (quote) HESAPLAMA.
 *
 * Competition Act kurali (yol haritasi §8.6): DRIP PRICING YASAK.
 * Zorunlu tum ucretler ilk gosterilen fiyata dahil olmalidir.
 * Tek istisna: devlet vergi/harclari (GST/HST) checkout'ta eklenebilir.
 * Bu yuzden quote her zaman TAM dokum dondurur — gizli kalem yoktur.
 */
import { applyPct, sum, type Cents } from './money.js';
import { taxOn, type ProvinceCode } from './taxes.js';
import {
  calculateCommission,
  type Attribution,
  type CommissionConfig,
  type CommissionResult,
} from './commission.js';
import { SERVICES, type ServiceType } from './services.js';

export interface QuoteInput {
  readonly serviceType: ServiceType;
  /** Bakicinin birim fiyati (gece/ziyaret/yuruyus/gun/seans) */
  readonly unitPriceCents: Cents;
  /** Birim sayisi — gece sayisi, ziyaret sayisi vb. */
  readonly units: number;
  /** Toplam hayvan sayisi (1 = ek ucret yok) */
  readonly petCount: number;
  /** Ek hayvan basina birim ucreti */
  readonly extraPetPriceCents?: Cents;
  /** Tatil donemi ek ucret yuzdesi (bakici belirler) */
  readonly holidaySurchargePct?: number;
  /**
   * Araliktaki TATIL birimi sayisi — holidayUnitsBetween'den.
   *
   * Eskiden yuzde, rezervasyonun TAMAMINA uygulaniyordu: "tatillerde
   * %20 fazla" diyen bakici, subatta sira bir salida da %20 fazla
   * aliyordu. Profilde yazan cumle ile kesilen tutar ayni olmali.
   *
   * Verilmezse 0: tarih bilinmeden tatil zammi hesaplanamaz ve
   * hesaplanmamali (ornek tutarlar boyle cikiyor).
   */
  readonly holidayUnits?: number;
  /** Bakicinin ekledigi opsiyonel ekstralar */
  readonly addOnsCents?: Cents;
  readonly attribution: Attribution;
  readonly province: ProvinceCode;
  readonly promoActive?: boolean;
  /** Bakici kendi GST/HST kaydina sahipse hizmet bedeline de vergi eklenir */
  readonly sitterGstRegistered?: boolean;
  readonly config?: CommissionConfig;
}

export interface QuoteLine {
  readonly key: string;
  readonly amountCents: Cents;
  /** Musteri bu kalemi oder mi, yoksa bakicidan mi kesilir */
  readonly side: 'owner' | 'sitter';
}

export interface Quote {
  readonly serviceType: ServiceType;
  readonly units: number;
  readonly unit: string;

  /** Bakicinin hizmet bedeli (vergi haric) */
  readonly subtotalCents: Cents;
  readonly lines: ReadonlyArray<QuoteLine>;

  /** --- Musteri tarafi --- */
  readonly ownerFeeCents: Cents;
  readonly ownerTaxCents: Cents;
  readonly ownerTotalCents: Cents;

  /** --- Bakici tarafi --- */
  readonly sitterCommissionCents: Cents;
  readonly sitterCommissionTaxCents: Cents;
  readonly sitterPayoutCents: Cents;

  /** --- Platform --- */
  readonly platformGrossCents: Cents;
  readonly effectiveTakeRatePct: number;

  readonly commission: CommissionResult;
  readonly province: ProvinceCode;
}

export function calculateQuote(input: QuoteInput): Quote {
  if (!Number.isInteger(input.units) || input.units < 1) {
    throw new RangeError(`units en az 1 tam sayi olmali: ${input.units}`);
  }
  if (!Number.isInteger(input.petCount) || input.petCount < 1) {
    throw new RangeError(`petCount en az 1 tam sayi olmali: ${input.petCount}`);
  }

  const def = SERVICES[input.serviceType];
  if (!def.multiDay && input.units > 1) {
    throw new RangeError(`${input.serviceType} tek birimlik bir hizmettir`);
  }

  const lines: QuoteLine[] = [];

  // 1. Temel hizmet bedeli
  const baseCents = input.unitPriceCents * input.units;
  lines.push({ key: 'quote.base', amountCents: baseCents, side: 'owner' });

  // 2. Ek hayvan
  const extraPets = input.petCount - 1;
  const extraPetCents =
    extraPets > 0 && input.extraPetPriceCents
      ? input.extraPetPriceCents * extraPets * input.units
      : 0;
  if (extraPetCents > 0) {
    lines.push({ key: 'quote.extraPets', amountCents: extraPetCents, side: 'owner' });
  }

  /*
    3. TATIL EK UCRETI — YALNIZCA TATIL GUNLERINE.

    Yuzde, tatile denk gelen birimlerin bedeline uygulaniyor; tum
    rezervasyona degil. Uc gecelik bir konaklamanin yalnizca biri Noel
    ise zam o bir geceden aliniyor.

    Ek hayvan ucreti de ayni orana giriyor: tatil gecesinde iki hayvan
    bakmak, normal gecede iki hayvan bakmaktan daha zor degil ama
    bakicinin o gunku bedeli butun olarak artiyor.
  */
  const holidayUnits = Math.min(Math.max(input.holidayUnits ?? 0, 0), input.units);
  const holidayBase = input.units > 0
    ? Math.round(((baseCents + extraPetCents) * holidayUnits) / input.units)
    : 0;
  const holidayCents = input.holidaySurchargePct
    ? applyPct(holidayBase, input.holidaySurchargePct)
    : 0;
  if (holidayCents > 0) {
    lines.push({ key: 'quote.holidaySurcharge', amountCents: holidayCents, side: 'owner' });
  }

  // 4. Ekstralar
  const addOnsCents = input.addOnsCents ?? 0;
  if (addOnsCents > 0) {
    lines.push({ key: 'quote.addOns', amountCents: addOnsCents, side: 'owner' });
  }

  const subtotalCents = sum(baseCents, extraPetCents, holidayCents, addOnsCents);

  // 5. Komisyon ve musteri ucreti
  const commission = calculateCommission({
    subtotalCents,
    attribution: input.attribution,
    promoActive: input.promoActive,
    config: input.config,
  });
  lines.push({ key: 'quote.serviceFee', amountCents: commission.ownerFeeCents, side: 'owner' });
  lines.push({
    key: 'quote.sitterCommission',
    amountCents: commission.sitterCommissionCents,
    side: 'sitter',
  });

  // 6. Vergi
  //    Platform ucreti her zaman vergiye tabi.
  //    Bakicinin hizmeti yalnizca bakici GST/HST kayitliysa.
  const ownerFeeTax = taxOn(commission.ownerFeeCents, input.province);
  const sitterServiceTax = input.sitterGstRegistered ? taxOn(subtotalCents, input.province) : 0;
  const ownerTaxCents = ownerFeeTax + sitterServiceTax;

  // Bakiciya kesilen komisyon da vergiye tabi bir hizmettir (platformdan bakiciya)
  const sitterCommissionTaxCents = taxOn(commission.sitterCommissionCents, input.province);

  const ownerTotalCents = sum(subtotalCents, commission.ownerFeeCents, ownerTaxCents);

  const sitterPayoutCents =
    subtotalCents +
    sitterServiceTax -
    commission.sitterCommissionCents -
    sitterCommissionTaxCents;

  const platformGrossCents = commission.ownerFeeCents + commission.sitterCommissionCents;
  const effectiveTakeRatePct =
    subtotalCents === 0 ? 0 : Math.round((platformGrossCents / subtotalCents) * 10000) / 100;

  return {
    serviceType: input.serviceType,
    units: input.units,
    unit: def.unit,
    subtotalCents,
    lines,
    ownerFeeCents: commission.ownerFeeCents,
    ownerTaxCents,
    ownerTotalCents,
    sitterCommissionCents: commission.sitterCommissionCents,
    sitterCommissionTaxCents,
    sitterPayoutCents,
    platformGrossCents,
    effectiveTakeRatePct,
    commission,
    province: input.province,
  };
}

/**
 * FIYAT ARALIGI ONERISI ICIN EN AZ ORNEK SAYISI.
 *
 * Uc bakicinin altinda "cevrendekiler su kadar aliyor" demiyoruz: iki
 * kisinin fiyatindan piyasa cikmaz, yanlis capa atmis oluruz. Sabit
 * burada duruyor cunku hem sunucu sorgusu (packages/db landing.ts) hem
 * de tarayicidaki form ayni esigi kullanmali.
 */
export const MIN_RANGE_SAMPLE = 3;

export interface PriceRange {
  readonly count: number;
  readonly p25Cents: Cents;
  readonly medianCents: Cents;
  readonly p75Cents: Cents;
}


/* --------------------------------------------- bakiciya ne kaliyor */

export interface NetPerUnit {
  readonly attribution: Attribution;
  /** Bu atifta gecerli bakici komisyonu yuzdesi */
  readonly commissionPct: number;
  /** Bir birim (gece/yuruyus/ziyaret) icin bakicinin eline gecen */
  readonly netCents: Cents;
}

/**
 * "SIZ $65 YAZDINIZ, SIZE NE KALIR?"
 *
 * Havre'nin tek gercek farki komisyon seffafligi ama bakici KENDI
 * ekraninda net kazancini goremiyordu; fiyat kutusunun yaninda sadece
 * "/ gece" yaziyordu.
 *
 * Hesap calculateQuote uzerinden yapiliyor, elle degil: ekranin
 * soyledigi rakam ile rezervasyonda kesilen rakam AYNI kodu kullanmali.
 * Komisyonun kendisi de vergiye tabi bir hizmet oldugu icin net tutar
 * komisyon + komisyon vergisi dusuldukten sonra kaliyor.
 *
 * Tek birim, tek hayvan, tatil disi: bakiciya gosterilen referans
 * senaryo. Ek hayvan ve tatil ek ucreti bunun USTUNE biner.
 */
export function netPerUnit(input: {
  readonly serviceType: ServiceType;
  readonly unitPriceCents: Cents;
  readonly province: ProvinceCode;
  readonly promoActive?: boolean;
  readonly sitterGstRegistered?: boolean;
  readonly config?: CommissionConfig;
}): NetPerUnit[] {
  const order: Attribution[] = ['sitter_referral', 'repeat', 'platform'];
  return order.map((attribution) => {
    const q = calculateQuote({
      serviceType: input.serviceType,
      unitPriceCents: input.unitPriceCents,
      units: 1,
      petCount: 1,
      attribution,
      province: input.province,
      ...(input.promoActive === undefined ? {} : { promoActive: input.promoActive }),
      ...(input.sitterGstRegistered === undefined
        ? {}
        : { sitterGstRegistered: input.sitterGstRegistered }),
      ...(input.config === undefined ? {} : { config: input.config }),
    });
    return {
      attribution,
      commissionPct: q.commission.sitterPct,
      netCents: q.sitterPayoutCents,
    };
  });
}
