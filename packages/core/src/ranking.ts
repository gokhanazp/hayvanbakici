/**
 * SEFFAF SIRALAMA SKORU (yol haritasi §6.4).
 *
 * Rover "sabit siralama yok, her arama kisisellestirilir" diyor — bakici icin kara kutu.
 * Biz her bileseni ve "nasil yukseltirsiniz"i bakici panelinde gosteriyoruz.
 * Bu ayrica Ontario DPWRA'nin algoritma seffafligi standardini gonullu karsilar.
 */

export interface RankingInput {
  readonly averageRating: number;      // 0-5
  readonly reviewCount: number;
  readonly medianResponseMinutes: number;
  readonly acceptanceRate: number;     // 0-1
  readonly cancellationRate: number;   // 0-1
  readonly profileCompleteness: number;// 0-1
  readonly badgeLevel: 0 | 1 | 2 | 3 | 4;
}

export interface RankingComponent {
  readonly key: string;
  readonly weight: number;
  readonly rawScore: number;    // 0-1
  readonly weighted: number;
  readonly improvementKey: string | null;
}

export interface RankingResult {
  readonly score: number;       // 0-100
  readonly components: ReadonlyArray<RankingComponent>;
}

const WEIGHTS = {
  reviewQuality: 0.30,
  responseSpeed: 0.20,
  acceptance: 0.20,
  reliability: 0.15,
  completeness: 0.10,
  badges: 0.05,
} as const;

/** Bayesyen ortalama — dusuk yorum sayisini cezalandirir (C=10 sanal yorum, m=4.5 onsel) */
function bayesianRating(avg: number, count: number, C = 10, m = 4.5): number {
  return (C * m + avg * count) / (C + count);
}

export function calculateRanking(input: RankingInput): RankingResult {
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  const reviewQuality = clamp01(bayesianRating(input.averageRating, input.reviewCount) / 5);
  // 15 dk = mukemmel, 24 saat = 0
  const responseSpeed = clamp01(1 - (input.medianResponseMinutes - 15) / (1440 - 15));
  const acceptance = clamp01(input.acceptanceRate);
  const reliability = clamp01(1 - input.cancellationRate * 5); // %20 iptal = 0
  const completeness = clamp01(input.profileCompleteness);
  const badges = clamp01(input.badgeLevel / 4);

  const raw = { reviewQuality, responseSpeed, acceptance, reliability, completeness, badges };

  const components: RankingComponent[] = (
    Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>
  ).map((key) => {
    const rawScore = raw[key];
    return {
      key,
      weight: WEIGHTS[key],
      rawScore,
      weighted: rawScore * WEIGHTS[key],
      improvementKey: rawScore < 0.85 ? `ranking.improve.${key}` : null,
    };
  });

  const score = Math.round(components.reduce((a, c) => a + c.weighted, 0) * 10000) / 100;
  return { score, components };
}
