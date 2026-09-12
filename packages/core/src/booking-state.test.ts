import { describe, it, expect } from 'vitest';
import { canTransition, assertTransition, payoutReleaseAt, PAYOUT_HOLD_HOURS } from './booking-state.js';

describe('rezervasyon durum makinesi', () => {
  it('gecerli mutlu yol', () => {
    expect(canTransition('draft', 'requested')).toBe(true);
    expect(canTransition('requested', 'confirmed')).toBe(true);
    expect(canTransition('confirmed', 'paid')).toBe(true);
    expect(canTransition('paid', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
    expect(canTransition('completed', 'payout_released')).toBe(true);
  });

  it('odeme yapilmadan hizmet baslatilamaz', () => {
    expect(canTransition('confirmed', 'in_progress')).toBe(false);
  });

  it('reddedilen rezervasyon terminaldir', () => {
    expect(canTransition('declined', 'confirmed')).toBe(false);
    expect(() => assertTransition('declined', 'paid')).toThrow(/Gecersiz/);
  });

  it('tamamlanmis rezervasyon ihtilafa acilabilir', () => {
    expect(canTransition('completed', 'disputed')).toBe(true);
    expect(canTransition('payout_released', 'disputed')).toBe(true);
  });

  it('odeme serbest birakma 48 saat sonra', () => {
    const end = new Date('2026-10-15T12:00:00Z');
    const release = payoutReleaseAt(end);
    expect(release.getTime() - end.getTime()).toBe(PAYOUT_HOLD_HOURS * 3600_000);
    expect(release.toISOString()).toBe('2026-10-17T12:00:00.000Z');
  });
});
