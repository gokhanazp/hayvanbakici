'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { clientIp } from '@/lib/admin';
import {
  isAdmin, decideApplication, setSuspension, setRole, addNote,
  setReviewHidden, resolveReport, createReport, adminSetBookingStatus,
  getRawMessage, getReport, recordAudit,
  saveCommissionSettings, getCommissionSettings, createCampaign, endCampaign,
} from '@/lib/data';
import { validateCommissionSettings, validateCampaign } from '@havre/core';
import type { SettingsState } from '@/components/admin/CommissionForms';
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

/* -------------------------------------------------------------- mesaj */

export type RevealState = {
  error?: string | undefined;
  message?: {
    body: string;
    redacted: string;
    senderName: string | null;
    createdAt: string;
  } | undefined;
};

/**
 * HAM MESAJI ACMA — sikayet dosyasi uzerinden, tek mesaj.
 *
 * Panelde mesaj listesi yok; buraya gelmenin tek yolu birinin o mesaji
 * sikayet etmis olmasi. Bu yuzden eylem `reportId` ISTIYOR ve sikayetin
 * gercekten O MESAJ hakkinda oldugunu dogruluyor: elde bir sikayet id'si
 * olmadan hicbir mesaj acilamaz.
 *
 * Kayit yazilmadan icerik DONMUYOR — `recordAudit` await ediliyor ve
 * hata verirse mesaj gosterilmiyor. Erisimi kaydetmeden goruntulemek,
 * kaydi hic tutmamakla ayni sey.
 */
export async function revealMessageAction(
  _prev: RevealState, form: FormData,
): Promise<RevealState> {
  const admin = await guard();
  if (!admin) return { error: 'not_allowed' };

  const reportId = field(form, 'reportId');
  const messageId = field(form, 'messageId');
  if (!reportId || !messageId) return { error: 'invalid' };

  const report = await getReport(reportId);
  if (!report || report.subjectType !== 'message' || report.subjectId !== messageId) {
    return { error: 'not_allowed' };
  }

  const raw = await getRawMessage(messageId);
  if (!raw) return { error: 'not_found' };

  const ip = await clientIp();
  await recordAudit({
    actorId: admin.id,
    action: 'admin.reveal',
    entity: 'message',
    entityId: messageId,
    // Gerekce denetim listesinde `after.reason` olarak okunuyor
    after: { reason: `report ${reportId}: ${report.reason}`, conversationId: raw.conversationId },
    ...(ip ? { ip } : {}),
  });

  return {
    message: {
      body: raw.body,
      redacted: raw.redacted,
      senderName: raw.senderName,
      createdAt: raw.createdAt,
    },
  };
}

/* ------------------------------------------------------- komisyon ayarlari */

/**
 * ORAN DEGISIKLIGI — PANELIN PARAYA DOKUNAN TEK YERI.
 *
 * UC SEY BURADA GARANTI ALTINA ALINIYOR:
 *
 *  1. Yetki her eylemde yeniden kontrol ediliyor (guard).
 *  2. Dogrulama packages/core icinde, yani ayni kural hem ekranda hem
 *     burada. Ekrandaki kontrol kolaylik; BAGLAYICI OLAN BURASI.
 *  3. Her degisiklik denetim kaydina oncesi/sonrasi ile yaziliyor
 *     (saveCommissionSettings icinde).
 *
 * GECMISE DONUK DEGIL: rezervasyonun komisyonu istek aninda hesaplanip
 * satirina yaziliyor. Buradaki degisiklik yalnizca BUNDAN SONRAKI
 * istekleri etkiler.
 *
 * `revalidatePath` yayinlanan sayfalar icin: ucret sayfasi, bakici
 * davet sayfasi, yardim ve sozlesme oranlari veritabanindan okuyor ve
 * ISR ile onbellekte. Tazelenmezse site bir sure ESKI orani yayinlar —
 * ve o sayfalar "her ucret burada yaziyor" diyor.
 */
export async function saveCommissionAction(
  _prev: SettingsState, form: FormData,
): Promise<SettingsState> {
  const admin = await guard();
  if (!admin) return { errors: { form: 'not_allowed' } };

  const num = (name: string) => Number(String(form.get(name) ?? '').replace(',', '.'));

  const input = {
    sitterPct: {
      platform: num('platform'),
      repeat: num('repeat'),
      sitter_referral: num('referral'),
    },
    ownerPct: num('ownerPct'),
    /* Ekranda DOLAR, veritabaninda cent. Yuvarlama burada bir kez. */
    ownerFeeCapCents: Math.round(num('ownerFeeCap') * 100),
    launchPromoMonths: Math.round(num('launchPromoMonths')),
  };

  const errors = validateCommissionSettings(input);
  if (Object.keys(errors).length) return { errors };

  const ip = await clientIp();
  await saveCommissionSettings({ adminId: admin.id, ...input, ...(ip ? { ip } : {}) });

  revalidateRates();
  return { saved: true };
}

export async function createCampaignAction(
  _prev: SettingsState, form: FormData,
): Promise<SettingsState> {
  const admin = await guard();
  if (!admin) return { errors: { form: 'not_allowed' } };

  const optionalPct = (name: string): number | undefined => {
    const raw = String(form.get(name) ?? '').trim();
    /* BOS = "bu atif icin indirim yok". Sifir ile ayni sey degil:
       sifir "komisyon almiyoruz" demek ve kasitli bir karar. */
    if (raw === '') return undefined;
    return Number(raw.replace(',', '.'));
  };

  /*
    Tarih alani GUN veriyor, saat vermiyor. Baslangic gunun basi,
    bitis gunun basi: "1 Aralik'ta basla, 1 Subat'ta bit" dendiginde
    Ocak'in son gunu dahil, Subat'in ilki degil. Ekranda da boyle
    yaziyor.
  */
  const day = (name: string) => {
    const raw = String(form.get(name) ?? '').trim();
    return raw === '' ? '' : `${raw}T00:00:00.000Z`;
  };

  const input = {
    name: String(form.get('name') ?? ''),
    sitterPct: {
      ...(optionalPct('cPlatform') === undefined ? {} : { platform: optionalPct('cPlatform')! }),
      ...(optionalPct('cRepeat') === undefined ? {} : { repeat: optionalPct('cRepeat')! }),
      ...(optionalPct('cReferral') === undefined ? {} : { sitter_referral: optionalPct('cReferral')! }),
    },
    startsAt: day('startsAt'),
    endsAt: day('endsAt'),
  };

  const base = await getCommissionSettings();
  const errors = validateCampaign(input, {
    sitterPct: base.sitterPct,
    ownerPct: base.ownerPct,
    ownerFeeCapCents: base.ownerFeeCapCents,
    launchPromoMonths: base.launchPromoMonths,
  });
  if (Object.keys(errors).length) return { errors };

  const ip = await clientIp();
  const res = await createCampaign({ adminId: admin.id, ...input, ...(ip ? { ip } : {}) });
  if (!res.ok) return { errors: { form: 'error.overlap' } };

  revalidateRates();
  return { saved: true };
}

/** Kampanyayi erken bitirir. Kayit SILINMIYOR, yalnizca isaretleniyor. */
export async function endCampaignAction(form: FormData): Promise<void> {
  const admin = await guard();
  if (!admin) return;
  const campaignId = field(form, 'campaignId');
  if (!campaignId) return;

  const ip = await clientIp();
  await endCampaign({ adminId: admin.id, campaignId, ...(ip ? { ip } : {}) });
  revalidateRates();
}

/**
 * Oranlari YAYINLAYAN her sayfa.
 *
 * Listeyi tek yerde tutmak sart: yeni bir sayfa oran yazdiginda buraya
 * eklenmezse, o sayfa eski orani yayinlamaya devam eder ve kimse fark
 * etmez. Sayfalarin kendi `revalidate` suresi de var — bu liste
 * unutulursa site en fazla bes dakika eski kalir, sonsuza kadar degil.
 */
function revalidateRates(): void {
  revalidatePath('/admin/settings');
  for (const seg of ['en', 'fr']) {
    revalidatePath(`/${seg}/pricing`);
    revalidatePath(`/${seg}/become-a-sitter`);
    revalidatePath(`/${seg}/help`);
    revalidatePath(`/${seg}/legal/sitter-agreement`);
  }
}
