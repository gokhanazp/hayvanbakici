import { describe, expect, it } from 'vitest';
import { demoNotice, isDemoEnv } from './demo.js';

describe('isDemoEnv', () => {
  it('DEMO_MODE=1 acar', () => {
    expect(isDemoEnv({ DEMO_MODE: '1' })).toBe(true);
  });

  it('hicbir ayar yoksa KAPALI — uretim varsayilani', () => {
    expect(isDemoEnv({})).toBe(false);
  });

  it('Vercel onizleme dagitimi kendiliginden demo sayilir', () => {
    expect(isDemoEnv({ VERCEL_ENV: 'preview' })).toBe(true);
    expect(isDemoEnv({ VERCEL_ENV: 'production' })).toBe(false);
  });

  it('DEMO_MODE=0 onizlemede bile KAPATIR — acik karar kazanir', () => {
    expect(isDemoEnv({ DEMO_MODE: '0', VERCEL_ENV: 'preview' })).toBe(false);
  });

  it('bos ya da anlamsiz deger acmaz', () => {
    expect(isDemoEnv({ DEMO_MODE: '' })).toBe(false);
    expect(isDemoEnv({ DEMO_MODE: 'true' })).toBe(false);
  });
});

describe('demoNotice', () => {
  it('uyari iki dilde ve "uydurma" diyor', () => {
    expect(demoNotice('en-CA').body).toMatch(/made up/);
    expect(demoNotice('fr-CA').body).toMatch(/fictifs/);
  });
});
