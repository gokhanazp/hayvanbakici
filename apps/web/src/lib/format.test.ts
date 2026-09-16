import { describe, it, expect } from 'vitest';
import { dateRangeFmt, daysUntil, relativeDay } from './format';

/**
 * REZERVASYON TARIHI.
 *
 * Kart bugune kadar dateFmt kullaniyordu ve o AY VE YIL veriyor:
 * ekranda "Kasim 2026 – Kasim 2026" yaziyordu. Sahibin listeye bakma
 * sebebi "hangi gun" sorusu ve kart ona cevap vermiyordu.
 */
const D = (d: string) => `${d}T15:00:00Z`;

describe('tarih araligi', () => {
  it('GUN gosteriyor — ay/yil degil', () => {
    const s = dateRangeFmt(D('2026-11-02'), D('2026-11-04'), 'en-CA');
    expect(s).toContain('2');
    expect(s).toContain('4');
    expect(s).toContain('2026');
    /* Eski hata: iki kez ay adi ve hic gun yok. */
    expect(s).not.toBe('November 2026 – November 2026');
  });

  it('AYNI AY ise ay ve yil TEKRAR ETMIYOR', () => {
    expect(dateRangeFmt(D('2026-11-02'), D('2026-11-04'), 'en-CA')).toBe('Nov 2–4, 2026');
  });

  it('AY SIRASI DILE GORE — elle birlestirme bir dilde yanlis olurdu', () => {
    // Ingilizce'de ay gunden once, Fransizca'da sonra.
    expect(dateRangeFmt(D('2026-11-02'), D('2026-11-04'), 'en-CA')).toMatch(/^Nov/);
    expect(dateRangeFmt(D('2026-11-02'), D('2026-11-04'), 'fr-CA')).toMatch(/^2/);
  });

  it('AY SINIRI asan aralik iki ayi da yaziyor', () => {
    const s = dateRangeFmt(D('2026-10-29'), D('2026-11-02'), 'en-CA');
    expect(s).toContain('Oct');
    expect(s).toContain('Nov');
  });

  it('YIL SINIRI asan aralik iki yili da yaziyor', () => {
    const s = dateRangeFmt(D('2026-12-30'), D('2027-01-02'), 'en-CA');
    expect(s).toContain('2026');
    expect(s).toContain('2027');
  });

  it('TEK GUN tek tarihe iniyor — "1 Agu – 1 Agu" gibi bir sey yazmiyor', () => {
    expect(dateRangeFmt(D('2026-08-01'), D('2026-08-01'), 'en-CA')).toBe('Aug 1, 2026');
  });

  it('SAAT DILIMI UTC: aksam saatli bir tarih bir onceki gune kaymiyor', () => {
    // 22:00 UTC — sunucu Toronto saatinde olsaydi 18:00 ve ayni gun,
    // ama Auckland'da ertesi gun olurdu. Sabit UTC ikisinde de ayni.
    expect(dateRangeFmt('2026-08-01T22:00:00Z', '2026-08-01T23:00:00Z', 'en-CA'))
      .toBe('Aug 1, 2026');
  });

  it('bozuk tarih bos dize doner, patlamaz', () => {
    expect(dateRangeFmt('', '2026-08-01', 'en-CA')).toBe('');
    expect(dateRangeFmt('elma', 'armut', 'en-CA')).toBe('');
  });
});

describe('yakinlik', () => {
  const now = new Date('2026-09-16T10:00:00Z');

  it('bugun / yarin kelimeyle', () => {
    expect(relativeDay('2026-09-16T22:00:00Z', 'en-CA', now)).toBe('today');
    expect(relativeDay('2026-09-17T02:00:00Z', 'en-CA', now)).toBe('tomorrow');
    expect(relativeDay('2026-09-17T02:00:00Z', 'fr-CA', now)).toBe('demain');
  });

  it('SAAT farki degil GUN farki', () => {
    /* Yirmi saat sonrasi "0 gun" degil: gece yarisini gectiyse yarin. */
    expect(daysUntil('2026-09-17T06:00:00Z', now)).toBe(1);
    expect(daysUntil('2026-09-16T23:59:00Z', now)).toBe(0);
  });

  it('uzak tarih sayiyla', () => {
    expect(relativeDay('2026-09-28T15:00:00Z', 'en-CA', now)).toContain('12');
  });

  it('GECMIS null — bu yardimci yalnizca yaklasan seyler icin', () => {
    expect(relativeDay('2026-09-15T15:00:00Z', 'en-CA', now)).toBeNull();
    expect(daysUntil('2026-09-14T15:00:00Z', now)).toBe(-2);
  });

  it('bozuk tarih null', () => {
    expect(daysUntil('elma', now)).toBeNull();
    expect(relativeDay('', 'en-CA', now)).toBeNull();
  });
});
