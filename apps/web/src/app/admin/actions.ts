'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { clientIp } from '@/lib/admin';
import {
  isAdmin, decideApplication, setSuspension, setRole, addNote,
  setReviewHidden, resolveReport, createReport, adminSetBookingStatus,
} from '@/lib/data';
import type { ActionState } from '@/components/admin/ReasonAction';

/**
 * PANELIN TUM YAZMA ISLEMLERI.
 *
 * YETKI HER EYLEMDE YENIDEN KONTROL EDILIYOR.
 * Sayfa korumasi (requireAdmin) GORUNURLUK icindir; sunucu eylemleri
 * sayfadan bagimsiz cagrilabilen HTTP uc noktalaridir. "Zaten duzende
 * kontrol ediliyor" demek, adresi bilen herkese acik bir kapi birakmaktir.
 *
 * `guard()` bu kontrolu tek yerde topluyor ki yeni bir eylem yazan kisi
 * unutmasin.
 */
async function guard(): Promise<{ id: string } | null> {
  const session = await getSession();
  if (!session) return null;
  if (!(await isAdmin(session.user.id))) return null;
  return { id: session.user.id };
}

const field = (f: FormData, name: string) => String(f.get(name) ?? '');

/* ------------------------------------------------------------ basvuru */

export async function decideApplicationAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  const admin = await guard();
  if (!admin) return { error: 'not_allowed' };

  const userId = field(form, 'userId');
  const decision = field(form, 'decision');
  if (decision !== 'approve' && decision !== 'reject') return { error: 'invalid' };

  const ip = await clientIp();
  const res = await decideApplication({
    userId, adminId: admin.id, decision, reason: field(form, 'reason'), ...(ip ? { ip } : {}),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath('/admin/applications');
  revalidatePath(`/admin/users/${userId}`);
  return { done: decision };
}

/* -------------------------------------------------------- kullanicilar */

export async function suspensionAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  const admin = await guard();
  if (!admin) return { error: 'not_allowed' };

  const userId = field(form, 'userId');
  const decision = field(form, 'decision');
  if (decision !== 'suspend' && decision !== 'restore') return { error: 'invalid' };

  const ip = await clientIp();
  const res = await setSuspension({
    userId, adminId: admin.id, suspend: decision === 'suspend',
    reason: field(form, 'reason'), ...(ip ? { ip } : {}),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath(`/admin/users/${userId}`);
  revalidatePath('/admin/users');
  return { done: decision };
}

export async function roleAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await guard();
  if (!admin) return { error: 'not_allowed' };

  const userId = field(form, 'userId');
  const decision = field(form, 'decision');
  const allowed = ['owner', 'sitter', 'both', 'admin'] as const;
  const role = allowed.find((r) => r === decision);
  if (!role) return { error: 'invalid' };

  const ip = await clientIp();
  const res = await setRole({
    userId, adminId: admin.id, role, reason: field(form, 'reason'), ...(ip ? { ip } : {}),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath(`/admin/users/${userId}`);
  return { done: decision };
}

/**
 * IC NOT. Tek dugmeli duz form — gerekce kutusu degil, notun kendisi.
 * Basarisizlikta sessiz kalmiyor: bos not eklenmiyor ve sayfa yenileniyor.
 */
export async function addNoteAction(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  const entityType = field(form, 'entityType');
  const entityId = field(form, 'entityId');
  const body = field(form, 'body');
  if (body.trim().length < 3) return;

  await addNote({ entityType, entityId, authorId: admin.id, body });
  revalidatePath(`/admin/${entityType === 'booking' ? 'bookings' : 'users'}/${entityId}`);
}

/* ---------------------------------------------------------- moderasyon */

export async function reviewAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await guard();
  if (!admin) return { error: 'not_allowed' };

  const reviewId = field(form, 'reviewId');
  const decision = field(form, 'decision');
  if (decision !== 'hide' && decision !== 'restore') return { error: 'invalid' };

  const ip = await clientIp();
  const res = await setReviewHidden({
    reviewId, adminId: admin.id, hide: decision === 'hide',
    reason: field(form, 'reason'), ...(ip ? { ip } : {}),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath('/admin/reviews');
  return { done: decision };
}

export async function reportAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await guard();
  if (!admin) return { error: 'not_allowed' };

  const reportId = field(form, 'reportId');
  const decision = field(form, 'decision');
  if (decision !== 'actioned' && decision !== 'dismissed' && decision !== 'reviewing') {
    return { error: 'invalid' };
  }

  const ip = await clientIp();
  const res = await resolveReport({
    reportId, adminId: admin.id, outcome: decision,
    resolution: field(form, 'reason'), ...(ip ? { ip } : {}),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath('/admin/reports');
  return { done: decision };
}

/** Telefonla/e-postayla gelen sikayeti kayda gecirmek icin. */
export async function newReportAction(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  const allowed = ['user', 'review', 'message', 'booking'] as const;
  const subjectType = allowed.find((t) => t === field(form, 'subjectType'));
  const subjectId = field(form, 'subjectId');
  const reason = field(form, 'reason');
  if (!subjectType || subjectId.length < 10 || reason.trim().length < 3) return;

  await createReport({
    reporterId: admin.id,
    subjectType,
    subjectId,
    ...(subjectType === 'user' ? { subjectUserId: subjectId } : {}),
    reason,
    details: field(form, 'details') || undefined,
  });
  revalidatePath('/admin/reports');
}

/* --------------------------------------------------------- rezervasyon */

export async function bookingAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await guard();
  if (!admin) return { error: 'not_allowed' };

  const bookingId = field(form, 'bookingId');
  const decision = field(form, 'decision');
  const allowed = ['confirmed', 'cancelled', 'completed', 'declined'] as const;
  const to = allowed.find((t) => t === decision);
  if (!to) return { error: 'invalid' };

  const ip = await clientIp();
  const res = await adminSetBookingStatus({
    bookingId, adminId: admin.id, to, reason: field(form, 'reason'), ...(ip ? { ip } : {}),
  });
  if (!res.ok) return { error: res.error };

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath('/admin/bookings');
  return { done: decision };
}
