import { describe, it, expect } from 'vitest';
import {
  calculateCommission,
  resolveAttribution,
  compareToRover,
  DEFAULT_COMMISSION,
  resolveCommissionConfig,
  validateCommissionSettings,
  validateCampaign,
} from './commission.js';
import { dollars } from './money.js';

describe('resolveAttribution', () => {
  it('bakici davetiyle gelen musteri her zaman sitter_referral', () => {
    expect(resolveAttribution({ viaSitterReferral: true, previousCompletedBookings: 0 }))
      .toBe('sitter_referral');
  });

  it('attribution KALICI: bakicinin getirdigi musteri tekrarda da sitter_referral kalir', () => {
    // Rover'in "her yeni musteride %30'a reset" mantiginin tam tersi
    expect(resolveAttribution({ viaSitterReferral: true, previousCompletedBookings: 5 }))
      .toBe('sitter_referral');
  });

  it('platformdan gelen ilk rezervasyon platform', () => {
    expect(resolveAttribution({ viaSitterReferral: false, previousCompletedBookings: 0 }))
      .toBe('platform');
  });

  it('platformdan gelen ikinci rezervasyon repeat', () => {
    expect(resolveAttribution({ viaSitterReferral: false, previousCompletedBookings: 1 }))
      .toBe('repeat');
  });
});

describe('calculateCommission', () => {
  const subtotal = dollars(500);

  it('platform attribution: bakicidan %18', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    expect(r.sitterPct).toBe(18);
    expect(r.sitterCommissionCents).toBe(dollars(90));
  });

  it('sitter_referral: bakicidan %0 — stratejinin kalbi', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'sitter_referral' });
    expect(r.sitterPct).toBe(0);
    expect(r.sitterCommissionCents).toBe(0);
  });

  it('repeat: bakicidan %10', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'repeat' });
    expect(r.sitterCommissionCents).toBe(dollars(50));
  });

  it('musteri ucreti %7', () => {
    const r = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    expect(r.ownerFeeCents).toBe(dollars(35));
    expect(r.ownerFeeCapped).toBe(false);
  });

  it('musteri ucreti CA$45 ust siniriyla kesilir', () => {
    const big = dollars(2000); // %7 = $140 -> cap $45
    const r = calculateCommission({ subtotalCents: big, attribution: 'platform' });
    expect(r.ownerFeeCents).toBe(DEFAULT_COMMISSION.ownerFeeCapCents);
    expect(r.ownerFeeCapped).toBe(true);
  });

  it('lansman promosyonu bakici komisyonunu sifirlar ama musteri ucretini etkilemez', () => {
    const r = calculateCommission({
      subtotalCents: subtotal,
      attribution: 'platform',
      promoActive: true,
    });
    expect(r.sitterCommissionCents).toBe(0);
    expect(r.ownerFeeCents).toBe(dollars(35));
    expect(r.promoApplied).toBe(true);
    expect(r.explanationKey).toBe('commission.promo');
  });

  it('cent yuvarlamasi tam sayi kalir', () => {
    const r = calculateCommission({ subtotalCents: 3333, attribution: 'platform' });
    expect(Number.isInteger(r.sitterCommissionCents)).toBe(true);
    expect(Number.isInteger(r.ownerFeeCents)).toBe(true);
  });
});

describe('compareToRover — pazarlama iddialarinin dogrulugu', () => {
  const subtotal = dollars(500);

  it('platform attribution bile Rover standarttan ucuz', () => {
    const ours = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    const c = compareToRover(subtotal, ours, 'standard');
    // Bizim: $90 + $35 = $125 | Rover: $100 + $55 = $155
    expect(c.ourTakeCents).toBe(dollars(125));
    expect(c.roverTakeCents).toBe(dollars(155));
    expect(c.sitterSavesCents).toBe(dollars(10));
    expect(c.ownerSavesCents).toBe(dollars(20));
  });

  it('sitter_referral vs Rover Tier 1: bakici $150 kazanir', () => {
    const ours = calculateCommission({ subtotalCents: subtotal, attribution: 'sitter_referral' });
    const c = compareToRover(subtotal, ours, 'tier1');
    // Rover Tier 1 bakicidan %30 = $150; biz $0
    expect(c.sitterSavesCents).toBe(dollars(150));
  });

  it('Rover Tier 1 toplam take rate ~%41', () => {
    const ours = calculateCommission({ subtotalCents: subtotal, attribution: 'platform' });
    const c = compareToRover(subtotal, ours, 'tier1');
    const roverRate = (c.roverTakeCents / subtotal) * 100;
    expect(roverRate).toBeCloseTo(41, 0);
  });
});

/* ------------------------------------------------------------------
   KAMPANYA.

   En kritik iki davranis: kampanya YALNIZCA indirir, ve gecmise
   donmez. Ikincisi burada dogrudan test edilemiyor (rezervasyon
   satirina yaziliyor) ama birincisi buranin isi.
   ------------------------------------------------------------------ */
describe('kampanya cozumleme', () => {
  const base = DEFAULT_COMMISSION;
  const campaign = {
    name: 'Kis indirimi',
    sitterPct: { platform: 10 },
    startsAt: '2026-12-01T00:00:00.000Z',
    endsAt: '2027-02-01T00:00:00.000Z',
  };

  it('pencere disinda taban oran gecerli', () => {
    const before = resolveCommissionConfig(base, campaign, new Date('2026-11-30T23:59:59Z'));
    expect(before.config.sitterPct.platform).toBe(18);
    expect(before.campaignName).toBeNull();

    const after = resolveCommissionConfig(base, campaign, new Date('2027-02-01T00:00:00Z'));
    expect(after.config.sitterPct.platform).toBe(18);
    expect(after.campaignName).toBeNull();
  });

  it('pencere icinde kampanya orani gecerli', () => {
    const r = resolveCommissionConfig(base, campaign, new Date('2026-12-15T12:00:00Z'));
    expect(r.config.sitterPct.platform).toBe(10);
    expect(r.campaignName).toBe('Kis indirimi');
    expect(r.campaignEndsAt).toBe(campaign.endsAt);
  });

  it('baslangic ani DAHIL, bitis ani HARIC', () => {
    expect(resolveCommissionConfig(base, campaign, new Date(campaign.startsAt)).campaignName)
      .toBe('Kis indirimi');
    expect(resolveCommissionConfig(base, campaign, new Date(campaign.endsAt)).campaignName)
      .toBeNull();
  });

  it('verilmeyen attribution tabanda kalir', () => {
    const r = resolveCommissionConfig(base, campaign, new Date('2026-12-15T12:00:00Z'));
    expect(r.config.sitterPct.repeat).toBe(10);
    expect(r.config.sitterPct.sitter_referral).toBe(0);
  });

  it('KAMPANYA KOMISYONU ARTIRAMAZ — tabandan yuksek oran yok sayilir', () => {
    const zam = { ...campaign, sitterPct: { platform: 25 } };
    const r = resolveCommissionConfig(base, zam, new Date('2026-12-15T12:00:00Z'));
    expect(r.config.sitterPct.platform).toBe(18);
    // Hicbir sey dusmediyse "kampanya var" da denmiyor
    expect(r.campaignName).toBeNull();
  });

  it('musteri ucreti ve ust siniri kampanyadan ETKILENMEZ', () => {
    const r = resolveCommissionConfig(base, campaign, new Date('2026-12-15T12:00:00Z'));
    expect(r.config.ownerPct).toBe(base.ownerPct);
    expect(r.config.ownerFeeCapCents).toBe(base.ownerFeeCapCents);
  });

  it('cozumlenen yapilandirma hesaba gercekten giriyor', () => {
    const r = resolveCommissionConfig(base, campaign, new Date('2026-12-15T12:00:00Z'));
    const withCampaign = calculateCommission({
      subtotalCents: dollars(100), attribution: 'platform', config: r.config,
    });
    const withoutCampaign = calculateCommission({
      subtotalCents: dollars(100), attribution: 'platform', config: base,
    });
    expect(withCampaign.sitterCommissionCents).toBe(dollars(10));
    expect(withoutCampaign.sitterCommissionCents).toBe(dollars(18));
  });
});

describe('taban oran dogrulamasi', () => {
  const ok = {
    sitterPct: { platform: 18, repeat: 10, sitter_referral: 0 },
    ownerPct: 7,
    ownerFeeCapCents: dollars(45),
    launchPromoMonths: 12,
  };

  it('gecerli ayarlari kabul eder', () => {
    expect(validateCommissionSettings(ok)).toEqual({});
  });

  /*
    Yayinlanan sayfalarda "Rover %20, biz %18" yaziyor. Paneldeki bir
    yazim hatasi (%180) hem o sayfayi sacmalatir hem de o an rezervasyon
    yapan bakicinin kazancindan gercekten kesilir.
  */
  it('ucuk orani reddeder', () => {
    expect(validateCommissionSettings({ ...ok, sitterPct: { ...ok.sitterPct, platform: 180 } })['sitterPct.platform'])
      .toBe('error.pctRange');
    expect(validateCommissionSettings({ ...ok, ownerPct: 60 }).ownerPct).toBe('error.pctRange');
    expect(validateCommissionSettings({ ...ok, ownerFeeCapCents: dollars(5000) }).ownerFeeCapCents)
      .toBe('error.capRange');
  });

  it('negatif oran reddedilir', () => {
    expect(validateCommissionSettings({ ...ok, sitterPct: { ...ok.sitterPct, repeat: -1 } })['sitterPct.repeat'])
      .toBe('error.pctRange');
  });

  it('sifir komisyon GECERLI — bakicinin kendi musterisi zaten %0', () => {
    expect(validateCommissionSettings({ ...ok, sitterPct: { platform: 0, repeat: 0, sitter_referral: 0 } }))
      .toEqual({});
  });
});

describe('kampanya dogrulamasi', () => {
  const base = DEFAULT_COMMISSION;
  const ok = {
    name: 'Kis',
    sitterPct: { platform: 10 },
    startsAt: '2026-12-01T00:00:00.000Z',
    endsAt: '2027-02-01T00:00:00.000Z',
  };

  it('gecerli kampanyayi kabul eder', () => {
    expect(validateCampaign(ok, base)).toEqual({});
  });

  it('bitis baslangictan once olamaz', () => {
    expect(validateCampaign({ ...ok, endsAt: '2026-11-01T00:00:00.000Z' }, base).endsAt)
      .toBe('error.endBeforeStart');
  });

  /*
    INDIRIM OLMAYAN KAMPANYA KAYDEDILMEZ. Sessizce etkisiz kalan bir
    kampanya, yoneticinin "indirim yaptim" sanmasi demek.
  */
  it('tabandan yuksek oran reddedilir', () => {
    const e = validateCampaign({ ...ok, sitterPct: { platform: 25 } }, base);
    expect(e['campaignPct.platform']).toBe('error.notLower');
  });

  it('hicbir oran dusmuyorsa reddedilir', () => {
    const e = validateCampaign({ ...ok, sitterPct: {} }, base);
    expect(e.sitterPct).toBe('error.noDiscount');
  });

  it('adi olmayan kampanya reddedilir', () => {
    expect(validateCampaign({ ...ok, name: ' ' }, base).name).toBe('error.required');
  });
});
