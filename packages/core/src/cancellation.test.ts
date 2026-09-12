import { describe, it, expect } from 'vitest';
import { calculateRefund } from './cancellation.js';
import { dollars } from './money.js';

const base = {
  subtotalCents: dollars(250),
  ownerFeeCents: dollars(17.5),
  ownerTaxCents: dollars(2.28),
};

describe('calculateRefund', () => {
  it('esnek politika: 24+ saat once tam iade', () => {
    const r = calculateRefund({ ...base, policy: 'flexible', cancelledBy: 'owner', hoursUntilStart: 48 });
    expect(r.refundPct).toBe(100);
    expect(r.serviceRefundCents).toBe(dollars(250));
  });

  it('esnek politika: 24 saatten az kala %50', () => {
    const r = calculateRefund({ ...base, policy: 'flexible', cancelledBy: 'owner', hoursUntilStart: 5 });
    expect(r.refundPct).toBe(50);
    expect(r.sitterRetainsCents).toBe(dollars(125));
  });

  it('siki politika: 14 gunden az kala %50, 7 gunden az kala %0', () => {
    expect(calculateRefund({ ...base, policy: 'strict', cancelledBy: 'owner', hoursUntilStart: 200 }).refundPct).toBe(50);
    expect(calculateRefund({ ...base, policy: 'strict', cancelledBy: 'owner', hoursUntilStart: 24 }).refundPct).toBe(0);
  });

  it('MUSTERI UCRETI her zaman tam iade edilir — politikadan bagimsiz', () => {
    const r = calculateRefund({ ...base, policy: 'strict', cancelledBy: 'owner', hoursUntilStart: 1 });
    expect(r.refundPct).toBe(0);
    expect(r.feeRefundCents).toBe(dollars(17.5));
  });

  it('bakici iptal ederse musteri her zaman tam iade alir', () => {
    const r = calculateRefund({ ...base, policy: 'strict', cancelledBy: 'sitter', hoursUntilStart: 1 });
    expect(r.refundPct).toBe(100);
    expect(r.sitterRetainsCents).toBe(0);
    expect(r.reasonKey).toBe('refund.cancelledBy.sitter');
  });

  it('yasal iptal hakki (Ontario/Quebec CPA) her politikayi ezer', () => {
    const r = calculateRefund({
      ...base, policy: 'strict', cancelledBy: 'owner', hoursUntilStart: 0, statutoryCancellation: true,
    });
    expect(r.refundPct).toBe(100);
    expect(r.reasonKey).toBe('refund.statutory');
  });
});
