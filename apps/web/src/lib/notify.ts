import 'server-only';
import {
  createMailer,
  newRequestEmail, requestAcceptedEmail, requestDeclinedEmail,
  bookingCancelledEmail, newMessageEmail,
  type Mailer, type OutgoingEmail,
} from '@havre/auth';
import { REQUEST_EXPIRY_HOURS } from '@havre/core';
import { getMessages, segmentFor, type Locale, type Messages } from '@havre/i18n';
import { getDb, bookingNotifyData, messageTarget, type BookingParty } from '@havre/db';
import { SITE_URL } from './seo';

/**
 * BILDIRIM E-POSTALARI — gonderim katmani.
 *
 * NEDEN BURADA, @havre/db ICINDE DEGIL: @havre/auth zaten @havre/db'ye
 * bagli; veri katmanindan e-posta gondermek dairesel bir bagimlilik
 * olurdu. Ayrica "ne zaman bildirim gider" bir URUN karari, bir veri
 * karari degil — sunucu eylemlerinin yaninda durmasi dogru.
 *
 * ATESLE-UNUT: gonderim, kullaniciyi BEKLETMIYOR. Resend cagrisi bir
 * iki saniye surebilir ya da dusebilir; rezervasyonun kaydedilip
 * kaydedilmedigi buna bagli olmamali. Hata sunucu kaydina yaziliyor ve
 * orada kaliyor.
 *
 * KAYBOLMA RISKI BILINIYOR: tekrar deneyen bir kuyruk YOK. Resend o an
 * dusukse o bildirim gitmez. Kuyruk bir isleyici (cron/worker)
 * gerektiriyor ve bugun yok; eklenene kadar kritik bilgi ekranda da
 * duruyor (talep listesi, rezervasyon detayi, gelen kutusu).
 */

/*
  POSTACI TEMBEL KURULUYOR — modul yuklenirken DEGIL.

  createMailer(), uretimde RESEND_API_KEY yoksa bilerek hata atiyor.
  Modul seviyesinde cagrildiginda bu hata `next build` sirasinda
  patliyordu: derleme makinesinin anahtara ihtiyaci yok, e-posta
  gonderen CALISAN sunucunun var. @havre/auth'taki getAuth() de ayni
  desenle tembel; kurulum hatasi ilk ISTEKTE cikmali, derlemede degil.
*/
let _mailer: Mailer | null = null;
function mailer(): Mailer {
  _mailer ??= createMailer();
  return _mailer;
}

/**
 * Gonderimi cagirandan AYIRIR.
 *
 * `void` ile birakilan bir promise reddedilirse Node surecin tamamini
 * dusurebilir; bu yuzden yakalama burada ve kosulsuz.
 */
function fireAndForget(email: OutgoingEmail | null): void {
  if (!email || !email.to) return;
  /* Postaci kurulumu da hata atabilir (anahtar yok): burada yakaliyoruz,
     cunku bir bildirim, yapilan islemi geri almamali. */
  void Promise.resolve()
    .then(() => mailer().send(email))
    .catch((err: unknown) => {
    // Adres kaydediliyor, ICERIK kaydedilmiyor: sunucu kaydi da bir yer.
      console.error(
        `[notify] gonderilemedi to=${email.to} subject=${JSON.stringify(email.subject)}`,
        err instanceof Error ? err.message : err,
      );
    });
}

function bookingUrl(locale: Locale, bookingId: string): string {
  return `${SITE_URL}/${segmentFor(locale)}/account/bookings/${bookingId}/`;
}

/** "12–15 oct. 2026" — e-postayi acan kisi tiklamadan hangi rezervasyon oldugunu anlamali. */
function dateRange(startIso: string, endIso: string, locale: Locale): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
  });
  const a = new Date(startIso);
  const b = new Date(endIso);
  return a.getTime() === b.getTime() ? fmt.format(a) : `${fmt.format(a)} – ${fmt.format(b)}`;
}

function serviceLabel(serviceType: string, locale: Locale): string {
  const m = getMessages(locale);
  return (m.service[serviceType as keyof Messages['service']] as string) ?? serviceType;
}

function notice(party: BookingParty, data: {
  serviceType: string; startAt: string; endAt: string;
}, bookingId: string) {
  return {
    to: party.email,
    locale: party.locale,
    counterpartName: party.counterpartName,
    serviceLabel: serviceLabel(data.serviceType, party.locale),
    dates: dateRange(data.startAt, data.endAt, party.locale),
    url: bookingUrl(party.locale, bookingId),
  };
}

/** BAKICIYA: yeni talep geldi. */
export async function notifyNewRequest(bookingId: string): Promise<void> {
  const data = await bookingNotifyData(getDb(), bookingId);
  if (!data) return;
  fireAndForget(newRequestEmail(notice(data.sitter, data, bookingId), REQUEST_EXPIRY_HOURS));
}

/** SAHIBE: bakici cevapladi. */
export async function notifyRequestAnswered(
  bookingId: string, accepted: boolean,
): Promise<void> {
  const data = await bookingNotifyData(getDb(), bookingId);
  if (!data) return;
  const n = notice(data.owner, data, bookingId);
  fireAndForget(accepted ? requestAcceptedEmail(n) : requestDeclinedEmail(n));
}

/** KARSI TARAFA: iptal edildi. Iptali YAPAN kisiye e-posta gitmiyor. */
export async function notifyCancelled(
  bookingId: string, cancelledBy: 'owner' | 'sitter',
): Promise<void> {
  const data = await bookingNotifyData(getDb(), bookingId);
  if (!data) return;
  const target = cancelledBy === 'owner' ? data.sitter : data.owner;
  fireAndForget(bookingCancelledEmail(notice(target, data, bookingId)));
}

/**
 * ALICIYA: yeni mesaj.
 *
 * IKI KAPI:
 *  1. Alici mesaj e-postasi istemiyorsa (users.notify_messages) gitmez.
 *  2. Aliciya bu gonderenden ZATEN okunmamis mesaj varsa gitmez —
 *     karsilikli yazisma sirasinda her satir icin e-posta, bildirim
 *     yagmuru demek. Kisi zaten haberdar.
 */
export async function notifyNewMessage(
  messageId: string, conversationId: string,
): Promise<void> {
  const t = await messageTarget(getDb(), messageId);
  if (!t || !t.wantsEmail || t.hadUnreadBefore) return;

  fireAndForget(newMessageEmail({
    to: t.recipientEmail,
    locale: t.recipientLocale,
    counterpartName: t.senderName,
    url: `${SITE_URL}/${segmentFor(t.recipientLocale)}/account/messages/${conversationId}/`,
  }));
}
