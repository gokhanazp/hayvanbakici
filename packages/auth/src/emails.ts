import type { Locale } from '@havre/i18n';
import type { OutgoingEmail } from './mail.js';

/**
 * KIMLIK E-POSTALARI — EN + FR.
 *
 * BILL 96: bunlar pazarlama degil, ISLEMSEL e-postalar; Quebec'teki bir
 * kullaniciya Fransizca gonderilmeleri zorunlu. Bu yuzden iki katalog da
 * ayni fonksiyonda yasiyor: birine metin eklenip digerine unutulmasi
 * derleme hatasi veriyor (Record<Locale, ...> tam olmak zorunda).
 *
 * TASARIM: e-postalar sade HTML. Uzak gorsel, web yazi tipi, takip pikseli
 * YOK — Law 25 opt-in takip kurali e-postada da gecerli ve gomulu takip
 * pikseli riza olmadan kullanilamaz.
 */

type Copy = { subject: string; heading: string; body: string; cta: string; footer: string };

/**
 * ORTAK E-POSTA GOVDESI.
 *
 * Kimlik e-postalari ve bildirimler AYNI kabugu paylasiyor: marka, renk
 * ve alt bilgi tek yerde. Bir e-posta turune "takip pikseli eklemeyi
 * unutmadik" demek icin de tek bir dosyaya bakmak yetiyor.
 */
export interface EmailShell {
  heading: string;
  body: string;
  /** Dugme metni ve adresi — ikisi birlikte verilir ya da hic verilmez */
  cta?: { label: string; url: string } | undefined;
  /** Dugmenin altindaki kucuk notlar (son kullanma, yok sayma, vb.) */
  notes?: readonly string[] | undefined;
  footer: string;
  locale: Locale;
  subject: string;
}

export function renderEmail(input: EmailShell): OutgoingEmail {
  const { heading, body, cta, notes = [], footer, locale, subject } = input;

  const text = [
    heading, '', body,
    ...(cta ? ['', cta.url] : []),
    ...(notes.length ? ['', ...notes] : []),
    '', footer,
  ].join('\n');

  const html = `<!doctype html>
<html lang="${locale === 'fr-CA' ? 'fr-CA' : 'en-CA'}">
<body style="margin:0;padding:32px 16px;background:${PALETTE.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${PALETTE.ink};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;">
    <tr><td style="padding-bottom:24px;font-size:20px;font-weight:700;letter-spacing:-0.02em;">Havre</td></tr>
    <tr><td style="background:#FFFFFF;border:1px solid ${PALETTE.line};border-radius:20px;padding:28px;">
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;letter-spacing:-0.02em;font-weight:700;">${escapeHtml(heading)}</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:${PALETTE.muted};">${escapeHtml(body)}</p>
      ${cta ? `<a href="${escapeAttr(cta.url)}" style="display:inline-block;background:${PALETTE.accent};color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:13px 22px;border-radius:12px;">${escapeHtml(cta.label)}</a>` : ''}
      ${notes.length ? `<p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:${PALETTE.muted};">${notes.map(escapeHtml).join('<br>')}</p>` : ''}
      ${cta ? `<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${PALETTE.muted};word-break:break-all;">${escapeHtml(cta.url)}</p>` : ''}
    </td></tr>
    <tr><td style="padding-top:20px;font-size:12px;line-height:1.5;color:${PALETTE.muted};">${escapeHtml(footer)}</td></tr>
  </table>
</body>
</html>`;

  return { to: '', subject, text, html, locale };
}

const PALETTE = {
  bg: '#FBF8F4',
  ink: '#1A1714',
  muted: '#5C544C',
  line: '#E7DFD4',
  accent: '#2F6B52',
} as const;

function render(copy: Copy, url: string, locale: Locale): OutgoingEmail {
  const expiryNote = locale === 'fr-CA'
    ? 'Ce lien expire dans 60 minutes et ne peut servir qu\u2019une seule fois.'
    : 'This link expires in 60 minutes and can only be used once.';

  const ignoreNote = locale === 'fr-CA'
    ? 'Si vous n\u2019avez pas fait cette demande, ignorez ce courriel : rien ne changera.'
    : 'If you didn\u2019t request this, ignore this email \u2014 nothing will change.';

  return renderEmail({
    subject: copy.subject,
    heading: copy.heading,
    body: copy.body,
    cta: { label: copy.cta, url },
    notes: [expiryNote, ignoreNote],
    footer: copy.footer,
    locale,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

const VERIFY: Record<Locale, Copy> = {
  'en-CA': {
    subject: 'Confirm your email — Havre',
    heading: 'Confirm your email address',
    body: 'One tap and your Havre account is ready. We ask for this so nobody else can sign up using your address.',
    cta: 'Confirm my email',
    footer: 'Havre — pet care marketplace. This is a transactional email about your account, not marketing.',
  },
  'fr-CA': {
    subject: 'Confirmez votre courriel — Havre',
    heading: 'Confirmez votre adresse courriel',
    body: 'Un seul clic et votre compte Havre est prêt. Nous le demandons pour que personne d’autre ne puisse s’inscrire avec votre adresse.',
    cta: 'Confirmer mon courriel',
    footer: 'Havre — plateforme de garde d’animaux. Ceci est un courriel transactionnel lié à votre compte, pas une publicité.',
  },
};

const MAGIC: Record<Locale, Copy> = {
  'en-CA': {
    subject: 'Your sign-in link — Havre',
    heading: 'Sign in to Havre',
    body: 'No password needed. This link signs you in on the device where you open it.',
    cta: 'Sign me in',
    footer: 'Havre — pet care marketplace. This is a transactional email about your account, not marketing.',
  },
  'fr-CA': {
    subject: 'Votre lien de connexion — Havre',
    heading: 'Connectez-vous à Havre',
    body: 'Aucun mot de passe requis. Ce lien vous connecte sur l’appareil où vous l’ouvrez.',
    cta: 'Me connecter',
    footer: 'Havre — plateforme de garde d’animaux. Ceci est un courriel transactionnel lié à votre compte, pas une publicité.',
  },
};

const RESET: Record<Locale, Copy> = {
  'en-CA': {
    subject: 'Reset your password — Havre',
    heading: 'Choose a new password',
    body: 'Someone asked to reset the password on this account. If that was you, set a new one here.',
    cta: 'Set a new password',
    footer: 'Havre — pet care marketplace. This is a transactional email about your account, not marketing.',
  },
  'fr-CA': {
    subject: 'Réinitialisez votre mot de passe — Havre',
    heading: 'Choisissez un nouveau mot de passe',
    body: 'Quelqu’un a demandé la réinitialisation du mot de passe de ce compte. Si c’était vous, définissez-en un nouveau ici.',
    cta: 'Définir un nouveau mot de passe',
    footer: 'Havre — plateforme de garde d’animaux. Ceci est un courriel transactionnel lié à votre compte, pas une publicité.',
  },
};

export function verifyEmail(to: string, url: string, locale: Locale): OutgoingEmail {
  return { ...render(VERIFY[locale], url, locale), to };
}

export function magicLinkEmail(to: string, url: string, locale: Locale): OutgoingEmail {
  return { ...render(MAGIC[locale], url, locale), to };
}

export function resetPasswordEmail(to: string, url: string, locale: Locale): OutgoingEmail {
  return { ...render(RESET[locale], url, locale), to };
}
