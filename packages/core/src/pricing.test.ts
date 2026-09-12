import { describe, it, expect } from 'vitest';
import { calculateQuote } from './pricing.js';
import { dollars, formatMoney } from './money.js';

describe('calculateQuote — Toronto konaklama', () => {
  const base = {
    serviceType: 'boarding' as const,
    unitPriceCents: dollars(50),
    units: 5,
    petCount: 1,
    province: 'ON' as const,
  };

  it('temel hesap: 5 gece x $50 = $250 ara toplam', () => {
    const q = calculateQuote({ ...base, attribution: 'platform' });
    expect(q.subtotalCents).toBe(dollars(250));
  });

  it('musteri toplami = ara toplam + %7 ucret + o ucretin HST-i', () => {
    const q = calculateQuote({ ...base, attribution: 'platform' });
    expect(q.ownerFeeCents).toBe(dollars(17.5));
    expect(q.ownerTaxCents).toBe(Math.round(dollars(17.5) * 0.13)); // ON %13
    expect(q.ownerTotalCents).toBe(dollars(250) + dollars(17.5) + q.ownerTaxCents);
  });

  it('bakici odemesi = ara toplam - komisyon - komisyon vergisi', () => {
    const q = calculateQuote({ ...base, attribution: 'platform' });
    const commission = dollars(45); // %18 of $250
    const commissionTax = Math.round(commission * 0.13);
    expect(q.sitterCommissionCents).toBe(commission);
    expect(q.sitterPayoutCents).toBe(dollars(250) - commission - commissionTax);
  });

  it('sitter_referral: bakici ara toplamin TAMAMINI alir', () => {
    const q = calculateQuote({ ...base, attribution: 'sitter_referral' });
    expect(q.sitterCommissionCents).toBe(0);
    expect(q.sitterCommissionTaxCents).toBe(0);
    expect(q.sitterPayoutCents).toBe(dollars(250));
  });

  it('ek hayvan gece basina ucretlendirilir', () => {
    const q = calculateQuote({
      ...base,
      petCount: 2,
      extraPetPriceCents: dollars(20),
      attribution: 'platform',
    });
    // 5 gece x 1 ek hayvan x $20 = $100
    expect(q.subtotalCents).toBe(dollars(350));
  });

  it('tatil ek ucreti temel + ek hayvan uzerinden hesaplanir', () => {
    const q = calculateQuote({ ...base, holidaySurchargePct: 20, attribution: 'platform' });
    expect(q.subtotalCents).toBe(dollars(300)); // 250 + %20
  });

  it('bakici GST kayitliysa hizmet bedeline de vergi eklenir ve bakiciya gecer', () => {
    const q = calculateQuote({ ...base, attribution: 'sitter_referral', sitterGstRegistered: true });
    const serviceTax = Math.round(dollars(250) * 0.13);
    expect(q.ownerTotalCents).toBe(dollars(250) + dollars(17.5) + Math.round(dollars(17.5) * 0.13) + serviceTax);
    expect(q.sitterPayoutCents).toBe(dollars(250) + serviceTax);
  });

  it('efektif take rate: platform %25, referral %7, repeat %17', () => {
    expect(calculateQuote({ ...base, attribution: 'platform' }).effectiveTakeRatePct).toBe(25);
    expect(calculateQuote({ ...base, attribution: 'sitter_referral' }).effectiveTakeRatePct).toBe(7);
    expect(calculateQuote({ ...base, attribution: 'repeat' }).effectiveTakeRatePct).toBe(17);
  });

  it('Quebec QST dogru uygulanir (%14,975)', () => {
    const q = calculateQuote({ ...base, province: 'QC', attribution: 'platform' });
    expect(q.ownerTaxCents).toBe(Math.round(dollars(17.5) * 0.14975));
  });

  it('Alberta yalnizca %5 GST', () => {
    const q = calculateQuote({ ...base, province: 'AB', attribution: 'platform' });
    expect(q.ownerTaxCents).toBe(Math.round(dollars(17.5) * 0.05));
  });

  it('dokum hicbir gizli kalem icermez (drip pricing yasagi)', () => {
    const q = calculateQuote({ ...base, attribution: 'platform' });
    const ownerLines = q.lines.filter((l) => l.side === 'owner');
    const linesTotal = ownerLines.reduce((a, l) => a + l.amountCents, 0);
    expect(linesTotal).toBe(q.ownerTotalCents - q.ownerTaxCents);
  });

  it('tek birimlik hizmette units > 1 reddedilir', () => {
    expect(() =>
      calculateQuote({ ...base, serviceType: 'dog_walking', units: 3, attribution: 'platform' }),
    ).toThrow(/tek birimlik/);
  });
});

describe('formatMoney', () => {
  it('en-CA formati', () => {
    expect(formatMoney(dollars(52.5), 'en-CA')).toMatch(/52\.50/);
  });
  it('fr-CA formati virgul kullanir', () => {
    expect(formatMoney(dollars(52.5), 'fr-CA')).toMatch(/52,50/);
  });
});
