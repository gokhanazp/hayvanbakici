'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { setAvailability, isSitter } from '@/lib/data';

export type CalendarState = { error?: string | undefined; saved?: boolean | undefined };

/**
 * Secilen gunleri ac ya da kapat.
 *
 * 'booked' gunler veri katmaninda korunuyor (ON CONFLICT ... WHERE status
 * <> 'booked'): onaylanmis bir rezervasyonun gunu takvimden acilarak iptal
 * edilemez. Iptal kendi akisindan gecmeli, cunku iptal politikasi ve karsi
 * tarafa bildirim oraya bagli.
 */
export async function saveCalendarAction(
  _prev: CalendarState, formData: FormData,
): Promise<CalendarState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };
  if (!(await isSitter(session.user.id))) return { error: 'not_allowed' };

  const status = String(formData.get('status') ?? '');
  if (status !== 'open' && status !== 'blocked') return { error: 'invalid' };

  const dates = formData.getAll('day')
    .map((d) => String(d))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));
  if (dates.length === 0) return { error: 'invalid' };

  await setAvailability(session.user.id, dates, status);
  revalidatePath(`/${String(formData.get('locale') ?? 'en')}/account/sitter/calendar/`);
  return { saved: true };
}
