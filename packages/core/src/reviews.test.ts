import { describe, expect, it } from 'vitest';
import {
  REVIEW_WINDOW_DAYS, canWriteReview, isReviewVisible, reviewPublishAt, reviewWindowCloses,
} from './reviews.js';

const end = new Date('2026-09-01T12:00:00Z');

describe('yorum penceresi', () => {
  it('rezervasyonun bitisinden itibaren on dort gun', () => {
    expect(reviewWindowCloses(end).toISOString()).toBe('2026-09-15T12:00:00.000Z');
    expect(REVIEW_WINDOW_DAYS).toBe(14);
  });

  it('tamamlanmamis rezervasyona yorum yazilamaz', () => {
    for (const status of ['requested', 'confirmed', 'in_progress', 'cancelled', 'declined']) {
      const r = canWriteReview({ status, endAt: end, alreadyWritten: false, now: end });
      expect(r).toEqual({ ok: false, reason: 'not_completed' });
    }
  });

  it('odemesi yapilmis rezervasyon da yorumlanabilir', () => {
    const r = canWriteReview({
      status: 'payout_released', endAt: end, alreadyWritten: false, now: end,
    });
    expect(r.ok).toBe(true);
  });

  it('pencere kapaninca yazilamaz', () => {
    const late = new Date('2026-09-15T12:00:01Z');
    const r = canWriteReview({ status: 'completed', endAt: end, alreadyWritten: false, now: late });
    expect(r).toEqual({ ok: false, reason: 'window_closed' });
  });

  it('pencerenin son aninda hala yazilabilir', () => {
    const r = canWriteReview({
      status: 'completed', endAt: end, alreadyWritten: false, now: reviewWindowCloses(end),
    });
    expect(r.ok).toBe(true);
  });

  it('ayni kisi iki kez yazamaz', () => {
    const r = canWriteReview({ status: 'completed', endAt: end, alreadyWritten: true, now: end });
    expect(r).toEqual({ ok: false, reason: 'already_written' });
  });
});

describe('karsilikli korleme', () => {
  it('karsi taraf yazdiysa ikisi de hemen yayinlanir', () => {
    const now = new Date('2026-09-02T00:00:00Z');
    expect(reviewPublishAt({ counterpartWrote: true, endAt: end, now })).toEqual(now);
  });

  it('yazmadiysa pencere kapanisinda yayinlanir', () => {
    const now = new Date('2026-09-02T00:00:00Z');
    expect(reviewPublishAt({ counterpartWrote: false, endAt: end, now }))
      .toEqual(reviewWindowCloses(end));
  });

  /* Ilk surumde `published_at IS NOT NULL` kullaniliyordu; gelecek tarihli
     bir damga o kontrolden GECIYOR ve yorumu erken gosteriyordu. */
  it('gelecek tarihli yayin damgasi henuz gorunur degil', () => {
    const now = new Date('2026-09-02T00:00:00Z');
    expect(isReviewVisible(reviewWindowCloses(end), now)).toBe(false);
    expect(isReviewVisible(now, now)).toBe(true);
    expect(isReviewVisible(null, now)).toBe(false);
  });
});
