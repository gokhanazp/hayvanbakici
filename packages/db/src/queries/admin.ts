import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';

/**
 * ADMIN PANELI VERISI.
 *
 * ERISIM SINIRI — bu dosyanin en onemli kismi.
 *
 * Panel "sitedeki her seyi" GORMEZ. Bir yoneticinin isini yapmasi icin
 * gerekli olan seyi gorur; gerisi sorguya hic girmez:
 *
 *   GORUNMEZ                          NEDEN
 *   SIN (sitters.sin_encrypted)       CRA icin toplaniyor, insan okumaz.
 *                                     Sifreli; cozme anahtari uygulamada.
 *   Tam adres (exact_address_enc)     Yalnizca onaylanmis rezervasyonda
 *                                     ve yalnizca KARSI TARAFA acilir.
 *   Adli sicil raporunun icerigi      Zaten saklamiyoruz; yalnizca karar
 *                                     (gecti / insan incelemesi / ret).
 *   Ozel mesaj govdeleri              Sikayet uzerine ayri bir akisla
 *                                     acilmali, listede degil.
 *   Odeme kimlik bilgileri            Hicbir zaman bizde durmuyor.
 *
 * HER OKUMA DEGIL, her HASSAS okuma ve her KARAR audit_log'a yazilir
 * (recordAudit). Law 25 ve PIPEDA "gerektigi kadar" erisim bekliyor;
 * bunun kaniti kayittir.
 */

/* --------------------------------------------------------------- denetim */

export interface AuditEntry {
  actorId: string | null;
  action: string;
  entity: string;
  entityId?: string | undefined;
  before?: Record<string, unknown> | undefined;
  after?: Record<string, unknown> | undefined;
  ip?: string | undefined;
}

export async function recordAudit(db: Database, e: AuditEntry): Promise<void> {
  await withDbErrors(async () => {
    await db.execute(sql`
      INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after, ip)
      VALUES (${e.actorId}, ${e.action}, ${e.entity}, ${e.entityId ?? null},
              ${e.before ? JSON.stringify(e.before) : null}::jsonb,
              ${e.after ? JSON.stringify(e.after) : null}::jsonb,
              ${e.ip ?? null})
    `);
  });
}

export interface AuditRow {
  id: string;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  /**
   * Karar gerekcesi. Denetim kaydinda en cok aranan sey "neden reddedildi"
   * sorusunun cevabi; ayri bir sayfaya gomulu olsa kimse bakmaz.
   * after jsonb'sinin YALNIZCA bu alani okunuyor — govdenin tamami degil.
   */
  reason: string | null;
  at: string;
}

/**
 * @param kind 'decisions' goruntuleme kayitlarini disarida birakir.
 *   Her sayfa acilisi bir satir uretiyor; kararlar aradan kaybolmasin diye
 *   varsayilan liste degil, ayri bir gorunum olarak sunuluyor.
 */
export async function listAudit(
  db: Database, limit = 100, kind: 'all' | 'decisions' = 'all',
): Promise<AuditRow[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT a.id::text, a.action, a.entity, a.entity_id, a.created_at,
             a.after->>'reason' AS reason,
             COALESCE(p.first_name, u.email) AS actor_name
      FROM audit_log a
      LEFT JOIN users u ON u.id = a.actor_id
      LEFT JOIN profiles p ON p.user_id = a.actor_id
      ${kind === 'decisions' ? sql`WHERE a.action <> 'admin.view'` : sql``}
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      actorName: (r.actor_name as string | null) ?? null,
      action: String(r.action),
      entity: String(r.entity),
      entityId: (r.entity_id as string | null) ?? null,
      reason: (r.reason as string | null) ?? null,
      at: new Date(r.created_at as Date).toISOString(),
    }));
  });
}

/* ---------------------------------------------------------------- ozet */

export interface AdminOverview {
  pendingApplications: number;
  manualReviews: number;
  activeSitters: number;
  owners: number;
  bookingsByStatus: Array<{ status: string; count: number }>;
  citiesWithSupply: number;
  reviewsPublished: number;
}

export async function getOverview(db: Database): Promise<AdminOverview> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT
        (SELECT count(*)::int FROM sitters WHERE status = 'pending') AS pending_applications,
        (SELECT count(*)::int FROM verifications WHERE status = 'manual_review') AS manual_reviews,
        (SELECT count(*)::int FROM sitters WHERE status = 'active') AS active_sitters,
        (SELECT count(*)::int FROM users WHERE role IN ('owner','both')) AS owners,
        (SELECT count(DISTINCT p.city_id)::int
           FROM sitters s JOIN profiles p ON p.user_id = s.user_id
          WHERE s.status = 'active') AS cities_with_supply,
        (SELECT count(*)::int FROM reviews WHERE published_at IS NOT NULL) AS reviews_published
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0] ?? {};

    const statuses = await db.execute(sql`
      SELECT status::text, count(*)::int AS n FROM bookings GROUP BY status ORDER BY n DESC
    `);

    return {
      pendingApplications: Number(r.pending_applications ?? 0),
      manualReviews: Number(r.manual_reviews ?? 0),
      activeSitters: Number(r.active_sitters ?? 0),
      owners: Number(r.owners ?? 0),
      citiesWithSupply: Number(r.cities_with_supply ?? 0),
      reviewsPublished: Number(r.reviews_published ?? 0),
      bookingsByStatus: (statuses as unknown as Array<Record<string, unknown>>).map((s) => ({
        status: String(s.status), count: Number(s.n),
      })),
    };
  });
}

/* --------------------------------------------------------- basvurular */

export interface ApplicationRow {
  userId: string;
  firstName: string;
  lastNameInitial: string;
  email: string;
  cityName: string | null;
  status: string;
  /** Dogrulama durumlari — YALNIZCA durum, rapor icerigi degil */
  verifications: Array<{ type: string; status: string }>;
  submittedAt: string;
}

/**
 * Insan karari bekleyenler. Sira BEKLEME SURESINE gore: en uzun bekleyen
 * en ustte. Bir basvuruyu unutmak, reddetmekten daha kotu.
 */
export async function listApplications(
  db: Database, filter: 'pending' | 'all' = 'pending',
): Promise<ApplicationRow[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT s.user_id::text, s.status, s.created_at,
             p.first_name, p.last_name_initial, u.email,
             c.name_en AS city_name,
             COALESCE(
               json_agg(json_build_object('type', v.type, 'status', v.status))
                 FILTER (WHERE v.id IS NOT NULL),
               '[]'
             ) AS verifications
      FROM sitters s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN profiles p ON p.user_id = s.user_id
      LEFT JOIN cities c ON c.id = p.city_id
      LEFT JOIN verifications v ON v.sitter_id = s.user_id
      ${filter === 'pending' ? sql`WHERE s.status = 'pending'` : sql``}
      GROUP BY s.user_id, s.status, s.created_at, p.first_name, p.last_name_initial, u.email, c.name_en
      ORDER BY s.created_at ASC
      LIMIT 100
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      userId: String(r.user_id),
      firstName: String(r.first_name ?? ''),
      lastNameInitial: String(r.last_name_initial ?? ''),
      email: String(r.email),
      cityName: (r.city_name as string | null) ?? null,
      status: String(r.status),
      verifications: (r.verifications as Array<{ type: string; status: string }>) ?? [],
      submittedAt: new Date(r.created_at as Date).toISOString(),
    }));
  });
}

export interface ApplicationDetail extends ApplicationRow {
  bio: string | null;
  province: string | null;
  neighbourhood: string | null;
  /** Sifreli alanlarin VARLIGI — degeri degil */
  hasExactAddress: boolean;
  hasSin: boolean;
  dateOfBirthYear: string | null;
  services: Array<{ serviceType: string; priceCents: number }>;
  consents: Array<{ purpose: string; granted: boolean; at: string }>;
  decisions: Array<{ type: string; outcome: string; at: string; humanOutcome: string | null }>;
  deactivationReason: string | null;
}

export async function getApplication(
  db: Database, userId: string,
): Promise<ApplicationDetail | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT s.user_id::text, s.status, s.created_at, s.deactivation_reason,
             p.first_name, p.last_name_initial, p.bio, p.province,
             u.email, c.name_en AS city_name, n.name_en AS neighbourhood,
             /*
               Sifreli alanlar: VAR MI diye bakiyoruz, ICINE bakmiyoruz.
               Yonetici adresi gormek zorunda degil; gormesi gereken sey
               basvurunun tamamlanip tamamlanmadigi.
             */
             (p.exact_address_enc IS NOT NULL) AS has_exact_address,
             (s.sin_encrypted IS NOT NULL) AS has_sin,
             -- Dogum tarihinden yalnizca YIL: yas kontrolu icin yeterli
             left(s.date_of_birth, 4) AS dob_year
      FROM sitters s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN profiles p ON p.user_id = s.user_id
      LEFT JOIN cities c ON c.id = p.city_id
      LEFT JOIN neighbourhoods n ON n.id = p.neighbourhood_id
      WHERE s.user_id = ${userId}
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;

    const [vers, svcs, consents, decisions] = await Promise.all([
      db.execute(sql`SELECT type::text, status::text FROM verifications WHERE sitter_id = ${userId}`),
      db.execute(sql`SELECT service_type::text, price_cents FROM sitter_services WHERE sitter_id = ${userId}`),
      db.execute(sql`
        SELECT type::text AS purpose, granted, created_at FROM consent_records
        WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
      `),
      db.execute(sql`
        SELECT decision_type, outcome, created_at, human_review_outcome
        FROM automated_decisions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 20
      `),
    ]);

    return {
      userId: String(r.user_id),
      firstName: String(r.first_name ?? ''),
      lastNameInitial: String(r.last_name_initial ?? ''),
      email: String(r.email),
      cityName: (r.city_name as string | null) ?? null,
      neighbourhood: (r.neighbourhood as string | null) ?? null,
      province: (r.province as string | null) ?? null,
      bio: (r.bio as string | null) ?? null,
      status: String(r.status),
      hasExactAddress: Boolean(r.has_exact_address),
      hasSin: Boolean(r.has_sin),
      dateOfBirthYear: (r.dob_year as string | null) ?? null,
      deactivationReason: (r.deactivation_reason as string | null) ?? null,
      submittedAt: new Date(r.created_at as Date).toISOString(),
      verifications: (vers as unknown as Array<Record<string, unknown>>).map((v) => ({
        type: String(v.type), status: String(v.status),
      })),
      services: (svcs as unknown as Array<Record<string, unknown>>).map((s) => ({
        serviceType: String(s.service_type), priceCents: Number(s.price_cents),
      })),
      consents: (consents as unknown as Array<Record<string, unknown>>).map((c) => ({
        purpose: String(c.purpose), granted: Boolean(c.granted),
        at: new Date(c.created_at as Date).toISOString(),
      })),
      decisions: (decisions as unknown as Array<Record<string, unknown>>).map((d) => ({
        type: String(d.decision_type), outcome: String(d.outcome),
        at: new Date(d.created_at as Date).toISOString(),
        humanOutcome: (d.human_review_outcome as string | null) ?? null,
      })),
    };
  });
}

export type DecisionResult =
  | { ok: true }
  | { ok: false; error: 'not_found' | 'reason_required' | 'invalid_state' };

/**
 * BASVURU KARARI — yalnizca insan verir.
 *
 * Reddin GEREKCESI ZORUNLU ve kayda geciyor. Iki sebep: Quebec Charter
 * s.18.2 ve Law 25 s.12.1 gereklerine ancak yazili gerekceyle cevap
 * verilebilir; ve sitede "cikarma yazili gerekceyle olur" diye yaziyor.
 * Sayfada yazip kodda uygulamamak, sozu hic vermemekten kotudur.
 */
export async function decideApplication(
  db: Database,
  input: {
    userId: string;
    adminId: string;
    decision: 'approve' | 'reject';
    reason: string;
    ip?: string | undefined;
  },
): Promise<DecisionResult> {
  const reason = input.reason.trim();
  if (input.decision === 'reject' && reason.length < 10) {
    return { ok: false, error: 'reason_required' };
  }

  return withDbErrors(async () => {
    const rows = await db.execute(sql`SELECT status FROM sitters WHERE user_id = ${input.userId} LIMIT 1`);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };
    const before = String(row.status);
    if (before !== 'pending') return { ok: false as const, error: 'invalid_state' as const };

    if (input.decision === 'approve') {
      await db.execute(sql`
        UPDATE sitters SET status = 'active', activated_at = now() WHERE user_id = ${input.userId}
      `);
    } else {
      await db.execute(sql`
        UPDATE sitters
        SET status = 'deactivated', deactivated_at = now(), deactivation_reason = ${reason}
        WHERE user_id = ${input.userId}
      `);
    }

    // Otomatik karar kaydi varsa insan incelemesinin sonucu oraya islenir
    await db.execute(sql`
      UPDATE automated_decisions
      SET human_reviewed_at = now(), human_reviewer_id = ${input.adminId},
          human_review_outcome = ${input.decision}
      WHERE user_id = ${input.userId} AND human_reviewed_at IS NULL
    `);

    await db.execute(sql`
      UPDATE verifications
      SET decision = ${input.decision}, decided_by = ${input.adminId}, decided_at = now()
      WHERE sitter_id = ${input.userId} AND status = 'manual_review'
    `);

    await recordAudit(db, {
      actorId: input.adminId,
      action: input.decision === 'approve' ? 'sitter.approve' : 'sitter.reject',
      entity: 'sitter',
      entityId: input.userId,
      before: { status: before },
      after: { status: input.decision === 'approve' ? 'active' : 'deactivated', reason },
      ...(input.ip ? { ip: input.ip } : {}),
    });

    return { ok: true as const };
  });
}

/* ----------------------------------------------------------- listeler */

export interface AdminBookingRow {
  id: string;
  status: string;
  serviceType: string;
  startAt: string;
  ownerName: string;
  sitterName: string;
  ownerTotalCents: number;
  createdAt: string;
}

export async function listAllBookings(
  db: Database, status?: string | undefined,
): Promise<AdminBookingRow[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT b.id::text, b.status::text, b.service_type::text, b.start_at,
             b.owner_total_cents, b.created_at,
             COALESCE(op.first_name, '—') AS owner_name,
             COALESCE(sp.first_name, '—') AS sitter_name
      FROM bookings b
      LEFT JOIN profiles op ON op.user_id = b.owner_id
      LEFT JOIN profiles sp ON sp.user_id = b.sitter_id
      ${status ? sql`WHERE b.status = ${status}::booking_status` : sql``}
      ORDER BY b.created_at DESC
      LIMIT 100
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      status: String(r.status),
      serviceType: String(r.service_type),
      startAt: new Date(r.start_at as Date).toISOString(),
      ownerName: String(r.owner_name),
      sitterName: String(r.sitter_name),
      ownerTotalCents: Number(r.owner_total_cents),
      createdAt: new Date(r.created_at as Date).toISOString(),
    }));
  });
}

/** Yonetici mi — sayfa korumasi bunu kullanir. */
export async function isAdmin(db: Database, userId: string): Promise<boolean> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT 1 FROM users WHERE id = ${userId} AND role = 'admin' LIMIT 1
    `);
    return (rows as unknown as unknown[]).length > 0;
  });
}
