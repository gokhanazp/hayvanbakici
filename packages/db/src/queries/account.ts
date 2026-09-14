import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';

/**
 * HESAP OZETI — "ben neyim" sorusunun tek cevabi.
 *
 * Havre'de tek hesap iki sapka tasiyor: HERKES sahiptir, isteyen ustune
 * bakiciligi ekler. Bu model urun acisindan dogru ama ekranda
 * soylenmedigi surece kullanici kendi durumunu bilmiyor — bakici mi,
 * basvurusu yarida mi kaldi, onay mi bekliyor? Bu sorgu o cevabi tek
 * yerden veriyor.
 *
 * Tek bir SELECT: hesap ekrani her acilista dort ayri sorgu calistirmasin.
 * Sayilar da burada hesaplaniyor cunku hepsi ayni sorunun parcasi:
 * "bugun benden ne bekleniyor".
 *
 * Onboarding alanlari (hasAbout, serviceCount, ...) DEGERLERI degil
 * yalnizca VAR/YOK bilgisini donduruyor: hesap ozetinin bakicinin
 * biyografisine, telefonuna veya adresine ihtiyaci yok.
 */
export interface AccountSummary {
  email: string;
  firstName: string | null;
  lastNameInitial: string | null;
  /** Askidaki kullanici bunu EKRANDA gormeli; sessizce kisitlanmak kotu */
  suspended: boolean;
  sitter: {
    status: 'draft' | 'pending' | 'active' | 'deactivated';
    slug: string | null;
    citySlugEn: string | null;
    citySlugFr: string | null;
    badgeLevel: number;
    /** Taslak basvuruda sirada hangi adim var */
    steps: {
      hasAbout: boolean;
      hasLocation: boolean;
      serviceCount: number;
      hasHome: boolean;
      screeningStarted: boolean;
    };
  } | null;
  counts: {
    /** Sahip tarafi: suren veya gelecek rezervasyonlar */
    upcomingBookings: number;
    /** Bakici tarafi: cevap bekleyen talepler */
    pendingRequests: number;
    unreadMessages: number;
    pets: number;
  };
}

export async function getAccountSummary(
  db: Database, userId: string,
): Promise<AccountSummary | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT
        u.email,
        (u.suspended_at IS NOT NULL)            AS suspended,
        p.first_name, p.last_name_initial,
        s.status::text                          AS sitter_status,
        s.slug                                  AS sitter_slug,
        s.badge_level,
        c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,

        -- onboarding: yalnizca VAR/YOK
        (p.bio IS NOT NULL AND s.date_of_birth IS NOT NULL AND u.phone IS NOT NULL) AS has_about,
        (p.city_id IS NOT NULL AND p.exact_address_enc IS NOT NULL)                 AS has_location,
        (s.home_type IS NOT NULL)                                                   AS has_home,
        (SELECT count(*)::int FROM sitter_services ss WHERE ss.sitter_id = u.id)    AS service_count,
        EXISTS (SELECT 1 FROM verifications v
                WHERE v.sitter_id = u.id AND v.type = 'criminal')                   AS screening_started,

        -- bugun benden ne bekleniyor
        (SELECT count(*)::int FROM bookings b
          WHERE b.owner_id = u.id AND b.status IN ('requested', 'confirmed')
            AND b.end_at >= now())                                                  AS upcoming_bookings,
        (SELECT count(*)::int FROM bookings b
          WHERE b.sitter_id = u.id AND b.status = 'requested')                      AS pending_requests,
        (SELECT count(*)::int FROM messages msg
           JOIN conversations cv ON cv.id = msg.conversation_id
          WHERE msg.read_at IS NULL AND msg.sender_id <> u.id
            AND (cv.owner_id = u.id OR cv.sitter_id = u.id))                        AS unread_messages,
        (SELECT count(*)::int FROM pets pt WHERE pt.owner_id = u.id)                AS pets

      FROM users u
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN sitters  s ON s.user_id = u.id
      LEFT JOIN cities   c ON c.id = p.city_id
      WHERE u.id = ${userId} AND u.deleted_at IS NULL
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;

    const status = (r.sitter_status as string | null) ?? null;

    return {
      email: String(r.email),
      firstName: (r.first_name as string | null) ?? null,
      lastNameInitial: (r.last_name_initial as string | null) ?? null,
      suspended: Boolean(r.suspended),
      sitter: status
        ? {
            status: String(status) as 'draft' | 'pending' | 'active' | 'deactivated',
            slug: (r.sitter_slug as string | null) ?? null,
            citySlugEn: (r.city_slug_en as string | null) ?? null,
            citySlugFr: (r.city_slug_fr as string | null) ?? null,
            badgeLevel: Number(r.badge_level ?? 0),
            steps: {
              hasAbout: Boolean(r.has_about),
              hasLocation: Boolean(r.has_location),
              serviceCount: Number(r.service_count ?? 0),
              hasHome: Boolean(r.has_home),
              screeningStarted: Boolean(r.screening_started),
            },
          }
        : null,
      counts: {
        upcomingBookings: Number(r.upcoming_bookings ?? 0),
        pendingRequests: Number(r.pending_requests ?? 0),
        unreadMessages: Number(r.unread_messages ?? 0),
        pets: Number(r.pets ?? 0),
      },
    };
  });
}

/**
 * Yalnizca bakici kaydinin DURUMU.
 *
 * `isSitter` (kayit var mi?) hesap ekranlarinin rozeti icin yetmiyordu:
 * taslak basvurusu olan birine "Bakici" demek, onay bekleyenle yayinda
 * olani ayni kefeye koymak demekti. Sekme gorunurlugu icin `!== null`
 * bakmak yeterli; rozet icin durumun kendisi gerekiyor.
 */
export async function getSitterStatus(
  db: Database, userId: string,
): Promise<'draft' | 'pending' | 'active' | 'deactivated' | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT status::text FROM sitters WHERE user_id = ${userId} LIMIT 1
    `);
    const r = (rows as unknown as Array<{ status: string }>)[0];
    return r ? (String(r.status) as 'draft' | 'pending' | 'active' | 'deactivated') : null;
  });
}
