'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { isAdmin, decideApplication } from '@/lib/data';

export type DecisionState = { error?: string | undefined; done?: string | undefined };

/**
 * BASVURU KARARI.
 *
 * Yetki iki kez kontrol ediliyor gibi gorunuyor ama degil: sayfa korumasi
 * (requireAdmin) GORUNURLUK icin, buradaki kontrol EYLEM icin. Sunucu
 * eylemleri sayfa korumasindan bagimsiz cagrilabilir; yetkiyi eylemin
 * kendisi dogrulamak zorunda.
 */
export async function decideAction(
  _prev: DecisionState, formData: FormData,
): Promise<DecisionState> {
  const session = await getSession();
  if (!session || !(await isAdmin(session.user.id))) return { error: 'not_allowed' };

  const userId = String(formData.get('userId') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const reason = String(formData.get('reason') ?? '');
  const locale = String(formData.get('locale') ?? 'en');
  if (decision !== 'approve' && decision !== 'reject') return { error: 'invalid' };

  const h = await headers();
  const ip = h.get('x-forwarded-for');
  const res = await decideApplication({
    userId,
    adminId: session.user.id,
    decision,
    reason,
    ...(ip ? { ip } : {}),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath(`/${locale}/admin/applications/${userId}/`);
  revalidatePath(`/${locale}/admin/applications/`);
  return { done: decision };
}
