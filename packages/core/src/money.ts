/**
 * Para birimi islemleri — HER ZAMAN tam sayi cent.
 * Kayan nokta ile para hesaplanmaz.
 */

export type Cents = number;
export const CURRENCY = 'CAD' as const;

export function assertCents(v: number, label = 'value'): asserts v is Cents {
  if (!Number.isInteger(v)) throw new TypeError(`${label} tam sayi cent olmali, alindi: ${v}`);
  if (v < 0) throw new RangeError(`${label} negatif olamaz: ${v}`);
}

/** Yuzde uygular ve en yakin cent'e yuvarlar. pct: 0-100 arasi ondalik olabilir. */
export function applyPct(amount: Cents, pct: number): Cents {
  assertCents(amount, 'amount');
  if (pct < 0 || pct > 100) throw new RangeError(`Yuzde 0-100 arasinda olmali: ${pct}`);
  return Math.round((amount * pct) / 100);
}

/** Ust sinir uygular. */
export function cap(amount: Cents, maxAmount: Cents): Cents {
  return Math.min(amount, maxAmount);
}

export function sum(...amounts: Cents[]): Cents {
  return amounts.reduce((a, b) => a + b, 0);
}

/** Kullaniciya gosterim. Bill 96: FR'de ondalik ayirici virgul ve simge sonda. */
export function formatMoney(cents: Cents, locale: 'en-CA' | 'fr-CA' = 'en-CA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: CURRENCY,
    currencyDisplay: 'narrowSymbol',
  }).format(cents / 100);
}

export const dollars = (d: number): Cents => Math.round(d * 100);
