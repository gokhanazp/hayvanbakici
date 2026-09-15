'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { respondToRequest, cancelBooking, getBooking, openConversation } from '@/lib/data';
import { notifyRequestAnswered, notifyCancelled } from '@/lib/notify';

/**
 * Rezervasyon eylemleri.
 *
 * YETKI HER ZAMAN SUNUCUDA: veri katmanindaki sorgular WHERE'inde
 * kullaniciyi da ariyor (respondToRequest yalnizca O BAKICI icin, cancel
 * yalnizca TARAFLAR icin). Yani bu dosya yetkiyi "kontrol etmiyor",
 * yetkisi olmayan cagri veritabaninda hicbir satir bulamiyor.
 */
export type ActionState = { error?: string | undefined };

export async function respondAction(
  _prev: ActionState, formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (decision !== 'confirmed' && decision !== 'declined') return { error: 'invalid' };

  const res = await respondToRequest(id, session.user.id, decision);
  if (!res.ok) return { error: res.error };

  // Sahibe haber ver — e-posta hatasi cevabi geri almamali
  await notifyRequestAnswered(id, decision === 'confirmed').catch(() => undefined);

  revalidatePath(`/${String(formData.get('locale') ?? 'en')}/account/bookings/${id}/`);
  return {};
}

export async function cancelAction(
  _prev: ActionState, formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const id = String(formData.get('id') ?? '');

  /*
    Iptali KIMIN yaptigini iptalden ONCE ogreniyoruz: e-posta karsi
    tarafa gidecek ve "siz iptal ettiniz" diye kendi kendine bildirim
    gonderilmemeli.
  */
  const before = await getBooking(id, session.user.id, 'en-CA');
  const res = await cancelBooking(id, session.user.id);
  if (!res.ok) return { error: res.error };

  if (before) {
    await notifyCancelled(id, before.viewerRole).catch(() => undefined);
  }

  revalidatePath(`/${String(formData.get('locale') ?? 'en')}/account/bookings/${id}/`);
  return {};
}

/**
 * Rezervasyondan konusmayi ac.
 *
 * Konusma REZERVASYONA degil, SAHIP–BAKICI CIFTINE ait; bu yuzden bu
 * eylem cogu zaman yeni bir sey yaratmaz, var olani bulur. `bookingId`
 * yalnizca konusma ilk kez burada aciliyorsa isaret olarak yaziliyor.
 *
 * Kimlik: rezervasyon once BAKAN KISI ile yeniden cekiliyor. Taraf
 * olmayan icin sorgu null doner, yani formdaki id ile baskasinin
 * karsisina konusma acilamiyor.
 */
export async function openBookingConversationAction(
  _prev: ActionState, formData: FormData,
): Promise<ActionState & { redirectTo?: string }> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const id = String(formData.get('id') ?? '');
  const seg = String(formData.get('locale') ?? 'en');

  const booking = await getBooking(id, session.user.id, 'en-CA');
  if (!booking) return { error: 'not_allowed' };

  const conv = await openConversation({
    ownerId: booking.ownerId, sitterId: booking.sitterId, bookingId: id,
  });
  if (!conv.ok) return { error: conv.error };

  revalidatePath(`/${seg}/account/messages/`);
  return { redirectTo: `/${seg}/account/messages/${conv.value}/` };
}
