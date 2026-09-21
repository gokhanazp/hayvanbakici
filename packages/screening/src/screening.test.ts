import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { MockScreeningProvider } from './mock.js';
import { decide, badgeLevelFor } from './decision.js';
import { createScreeningProvider, CertnScreeningProvider } from './index.js';

describe('karar kurali', () => {
  it('temiz sonuc otomatik gecer', () => {
    const d = decide('clear', 'ON');
    expect(d.status).toBe('passed');
    expect(d.needsHumanReview).toBe(false);
    // Law 25 s.12.1: otomatik olmasi kaydedilmeli, yonu fark etmez
    expect(d.automated).toBe(true);
  });

  it('ISARETLI sonuc HICBIR eyalette otomatik reddedilmez', () => {
    for (const province of ['ON', 'QC', 'BC', 'AB'] as const) {
      const d = decide('flagged', province);
      expect(d.status).toBe('manual_review');
      expect(d.status).not.toBe('failed');
      expect(d.needsHumanReview).toBe(true);
      // Insan karar verecegi icin karar "munhasiran otomatik" degil
      expect(d.automated).toBe(false);
    }
  });

  it('saglayici hatasi da insana duser, sessizce gecmez', () => {
    const d = decide('error', 'QC');
    expect(d.status).toBe('manual_review');
  });

  it('hicbir girdi failed uretmiyor — red yalnizca elle verilir', () => {
    const outcomes = ['pending', 'clear', 'flagged', 'error'] as const;
    for (const o of outcomes) {
      expect(decide(o, 'QC').status).not.toBe('failed');
    }
  });
});

describe('rozet seviyesi', () => {
  it('en yuksek gecilen kontrole gore belirlenir', () => {
    expect(badgeLevelFor({ identityPassed: false, criminalPassed: false, licencePassed: false, certificationPassed: false })).toBe(0);
    expect(badgeLevelFor({ identityPassed: true, criminalPassed: false, licencePassed: false, certificationPassed: false })).toBe(1);
    expect(badgeLevelFor({ identityPassed: true, criminalPassed: true, licencePassed: false, certificationPassed: false })).toBe(2);
    expect(badgeLevelFor({ identityPassed: true, criminalPassed: true, licencePassed: true, certificationPassed: false })).toBe(3);
    expect(badgeLevelFor({ identityPassed: true, criminalPassed: true, licencePassed: true, certificationPassed: true })).toBe(4);
  });
});

describe('sahte saglayici', () => {
  const provider = new MockScreeningProvider('test-secret');
  const base = {
    sitterId: '11111111-1111-1111-1111-111111111111',
    firstName: 'Camille',
    lastName: 'Bourque',
    dateOfBirth: '1990-05-14',
    province: 'QC' as const,
  };

  it('ayni e-posta her zaman ayni sonucu verir', async () => {
    const a = await provider.submit({ ...base, email: 'camille@example.ca' });
    const b = await provider.submit({ ...base, email: 'camille@example.ca' });
    expect(a.outcome).toBe(b.outcome);
  });

  it('etiketle sonuc zorlanabilir', async () => {
    expect((await provider.submit({ ...base, email: 'a+clear@example.ca' })).outcome).toBe('clear');
    expect((await provider.submit({ ...base, email: 'a+flagged@example.ca' })).outcome).toBe('flagged');
    expect((await provider.submit({ ...base, email: 'a+error@example.ca' })).outcome).toBe('error');
    expect((await provider.submit({ ...base, email: 'a+pending@example.ca' })).outcome).toBe('pending');
  });

  it('imzasiz webhook reddedilir', () => {
    expect(provider.verifyWebhook('{}', null)).toBe(false);
    expect(provider.verifyWebhook('{}', 'yanlis')).toBe(false);
  });

  it('dogru imzali webhook kabul edilir', () => {
    const body = JSON.stringify({ providerRef: 'mock_x', outcome: 'clear' });
    const sig = createHmac('sha256', 'test-secret').update(body).digest('hex');
    expect(provider.verifyWebhook(body, sig)).toBe(true);
    expect(provider.parseWebhook(body).outcome).toBe('clear');
  });
});

describe('saglayici secimi', () => {
  it('anahtar yoksa gelistirmede sahte saglayici', () => {
    const p = createScreeningProvider({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
    expect(p.name).toBe('mock');
  });

  it('URETIMDE anahtarsiz calismayi REDDEDER', () => {
    expect(() => createScreeningProvider({ NODE_ENV: 'production' } as NodeJS.ProcessEnv))
      .toThrow(/CERTN_API_KEY/);
  });

  it('anahtar varsa gercek saglayici', () => {
    const p = createScreeningProvider({
      CERTN_API_KEY: 'k', CERTN_WEBHOOK_SECRET: 's',
    } as NodeJS.ProcessEnv);
    expect(p.name).toBe('certn');
  });
});

describe('saglayici secimi', () => {
  const base = { NODE_ENV: 'production' } as NodeJS.ProcessEnv;

  it('uretimde anahtar yoksa ACILISTA durur', () => {
    expect(() => createScreeningProvider({ ...base })).toThrow(/CERTN_API_KEY/);
  });

  it('DEMO yayininda sahte saglayiciya izin verilir', () => {
    const p = createScreeningProvider({ ...base, DEMO_MODE: '1' });
    expect(p).toBeInstanceOf(MockScreeningProvider);
  });

  it('Vercel onizlemesi de demo sayilir', () => {
    const p = createScreeningProvider({ ...base, VERCEL_ENV: 'preview' });
    expect(p).toBeInstanceOf(MockScreeningProvider);
  });

  it('DEMO_MODE=0 onizlemede bile kurali geri getirir', () => {
    expect(() => createScreeningProvider({ ...base, VERCEL_ENV: 'preview', DEMO_MODE: '0' }))
      .toThrow(/CERTN_API_KEY/);
  });

  it('anahtar varsa demo bayragi bir sey degistirmez — GERCEK saglayici', () => {
    const p = createScreeningProvider({
      ...base, DEMO_MODE: '1', CERTN_API_KEY: 'k', CERTN_WEBHOOK_SECRET: 's',
    });
    expect(p).toBeInstanceOf(CertnScreeningProvider);
  });
});
