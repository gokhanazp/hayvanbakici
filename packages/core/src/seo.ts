/**
 * ARZ ESIGI KURALI — SEO'nun en onemli tek mekanizmasi (yol haritasi §7.3).
 *
 * Google'in "doorway pages" tanimi sehir sayfalarina dogrudan temas eder.
 * Bizi koruyan tek sey: her sayfanin o sehir icin GERCEK, benzersiz,
 * kullaniciya degerli arz tasimasi. Bos sayfa hic yayina cikmaz.
 */

export interface IndexabilityInput {
  readonly sitterCount: number;
  readonly reviewCount?: number;
}

export interface IndexabilityResult {
  /** Sayfa hic uretilmeli mi */
  readonly shouldRender: boolean;
  readonly index: boolean;
  readonly follow: boolean;
  /** Yakindaki sehirler modulu genisletilsin mi */
  readonly expandNearbyModule: boolean;
  /** Bekleme listesi formu gosterilsin mi */
  readonly showWaitlist: boolean;
  readonly reasonKey: string;
}

export const SUPPLY_THRESHOLDS = {
  /** Bu ve ustu: tam indekslenebilir */
  healthy: 8,
  /** Bu ve ustu: indekslenebilir ama yakin sehir modulu genisletilir */
  minimum: 3,
} as const;

export function evaluateIndexability(input: IndexabilityInput): IndexabilityResult {
  const n = input.sitterCount;

  if (n === 0) {
    return {
      shouldRender: false,
      index: false,
      follow: false,
      expandNearbyModule: false,
      showWaitlist: false,
      reasonKey: 'seo.noSupply',
    };
  }

  if (n < SUPPLY_THRESHOLDS.minimum) {
    return {
      shouldRender: true,
      index: false,
      follow: true,
      expandNearbyModule: true,
      showWaitlist: true,
      reasonKey: 'seo.thinSupply',
    };
  }

  if (n < SUPPLY_THRESHOLDS.healthy) {
    return {
      shouldRender: true,
      index: true,
      follow: true,
      expandNearbyModule: true,
      showWaitlist: false,
      reasonKey: 'seo.growingSupply',
    };
  }

  return {
    shouldRender: true,
    index: true,
    follow: true,
    expandNearbyModule: false,
    showWaitlist: false,
    reasonKey: 'seo.healthySupply',
  };
}
