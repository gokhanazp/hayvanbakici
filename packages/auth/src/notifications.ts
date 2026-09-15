import type { Locale } from '@havre/i18n';
import type { OutgoingEmail } from './mail.js';
import { renderEmail } from './emails.js';

/**
 * BILDIRIM E-POSTALARI — EN + FR.
 *
 * Bugun her sey ancak siteye girince goruluyordu: 36 saatlik yanit
 * suresi ve mesajlasma bu yuzden yarim kaliyordu. Bakici talebin
 * geldigini bilmiyorsa sure isliyor ve talep kendiliginden dusuyor.
 *
 * ISLEMSEL / PAZARLAMA AYRIMI (CASL, Law 25):
 * Buradakilerin hepsi islemsel — kullanicinin BASLATTIGI ya da karsi
 * tarafin ona yonelttigi bir eylemin sonucu. Pazarlama e-postasi bu
 * dosyada YOK ve olmamali; alt bilgi de bunu acikca yaziyor.
 *
 * Tek istisna kapatilabilirlik: mesaj bildirimi kapatilabiliyor
 * (users.notify_messages), rezervasyon bildirimleri kapatilamiyor —
 * karsi taraf bir sey bekliyorken haber vermemek hizmetin kendisini
 * bozar.
 *
 * Record<Locale, ...> tam olmak zorunda: birine metin ekleyip digerini
 * unutmak DERLEME HATASI veriyor (Bill 96).
 */

const FOOTER: Record<Locale, string> = {
  'en-CA': 'Havre — pet care marketplace. This is a transactional email about a booking or a message on your account, not marketing.',
  'fr-CA': 'Havre — plateforme de garde d’animaux. Ceci est un courriel transactionnel lié à une réservation ou à un message de votre compte, pas une publicité.',
};

/** Mesaj bildiriminin altindaki "bunu kapatabilirsiniz" notu. */
const OPT_OUT: Record<Locale, string> = {
  'en-CA': 'You can turn message emails off in your account settings. Booking emails cannot be turned off.',
  'fr-CA': 'Vous pouvez désactiver les courriels de messages dans les réglages de votre compte. Les courriels de réservation ne peuvent pas être désactivés.',
};

export interface BookingNotice {
  to: string;
  locale: Locale;
  /** Karsi tarafin adi — "Ahmed" gibi, tam ad DEGIL */
  counterpartName: string;
  /** Hizmetin cevrilmis adi, ornegin "Dog boarding" */
  serviceLabel: string;
  /** Bicimlenmis tarih araligi, ornegin "12–15 Oct 2026" */
  dates: string;
  /** Rezervasyonun tam adresi */
  url: string;
}

function bookingEmail(
  n: BookingNotice,
  copy: { subject: string; heading: string; body: string; cta: string },
  extraNotes: readonly string[] = [],
): OutgoingEmail {
  return {
    ...renderEmail({
      subject: copy.subject,
      heading: copy.heading,
      /* Tarih ve hizmet GOVDEDE: konu satiri kisa kalmali ama e-postayi
         acan kisi hangi rezervasyon oldugunu tiklamadan anlamali. */
      body: `${copy.body}\n\n${n.serviceLabel} · ${n.dates}`,
      cta: { label: copy.cta, url: n.url },
      notes: extraNotes,
      footer: FOOTER[n.locale],
      locale: n.locale,
    }),
    to: n.to,
  };
}

/** BAKICIYA: yeni rezervasyon talebi geldi. */
export function newRequestEmail(n: BookingNotice, expiryHours: number): OutgoingEmail {
  const copy = n.locale === 'fr-CA'
    ? {
        subject: `Nouvelle demande de ${n.counterpartName} — Havre`,
        heading: 'Vous avez une nouvelle demande',
        body: `${n.counterpartName} aimerait réserver avec vous.`,
        cta: 'Voir la demande',
      }
    : {
        subject: `New booking request from ${n.counterpartName} — Havre`,
        heading: 'You have a new booking request',
        body: `${n.counterpartName} would like to book with you.`,
        cta: 'See the request',
      };

  /* Sure BIZIM sistemimizden geliyor, sabit metinden degil: kural
     degisirse e-posta yalan soylemesin. */
  const note = n.locale === 'fr-CA'
    ? `Une demande sans réponse expire d’elle-même après ${expiryHours} heures.`
    : `A request that goes unanswered expires on its own after ${expiryHours} hours.`;

  return bookingEmail(n, copy, [note]);
}

/** SAHIBE: bakici kabul etti. */
export function requestAcceptedEmail(n: BookingNotice): OutgoingEmail {
  const copy = n.locale === 'fr-CA'
    ? {
        subject: `${n.counterpartName} a accepté votre demande — Havre`,
        heading: 'Votre demande est acceptée',
        body: `${n.counterpartName} a accepté votre demande de réservation.`,
        cta: 'Voir la réservation',
      }
    : {
        subject: `${n.counterpartName} accepted your request — Havre`,
        heading: 'Your request was accepted',
        body: `${n.counterpartName} accepted your booking request.`,
        cta: 'See the booking',
      };

  /* Odeme henuz YOK ve bunu burada da soyluyoruz: "kabul edildi"
     e-postasini alan kisi bir tahsilat bekler. */
  const note = n.locale === 'fr-CA'
    ? 'Havre n’accepte pas encore les paiements : rien n’a été facturé. Entendez-vous directement avec votre gardien.'
    : 'Havre is not taking payments yet, so nothing has been charged. Settle the payment with your sitter directly.';

  return bookingEmail(n, copy, [note]);
}

/** SAHIBE: bakici reddetti. */
export function requestDeclinedEmail(n: BookingNotice): OutgoingEmail {
  const copy = n.locale === 'fr-CA'
    ? {
        subject: 'Votre demande a été refusée — Havre',
        heading: 'Cette fois, ça n’a pas marché',
        body: `${n.counterpartName} ne peut pas prendre cette réservation. D’autres gardiens sont disponibles près de chez vous.`,
        cta: 'Trouver un autre gardien',
      }
    : {
        subject: 'Your request was declined — Havre',
        heading: 'This one did not work out',
        body: `${n.counterpartName} cannot take this booking. Other sitters near you are available.`,
        cta: 'Find another sitter',
      };

  return bookingEmail(n, copy);
}

/** KARSI TARAFA: rezervasyon iptal edildi. */
export function bookingCancelledEmail(n: BookingNotice): OutgoingEmail {
  const copy = n.locale === 'fr-CA'
    ? {
        subject: 'Réservation annulée — Havre',
        heading: 'Cette réservation est annulée',
        body: `${n.counterpartName} a annulé cette réservation.`,
        cta: 'Voir les détails',
      }
    : {
        subject: 'Booking cancelled — Havre',
        heading: 'This booking is cancelled',
        body: `${n.counterpartName} cancelled this booking.`,
        cta: 'See the details',
      };

  return bookingEmail(n, copy);
}

export interface MessageNotice {
  to: string;
  locale: Locale;
  counterpartName: string;
  url: string;
}

/**
 * YENI MESAJ.
 *
 * MESAJIN ICERIGI E-POSTAYA GIRMIYOR — bilerek. Yazismalar maskelenmis
 * iletisim bilgisi iceriyor olabilir ve e-posta kutusu bizim
 * denetleyemedigimiz bir yer; ayrica panelde bile ham metin yalnizca
 * sikayet uzerine aciliyor (bkz. app/admin/actions.ts). Kendi
 * kuralimizi e-postayla delmiyoruz.
 */
export function newMessageEmail(n: MessageNotice): OutgoingEmail {
  const copy = n.locale === 'fr-CA'
    ? {
        subject: `Nouveau message de ${n.counterpartName} — Havre`,
        heading: `${n.counterpartName} vous a écrit`,
        body: 'Le message vous attend sur Havre. Nous n’en recopions pas le contenu ici.',
        cta: 'Lire le message',
      }
    : {
        subject: `New message from ${n.counterpartName} — Havre`,
        heading: `${n.counterpartName} sent you a message`,
        body: 'The message is waiting for you on Havre. We do not copy its contents into email.',
        cta: 'Read the message',
      };

  return {
    ...renderEmail({
      subject: copy.subject,
      heading: copy.heading,
      body: copy.body,
      cta: { label: copy.cta, url: n.url },
      notes: [OPT_OUT[n.locale]],
      footer: FOOTER[n.locale],
      locale: n.locale,
    }),
    to: n.to,
  };
}
