import { sql, type SQL } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import { recordAudit } from './admin.js';

/**
 * KULLANICI YONETIMI (yonetici paneli).
 *
 * Bu dosyadaki sorgularin hicbiri sunlari DONDURMEZ: sifre ozeti, oturum
 * jetonu, SIN, tam adres, mesaj govdesi. Yoneticinin isi bunlarla degil,
 * kimin kim oldugu ve kimin ne yaptigiyla.
 *
 * ARAMA: e-posta ve ada gore. Girdi HER ZAMAN bagli parametre — bu dosyada
 * hicbir kullanici metni SQL'e gomulmuyor (place.ts'te bir kez yapilmisti,
 * bir daha yapilmayacak). LIKE ozel karakterleri de kacisla korunuyor.
 */

/** LIKE icin kacis: kullanicinin yazdigi % ve _ joker olmamali. */
function likeSafe(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export type UserFilter = 'all' | 'owners' | 'sitters' | 'admins' | 'suspended';

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  locale: string;
  cityName: string | null;
  sitterStatus: string | null;
  bookingCount: number;
  suspended: boolean;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface UserPage {
  rows: AdminUserRow[];
  total: number;
}

export async function listUsers(
  db: Database,
  opts: { q?: string | undefined; filter?: UserFilter | undefined; page?: number | undefined } = {},
): Promise<UserPage> {
  const filter = opts.filter ?? 'all';
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const perPage = 50;
  const offset = (page - 1) * perPage;
  const q = (opts.q ?? '').trim();

  return withDbErrors(async () => {
    const where: SQL[] = [sql`u.deleted_at IS NULL`];

    if (q) {
      const pattern = `%${likeSafe(q)}%`;
      where.push(sql`(
        u.email ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(u.name, '') ILIKE ${pattern} ESCAPE '\\'
        OR COALESCE(p.first_name, '') ILIKE ${pattern} ESCAPE '\\'
      )`);
    }
    if (filter === 'owners') where.push(sql`u.role IN ('owner', 'both')`);
    if (filter === 'sitters') where.push(sql`s.user_id IS NOT NULL`);
    if (filter === 'admins') where.push(sql`u.role = 'admin'`);
    if (filter === 'suspended') where.push(sql`u.suspended_at IS NOT NULL`);

    const whereSql = sql.join(where, sql` AND `);

    const rows = await db.execute(sql`
      SELECT u.id::text, u.email, u.name, u.role::text, u.locale::text,
             u.created_at, u.last_active_at, (u.suspended_at IS NOT NULL) AS suspended,
             c.name_en AS city_name,
             s.status::text AS sitter_status,
             (SELECT count(*)::int FROM bookings b
               WHERE b.owner_id = u.id OR b.sitter_id = u.id) AS booking_count,
             count(*) OVER ()::int AS total
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN cities c ON c.id = p.city_id
      LEFT JOIN sitters s ON s.user_id = u.id
      WHERE ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT ${perPage} OFFSET ${offset}
    `);

    const list = rows as unknown as Array<Record<string, unknown>>;
    return {
      total: list.length > 0 ? Number(list[0]!.total) : 0,
      rows: list.map((r) => ({
        id: String(r.id),
        email: String(r.email),
        name: (r.name as string | null) ?? null,
        role: String(r.role),
        locale: String(r.locale),
        cityName: (r.city_name as string | null) ?? null,
        sitterStatus: (r.sitter_status as string | null) ?? null,
        bookingCount: Number(r.booking_count ?? 0),
        suspended: Boolean(r.suspended),
        createdAt: new Date(r.created_at as Date).toISOString(),
        lastActiveAt: r.last_active_at ? new Date(r.last_active_at as Date).toISOString() : null,
      })),
    };
  });
}

export interface AdminUserDetail extends AdminUserRow {
  emailVerified: boolean;
  phoneKnown: boolean;
  bio: string | null;
  neighbourhood: string | null;
  province: string | null;
  /** Bakici ise */
  sitterSlug: string | null;
  averageRating: number | null;
  reviewCount: number;
  services: Array<{ serviceType: string; priceCents: number }>;
  suspensionReason: string | null;
  recentBookings: Array<{
    id: string; status: string; serviceType: string; startAt: string;
    role: 'owner' | 'sitter'; counterpart: string; ownerTotalCents: number;
  }>;
  reviewsWritten: number;
  reportsAgainst: number;
}

export async function getUser(db: Database, userId: string): Promise<AdminUserDetail | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT u.id::text, u.email, u.name, u.role::text, u.locale::text,
             u.created_at, u.last_active_at, u.email_verified,
             (u.phone IS NOT NULL) AS phone_known,
             (u.suspended_at IS NOT NULL) AS suspended, u.suspension_reason,
             p.bio, p.province::text, c.name_en AS city_name, n.name_en AS neighbourhood,
             s.slug AS sitter_slug, s.status::text AS sitter_status,
             s.average_rating, s.review_count,
             (SELECT count(*)::int FROM bookings b
               WHERE b.owner_id = u.id OR b.sitter_id = u.id) AS booking_count,
             (SELECT count(*)::int FROM reviews r WHERE r.author_id = u.id) AS reviews_written,
             (SELECT count(*)::int FROM reports rp WHERE rp.subject_user_id = u.id) AS reports_against
      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN cities c ON c.id = p.city_id
      LEFT JOIN neighbourhoods n ON n.id = p.neighbourhood_id
      LEFT JOIN sitters s ON s.user_id = u.id
      WHERE u.id = ${userId}
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;

    const [svcs, bookings] = await Promise.all([
      db.execute(sql`
        SELECT service_type::text, price_cents FROM sitter_services WHERE sitter_id = ${userId}
      `),
      db.execute(sql`
        SELECT b.id::text, b.status::text, b.service_type::text, b.start_at, b.owner_total_cents,
               CASE WHEN b.owner_id = ${userId} THEN 'owner' ELSE 'sitter' END AS viewer_role,
               CASE WHEN b.owner_id = ${userId}
                    THEN COALESCE(sp.first_name, '—') ELSE COALESCE(op.first_name, '—') END AS counterpart
        FROM bookings b
        LEFT JOIN profiles op ON op.user_id = b.owner_id
        LEFT JOIN profiles sp ON sp.user_id = b.sitter_id
        WHERE b.owner_id = ${userId} OR b.sitter_id = ${userId}
        ORDER BY b.created_at DESC
        LIMIT 20
      `),
    ]);

    return {
      id: String(r.id),
      email: String(r.email),
      name: (r.name as string | null) ?? null,
      role: String(r.role),
      locale: String(r.locale),
      emailVerified: Boolean(r.email_verified),
      phoneKnown: Boolean(r.phone_known),
      bio: (r.bio as string | null) ?? null,
      province: (r.province as string | null) ?? null,
      cityName: (r.city_name as string | null) ?? null,
      neighbourhood: (r.neighbourhood as string | null) ?? null,
      sitterSlug: (r.sitter_slug as string | null) ?? null,
      sitterStatus: (r.sitter_status as string | null) ?? null,
      averageRating: r.average_rating === null ? null : Number(r.average_rating),
      reviewCount: Number(r.review_count ?? 0),
      bookingCount: Number(r.booking_count ?? 0),
      reviewsWritten: Number(r.reviews_written ?? 0),
      reportsAgainst: Number(r.reports_against ?? 0),
      suspended: Boolean(r.suspended),
      suspensionReason: (r.suspension_reason as string | null) ?? null,
      createdAt: new Date(r.created_at as Date).toISOString(),
      lastActiveAt: r.last_active_at ? new Date(r.last_active_at as Date).toISOString() : null,
      services: (svcs as unknown as Array<Record<string, unknown>>).map((x) => ({
        serviceType: String(x.service_type), priceCents: Number(x.price_cents),
      })),
      recentBookings: (bookings as unknown as Array<Record<string, unknown>>).map((b) => ({
        id: String(b.id),
        status: String(b.status),
        serviceType: String(b.service_type),
        startAt: new Date(b.start_at as Date).toISOString(),
        role: b.viewer_role === 'owner' ? 'owner' : 'sitter',
        counterpart: String(b.counterpart),
        ownerTotalCents: Number(b.owner_total_cents),
      })),
    };
  });
}

export type AdminActionResult =
  | { ok: true }
  | { ok: false; error: 'not_found' | 'reason_required' | 'invalid_state' | 'self_action' };

/**
 * ASKIYA ALMA / GERI ACMA.
 *
 * Gerekce ZORUNLU ve kullanicinin satirinda duruyor: sitede "cikarma
 * yazili gerekceyle olur" yaziyor (DPWRA ve Quebec Charter s.18.2 aynı
 * seyi bekliyor). Gerekce yoksa islem yapilmiyor.
 *
 * Yonetici KENDINI askiya alamaz: paneli kilitleyen tek tikla geri
 * donusu olmayan bir durum yaratmanin anlami yok.
 */
export async function setSuspension(
  db: Database,
  input: {
    userId: string; adminId: string; suspend: boolean; reason: string; ip?: string | undefined;
  },
): Promise<AdminActionResult> {
  const reason = input.reason.trim();
  if (reason.length < 10) return { ok: false, error: 'reason_required' };
  if (input.userId === input.adminId) return { ok: false, error: 'self_action' };

  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT (suspended_at IS NOT NULL) AS suspended FROM users WHERE id = ${input.userId} LIMIT 1
    `);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };
    if (Boolean(row.suspended) === input.suspend) {
      return { ok: false as const, error: 'invalid_state' as const };
    }

    if (input.suspend) {
      await db.execute(sql`
        UPDATE users SET suspended_at = now(), suspension_reason = ${reason},
                         suspended_by = ${input.adminId}, updated_at = now()
        WHERE id = ${input.userId}
      `);
      /*
        Bakici kaydi da devre disi birakiliyor.

        NEDEN BOYLE: arama, sehir sayfalari, one cikanlar, yorum listeleri —
        hepsi "status = 'active'" diyor. Askiyi ayri bir bayrak olarak
        tutup her sorguya JOIN eklemek, bir gun birini unutmak demekti;
        unutulan sorgu askiya alinmis bakiciyi sitede gostermeye devam
        ederdi. Tek yerde durumu degistirmek, tum sorgulari otomatik dogru
        yapiyor. Eski durum geri acilista lazim, o yuzden saklaniyor.
      */
      await db.execute(sql`
        UPDATE sitters
        SET pre_suspension_status = status,
            status = 'deactivated',
            deactivated_at = now(),
            deactivation_reason = ${reason}
        WHERE user_id = ${input.userId} AND status <> 'deactivated'
      `);
    } else {
      await db.execute(sql`
        UPDATE users SET suspended_at = NULL, suspension_reason = NULL,
                         suspended_by = NULL, updated_at = now()
        WHERE id = ${input.userId}
      `);
      await db.execute(sql`
        UPDATE sitters
        SET status = pre_suspension_status,
            pre_suspension_status = NULL,
            deactivated_at = NULL,
            deactivation_reason = NULL
        WHERE user_id = ${input.userId} AND pre_suspension_status IS NOT NULL
      `);
    }

    await recordAudit(db, {
      actorId: input.adminId,
      action: input.suspend ? 'user.suspend' : 'user.restore',
      entity: 'user',
      entityId: input.userId,
      after: { reason },
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return { ok: true as const };
  });
}

/**
 * ROL DEGISTIRME.
 *
 * Yonetici yapmak ve yoneticiligi almak da buradan. Iki kural:
 *  - Kendi rolunu degistiremezsin (son yoneticinin kendini dusurmesi).
 *  - Sistemde en az bir yonetici kalmali; son yonetici indirilemez.
 */
export async function setRole(
  db: Database,
  input: {
    userId: string; adminId: string; role: 'owner' | 'sitter' | 'both' | 'admin';
    reason: string; ip?: string | undefined;
  },
): Promise<AdminActionResult> {
  const reason = input.reason.trim();
  if (reason.length < 10) return { ok: false, error: 'reason_required' };
  if (input.userId === input.adminId) return { ok: false, error: 'self_action' };

  return withDbErrors(async () => {
    const rows = await db.execute(sql`SELECT role::text FROM users WHERE id = ${input.userId} LIMIT 1`);
    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };
    const before = String(row.role);
    if (before === input.role) return { ok: false as const, error: 'invalid_state' as const };

    if (before === 'admin' && input.role !== 'admin') {
      const left = await db.execute(sql`SELECT count(*)::int AS n FROM users WHERE role = 'admin'`);
      const n = Number((left as unknown as Array<Record<string, unknown>>)[0]?.n ?? 0);
      if (n <= 1) return { ok: false as const, error: 'invalid_state' as const };
    }

    await db.execute(sql`
      UPDATE users SET role = ${input.role}::user_role, updated_at = now() WHERE id = ${input.userId}
    `);
    await recordAudit(db, {
      actorId: input.adminId,
      action: 'user.role',
      entity: 'user',
      entityId: input.userId,
      before: { role: before },
      after: { role: input.role, reason },
      ...(input.ip ? { ip: input.ip } : {}),
    });
    return { ok: true as const };
  });
}

/* ------------------------------------------------------------- ic notlar */

export interface AdminNote {
  id: string;
  body: string;
  authorName: string | null;
  createdAt: string;
}

export async function listNotes(
  db: Database, entityType: string, entityId: string,
): Promise<AdminNote[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT n.id::text, n.body, n.created_at,
             COALESCE(p.first_name, u.email) AS author_name
      FROM admin_notes n
      LEFT JOIN users u ON u.id = n.author_id
      LEFT JOIN profiles p ON p.user_id = n.author_id
      WHERE n.entity_type = ${entityType} AND n.entity_id = ${entityId}
      ORDER BY n.created_at DESC
      LIMIT 50
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      body: String(r.body),
      authorName: (r.author_name as string | null) ?? null,
      createdAt: new Date(r.created_at as Date).toISOString(),
    }));
  });
}

/** Not eklemek disinda islem yok: notlar duzenlenemez ve silinemez. */
export async function addNote(
  db: Database,
  input: { entityType: string; entityId: string; authorId: string; body: string },
): Promise<AdminActionResult> {
  const body = input.body.trim();
  if (body.length < 3) return { ok: false, error: 'reason_required' };
  return withDbErrors(async () => {
    await db.execute(sql`
      INSERT INTO admin_notes (entity_type, entity_id, author_id, body)
      VALUES (${input.entityType}, ${input.entityId}, ${input.authorId}, ${body})
    `);
    return { ok: true as const };
  });
}
