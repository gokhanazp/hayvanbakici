import { describe, it, expect } from 'vitest';
import {
  calculateCommission,
  resolveAttribution,
  compareToRover,
  DEFAULT_COMMISSION,
} from './commission.js';
import { dollars } from './money.js';

describe('resolveAttribution', () => {
  it('bakici davetiyle gelen musteri her zaman sitter_referral', () => {
    expect(resolveAttribution({ viaSitterReferral: true, previousCompletedBookings: 0 }))
      .toBe('sitter_referral');
  });

  it('attribution KALICI: bakicinin getirdigi musteri tekrarda da sitter_referral kalir', () => {
    // Rover'in "her yeni musteride %30'a reset" mantiginin tam tersi
    expect(resolveAttribution({ viaSitterReferral: true, previousCompletedBookings: 5 }))
      .toBe('sitter_referral');
  });

  it('platformdan gelen ilk rezervasyon platform', () => {
    expect(resolveAttribution({ viaSitterReferral: false, previousCompletedBookings: 0 }))
      .toBe('platform');
  });

  it('platformdan gelen ikinci rezervasyon repeat', () => {
    expect(resolveAttribution({ viaSitterReferral: false, previousCompletedBookings: 1 }))
      .toBe('repeat');
  });
});

describe('calculateCommission', () => {
  const subtotal = dollars(500);

  it('platform attribution: bakicidan %18', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    expect(r.sitterPct).toBe(18);
    expect(r.sitterCommissionCents).toBe(dollars(90));
  });

  it('sitter_referral: bakicidan %0 — stratejinin kalbi', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'sitter_referral' });
    expect(r.sitterPct).toBe(0);
    expect(r.sitterCommissionCents).toBe(0);
  });

  it('repeat: bakicidan %10', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'repeat' });
    expect(r.sitterCommissionCents).toBe(dollars(50));
  });

  it('musteri ucreti %7', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    expect(r.ownerFeeCents).toBe(dollars(35));
    expect(r.ownerFeeCapped).toBe(false);
  });

  it('musteri ucreti CA$45 ust siniriyla kesilir', () => {
    const big = dollars(2000); // %7 = $140 -> cap $45
    const r = calculateCommission({ subtotalCents: big, attribution: 'platform' });
    expect(r.ownerFeeCents).toBe(DEFAULT_COMMISSION.ownerFeeCapCents);
    expect(r.ownerFeeCapped).toBe(true);
  });

  it('lansman promosyonu bakici komisyonunu sifirlar ama musteri ucretini etkilemez', () => {
    const r = calculateCommission({
      subtotalCents: subtotal,
      attribution: 'platform',
      promoActive: true,
    });
    expect(r.sitterCommissionCents).toBe(0);
    expect(r.ownerFeeCents).toBe(dollars(35));
    expect(r.promoApplied).toBe(true);
    expect(r.explanationKey).toBe('commission.promo');
  });

  it('cent yuvarlamasi tam sayi kalir', () => {
    const r = calculateCommission({ subtotalCents: 3333, attribution: 'platform' });
    expect(Number.isInteger(r.sitterCommissionCents)).toBe(true);
    expect(Number.isInteger(r.ownerFeeCents)).toBe(true);
  });
});

describe('compareToRover — pazarlama iddialarinin dogrulugu', () => {
  const subtotal = dollars(500);

  it('platform attribution bile Rover standarttan ucuz', () => {
    const ours = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    const c = compareToRover(subtotal, ours, 'standard');
    // Bizim: $90 + $35 = $125 | Rover: $100 + $55 = $155
    expect(c.ourTakeCents).toBe(dollars(125));
    expect(c.roverTakeCents).toBe(dollars(155));
    expect(c.sitterSavesCents).toBe(dollars(10));
    expect(c.ownerSavesCents).toBe(dollars(20));
  });

  it('sitter_referral vs Rover Tier 1: bakici $150 kazanir', () => {
    const ours = calculateCommission({ subtotalCents: subtotal, attribution: 'sitter_referral' });
    const c = compareToRover(subtotal, ours, 'tier1');
    // Rover Tier 1 bakicidan %30 = $150; biz $0
    expect(c.sitterSavesCents).toBe(dollars(150));
  });

  it('Rover Tier 1 toplam take rate ~%41', () => {
    const ours = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    const c = compareToRover(subtotal, ours, 'tier1');
    const roverRate = (c.roverTakeCents / subtotal) * 100;
    expect(roverRate).toBeCloseTo(41, 0);
  });
});
