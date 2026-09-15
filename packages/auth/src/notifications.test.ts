import { describe, it, expect } from 'vitest';
import {
  newRequestEmail, requestAcceptedEmail, requestDeclinedEmail,
  bookingCancelledEmail, newMessageEmail,
} from './notifications.js';

/**
 * BILDIRIM E-POSTALARI.
 *
 * Verilen sozler:
 *  - iki dilde de gercek metin var, Ingilizce'ye dusmuyor (Bill 96)
 *  - takip pikseli ve uzak gorsel YOK (Law 25)
 *  - mesajin ICERIGI e-postaya girmiyor
 *  - "kabul edildi" e-postasi odeme alindigini ima etmiyor
 */
const booking = {
  to: 'sitter@havre-test.ca',
  locale: 'en-CA' as const,
  counterpartName: 'Chloé',
  serviceLabel: 'Dog boarding',
  dates: '12 – 15 Oct 2026',
  url: 'https://havre.ca/en/account/bookings/abc/',
};

describe('bildirim e-postalari', () => {
  it('konu, govde ve dugme dolu; alici ayarli', () => {
    const e = newRequestEmail(booking, 36);
    expect(e.to).toBe(booking.to);
    expect(e.subject).toContain('Chloé');
    expect(e.text).toContain('Dog boarding');
    expect(e.text).toContain('12 – 15 Oct 2026');
    expect(e.html).toContain(booking.url);
  });

  it('yanit suresi SABIT DEGIL — cagirandan geliyor', () => {
    expect(newRequestEmail(booking, 36).text).toContain('36');
    expect(newRequestEmail(booking, 24).text).toContain('24');
  });

  it('Fransizca gercekten Fransizca — Ingilizce metne dusmuyor', () => {
    const fr = newRequestEmail({ ...booking, locale: 'fr-CA' }, 36);
    expect(fr.locale).toBe('fr-CA');
    expect(fr.subject).toContain('Nouvelle demande');
    expect(fr.html).toContain('lang="fr-CA"');
    expect(fr.text).not.toContain('booking request');
  });

  it('"kabul edildi" odeme alindigini IMA ETMIYOR', () => {
    const en = requestAcceptedEmail(booking).text;
    expect(en).toMatch(/not taking payments yet/i);
    const fr = requestAcceptedEmail({ ...booking, locale: 'fr-CA' }).text;
    expect(fr).toMatch(/n’accepte pas encore les paiements/);
  });

  it('red e-postasi suclamiyor, yol gosteriyor', () => {
    const e = requestDeclinedEmail(booking);
    expect(e.subject).toMatch(/declined/i);
    expect(e.text).toMatch(/Other sitters near you/i);
  });

  it('iptal e-postasi kimin iptal ettigini soyluyor', () => {
    expect(bookingCancelledEmail(booking).text).toContain('Chloé');
  });

  it('MESAJIN ICERIGI e-postaya girmiyor', () => {
    const e = newMessageEmail({
      to: 'owner@havre-test.ca', locale: 'en-CA',
      counterpartName: 'Ahmed',
      url: 'https://havre.ca/en/account/messages/xyz/',
    });
    expect(e.text).toContain('Ahmed');
    expect(e.text).toMatch(/do not copy its contents/i);
    // Kapatma hakki yaziyor (CASL)
    expect(e.text).toMatch(/turn message emails off/i);
  });

  it('takip pikseli ve uzak gorsel YOK (Law 25)', () => {
    for (const e of [
      newRequestEmail(booking, 36),
      requestAcceptedEmail(booking),
      newMessageEmail({ to: 'a@b.ca', locale: 'fr-CA', counterpartName: 'X', url: 'https://havre.ca/fr/' }),
    ]) {
      expect(e.html).not.toMatch(/<img/i);
      expect(e.html).not.toMatch(/background-image/i);
    }
  });

  it('kullanici adi HTML olarak yorumlanmiyor', () => {
    const e = newMessageEmail({
      to: 'a@b.ca', locale: 'en-CA',
      counterpartName: '<script>alert(1)</script>',
      url: 'https://havre.ca/en/',
    });
    expect(e.html).not.toContain('<script>');
    expect(e.html).toContain('&lt;script&gt;');
  });
});
