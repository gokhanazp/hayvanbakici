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
  avatarUrl: string | null;
  /** Askidaki kullanici bunu EKRANDA gormeli; sessizce kisitlanmak kotu */
  suspended: boolean;
  /** Yeni mesaj e-postasi istiyor mu — profil ekranindaki kutu */
  notifyMessages: boolean;
  sitter: {
    status: 'draft' | 'pending' | 'active' | 'deactivated';
    slug: string | null;
    citySlugEn: string | null;
    citySlugFr: string | null;
    badgeLevel: number;
    /**
     * "Evimde hayvan var" isaretli mi — fotograf adimi bunu soruyor.
     * Profildeki iddia buna DEGIL, fotografa bagli (bkz. showsOwnPets);
     * bu alan yalnizca "sana soralim mi" sorusunun cevabi.
     */
    hasOwnPets: boolean;
    /** Taslak basvuruda sirada hangi adim var */
    steps: {
      hasAbout: boolean;
      hasLocation: boolean;
      serviceCount: number;
      hasHome: boolean;
      screeningStarted: boolean;
      /** Profil fotografi DAHIL — bkz. @havre/core photoTotal */
      photoCount: number;
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
        u.notify_messages                       AS notify_messages,
        p.first_name, p.last_name_initial, p.avatar_url,
        s.status::text                          AS sitter_status,
        s.slug                                  AS sitter_slug,
        s.badge_level, s.has_own_pets,
        c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,

        -- onboarding: yalnizca VAR/YOK
        (p.bio IS NOT NULL AND s.date_of_birth IS NOT NULL AND u.phone IS NOT NULL) AS has_about,
        (p.city_id IS NOT NULL AND p.exact_address_enc IS NOT NULL)                 AS has_location,
        (s.home_type IS NOT NULL)                                                   AS has_home,
        (SELECT count(*)::int FROM sitter_services ss WHERE ss.sitter_id = u.id)    AS service_count,
        EXISTS (SELECT 1 FROM verifications v
                WHERE v.sitter_id = u.id AND v.type = 'criminal')                   AS screening_started,
        -- profil fotografi + ev fotograflari: hesap sayfasi "siradaki adim"
        -- derken sihirbazla AYNI sayiyi gormeli
        -- Hayvan fotografi bu sayiya GIRMIYOR: ilerleme cubugu ev ve
        -- profil fotografini olcuyor, hayvan fotografi ayri bir iddianin
        -- dayanagi (bkz. showsOwnPets).
        ((p.avatar_url IS NOT NULL)::int
         + (SELECT count(*)::int FROM sitter_photos sp
             WHERE sp.sitter_id = u.id AND sp.kind = 'home'))                       AS photo_count,

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
      avatarUrl: (r.avatar_url as string | null) ?? null,
      suspended: Boolean(r.suspended),
      notifyMessages: Boolean(r.notify_messages),
      sitter: status
        ? {
            status: String(status) as 'draft' | 'pending' | 'active' | 'deactivated',
            slug: (r.sitter_slug as string | null) ?? null,
            citySlugEn: (r.city_slug_en as string | null) ?? null,
            citySlugFr: (r.city_slug_fr as string | null) ?? null,
            badgeLevel: Number(r.badge_level ?? 0),
            hasOwnPets: Boolean(r.has_own_pets),
            steps: {
              hasAbout: Boolean(r.has_about),
              hasLocation: Boolean(r.has_location),
              serviceCount: Number(r.service_count ?? 0),
              hasHome: Boolean(r.has_home),
              screeningStarted: Boolean(r.screening_started),
              photoCount: Number(r.photo_count ?? 0),
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

/* ------------------------------------------------------------ fotograf */

/**
 * PROFIL FOTOGRAFI.
 *
 * Eski adres GERI DONUYOR: cagiran taraf dosyayi depodan silebilsin diye.
 * Silmeyi buraya koymadik — veritabani katmani diski tanimiyor ve
 * tanimamali.
 */
export async function setAvatar(
  db: Database, userId: string, url: string | null,
): Promise<string | null> {
  return withDbErrors(async () => {
    /*
      Once OKU, sonra YAZ. `RETURNING` icinde alt sorguyla eski degeri
      almak calisiyor gibi gorunuyor ama ayni ifadenin goruntusune bagli
      ve okundugunda yaniltici; iki adim burada hem dogru hem acik.
    */
    const before = await db.execute(sql`
      SELECT avatar_url FROM profiles WHERE user_id = ${userId} LIMIT 1
    `);
    const previous = (before as unknown as Array<{ avatar_url: string | null }>)[0]?.avatar_url
      ?? null;

    await db.execute(sql`
      UPDATE profiles SET avatar_url = ${url}, updated_at = now() WHERE user_id = ${userId}
    `);
    return previous;
  });
}

export type SitterPhotoKind = 'home' | 'pet';

export interface SitterPhoto {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  /** Ev fotografi mi, bakicinin kendi hayvani mi. */
  kind: SitterPhotoKind;
}

export async function listSitterPhotos(db: Database, sitterId: string): Promise<SitterPhoto[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT id::text, url, alt, sort_order, kind::text FROM sitter_photos
      WHERE sitter_id = ${sitterId}
      ORDER BY sort_order ASC, created_at ASC
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      url: String(r.url),
      alt: (r.alt as string | null) ?? null,
      sortOrder: Number(r.sort_order ?? 0),
      kind: String(r.kind) as SitterPhotoKind,
    }));
  });
}

/** Bir bakicinin tutabilecegi ev fotografi sayisi. */
export const MAX_SITTER_PHOTOS = 8;

/**
 * KENDI HAYVANININ fotograf sayisi — ayri tavan.
 *
 * Ev fotograflariyla ayni kovadan saymiyoruz: sekiz ev fotografi
 * yuklemis bir bakici, hayvanini gosteremez hale gelirdi ve profildeki
 * "evimde hayvan var" cumlesi artik buna bagli.
 */
export const MAX_PET_PHOTOS = 4;

export async function addSitterPhoto(
  db: Database,
  input: {
    sitterId: string; url: string; alt?: string | undefined;
    kind?: SitterPhotoKind | undefined;
  },
): Promise<{ ok: true; id: string } | { ok: false; error: 'too_many' }> {
  return withDbErrors(async () => {
    /*
      TAVAN TURE GORE. Iki tur ayni kovadan sayilsaydi sekiz ev
      fotografi yuklemis bakici hayvanini gosteremezdi — ve profildeki
      "evimde hayvan var" cumlesi artik fotografa bagli.
    */
    const kind: SitterPhotoKind = input.kind ?? 'home';
    const max = kind === 'pet' ? MAX_PET_PHOTOS : MAX_SITTER_PHOTOS;

    const countRows = await db.execute(sql`
      SELECT count(*)::int AS n FROM sitter_photos
      WHERE sitter_id = ${input.sitterId} AND kind = ${kind}::sitter_photo_kind
    `);
    const n = Number((countRows as unknown as Array<{ n: number }>)[0]?.n ?? 0);
    if (n >= max) return { ok: false as const, error: 'too_many' as const };

    const rows = await db.execute(sql`
      INSERT INTO sitter_photos (sitter_id, url, alt, sort_order, kind)
      VALUES (${input.sitterId}, ${input.url}, ${input.alt ?? null}, ${n},
              ${kind}::sitter_photo_kind)
      RETURNING id::text
    `);
    const id = String((rows as unknown as Array<{ id: string }>)[0]!.id);
    return { ok: true as const, id };
  });
}

/**
 * Fotograf silme. Kimlik kontrolu WHERE icinde: baskasinin fotografini
 * silmeye calisan sorgu hicbir satir bulamiyor. Silinen adres geri
 * donuyor ki cagiran taraf dosyayi depodan da kaldirabilsin.
 */
export async function deleteSitterPhoto(
  db: Database, photoId: string, sitterId: string,
): Promise<string | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      DELETE FROM sitter_photos
      WHERE id = ${photoId} AND sitter_id = ${sitterId}
      RETURNING url
    `);
    const r = (rows as unknown as Array<{ url: string }>)[0];
    return r ? String(r.url) : null;
  });
}

/**
 * Ad ve dil tercihi. Soyadinin yalnizca BAS HARFI saklaniyor — profil
 * sayfasinda tam soyad hicbir zaman gorunmuyor, bu yuzden veritabaninda
 * da tutmuyoruz.
 */
export async function updateProfile(
  db: Database,
  input: { userId: string; firstName: string; lastNameInitial: string; locale: string },
): Promise<void> {
  await withDbErrors(async () => {
    await db.execute(sql`
      UPDATE profiles
      SET first_name = ${input.firstName},
          last_name_initial = ${input.lastNameInitial},
          updated_at = now()
      WHERE user_id = ${input.userId}
    `);
    await db.execute(sql`
      UPDATE users SET locale = ${input.locale}::locale WHERE id = ${input.userId}
    `);
  });
}
