import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';

/**
 * METRIKLER.
 *
 * Grafiklerin veri tarafi. Uc kural:
 *
 * 1. BOS GUNLER DOLDURULUR. `generate_series` ile tam tarih araligi
 *    uretiliyor; veri olmayan gune 0 yaziliyor. Aksi halde cizgi grafik
 *    olmayan gunleri atlar ve dusen bir egri yukselen gibi gorunur.
 * 2. TARIH ARALIGI PARAMETRE, gun sayisi tamsayiya zorlaniyor — adres
 *    cubugundan gelen bir metin sorguya girmiyor.
 * 3. "Gelir" burada PLATFORMUN BRUTU (sahip ucreti + bakici komisyonu),
 *    islem hacmi degil. Ikisini ayirmak sart: hacmi gelir diye gostermek
 *    kendini kandirmaktir. Ustelik henuz para almiyoruz — bu rakam
 *    "tahsil edilse ne olurdu" demektir ve ekranda oyle yaziyor.
 */

export interface SeriesPoint {
  date: string;
  value: number;
}

export interface AdminMetrics {
  days: number;
  signups: SeriesPoint[];
  bookings: SeriesPoint[];
  /** Platform brutu (sent) — tahakkuk, tahsilat degil */
  grossCents: SeriesPoint[];
  /** Ayni donemin toplamlari */
  totals: {
    signups: number;
    bookings: number;
    confirmed: number;
    grossCents: number;
    gmvCents: number;
    newSitters: number;
  };
  /** Onceki esit uzunluktaki donemle karsilastirma (yuzde) */
  change: { signups: number | null; bookings: number | null; grossCents: number | null };
  topCities: Array<{ city: string; sitters: number; bookings: number }>;
  funnel: { applications: number; active: number; withBooking: number; withReview: number };
  serviceMix: Array<{ serviceType: string; count: number }>;
}

function pct(now: number, before: number): number | null {
  if (before === 0) return now === 0 ? 0 : null;
  return Math.round(((now - before) / before) * 1000) / 10;
}

export async function getMetrics(db: Database, daysInput = 30): Promise<AdminMetrics> {
  // Gun sayisi: tamsayi ve makul bir araliga kisitli
  const days = Math.min(365, Math.max(7, Math.floor(daysInput)));

  return withDbErrors(async () => {
    const [signups, bookings, gross, totals, prev, cities, funnel, mix] = await Promise.all([
      db.execute(sql`
        SELECT d::date::text AS date, COALESCE(count(u.id), 0)::int AS value
        FROM generate_series(current_date - ${days - 1}::int, current_date, '1 day') d
        LEFT JOIN users u ON u.created_at::date = d::date AND u.deleted_at IS NULL
        GROUP BY d ORDER BY d
      `),
      db.execute(sql`
        SELECT d::date::text AS date, COALESCE(count(b.id), 0)::int AS value
        FROM generate_series(current_date - ${days - 1}::int, current_date, '1 day') d
        LEFT JOIN bookings b ON b.created_at::date = d::date
        GROUP BY d ORDER BY d
      `),
      db.execute(sql`
        SELECT d::date::text AS date,
               COALESCE(sum(b.owner_fee_cents + b.sitter_commission_cents), 0)::int AS value
        FROM generate_series(current_date - ${days - 1}::int, current_date, '1 day') d
        LEFT JOIN bookings b ON b.created_at::date = d::date
          AND b.status NOT IN ('draft', 'declined', 'expired', 'cancelled')
        GROUP BY d ORDER BY d
      `),
      db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM users
            WHERE created_at >= current_date - ${days - 1}::int AND deleted_at IS NULL) AS signups,
          (SELECT count(*)::int FROM bookings
            WHERE created_at >= current_date - ${days - 1}::int) AS bookings,
          (SELECT count(*)::int FROM bookings
            WHERE created_at >= current_date - ${days - 1}::int
              AND status NOT IN ('draft','requested','declined','expired','cancelled')) AS confirmed,
          (SELECT COALESCE(sum(owner_fee_cents + sitter_commission_cents), 0)::int FROM bookings
            WHERE created_at >= current_date - ${days - 1}::int
              AND status NOT IN ('draft','declined','expired','cancelled')) AS gross_cents,
          (SELECT COALESCE(sum(owner_total_cents), 0)::int FROM bookings
            WHERE created_at >= current_date - ${days - 1}::int
              AND status NOT IN ('draft','declined','expired','cancelled')) AS gmv_cents,
          (SELECT count(*)::int FROM sitters
            WHERE created_at >= current_date - ${days - 1}::int) AS new_sitters
      `),
      db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM users
            WHERE created_at >= current_date - ${days * 2 - 1}::int
              AND created_at < current_date - ${days - 1}::int
              AND deleted_at IS NULL) AS signups,
          (SELECT count(*)::int FROM bookings
            WHERE created_at >= current_date - ${days * 2 - 1}::int
              AND created_at < current_date - ${days - 1}::int) AS bookings,
          (SELECT COALESCE(sum(owner_fee_cents + sitter_commission_cents), 0)::int FROM bookings
            WHERE created_at >= current_date - ${days * 2 - 1}::int
              AND created_at < current_date - ${days - 1}::int
              AND status NOT IN ('draft','declined','expired','cancelled')) AS gross_cents
      `),
      db.execute(sql`
        SELECT c.name_en AS city,
               count(DISTINCT s.user_id)::int AS sitters,
               count(DISTINCT b.id)::int AS bookings
        FROM cities c
        LEFT JOIN profiles p ON p.city_id = c.id
        LEFT JOIN sitters s ON s.user_id = p.user_id AND s.status = 'active'
        LEFT JOIN bookings b ON b.sitter_id = s.user_id
        GROUP BY c.id, c.name_en
        HAVING count(DISTINCT s.user_id) > 0
        ORDER BY sitters DESC
        LIMIT 8
      `),
      db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM sitters) AS applications,
          (SELECT count(*)::int FROM sitters WHERE status = 'active') AS active,
          (SELECT count(DISTINCT sitter_id)::int FROM bookings) AS with_booking,
          (SELECT count(DISTINCT subject_id)::int FROM reviews
            WHERE direction = 'owner_to_sitter' AND published_at IS NOT NULL
              AND hidden_at IS NULL) AS with_review
      `),
      db.execute(sql`
        SELECT service_type::text, count(*)::int AS n FROM bookings
        WHERE created_at >= current_date - ${days - 1}::int
        GROUP BY service_type ORDER BY n DESC
      `),
    ]);

    const series = (rows: unknown): SeriesPoint[] =>
      (rows as Array<Record<string, unknown>>).map((r) => ({
        date: String(r.date), value: Number(r.value ?? 0),
      }));

    const t = (totals as unknown as Array<Record<string, unknown>>)[0] ?? {};
    const p = (prev as unknown as Array<Record<string, unknown>>)[0] ?? {};
    const f = (funnel as unknown as Array<Record<string, unknown>>)[0] ?? {};

    const totalsOut = {
      signups: Number(t.signups ?? 0),
      bookings: Number(t.bookings ?? 0),
      confirmed: Number(t.confirmed ?? 0),
      grossCents: Number(t.gross_cents ?? 0),
      gmvCents: Number(t.gmv_cents ?? 0),
      newSitters: Number(t.new_sitters ?? 0),
    };

    return {
      days,
      signups: series(signups),
      bookings: series(bookings),
      grossCents: series(gross),
      totals: totalsOut,
      change: {
        signups: pct(totalsOut.signups, Number(p.signups ?? 0)),
        bookings: pct(totalsOut.bookings, Number(p.bookings ?? 0)),
        grossCents: pct(totalsOut.grossCents, Number(p.gross_cents ?? 0)),
      },
      topCities: (cities as unknown as Array<Record<string, unknown>>).map((c) => ({
        city: String(c.city), sitters: Number(c.sitters), bookings: Number(c.bookings),
      })),
      funnel: {
        applications: Number(f.applications ?? 0),
        active: Number(f.active ?? 0),
        withBooking: Number(f.with_booking ?? 0),
        withReview: Number(f.with_review ?? 0),
      },
      serviceMix: (mix as unknown as Array<Record<string, unknown>>).map((m) => ({
        serviceType: String(m.service_type), count: Number(m.n),
      })),
    };
  });
}
