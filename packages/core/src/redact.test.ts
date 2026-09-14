import { describe, it, expect } from 'vitest';
import { redactContact, hasContactInfo } from './redact.js';

/**
 * MASKELEME TESTLERI.
 *
 * Once YANLIS MASKELEME testleri geliyor, sonra dogru maskeleme. Sira
 * bilincli: bu ozelligin tehlikesi kacirmak degil, fazla yakalamak.
 * Fiyatini, tarihini, kopeginin yasini maskeleyen bir sistem insanlari
 * normal konusmaktan alikoyar.
 */

describe('MASKELENMEMESI gerekenler', () => {
  const safe = [
    'Gecesi $55.00, toplam $165.00 tutuyor.',
    'Tarihler 2026-09-14 ile 2026-09-17 arasi.',
    'Luna 7 yasinda ve 22 kg.',
    'Sabah 8 ve aksam 19:30 mama veriyoruz.',
    'Adres Leslieville, posta kodu M5V 2T6.',
    'Iki kopek, 3 gece, 1 kedi.',
    'Fiyat 1,234.56 CAD.',
    'Kapi kodu 4821 (dort hane).',
    'Asi karti 2025 yilinda yenilendi.',
    '15% indirim uyguladim.',
  ];

  it.each(safe)('dokunmuyor: %s', (line) => {
    const out = redactContact(line);
    expect(out.text).toBe(line);
    expect(out.count).toBe(0);
  });
});

describe('E-POSTA maskeleniyor', () => {
  it('duz adres', () => {
    const out = redactContact('Bana ali@ornek.com adresinden yazin');
    expect(out.text).not.toContain('ali@ornek.com');
    expect(out.kinds).toContain('email');
    expect(out.count).toBe(1);
  });

  it('nokta ve rakam iceren adres tek parca maskeleniyor', () => {
    const out = redactContact('adres: kisi.55.1234@mail.co.uk sonra yazariz');
    expect(out.text).not.toMatch(/kisi|mail\.co\.uk/);
    expect(out.count).toBe(1);
  });

  it('aksanli harfli adres', () => {
    const out = redactContact('chloé.gagnon@exemple.qc.ca yazabilirsiniz');
    expect(out.text).not.toContain('chloé');
    expect(out.count).toBe(1);
  });
});

describe('TELEFON maskeleniyor', () => {
  const phones = [
    '416-555-1234',
    '(416) 555-1234',
    '416.555.1234',
    '4165551234',
    '+1 416 555 1234',
    '+14165551234',
  ];

  it.each(phones)('yakaliyor: %s', (p) => {
    const out = redactContact(`Beni ${p} numarasindan arayin`);
    expect(out.text).not.toContain(p.replace(/\D/g, '').slice(-4));
    expect(out.kinds).toContain('phone');
  });

  it('dokuz haneli bir sayi telefon SAYILMIYOR', () => {
    const line = 'Referans numarasi 123456789 olarak gecti';
    expect(redactContact(line).text).toBe(line);
  });
});

describe('UZUN RAKAM DIZISI (hesap/kart) maskeleniyor', () => {
  it('16 haneli kart benzeri dizi', () => {
    const out = redactContact('Karta gonderin: 4539148803436467');
    expect(out.text).not.toContain('4539148803436467');
    expect(out.kinds).toContain('payment');
  });

  it('on haneli bir sayi TELEFON olarak isaretlenir, hesap degil', () => {
    const out = redactContact('4165551234');
    expect(out.kinds).toEqual(['phone']);
  });
});

describe('gercek mesajlar', () => {
  it('platform disina cikma denemesi', () => {
    const out = redactContact(
      'Merhaba! Havre uzerinden olmasa daha ucuz olur, bana 416-555-1234 ' +
      'yazin ya da ali@ornek.com adresine e-Transfer gonderin.',
    );
    expect(out.count).toBe(2);
    expect(out.kinds).toEqual(expect.arrayContaining(['phone', 'email']));
    // "e-Transfer" kelimesi DURUYOR: soru mesru, cevabi "hayir" olmali
    expect(out.text).toContain('e-Transfer');
    expect(out.text).toContain('Havre uzerinden');
  });

  it('siradan bir bakim mesajina hic dokunmuyor', () => {
    const line =
      'Luna 7 yasinda, gunde 2 ogun yiyor. 14 Eylul saat 9:00 gibi ' +
      'birakabilirim, gecesi $55 diye anlasmistik degil mi?';
    const out = redactContact(line);
    expect(out.text).toBe(line);
    expect(hasContactInfo(line)).toBe(false);
  });
});

describe('hasContactInfo', () => {
  it('temiz metin icin false', () => {
    expect(hasContactInfo('Yarin 10 gibi gelsem olur mu?')).toBe(false);
  });
  it('iletisim bilgisi varsa true', () => {
    expect(hasContactInfo('numaram 416 555 1234')).toBe(true);
  });
});
