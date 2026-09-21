/**
 * E-POSTA GONDERIMI.
 *
 * Uc saglayici, tek arayuz: gelistirmede konsol, uretimde Amazon SES ya
 * da Resend. Gelistirirken gercek e-posta gondermek hem yavas hem
 * gereksiz; sihirli baglanti dogrudan terminale basiliyor ve
 * /account/dev-inbox sayfasinda tiklanabiliyor.
 *
 * NEDEN SES DE VAR: sitede "veriniz Kanada'da" yaziyor. SES'in
 * `ca-central-1` bolgesi var, Resend'in Kanada bolgesi yok. Rezervasyon
 * bildirimleri ad, tarih ve hizmet bilgisi tasiyor — yani kisisel veri.
 * Saglayiciyi bir ortam degiskeni yaptik ki bu, kod karari degil
 * yapilandirma karari olsun (depolama katmaninda da ayni desen).
 *
 * URETIMDE SAGLAYICI YOKSA UYGULAMA ACILISTA HATA VERIYOR — sessizce
 * konsola dusup "kullanici dogrulama e-postasi almiyor" hatasini
 * uretmesin diye.
 */

import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

import { recordDevEmail } from './dev-inbox.js';

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Bill 96: hangi dilde gonderildigi denetim icin kaydedilir */
  locale: 'en-CA' | 'fr-CA';
}

export interface Mailer {
  readonly name: string;
  send(email: OutgoingEmail): Promise<void>;
}

/** Gelistirme: e-postayi gondermez, terminale basar. */
export class ConsoleMailer implements Mailer {
  readonly name = 'console';

  async send(email: OutgoingEmail): Promise<void> {
    // Terminale basmanin yani sira /account/dev-inbox sayfasi icin de kaydet.
    recordDevEmail(email);

    const line = '─'.repeat(72);
    const links = [...email.text.matchAll(/https?:\/\/\S+/g)].map((m) => m[0]);
    console.log(
      `\n${line}\n  E-POSTA (gonderilmedi — gelistirme modu)\n` +
        `  Kime   : ${email.to}\n` +
        `  Konu   : ${email.subject}\n` +
        `  Dil    : ${email.locale}\n` +
        (links.length ? `  Baglanti:\n${links.map((l) => `    ${l}`).join('\n')}\n` : '') +
        `${line}\n`,
    );
  }
}

export class ResendMailer implements Mailer {
  readonly name = 'resend';

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(email: OutgoingEmail): Promise<void> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: this.from,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // API anahtari hicbir kosulda hata mesajina girmez.
      throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
    }
  }
}

/**
 * AMAZON SES.
 *
 * BOLGE ONEMLI: `ca-central-1` secilirse gonderim Kanada'da isleniyor
 * ve "veriniz Kanada'da" cumlesi e-posta tarafinda da bozulmuyor.
 *
 * KIMLIK BILGILERI ACIKCA VERILIYOR (`SES_ACCESS_KEY_ID` /
 * `SES_SECRET_ACCESS_KEY`). SDK'nin varsayilan zinciri de calisirdi ama
 * Vercel gibi ortamlarda `AWS_*` degiskenleri baska amaclarla dolu
 * olabiliyor; kendi adlarimizi kullanmak bu karisikligi kaldiriyor.
 * Verilmezlerse SDK kendi varsayilan zincirine dusuyor (AWS uzerinde
 * calisiyorsa rol yeterli).
 *
 * `SES_CONFIGURATION_SET` istege bagli: verilirse geri donen/sikayet
 * edilen adresler SES tarafinda izlenebiliyor. Kuyruk ya da yeniden
 * deneme YOK — bkz. notify.ts'teki "atesle-unut" notu.
 */
export class SesMailer implements Mailer {
  readonly name = 'ses';

  constructor(
    private readonly client: SESv2Client,
    private readonly from: string,
    private readonly configurationSet: string | undefined,
  ) {}

  async send(email: OutgoingEmail): Promise<void> {
    await this.client.send(new SendEmailCommand({
      FromEmailAddress: this.from,
      Destination: { ToAddresses: [email.to] },
      ...(this.configurationSet ? { ConfigurationSetName: this.configurationSet } : {}),
      Content: {
        Simple: {
          Subject: { Data: email.subject, Charset: 'UTF-8' },
          Body: {
            /* Ikisi birden: metin surumu hem eski istemciler hem de
               istenmeyen posta puani icin gerekiyor. */
            Text: { Data: email.text, Charset: 'UTF-8' },
            Html: { Data: email.html, Charset: 'UTF-8' },
          },
        },
      },
    }));
  }
}

export type MailDriver = 'console' | 'ses' | 'resend';

/**
 * Hangi saglayici calisacak.
 *
 * `MAIL_DRIVER` verilmezse eldeki ayardan cikariliyor. Ikisi birden
 * tanimliysa ACIK secim kazaniyor — "hangisi gonderdi" sorusunun
 * tahmine birakilmamasi gereken bir soru oldugunu bir kez ogrendik.
 */
export function createMailer(env: NodeJS.ProcessEnv = process.env): Mailer {
  const from = env.MAIL_FROM ?? 'Havre <no-reply@havre.ca>';
  const explicit = env.MAIL_DRIVER as MailDriver | undefined;
  const driver: MailDriver =
    explicit ?? (env.SES_REGION ? 'ses' : env.RESEND_API_KEY ? 'resend' : 'console');

  if (driver === 'ses') {
    const region = env.SES_REGION;
    if (!region) {
      throw new Error('MAIL_DRIVER="ses" secildi ama SES_REGION tanimli degil (ornek: ca-central-1).');
    }
    const id = env.SES_ACCESS_KEY_ID;
    const secret = env.SES_SECRET_ACCESS_KEY;
    if ((id && !secret) || (!id && secret)) {
      throw new Error('SES_ACCESS_KEY_ID ve SES_SECRET_ACCESS_KEY birlikte verilmeli.');
    }
    return new SesMailer(
      new SESv2Client({
        region,
        /*
          `SES_ENDPOINT` yalnizca YEREL DENEME icin (moto/LocalStack).
          Uretimde verilmiyor; verilmezse SDK gercek SES adresini
          kendisi kuruyor. Ucu ucuna calisan bir deneme yapabilmek,
          "Better Auth gercekten bu suruculye ulasiyor mu" sorusunu
          tahmin olmaktan cikariyor.
        */
        ...(env.SES_ENDPOINT ? { endpoint: env.SES_ENDPOINT } : {}),
        ...(id && secret ? { credentials: { accessKeyId: id, secretAccessKey: secret } } : {}),
      }),
      from,
      env.SES_CONFIGURATION_SET,
    );
  }

  if (driver === 'resend') {
    const key = env.RESEND_API_KEY;
    if (!key) throw new Error('MAIL_DRIVER="resend" secildi ama RESEND_API_KEY tanimli degil.');
    return new ResendMailer(key, from);
  }

  if (driver !== 'console') {
    throw new Error(`MAIL_DRIVER="${String(driver)}" tanimli degil. Gecerli: "console", "ses", "resend".`);
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'Uretimde e-posta saglayicisi tanimli degil: SES_REGION ya da RESEND_API_KEY verin. ' +
        'Aksi halde dogrulama, sihirli baglanti ve sifre sifirlama akislari sessizce kirilir.',
    );
  }

  return new ConsoleMailer();
}
