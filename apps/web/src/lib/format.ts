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

/** Gun hassasiyeti — yonetici listelerinde "Eylul 2026" yeterli degil. */
export function dayFmt(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

/**
 * YONETICI TABLOLARINDA tarih: Kanada'da her iki dilde de 2026-09-14.
 *
 * Ay adi kullanmiyoruz. Sutun tabular-nums ile hizalaniyor; "Sep 14, 2026"
 * gibi bir metinde rakamlarin sabit genisligi virgulden once bosluk
 * biraktigi icin "Sep 14 , 2026" gibi gorunuyordu.
 *
 * Saat dilimi UTC'ye sabit: bu sayfalar sunucuda cizilir, sunucunun yerel
 * saati neyse o gorunurdu. Hangi saat oldugu tartisilirsa cevabi olsun.
 */
export function dayNumFmt(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeZone: 'UTC' })
    .format(new Date(iso));
}

/** Denetim kaydi icin tarih + saat, acikca UTC. */
export function stampFmt(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeZone: 'UTC' }).format(d);
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  }).format(d);
  return `${day} ${time} UTC`;
}

/**
 * SOHBET LISTESINDEKI ZAMAN.
 *
 * "Eylul 2026" bugun gelen bir mesaj icin yanlis bir cevap: listeye
 * bakan kisi "ne zaman yazdi" diye soruyor, "hangi ay" diye degil.
 * Bugunse saat, bu haftaysa gun adi, daha eskiyse kisa tarih.
 */
export function chatStamp(iso: string, locale: Locale): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(d);
  }
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days < 7) return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d);
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(d);
}
