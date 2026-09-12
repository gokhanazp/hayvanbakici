/** Rezervasyon durum makinesi (yol haritasi §5.3) */

export const BOOKING_STATUSES = [
  'draft',
  'requested',
  'counter_offered',
  'declined',
  'expired',
  'confirmed',
  'paid',
  'in_progress',
  'completed',
  'payout_released',
  'cancelled',
  'disputed',
  'refunded',
  'resolved',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

const TRANSITIONS: Readonly<Record<BookingStatus, ReadonlyArray<BookingStatus>>> = {
  draft:           ['requested'],
  requested:       ['confirmed', 'counter_offered', 'declined', 'expired', 'cancelled'],
  counter_offered: ['confirmed', 'declined', 'expired', 'cancelled'],
  declined:        [],
  expired:         [],
  confirmed:       ['paid', 'cancelled'],
  paid:            ['in_progress', 'cancelled'],
  in_progress:     ['completed', 'disputed'],
  completed:       ['payout_released', 'disputed'],
  payout_released: ['disputed'],
  cancelled:       ['refunded'],
  disputed:        ['resolved', 'refunded'],
  refunded:        [],
  resolved:        ['payout_released'],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Gecersiz rezervasyon gecisi: ${from} -> ${to}`);
  }
}

/** Bakici yanit suresi — asilirsa rezervasyon otomatik suresi doler */
export const REQUEST_EXPIRY_HOURS = 36;

/** Hizmet bitiminden sonra odemenin serbest birakilmasina kadar gecen sure.
 *  Stripe Kanada'da manuel payout ile azami tutma suresi 90 gundur — bolca icindeyiz. */
export const PAYOUT_HOLD_HOURS = 48;

/** Tazminat talebi karar SLA'si — rakiplerden farklilasma noktasi */
export const CLAIM_DECISION_SLA_HOURS = 48;

export function payoutReleaseAt(serviceEndsAt: Date): Date {
  return new Date(serviceEndsAt.getTime() + PAYOUT_HOLD_HOURS * 3600_000);
}
