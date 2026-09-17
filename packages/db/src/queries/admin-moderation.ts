import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import { recordAudit } from './admin.js';
import type { AdminActionResult } from './admin-users.js';

/**
 * MODERASYON: yorumlar ve sikayetler.
 *
 * YORUMDA TEK YETKI GIZLEMEKTIR.
 * Competition Act (§8.6): yorumlar duzenlenmez, kirpilmaz, secilerek
 * yayinlanmaz. Bu dosyada bir yorumun metnini degistiren tek bir sorgu
 * yok ve olmayacak. Yonetici yalnizca gerekce yazarak gizleyebilir; gerekce
 * kayitta kalir, gizleme geri alinabilir.
 *
 * Gizlenen yorum bakicinin puan ortalamasindan da dusulur — aksi halde
 * "gorunmuyor ama puani etkiliyor" gibi acik bir tutarsizlik olurdu.
 */

export interface ModerationReview {
  id: string;
  rating: number;
  body: string | null;
  direction: string;
  authorName: string | null;
  subjectName: string | null;
  subjectId: string;
  bookingId: string;
  publishedAt: string | null;
  hiddenAt: string | null;
  hiddenReason: string | null;
  reportCount: number;
  createdAt: string;
}

export type ReviewFilter = 'all' | 'published' | 'hidden' | 'reported' | 'low';

/**
 * ARAMA VE SAYFALAMA — DUZELTILEN EKSIK.
 *
 * 1136 yorum vardi, ekranda 60'i goruluyordu ve **kesildigi bile
 * yazmiyordu** (rezervasyon listesi en azindan "en yeni 100" diyordu).
 * Bir yorumu bulmanin baska yolu yoktu.
 *
 * Arama yorumun METNINDE ve taraflarin adinda/e-postasinda; "bize
 * soyle bir yorum sikayet edildi" denildiginde aranan sey bu.
 */
function reviewSearch(term: string) {
  if (!term) return sql``;
  const like = `%${term.toLowerCase()}%`;
  return sql`AND (
    r.id::text LIKE ${term.toLowerCase() + '%'}
    OR lower(COALESCE(r.body, '')) LIKE ${like}
    OR lower(COALESCE(ap.first_name, '')) LIKE ${like}
    OR lower(COALESCE(sp.first_name, '')) LIKE ${like}
    OR lower(COALESCE(au.email, '')) LIKE ${like}
    OR lower(COALESCE(su.email, '')) LIKE ${like}
  )`;
}

function reviewWhere(filter: ReviewFilter) {
  return filter === 'published' ? sql`AND r.published_at <= now() AND r.hidden_at IS NULL`
    : filter === 'hidden' ? sql`AND r.hidden_at IS NOT NULL`
    : filter === 'low' ? sql`AND r.rating <= 2`
    : filter === 'reported' ? sql`AND EXISTS (
        SELECT 1 FROM reports rp
        WHERE rp.subject_type = 'review' AND rp.subject_id = r.id AND rp.status <> 'dismissed')`
    : sql``;
}

/** Aramaya/filtreye uyan toplam yorum — sayfalama icin. */
export async function countReviews(
  db: Database, filter: ReviewFilter = 'all', q?: string | undefined,
): Promise<number> {
  const term = (q ?? '').trim();
  return withDbErrors(async () => {
    const rows = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n
      FROM reviews r
      LEFT JOIN users au ON au.id = r.author_id
      LEFT JOIN profiles ap ON ap.user_id = r.author_id
      LEFT JOIN users su ON su.id = r.subject_id
      LEFT JOIN profiles sp ON sp.user_id = r.subject_id
      WHERE TRUE ${reviewWhere(filter)} ${reviewSearch(term)}
    `) as unknown as Array<{ n: number }>;
    return rows[0]?.n ?? 0;
  });
}

export async function listReviews(
  db: Database, filter: ReviewFilter = 'all', limit = 100,
  q?: string | undefined, offset = 0,
): Promise<ModerationReview[]> {
  const term = (q ?? '').trim();
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT r.id::text, r.rating, r.body, r.direction, r.booking_id::text, r.subject_id::text,
             r.published_at, r.hidden_at, r.hidden_reason, r.created_at,
             COALESCE(ap.first_name, au.email) AS author_name,
             COALESCE(sp.first_name, su.email) AS subject_name,
             (SELECT count(*)::int FROM reports rp
               WHERE rp.subject_type = 'review' AND rp.subject_id = r.id) AS report_count
      FROM reviews r
      LEFT JOIN users au ON au.id = r.author_id
      LEFT JOIN profiles ap ON ap.user_id = r.author_id
      LEFT JOIN users su ON su.id = r.subject_id
      LEFT JOIN profiles sp ON sp.user_id = r.subject_id
      WHERE TRUE ${reviewWhere(filter)} ${reviewSearch(term)}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      rating: Number(r.rating),
      body: (r.body as string | null) ?? null,
      direction: String(r.direction),
      bookingId: String(r.booking_id),
      subjectId: String(r.subject_id),
      authorName: (r.author_name as string | null) ?? null,
      subjectName: (r.subject_name as string | null) ?? null,
      publishedAt: r.published_at ? new Date(r.published_at as Date).toISOString() : null,
      hiddenAt: r.hidden_at ? new Date(r.hidden_at as Date).toISOString() : null,
      hiddenReason: (r.hidden_reason as string | null) ?? null,
      reportCount: Number(r.report_count ?? 0),
      createdAt: new Date(r.created_at as Date).toISOString(),
    }));
  });
}

/** Bir bakicinin puan ozetini yayindaki yorumlardan YENIDEN hesaplar. */
async function recomputeRating(db: Database, subjectId: string): Promise<void> {
  await db.execute(sql`
    UPDATE sitters st SET
      review_count = COALESCE(agg.n, 0),
      average_rating = COALESCE(agg.avg, 0)
    FROM (
      SELECT count(*)::int AS n, round(avg(rating)::numeric, 1)::float8 AS avg
      FROM reviews
      WHERE subject_id = ${subjectId}
        AND direction = 'owner_to_sitter'
        AND published_at <= now()
        AND hidden_at IS NULL
    ) agg
    WHERE st.user_id = ${subjectId}
  `);
}

export async function setReviewHidden(
  db: Database,
  input: {
    reviewId: string; adminId: string; hide: boolean; reason: string; ip?: string | undefined;
  },
): Promise<AdminActionResult> {
  const reason = input.reason.trim();
  if (input.hide && reason.length < 10) return { ok: false, error: 'reason_required' };

  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT subject_id::text, (hidden_at IS NOT NULL) AS hidden
      FROM reviews WHERE id = ${input.reviewId} LIMIT 1
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };
    if (Boolean(row.hidden) === input.hide) {
      return { ok: false as const, error: 'invalid_state' as const };
    }

    if (input.hide) {
      await db.execute(sql`
        UPDATE reviews SET hidden_at = now(), hidden_reason = ${reason}, hidden_by = ${input.adminId}
        WHERE id = ${input.reviewId}
      `);
    } else {
      await db.execute(sql`
        UPDATE reviews SET hidden_at = NULL, hidden_reason = NULL, hidden_by = NULL
        WHERE id = ${input.reviewId}
      `);
    }

    await recomputeRating(db, String(row.subject_id));

    await recordAudit(db, {
      actorId: input.adminId,
      action: input.hide ? 'review.hide' : 'review.restore',
      entity: 'review',
      entityId: input.reviewId,
      after: { reason },
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return { ok: true as const };
  });
}

/* ------------------------------------------------------------ sikayetler */

export interface ReportRow {
  id: string;
  subjectType: string;
  subjectId: string;
  subjectUserName: string | null;
  subjectUserId: string | null;
  reporterName: string | null;
  /** Sikayeti KIM acti — mesaj acma kuralinin dayanagi. */
  reporterId: string | null;
  reason: string;
  details: string | null;
  status: string;
  resolution: string | null;
  handledByName: string | null;
  handledAt: string | null;
  createdAt: string;
}

export async function listReports(
  db: Database, status: 'open' | 'all' = 'open',
): Promise<ReportRow[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT r.id::text, r.subject_type::text, r.subject_id::text, r.subject_user_id::text,
             r.reporter_id::text,
             r.reason, r.details, r.status::text, r.resolution, r.handled_at, r.created_at,
             COALESCE(rp.first_name, ru.email) AS reporter_name,
             COALESCE(sp.first_name, su.email) AS subject_user_name,
             COALESCE(hp.first_name, hu.email) AS handled_by_name
      FROM reports r
      LEFT JOIN users ru ON ru.id = r.reporter_id
      LEFT JOIN profiles rp ON rp.user_id = r.reporter_id
      LEFT JOIN users su ON su.id = r.subject_user_id
      LEFT JOIN profiles sp ON sp.user_id = r.subject_user_id
      LEFT JOIN users hu ON hu.id = r.handled_by
      LEFT JOIN profiles hp ON hp.user_id = r.handled_by
      ${status === 'open' ? sql`WHERE r.status IN ('open', 'reviewing')` : sql``}
      -- En eski sikayet en ustte: bekleyen sikayet, kapatilan sikayetten kotudur
      ORDER BY (r.status IN ('open','reviewing')) DESC, r.created_at ASC
      LIMIT 200
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      subjectType: String(r.subject_type),
      subjectId: String(r.subject_id),
      subjectUserId: (r.subject_user_id as string | null) ?? null,
      subjectUserName: (r.subject_user_name as string | null) ?? null,
      reporterName: (r.reporter_name as string | null) ?? null,
      reporterId: (r.reporter_id as string | null) ?? null,
      reason: String(r.reason),
      details: (r.details as string | null) ?? null,
      status: String(r.status),
      resolution: (r.resolution as string | null) ?? null,
      handledByName: (r.handled_by_name as string | null) ?? null,
      handledAt: r.handled_at ? new Date(r.handled_at as Date).toISOString() : null,
      createdAt: new Date(r.created_at as Date).toISOString(),
    }));
  });
}

/**
 * TEK sikayet.
 *
 * Ham mesaji acma eyleminin dogrulamasi icin var: "bu sikayet gercekten
 * bu mesaj hakkinda mi". Listeden secmek YETMEZ — sunucu eylemi listeden
 * bagimsiz cagrilabiliyor, yani id'ler uydurulabiliyor.
 */
export async function getReport(db: Database, reportId: string): Promise<ReportRow | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT r.id::text, r.subject_type::text, r.subject_id::text, r.subject_user_id::text,
             r.reporter_id::text,
             r.reason, r.details, r.status::text, r.resolution, r.handled_at, r.created_at,
             COALESCE(rp.first_name, ru.email) AS reporter_name,
             COALESCE(sp.first_name, su.email) AS subject_user_name,
             COALESCE(hp.first_name, hu.email) AS handled_by_name
      FROM reports r
      LEFT JOIN users ru ON ru.id = r.reporter_id
      LEFT JOIN profiles rp ON rp.user_id = r.reporter_id
      LEFT JOIN users su ON su.id = r.subject_user_id
      LEFT JOIN profiles sp ON sp.user_id = r.subject_user_id
      LEFT JOIN users hu ON hu.id = r.handled_by
      LEFT JOIN profiles hp ON hp.user_id = r.handled_by
      WHERE r.id = ${reportId}
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;
    return {
      id: String(r.id),
      subjectType: String(r.subject_type),
      subjectId: String(r.subject_id),
      subjectUserId: (r.subject_user_id as string | null) ?? null,
      subjectUserName: (r.subject_user_name as string | null) ?? null,
      reporterName: (r.reporter_name as string | null) ?? null,
      reporterId: (r.reporter_id as string | null) ?? null,
      reason: String(r.reason),
      details: (r.details as string | null) ?? null,
      status: String(r.status),
      resolution: (r.resolution as string | null) ?? null,
      handledByName: (r.handled_by_name as string | null) ?? null,
      handledAt: r.handled_at ? new Date(r.handled_at as Date).toISOString() : null,
      createdAt: new Date(r.created_at as Date).toISOString(),
    };
  });
}

export const REPORT_SUBJECTS = ['user', 'review', 'message', 'booking'] as const;

/**
 * Sikayet acmak. Bugun yalnizca destek ekibi kullaniyor (telefon/e-posta
 * ile gelen sikayeti kayda gecirmek icin); kullanici tarafindaki "bildir"
 * dugmesi mesajlasma ile birlikte gelecek ve ayni tabloyu kullanacak.
 */
export async function createReport(
  db: Database,
  input: {
    reporterId: string; subjectType: (typeof REPORT_SUBJECTS)[number]; subjectId: string;
    subjectUserId?: string | undefined; reason: string; details?: string | undefined;
  },
): Promise<AdminActionResult> {
  const reason = input.reason.trim();
  if (reason.length < 3) return { ok: false, error: 'reason_required' };
  return withDbErrors(async () => {
    await db.execute(sql`
      INSERT INTO reports (reporter_id, subject_type, subject_id, subject_user_id, reason, details)
      VALUES (${input.reporterId}, ${input.subjectType}::report_subject, ${input.subjectId},
              ${input.subjectUserId ?? null}, ${reason}, ${input.details ?? null})
    `);
    return { ok: true as const };
  });
}

/**
 * Sikayeti kapatmak. 'dismissed' de bir sonuc: NE YAPILDIGI yazilmadan
 * kapanmiyor. Sessizce kapatilan sikayet, kapatilmamis sayilir.
 */
export async function resolveReport(
  db: Database,
  input: {
    reportId: string; adminId: string; outcome: 'actioned' | 'dismissed' | 'reviewing';
    resolution: string; ip?: string | undefined;
  },
): Promise<AdminActionResult> {
  const resolution = input.resolution.trim();
  if (input.outcome !== 'reviewing' && resolution.length < 10) {
    return { ok: false, error: 'reason_required' };
  }

  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT status::text FROM reports WHERE id = ${input.reportId} LIMIT 1
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };
    const before = String(row.status);
    if (before === 'actioned' || before === 'dismissed') {
      return { ok: false as const, error: 'invalid_state' as const };
    }

    await db.execute(sql`
      UPDATE reports
      SET status = ${input.outcome}::report_status,
          resolution = ${resolution.length > 0 ? resolution : null},
          handled_by = ${input.adminId},
          handled_at = ${input.outcome === 'reviewing' ? sql`NULL` : sql`now()`}
      WHERE id = ${input.reportId}
    `);

    await recordAudit(db, {
      actorId: input.adminId,
      action: 'report.resolve',
      entity: 'report',
      entityId: input.reportId,
      before: { status: before },
      after: { status: input.outcome, reason: resolution },
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return { ok: true as const };
  });
}
