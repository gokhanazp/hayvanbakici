'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { sendMessage, openConversation, reportableMessage, createReport } from '@/lib/data';
import { segmentFor, type Locale } from '@havre/i18n';

export type MessageState = {
  error?: string | undefined;
  /** Gonderildi ve kac iletisim bilgisi maskelendi */
  redacted?: number | undefined;
  sentAt?: number | undefined;
};

/**
 * MESAJ GONDERME.
 *
 * Yetki sunucu eyleminde YENIDEN kontrol ediliyor: sayfa korumasi
 * gorunurluk icindir, sunucu eylemi sayfadan bagimsiz cagrilabilen bir
 * uc noktadir. Konusmanin tarafi olup olmadigi ayrica sorgunun WHERE
 * kosulunda (packages/db/src/queries/messaging.ts).
 */
export async function sendMessageAction(
  _prev: MessageState, form: FormData,
): Promise<MessageState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const conversationId = String(form.get('conversationId') ?? '');
  const body = String(form.get('body') ?? '');
  const seg = String(form.get('locale') ?? 'en');

  const res = await sendMessage({ conversationId, senderId: session.user.id, body });
  if (!res.ok) return { error: res.error };

  revalidatePath(`/${seg}/account/messages/${conversationId}/`);
  revalidatePath(`/${seg}/account/messages/`);
  /*
    sentAt: arayuz "gonderildi" durumunu ayirt edebilsin diye. Ayni
    mesaji iki kez gonderince redacted degeri ayni kalabiliyor ve React
    durumu degismemis saniyordu.
  */
  return { redacted: res.value.redactedCount, sentAt: Date.now() };
}

/**
 * Bakici profilinden soru sorma: konusmayi acar (varsa bulur) ve ilk
 * mesaji yazar, sonra konusmaya yonlendirir.
 *
 * Tek islem gibi gorunuyor ama iki adim: konusma acmanin kendi hiz
 * siniri var (saatte 10 yeni konusma), mesaj yazmanin yok.
 */
export async function askSitterAction(
  _prev: MessageState, form: FormData,
): Promise<MessageState & { redirectTo?: string }> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const sitterId = String(form.get('sitterId') ?? '');
  const body = String(form.get('body') ?? '');
  const locale = String(form.get('locale') ?? 'en-CA') as Locale;

  if (body.trim().length === 0) return { error: 'empty' };

  const conv = await openConversation({ ownerId: session.user.id, sitterId });
  if (!conv.ok) return { error: conv.error };

  const sent = await sendMessage({
    conversationId: conv.value, senderId: session.user.id, body,
  });
  if (!sent.ok) return { error: sent.error };

  const seg = segmentFor(locale);
  revalidatePath(`/${seg}/account/messages/`);
  return { redirectTo: `/${seg}/account/messages/${conv.value}/` };
}

export type ReportState = { error?: string | undefined; done?: boolean | undefined };

/**
 * BIR MESAJI BILDIRME.
 *
 * Sikayet, panelde ham metni acmanin TEK anahtari (bkz.
 * app/admin/actions.ts -> revealMessageAction). Yani bu dugme olmadan
 * yonetici hicbir yazismayi goremez — ve bu bilerek boyle.
 *
 * Kullaniciya "inceleyecegiz" diyoruz, "sildik/uyardik" demiyoruz:
 * bildirme aninda hicbir karar verilmedi, veremeyiz de.
 */
export async function reportMessageAction(
  _prev: ReportState, form: FormData,
): Promise<ReportState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const messageId = String(form.get('messageId') ?? '');
  const reason = String(form.get('reason') ?? '').trim();
  if (reason.length < 3) return { error: 'empty' };

  const target = await reportableMessage(messageId, session.user.id);
  // 'self' burada "kendine mesaj atma" degil "kendi mesajini bildirme":
  // ayni kod, farkli cumle.
  if (!target.ok) return { error: target.error === 'self' ? 'self_report' : target.error };

  await createReport({
    reporterId: session.user.id,
    subjectType: 'message',
    subjectId: messageId,
    // Kimin hakkinda oldugu AYRICA yaziliyor: panelde kisi sayfasindan
    // da gorunsun diye — sikayet listesi tek giris kapisi olmamali.
    subjectUserId: target.value.senderId,
    reason,
  });

  return { done: true };
}
