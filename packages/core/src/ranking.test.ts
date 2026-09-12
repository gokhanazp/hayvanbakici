import { describe, it, expect } from 'vitest';
import { calculateRanking } from './ranking.js';

const perfect = {
  averageRating: 5, reviewCount: 200, medianResponseMinutes: 15,
  acceptanceRate: 1, cancellationRate: 0, profileCompleteness: 1, badgeLevel: 4 as const,
};

describe('calculateRanking — seffaf siralama', () => {
  it('mukemmel bakici 100-e yakin skor alir', () => {
    expect(calculateRanking(perfect).score).toBeGreaterThan(95);
  });

  it('bayesyen ortalama az yorumlu bakiciyi cezalandirir', () => {
    const few = calculateRanking({ ...perfect, reviewCount: 1 });
    expect(few.score).toBeLessThan(calculateRanking(perfect).score);
  });

  it('yuksek iptal orani guvenilirligi sifirlar', () => {
    const r = calculateRanking({ ...perfect, cancellationRate: 0.2 });
    const reliability = r.components.find((c) => c.key === 'reliability');
    expect(reliability?.rawScore).toBe(0);
  });

  it('her zayif bilesen icin iyilestirme anahtari dondurulur', () => {
    const r = calculateRanking({ ...perfect, profileCompleteness: 0.4 });
    const c = r.components.find((x) => x.key === 'completeness');
    expect(c?.improvementKey).toBe('ranking.improve.completeness');
  });

  it('guclu bilesenler icin iyilestirme anahtari null', () => {
    const r = calculateRanking(perfect);
    expect(r.components.every((c) => c.improvementKey === null)).toBe(true);
  });

  it('agirliklarin toplami 1', () => {
    const total = calculateRanking(perfect).components.reduce((a, c) => a + c.weight, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});
