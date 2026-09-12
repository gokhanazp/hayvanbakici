import { describe, it, expect } from 'vitest';
import { evaluateIndexability } from './seo.js';

describe('evaluateIndexability — arz esigi kurali', () => {
  it('0 bakici: sayfa hic uretilmez (doorway cezasina karsi savunma)', () => {
    const r = evaluateIndexability({ sitterCount: 0 });
    expect(r.shouldRender).toBe(false);
    expect(r.index).toBe(false);
  });

  it('1-2 bakici: noindex ama follow, bekleme listesi gosterilir', () => {
    const r = evaluateIndexability({ sitterCount: 2 });
    expect(r.shouldRender).toBe(true);
    expect(r.index).toBe(false);
    expect(r.follow).toBe(true);
    expect(r.showWaitlist).toBe(true);
  });

  it('3-7 bakici: indekslenir, yakin sehir modulu genisletilir', () => {
    const r = evaluateIndexability({ sitterCount: 5 });
    expect(r.index).toBe(true);
    expect(r.expandNearbyModule).toBe(true);
  });

  it('8+ bakici: tam saglikli indeksleme', () => {
    const r = evaluateIndexability({ sitterCount: 12 });
    expect(r.index).toBe(true);
    expect(r.expandNearbyModule).toBe(false);
    expect(r.reasonKey).toBe('seo.healthySupply');
  });
});
