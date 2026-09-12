/**
 * Kanada GST/HST/QST — platformun KENDI hizmeti (komisyon + musteri ucreti) uzerinden.
 *
 * ONEMLI MIMARI NOTU (yol haritasi §8.4):
 * Platform ACENTE (agent) olarak konumlanir; bakicinin hizmetinin GST/HST'si
 * bakicinin kendi sorumlulugudur (kendi cirosu 30.000 CAD esigini asarsa).
 * Bu nedenle vergi yalnizca platformun ucretlerine uygulanir.
 *
 * DOGRULAT: Oranlar ve "acente vs asil" konumlandirmasi Kanadali GST/HST uzmani
 * CPA tarafindan teyit edilmelidir. NS orani 1 Nis 2025'te %15 -> %14 indirildi.
 */
import { applyPct, type Cents } from './money.js';

export type ProvinceCode =
  | 'AB' | 'BC' | 'MB' | 'NB' | 'NL' | 'NS' | 'NT' | 'NU' | 'ON' | 'PE' | 'QC' | 'SK' | 'YT';

export interface TaxRate {
  /** Toplam yuzde — platform hizmetine uygulanan */
  readonly total: number;
  readonly label: string;
  readonly components: ReadonlyArray<{ name: string; pct: number }>;
}

/** 2026 oranlari — DOGRULAT (CPA) */
export const TAX_RATES: Readonly<Record<ProvinceCode, TaxRate>> = {
  ON: { total: 13,     label: 'HST',       components: [{ name: 'HST', pct: 13 }] },
  NB: { total: 15,     label: 'HST',       components: [{ name: 'HST', pct: 15 }] },
  NL: { total: 15,     label: 'HST',       components: [{ name: 'HST', pct: 15 }] },
  PE: { total: 15,     label: 'HST',       components: [{ name: 'HST', pct: 15 }] },
  NS: { total: 14,     label: 'HST',       components: [{ name: 'HST', pct: 14 }] },
  QC: { total: 14.975, label: 'GST + QST', components: [{ name: 'GST', pct: 5 }, { name: 'QST', pct: 9.975 }] },
  BC: { total: 5,      label: 'GST',       components: [{ name: 'GST', pct: 5 }] },
  AB: { total: 5,      label: 'GST',       components: [{ name: 'GST', pct: 5 }] },
  SK: { total: 5,      label: 'GST',       components: [{ name: 'GST', pct: 5 }] },
  MB: { total: 5,      label: 'GST',       components: [{ name: 'GST', pct: 5 }] },
  NT: { total: 5,      label: 'GST',       components: [{ name: 'GST', pct: 5 }] },
  NU: { total: 5,      label: 'GST',       components: [{ name: 'GST', pct: 5 }] },
  YT: { total: 5,      label: 'GST',       components: [{ name: 'GST', pct: 5 }] },
};

export function taxRateFor(province: ProvinceCode): TaxRate {
  const rate = TAX_RATES[province];
  if (!rate) throw new RangeError(`Bilinmeyen eyalet kodu: ${province}`);
  return rate;
}

/** Verilen tutar uzerinden vergi hesaplar (vergi haric tutar beklenir). */
export function taxOn(amount: Cents, province: ProvinceCode): Cents {
  return applyPct(amount, taxRateFor(province).total);
}
