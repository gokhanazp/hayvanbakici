import type { ProvinceCode } from './taxes.js';

/**
 * KANADA RESMI TATILLERI — tatil ek ucretinin DAYANAGI.
 *
 * NEDEN VAR: bakici "tatillerde %20 fazla" diyebiliyor ve profilinde de
 * boyle yaziyor. Hesap motoru ise bu yuzdeyi HER rezervasyona
 * uyguluyordu — subatta sira bir salinin fiyati da %20 artiyordu. Ekranda
 * yazan cumle ile kesilen tutar ayni olmali; aksi halde soz yalan olur.
 *
 * KAPSAM: federal tatiller + eyalete ozgu olanlardan talebi gercekten
 * degistirenler. Her eyaletin her tatili DEGIL — ve bu bilincli bir
 * sadelestirme, sayfada da boyle anlatiliyor. Eksik bir tatil, bakicinin
 * o gun icin zam alamamasi demek; fazladan bir tatil ise sahibin
 * beklemedigi bir ucret odemesi demek. Ikincisi daha kotu, o yuzden liste
 * DAR tutuldu: yalnizca tartismasiz olanlar.
 *
 * Tarihler UTC gun bazinda hesaplaniyor — rezervasyon tarihleri de
 * (YYYY-AA-GG) oyle saklaniyor.
 */

/** Paskalya Pazari (Gregoryen) — Good Friday bundan iki gun once. */
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const mth = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * mth + 114) / 31);
  const day = ((h + l - 7 * mth + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Ayin n'inci belirli haftagunu — "eylulun ilk pazartesi" gibi. */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(Date.UTC(year, month, 1));
  const shift = (weekday - first.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(year, month, 1 + shift + (n - 1) * 7));
}

/** 25 Mayis'tan ONCEKI pazartesi — Victoria Day / Journee des patriotes. */
function mondayBeforeMay25(year: number): Date {
  const may25 = new Date(Date.UTC(year, 4, 25));
  const back = (may25.getUTCDay() + 6) % 7 || 7;
  return new Date(Date.UTC(year, 4, 25 - back));
}

const iso = (d: Date): string => d.toISOString().slice(0, 10);

/** Eyalete ozgu tatiller — listede OLMAYAN eyalet yalnizca ortak tatilleri alir. */
const PROVINCIAL: Partial<Record<ProvinceCode, (year: number) => string[]>> = {
  // Fete nationale — Quebec'te yilin en buyuk tatillerinden
  QC: (y) => [iso(new Date(Date.UTC(y, 5, 24)))],
  // Family Day — subatin ucuncu pazartesi
  ON: (y) => [iso(nthWeekday(y, 1, 1, 3)), iso(new Date(Date.UTC(y, 11, 26)))],
  BC: (y) => [iso(nthWeekday(y, 1, 1, 3)), iso(new Date(Date.UTC(y, 8, 30)))],
  AB: (y) => [iso(nthWeekday(y, 1, 1, 3))],
};

/** Bir yilin tatil gunleri (YYYY-AA-GG), eyalete gore. */
export function holidaysIn(year: number, province: ProvinceCode): ReadonlySet<string> {
  const good = new Date(easterSunday(year));
  good.setUTCDate(good.getUTCDate() - 2);

  const common = [
    iso(new Date(Date.UTC(year, 0, 1))),   // Yilbasi
    iso(good),                              // Good Friday
    iso(mondayBeforeMay25(year)),           // Victoria Day / patriotes
    iso(new Date(Date.UTC(year, 6, 1))),   // Canada Day
    iso(nthWeekday(year, 8, 1, 1)),        // Labour Day
    iso(nthWeekday(year, 9, 1, 2)),        // Thanksgiving
    iso(new Date(Date.UTC(year, 11, 25))), // Noel
  ];

  return new Set([...common, ...(PROVINCIAL[province]?.(year) ?? [])]);
}

export function isHoliday(date: string, province: ProvinceCode): boolean {
  const year = Number(date.slice(0, 4));
  if (!Number.isInteger(year)) return false;
  return holidaysIn(year, province).has(date);
}

/**
 * ARALIKTAKI TATIL BIRIMI SAYISI.
 *
 * GECE ile ZIYARET farkli sayilir: uc gecelik bir konaklamada 24, 25 ve
 * 26'nin GECELERI satiliyor, yani bitis gunu dahil DEGIL. Ziyaret ve
 * yuruyuste ise her gun bir birim, bitis gunu dahil. Bu, rezervasyon
 * sorgusundaki unitsBetween ile AYNI kural — iki yerde iki tanim olsa
 * gosterilen tutar ile kesilen tutar ayrisirdi.
 *
 * Tarih verilmemisse 0: ornek hesapta tatil zammi gorunmuyor ve
 * gorunmemeli de — hangi gunler oldugu belli degil.
 */
export function holidayUnitsBetween(
  startDate: string, endDate: string,
  unit: 'night' | 'visit' | 'walk' | 'day' | 'session',
  province: ProvinceCode,
): number {
  if (!startDate || !endDate) return 0;
  const a = Date.parse(`${startDate}T00:00:00Z`);
  const b = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;

  const days = Math.round((b - a) / 86_400_000);
  const count = unit === 'night' ? days : days + 1;
  if (count <= 0) return 0;

  // Uzun araliklarda yil degisebilir; her gun kendi yilinin listesine bakiyor.
  let hits = 0;
  for (let i = 0; i < count; i += 1) {
    const d = new Date(a + i * 86_400_000).toISOString().slice(0, 10);
    if (isHoliday(d, province)) hits += 1;
  }
  return hits;
}
