/**
 * IPTAL POLITIKALARI VE IADE HESABI.
 *
 * Tuketici koruma notlari (yol haritasi §8.6):
 *  - Ontario CPA: on bilgilendirme yapilmadiysa 7 gun, sozlesme kopyasi verilmediyse 30 gun iptal hakki
 *  - Musteri ucreti (service fee) iptalde HER ZAMAN tam iade edilir
 *  - Politika checkout'ta acikca gosterilmelidir
 */
import { applyPct, type Cents } from './money.js';

export type CancellationPolicy = 'flexible' | 'moderate' | 'strict';

export interface PolicyRule {
  /** Hizmet baslangicina kalan saat >= bu deger ise iade yuzdesi uygulanir */
  readonly hoursBefore: number;
  /** Hizmet bedelinin iade edilen yuzdesi */
  readonly refundPct: number;
}

export const POLICIES: Readonly<Record<CancellationPolicy, ReadonlyArray<PolicyRule>>> = {
  flexible: [
    { hoursBefore: 24, refundPct: 100 },
    { hoursBefore: 0, refundPct: 50 },
  ],
  moderate: [
    { hoursBefore: 168, refundPct: 100 }, // 7 gun
    { hoursBefore: 72, refundPct: 50 },
    { hoursBefore: 0, refundPct: 0 },
  ],
  strict: [
    { hoursBefore: 336, refundPct: 100 }, // 14 gun
    { hoursBefore: 168, refundPct: 50 },
    { hoursBefore: 0, refundPct: 0 },
  ],
};

export interface RefundInput {
  readonly policy: CancellationPolicy;
  readonly subtotalCents: Cents;
  readonly ownerFeeCents: Cents;
  readonly ownerTaxCents: Cents;
  readonly cancelledBy: 'owner' | 'sitter' | 'platform';
  readonly hoursUntilStart: number;
  /** Ontario/Quebec CPA yasal iptal hakki devrede mi */
  readonly statutoryCancellation?: boolean;
}

export interface RefundResult {
  readonly refundPct: number;
  readonly serviceRefundCents: Cents;
  /** Musteri ucreti iptalde her zaman tam iade */
  readonly feeRefundCents: Cents;
  readonly taxRefundCents: Cents;
  readonly totalRefundCents: Cents;
  /** Bakiciya odenecek tutar (iade edilmeyen hizmet bedeli) */
  readonly sitterRetainsCents: Cents;
  readonly reasonKey: string;
}

export function calculateRefund(input: RefundInput): RefundResult {
  let refundPct: number;
  let reasonKey: string;

  if (input.statutoryCancellation) {
    // Yasal iptal hakki — kosulsuz tam iade
    refundPct = 100;
    reasonKey = 'refund.statutory';
  } else if (input.cancelledBy === 'sitter' || input.cancelledBy === 'platform') {
    // Bakici veya platform iptal ederse musteri hicbir sekilde zarar gormez
    refundPct = 100;
    reasonKey = `refund.cancelledBy.${input.cancelledBy}`;
  } else {
    const rules = POLICIES[input.policy];
    const matched = rules.find((r) => input.hoursUntilStart >= r.hoursBefore);
    refundPct = matched?.refundPct ?? 0;
    reasonKey = `refund.policy.${input.policy}`;
  }

  const serviceRefundCents = applyPct(input.subtotalCents, refundPct);
  const feeRefundCents = input.ownerFeeCents; // her zaman tam iade
  const taxRefundCents = applyPct(input.ownerTaxCents, refundPct === 100 ? 100 : refundPct);

  return {
    refundPct,
    serviceRefundCents,
    feeRefundCents,
    taxRefundCents,
    totalRefundCents: serviceRefundCents + feeRefundCents + taxRefundCents,
    sitterRetainsCents: input.subtotalCents - serviceRefundCents,
    reasonKey,
  };
}
