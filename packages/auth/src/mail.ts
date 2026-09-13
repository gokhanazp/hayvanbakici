/**
 * E-POSTA GONDERIMI.
 *
 * Iki saglayici: gelistirmede konsol, uretimde Resend. Ayni arayuz.
 * Sebebi pratik — gelistirirken gercek e-posta gondermek hem yavas hem
 * gereksiz; sihirli baglanti dogrudan terminale basiliyor, tiklanabiliyor.
 *
 * URETIME GECERKEN: RESEND_API_KEY tanimlanir tanimlanmaz Resend'e geciyor,
 * kod degisikligi gerekmiyor. Anahtar yoksa ve NODE_ENV=production ise
 * uygulama ACILISTA hata veriyor — sessizce konsola dusup "kullanici
 * dogrulama e-postasi almiyor" hatasini uretmesin diye.
 */

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

export function createMailer(env: NodeJS.ProcessEnv = process.env): Mailer {
  const key = env.RESEND_API_KEY;
  const from = env.MAIL_FROM ?? 'Havre <no-reply@havre.ca>';

  if (key) return new ResendMailer(key, from);

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'RESEND_API_KEY tanimli degil. Uretimde e-posta gonderilemez; ' +
        'dogrulama ve sifre sifirlama akislari sessizce kirilirdi.',
    );
  }

  return new ConsoleMailer();
}
