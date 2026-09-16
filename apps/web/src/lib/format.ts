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

/**
 * TARIH ARALIGI — "Nov 2 – 4, 2026" / "2 – 4 nov. 2026".
 *
 * Rezervasyon karti bugune kadar dateFmt kullaniyordu ve dateFmt AY VE
 * YIL veriyor: kartta "Kasim 2026 – Kasim 2026" yaziyordu. Sahibin
 * karta bakma sebebi tam olarak "hangi gun" sorusuydu ve kart ona
 * cevap vermiyordu (tarayicida yakalandi).
 *
 * formatRange KULLANILIYOR, iki tarihi elle birlestirmiyoruz. Ilk
 * denemede "gun–tamTarih" diye birlestirdim ve Ingilizce'de
 * "2–Nov 4, 2026" cikti: ay adi gunden ONCE geliyor, dolayisiyla elle
 * kurulan her sira bir dilde dogru bir dilde yanlis oluyor. formatRange
 * ortak parcayi (ay, yil) tekrar etmeden dogru sirayla yaziyor ve tek
 * gunluk araligi tek tarihe indiriyor.
 *
 * UTC sabit: rezervasyon tarihleri gun olarak anlamli ve sayfa
 * sunucuda ciziliyor — sunucunun saat dilimi bir gun kaydirabilirdi.
 */
export function dateRangeFmt(startIso: string, endIso: string, locale: Locale): string {
  const a = new Date(startIso);
  const b = new Date(endIso);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return '';

  const fmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
  /* formatRange her ortamda yok; yoksa iki tarihi tire ile yaziyoruz. */
  return typeof fmt.formatRange === 'function'
    ? fmt.formatRange(a, b)
    : `${fmt.format(a)} – ${fmt.format(b)}`;
}

/**
 * "12 gun sonra" / "yarin" / "bugun".
 *
 * Hesap ozetinde bir tarihin KENDISI yeterli bilgi degil: "12-15 Eki"
 * yazan bir satira bakan kisi once bugunun kacinci oldugunu
 * hatirlamaya calisiyor. Yakinlik, tarihin yaninda duran ikinci bir
 * bilgi.
 *
 * GUN FARKI, saat farki DEGIL: iki tarih arasinda 20 saat varsa bu
 * "0 gun" degil, duruma gore "bugun" ya da "yarin". Ikisi de UTC gun
 * basina yuvarlaniyor — sunucu saat dilimi sonucu kaydirmasin.
 *
 * GECMIS icin null doner: "3 gun once" bir uyari degil, ve bu yardimci
 * yalnizca yaklasan seyler icin kullaniliyor.
 */
export function daysUntil(iso: string, now: Date = new Date()): number | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const day = (d: number) => Math.floor(d / 86_400_000);
  return day(t) - day(now.getTime());
}

export function relativeDay(iso: string, locale: Locale, now: Date = new Date()): string | null {
  const d = daysUntil(iso, now);
  if (d === null || d < 0) return null;
  const m = locale === 'fr-CA';
  if (d === 0) return m ? 'aujourd\u2019hui' : 'today';
  if (d === 1) return m ? 'demain' : 'tomorrow';
  /*
    Intl.RelativeTimeFormat: "in 12 days" / "dans 12 jours" — cevirisi
    tarayicidan geliyor, bizim ceviri dosyamizda cogul kurallarini elle
    yazmamiza gerek kalmiyor.
  */
  return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(d, 'day');
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
