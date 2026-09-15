import { describe, it, expect } from 'vitest';
import { holidaysIn, isHoliday, holidayUnitsBetween } from './holidays.js';
import { calculateQuote } from './pricing.js';

/**
 * TATIL TAKVIMI.
 *
 * Buradaki tek soru, ekranda yazan cumlenin dogru olup olmadigi:
 * bakici "tatillerde %20 fazla" diyor ve profilinde de oyle yaziyor.
 * Motor bunu HER rezervasyona uyguluyordu — subatta sira bir salinin
 * fiyati da artiyordu.
 */
describe('tatil takvimi', () => {
  it('sabit tarihli tatilleri biliyor', () => {
    expect(isHoliday('2026-01-01', 'ON')).toBe(true);  // Yilbasi
    expect(isHoliday('2026-07-01', 'ON')).toBe(true);  // Canada Day
    expect(isHoliday('2026-12-25', 'ON')).toBe(true);  // Noel
  });

  it('siradan bir gun tatil DEGIL', () => {
    expect(isHoliday('2026-02-17', 'QC')).toBe(false);
    expect(isHoliday('2026-09-15', 'ON')).toBe(false);
  });

  it('Good Friday Paskalyadan iki gun once — 2026’da 3 Nisan', () => {
    expect(isHoliday('2026-04-03', 'ON')).toBe(true);
  });

  it('Labour Day eylulun ILK pazartesi', () => {
    // 2026: 7 Eylul Pazartesi
    expect(isHoliday('2026-09-07', 'ON')).toBe(true);
    expect(isHoliday('2026-09-14', 'ON')).toBe(false);
  });

  it('Victoria Day 25 Mayis’tan onceki pazartesi', () => {
    // 2026: 25 Mayis Pazartesi -> onceki pazartesi 18 Mayis
    expect(isHoliday('2026-05-18', 'ON')).toBe(true);
  });

  it('EYALETE OZGU tatil yalnizca o eyalette', () => {
    // Fete nationale: Quebec'te tatil, Ontario'da degil
    expect(isHoliday('2026-06-24', 'QC')).toBe(true);
    expect(isHoliday('2026-06-24', 'ON')).toBe(false);
    // Boxing Day: Ontario'da listede, Quebec'te degil
    expect(isHoliday('2026-12-26', 'ON')).toBe(true);
    expect(isHoliday('2026-12-26', 'QC')).toBe(false);
  });

  it('listede olmayan eyalet yalnizca ortak tatilleri alir', () => {
    const mb = holidaysIn(2026, 'MB');
    expect(mb.has('2026-12-25')).toBe(true);
    expect(mb.has('2026-06-24')).toBe(false);
  });
});

describe('araliktaki tatil birimi', () => {
  it('GECE: bitis gunu sayilmiyor', () => {
    // 24 -> 26 Aralik: 24 ve 25'in geceleri. 25 tatil, 26 degil (satilmiyor).
    expect(holidayUnitsBetween('2026-12-24', '2026-12-26', 'night', 'ON')).toBe(1);
  });

  it('ZIYARET: bitis gunu sayiliyor', () => {
    // 25 -> 26 Aralik: iki ziyaret, ikisi de tatil (ON)
    expect(holidayUnitsBetween('2026-12-25', '2026-12-26', 'visit', 'ON')).toBe(2);
  });

  it('tatile denk gelmeyen aralikta sifir', () => {
    expect(holidayUnitsBetween('2026-09-14', '2026-09-17', 'night', 'ON')).toBe(0);
  });

  it('yil siniri asan aralik iki yilin listesine de bakiyor', () => {
    // 31 Ara -> 2 Oca: 31'in ve 1'in geceleri; 1 Ocak tatil
    expect(holidayUnitsBetween('2026-12-31', '2027-01-02', 'night', 'ON')).toBe(1);
  });

  it('tarih yoksa ya da ters sirada ise sifir', () => {
    expect(holidayUnitsBetween('', '2026-12-25', 'night', 'ON')).toBe(0);
    expect(holidayUnitsBetween('2026-12-26', '2026-12-24', 'night', 'ON')).toBe(0);
  });
});

describe('tatil zammi hesaba nasil giriyor', () => {
  const base = {
    serviceType: 'boarding' as const,
    unitPriceCents: 5000,
    units: 4,
    petCount: 1,
    holidaySurchargePct: 20,
    attribution: 'platform' as const,
    province: 'ON' as const,
  };

  it('TARIH YOKSA zam YOK — eski davranis her rezervasyona uyguluyordu', () => {
    const q = calculateQuote(base);
    expect(q.lines.find((l) => l.key === 'quote.holidaySurcharge')).toBeUndefined();
    expect(q.subtotalCents).toBe(20_000);
  });

  it('yalnizca tatile denk gelen birimden aliniyor', () => {
    // Dort gecenin biri tatil: 5000 x 1 = 5000'in %20'si = 1000
    const q = calculateQuote({ ...base, holidayUnits: 1 });
    expect(q.lines.find((l) => l.key === 'quote.holidaySurcharge')?.amountCents).toBe(1000);
    expect(q.subtotalCents).toBe(21_000);
  });

  it('tum gunler tatilse tam yuzde uygulaniyor', () => {
    const q = calculateQuote({ ...base, holidayUnits: 4 });
    expect(q.lines.find((l) => l.key === 'quote.holidaySurcharge')?.amountCents).toBe(4000);
  });

  it('birim sayisindan fazla tatil verilse bile tavan birim sayisi', () => {
    const q = calculateQuote({ ...base, holidayUnits: 99 });
    expect(q.lines.find((l) => l.key === 'quote.holidaySurcharge')?.amountCents).toBe(4000);
  });

  it('DOKUMDEKI KALEMLER TOPLAMI ara toplama esit — gizli kalem yok', () => {
    const q = calculateQuote({ ...base, holidayUnits: 2, petCount: 2, extraPetPriceCents: 1000 });
    const ownerLines = q.lines
      .filter((l) => l.side === 'owner' && l.key !== 'quote.serviceFee')
      .reduce((sum, l) => sum + l.amountCents, 0);
    expect(ownerLines).toBe(q.subtotalCents);
  });
});
