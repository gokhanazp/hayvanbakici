import { formatMoney } from '@havre/core';
import type { Locale } from '@havre/i18n';

export function money(cents: number, locale: Locale): string {
  return formatMoney(cents, locale);
}

export function responseTime(minutes: number, locale: Locale): string {
  if (minutes < 60) return locale === 'fr-CA' ? `${minutes} min` : `${minutes} min`;
  const h = Math.round(minutes / 60);
  return locale === 'fr-CA' ? `${h} h` : `${h} hr`;
}

export function numberFmt(n: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function dateFmt(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(new Date(iso));
}
