'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { respondToRequest, cancelBooking } from '@/lib/data';

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

  revalidatePath(`/${String(formData.get('locale') ?? 'en')}/account/bookings/${id}/`);
  return {};
}

export async function cancelAction(
  _prev: ActionState, formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const id = String(formData.get('id') ?? '');
  const res = await cancelBooking(id, session.user.id);
  if (!res.ok) return { error: res.error };

  revalidatePath(`/${String(formData.get('locale') ?? 'en')}/account/bookings/${id}/`);
  return {};
}
