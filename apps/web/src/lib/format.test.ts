import { describe, it, expect } from 'vitest';
import { dateRangeFmt } from './format';

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
