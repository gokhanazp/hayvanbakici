import { describe, it, expect } from 'vitest';
import { createMailer, ConsoleMailer, ResendMailer, SesMailer } from './mail.js';

/**
 * SAGLAYICI SECIMI.
 *
 * Bu dosyanin tek isi: "hangi saglayici gonderdi" sorusunun asla tahmine
 * kalmamasi. Uretimde saglayici yoksa uygulama ACILISTA durmali —
 * sessizce konsola dusen bir dogrulama e-postasi, kullanicinin hic
 * giris yapamamasi demek ve bu, aylar sonra fark edilen turden bir hata.
 */
const base = { MAIL_FROM: 'Havre <no-reply@havre.ca>' } as NodeJS.ProcessEnv;

describe('saglayici secimi', () => {
  it('gelistirmede konsol', () => {
    expect(createMailer({ ...base })).toBeInstanceOf(ConsoleMailer);
  });

  it('URETIMDE saglayici yoksa ACILISTA durur', () => {
    expect(() => createMailer({ ...base, NODE_ENV: 'production' }))
      .toThrow(/SES_REGION|RESEND_API_KEY/);
  });

  it('SES_REGION varsa SES', () => {
    const m = createMailer({ ...base, SES_REGION: 'ca-central-1' });
    expect(m).toBeInstanceOf(SesMailer);
    expect(m.name).toBe('ses');
  });

  it('RESEND_API_KEY varsa Resend', () => {
    expect(createMailer({ ...base, RESEND_API_KEY: 'x' })).toBeInstanceOf(ResendMailer);
  });

  it('IKISI DE varsa ACIK secim kazanir', () => {
    /* Tahmine birakilmamasi gereken tek soru bu. */
    const env = { ...base, SES_REGION: 'ca-central-1', RESEND_API_KEY: 'x' };
    expect(createMailer({ ...env, MAIL_DRIVER: 'resend' })).toBeInstanceOf(ResendMailer);
    expect(createMailer({ ...env, MAIL_DRIVER: 'ses' })).toBeInstanceOf(SesMailer);
  });

  it('acik secim ama ayar eksikse HANGISI oldugunu soyler', () => {
    expect(() => createMailer({ ...base, MAIL_DRIVER: 'ses' })).toThrow(/SES_REGION/);
    expect(() => createMailer({ ...base, MAIL_DRIVER: 'resend' })).toThrow(/RESEND_API_KEY/);
  });

  it('yarim SES kimligi kabul edilmez', () => {
    /* Yalnizca birini vermek sessizce SDK'nin varsayilan zincirine
       dusurur ve "neden yetki hatasi aliyorum" diye saatler yakar. */
    expect(() => createMailer({
      ...base, SES_REGION: 'ca-central-1', SES_ACCESS_KEY_ID: 'a',
    })).toThrow(/birlikte/);
  });

  it('taninmayan surucu adini soyler', () => {
    expect(() => createMailer({ ...base, MAIL_DRIVER: 'sendgrid' })).toThrow(/sendgrid/);
  });
});

/*
  GERCEK SES GONDERIMI — yalnizca SES_TEST_ENDPOINT verilirse.
    pip install "moto[all,server]" && python3 -m moto.server -p 5999
    SES_TEST_ENDPOINT=http://127.0.0.1:5999 npm test -w @havre/auth
*/
const endpoint = process.env.SES_TEST_ENDPOINT;
describe.skipIf(!endpoint)('ses gonderimi', () => {
  it('gonderdigi zarf dogru', async () => {
    const { SESv2Client, CreateEmailIdentityCommand } =
      await import('@aws-sdk/client-sesv2');
    const cfg = {
      region: 'ca-central-1', endpoint,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    };
    const admin = new SESv2Client(cfg);
    try {
      await admin.send(new CreateEmailIdentityCommand({ EmailIdentity: 'havre.ca' }));
    } catch { /* zaten dogrulanmis */ }

    const mailer = new SesMailer(
      new SESv2Client(cfg), 'Havre <no-reply@havre.ca>', undefined,
    );
    await expect(mailer.send({
      to: 'kisi@example.com',
      subject: 'Dogrulama',
      text: 'https://havre.ca/dogrula?x=1',
      html: '<p>https://havre.ca/dogrula?x=1</p>',
      locale: 'fr-CA',
    })).resolves.toBeUndefined();

    /*
      GONDERIMIN GERCEKTEN SES'E ULASTIGINI kanitlamak icin: dogrulanmamis
      bir adresten gonderim REDDEDILMELI. Sadece "hata atmadi" demek,
      cagrinin hic yapilmadigi bir durumda da gecerdi.
    */
    const rogue = new SesMailer(
      new SESv2Client(cfg), 'Sahte <no-reply@baskasite.example>', undefined,
    );
    await expect(rogue.send({
      to: 'kisi@example.com', subject: 'x', text: 'x', html: '<p>x</p>', locale: 'en-CA',
    })).rejects.toThrow();
  });
});
