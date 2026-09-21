import { describe, expect, it } from 'vitest';
import { REDACTED, scrubEvent, scrubUrl, type ScrubbableEvent } from './observability.js';

/*
  Bu testlerin varlik sebebi tek bir cumle: hata kaydini okuyabilen
  birinin, o kayitla BASKA BIRININ HESABINA girebilmesi mumkun olmamali.
*/

describe('scrubUrl', () => {
  it('sifre sifirlama jetonunu silir, anahtari birakir', () => {
    expect(scrubUrl('/en/account/reset-password/?token=abc123')).toBe(
      `/en/account/reset-password/?token=${REDACTED}`,
    );
  });

  it('e-posta adresini silir', () => {
    expect(scrubUrl('/en/account/sign-in/?email=ali%40example.com')).toBe(
      `/en/account/sign-in/?email=${REDACTED}`,
    );
  });

  it('zararsiz parametrelere dokunmaz', () => {
    const url = '/en/search/?city=toronto&service=boarding&page=2';
    expect(scrubUrl(url)).toBe(url);
  });

  it('karisik sorguda yalnizca hassas olani siler', () => {
    expect(scrubUrl('/x/?city=toronto&token=zzz&page=2')).toBe(
      `/x/?city=toronto&token=${REDACTED}&page=2`,
    );
  });

  it('sorgusuz adresi oldugu gibi birakir', () => {
    expect(scrubUrl('/en/toronto/sitter/ayse-k/')).toBe('/en/toronto/sitter/ayse-k/');
  });

  it('cipayi korur', () => {
    expect(scrubUrl('/x/?token=abc#reviews')).toBe(`/x/?token=${REDACTED}#reviews`);
  });

  it('buyuk harfli ve kodlanmis anahtari da yakalar', () => {
    expect(scrubUrl('/x/?TOKEN=abc')).toBe(`/x/?TOKEN=${REDACTED}`);
    expect(scrubUrl('/x/?access%5Ftoken=abc')).toBe(`/x/?access%5Ftoken=${REDACTED}`);
  });

  it('degeri olmayan parametreyi bozmaz', () => {
    expect(scrubUrl('/x/?debug&city=laval')).toBe('/x/?debug&city=laval');
  });
});

describe('scrubEvent', () => {
  it('cerezi, govdeyi ve kullaniciyi tamamen kaldirir', () => {
    const event: ScrubbableEvent = {
      request: {
        url: 'https://havre.ca/en/account/reset-password/?token=abc',
        cookies: { 'better-auth.session_token': 'gizli' },
        data: { password: 'acikmetin' },
        headers: {
          cookie: 'better-auth.session_token=gizli',
          authorization: 'Bearer xyz',
          'x-forwarded-for': '24.114.0.1',
          'user-agent': 'Mozilla/5.0',
          'content-type': 'application/json',
        },
      },
      user: { id: 'u1', email: 'ali@example.com' },
    };

    const out = scrubEvent(event);

    expect(out.request?.url).toBe(`https://havre.ca/en/account/reset-password/?token=${REDACTED}`);
    expect(out.request?.cookies).toBeUndefined();
    expect(out.request?.data).toBeUndefined();
    expect(out.user).toBeUndefined();
    expect(Object.keys(out.request?.headers ?? {}).sort()).toEqual([
      'content-type',
      'user-agent',
    ]);
  });

  it('sorgu dizesini metin olarak da temizler', () => {
    const out = scrubEvent({ request: { query_string: 'city=laval&token=abc' } });
    expect(out.request?.query_string).toBe(`city=laval&token=${REDACTED}`);
  });

  it('sorgu dizesini nesne olarak da temizler', () => {
    const out = scrubEvent({ request: { query_string: { city: 'laval', token: 'abc' } } });
    expect(out.request?.query_string).toEqual({ city: 'laval', token: REDACTED });
  });

  it('sorgu dizesini cift listesi olarak da temizler', () => {
    const out = scrubEvent({
      request: { query_string: [['city', 'laval'], ['email', 'a@b.ca']] },
    });
    expect(out.request?.query_string).toEqual([['city', 'laval'], ['email', REDACTED]]);
  });

  it('istegi olmayan olayi bozmadan gecirir', () => {
    const out = scrubEvent({});
    expect(out).toEqual({});
  });
});
