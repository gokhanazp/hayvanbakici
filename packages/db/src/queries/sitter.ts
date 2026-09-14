import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import type { Locale } from './types.js';
import type { ServiceType } from '@havre/core';

/**
 * BAKICI PROFIL SAYFASI VERISI.
 *
 * Tek bir bakicinin sayfasinda gorunen her sey burada toplaniyor: profil,
 * hizmetler ve fiyatlar, dogrulama basamaklari, yorumlar, musaitlik ozeti.
 *
 * GIZLILIK — bu sorgunun DONDURMEDIKLERI en az donduRdukleri kadar onemli:
 *   • Soyadin tamami (yalnizca bas harf)
 *   • Tam adres (sifreli; rezervasyon onaylanana kadar acilmaz)
 *   • Dogum tarihi, SIN, telefon, e-posta
 *   • Adli sicil raporunun icerigi (yalnizca GECTI/BEKLEMEDE)
 * Bunlar sayfada gosterilmedigi icin degil, SORGUYA HIC GIRMEDIKLERI icin
 * guvendeler: gelecekte biri sayfaya bir alan eklemek istediginde once bu
 * dosyayi degistirmek zorunda kalacak.
 */

export interface SitterReview {
  id: string;
  rating: number;
  body: string | null;
  authorFirstName: string;
  authorInitial: string;
  authorAvatarUrl: string | null;
  publishedAt: string;
  responseBody: string | null;
}

export interface SitterService {
  serviceType: ServiceType;
  priceCents: number;
  /* Rezervasyon formundaki CANLI fiyat bu ikisi olmadan sunucunun
     hesabiyla uyusmuyordu: ek hayvan ve tatil farki sifir gorunuyordu. */
  extraPetPriceCents: number;
  holidaySurchargePct: number;
  priceUnit: string;
  cancellationPolicy: 'flexible' | 'moderate' | 'strict';
  acceptsDogs: boolean;
  acceptsCats: boolean;
  acceptsOther: boolean;
  acceptedSizeMinKg: number;
  acceptedSizeMaxKg: number;
}

export interface SitterProfile {
  userId: string;
  slug: string;
  firstName: string;
  lastNameInitial: string;
  bio: string | null;
  photoInitials: string;
  avatarUrl: string | null;
  /** Ev/ortam galerisi — sitter_photos, sirali */
  photos: Array<{ url: string; alt: string | null }>;

  citySlugEn: string;
  citySlugFr: string;
  cityNameEn: string;
  cityNameFr: string;
  neighbourhoodEn: string;
  neighbourhoodFr: string;
  province: string;

  badgeLevel: 0 | 1 | 2 | 3 | 4;
  averageRating: number;
  reviewCount: number;
  repeatClients: number;
  medianResponseMinutes: number;
  acceptanceRate: number;
  memberSince: string;

  homeType: string | null;
  hasYard: boolean;
  yardFenced: boolean;
  hasOwnPets: boolean;
  smokeFree: boolean;
  maxConcurrentPets: number;

  services: SitterService[];
  reviews: SitterReview[];
  /** Onumuzdeki 30 gunde musait gun sayisi */
  openDays: number;
  completedBookings: number;
  /** Yorum ve istatistiklerin tarihi — sayfada gosteriliyor (§7.7) */
  dataAsOf: string;
}

export async function getSitterProfile(
  db: Database, slug: string, locale: Locale,
): Promise<SitterProfile | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT
        st.user_id, st.slug, st.badge_level, st.average_rating, st.review_count,
        st.median_response_minutes, st.acceptance_rate, st.home_type,
        st.has_yard, st.yard_fenced, st.has_own_pets, st.smoke_free,
        st.max_concurrent_pets, st.activated_at, st.created_at,
        p.first_name, p.last_name_initial, p.bio, p.province, p.avatar_url,
        c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
        c.name_en AS city_name_en, c.name_fr AS city_name_fr,
        COALESCE(n.name_en, '') AS hood_en, COALESCE(n.name_fr, '') AS hood_fr
      FROM sitters st
      JOIN profiles p ON p.user_id = st.user_id
      JOIN cities c ON c.id = p.city_id
      LEFT JOIN neighbourhoods n ON n.id = p.neighbourhood_id
      WHERE st.slug = ${slug}
        -- Yalnizca AKTIF bakicilar. Taslak, beklemede ya da cikarilmis bir
        -- bakicinin sayfasi olmamali: indekslenir ve sonra 404'e doner.
        AND st.status = 'active'
      LIMIT 1
    `);

    const row = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return null;
    const userId = String(row.user_id);

    const [svcRows, reviewRows, statRows, photoRows] = await Promise.all([
      db.execute(sql`
        SELECT service_type, price_cents, extra_pet_price_cents, holiday_surcharge_pct,
               price_unit, cancellation_policy,
               accepts_dogs, accepts_cats, accepts_other,
               accepted_size_min_kg, accepted_size_max_kg
        FROM sitter_services
        WHERE sitter_id = ${userId} AND is_active
        ORDER BY price_cents ASC
      `),
      db.execute(sql`
        SELECT r.id, r.rating, r.body, r.published_at, r.response_body,
               p.first_name, p.last_name_initial, p.avatar_url
        FROM reviews r
        -- LEFT JOIN sart: yazarin profil satiri eksikse yorum DUSMEMELI.
        -- Iç birlestirmeyle 21 yorumun 21'i sessizce kayboluyordu ve sayfa
        -- "henuz yorum yok" diyordu — tarayicida yakalandi. Bir bakicinin
        -- kazandigi yorumlari veri eksikligi yuzunden gizlemek, onun
        -- aleyhine bir hata.
        LEFT JOIN profiles p ON p.user_id = r.author_id
        WHERE r.subject_id = ${userId}
          AND r.direction = 'owner_to_sitter'
          -- Yayimlanmamis yorum gosterilmez; yorum penceresi kapanmadan
          -- tek tarafli yayin, karsilikli korleme kuralini bozar.
          AND r.published_at IS NOT NULL
        ORDER BY r.published_at DESC
        LIMIT 12
      `),
      db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM bookings b
            WHERE b.sitter_id = ${userId}
              AND b.status IN ('completed','payout_released')) AS completed,
          (SELECT count(DISTINCT b.owner_id)::int FROM bookings b
            WHERE b.sitter_id = ${userId}
              AND b.attribution IN ('repeat','sitter_referral')) AS repeat_clients,
          (SELECT count(*)::int FROM sitter_availability a
            WHERE a.sitter_id = ${userId}
              AND a.status = 'open'
              AND a.date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS open_days
      `),
      db.execute(sql`
        SELECT url, alt FROM sitter_photos
        WHERE sitter_id = ${userId}
        ORDER BY sort_order ASC
        LIMIT 6
      `),
    ]);

    const stats = (statRows as unknown as Array<Record<string, unknown>>)[0] ?? {};

    const first = String(row.first_name ?? '');
    const initial = String(row.last_name_initial ?? '');

    return {
      userId,
      slug: String(row.slug),
      firstName: first,
      lastNameInitial: initial,
      bio: (row.bio as string | null) ?? null,
      photoInitials: `${first.slice(0, 1)}${initial}`.toUpperCase(),
      avatarUrl: (row.avatar_url as string | null) ?? null,
      photos: (photoRows as unknown as Array<Record<string, unknown>>).map((ph) => ({
        url: String(ph.url),
        alt: (ph.alt as string | null) ?? null,
      })),

      citySlugEn: String(row.city_slug_en),
      citySlugFr: String(row.city_slug_fr),
      cityNameEn: String(row.city_name_en),
      cityNameFr: String(row.city_name_fr),
      neighbourhoodEn: String(row.hood_en ?? ''),
      neighbourhoodFr: String(row.hood_fr ?? ''),
      province: String(row.province ?? ''),

      badgeLevel: Number(row.badge_level ?? 0) as 0 | 1 | 2 | 3 | 4,
      averageRating: Number(row.average_rating ?? 0),
      reviewCount: Number(row.review_count ?? 0),
      repeatClients: Number(stats.repeat_clients ?? 0),
      medianResponseMinutes: Number(row.median_response_minutes ?? 0),
      acceptanceRate: Number(row.acceptance_rate ?? 0),
      memberSince: new Date(
        (row.activated_at as Date | null) ?? (row.created_at as Date),
      ).toISOString(),

      homeType: (row.home_type as string | null) ?? null,
      hasYard: Boolean(row.has_yard),
      yardFenced: Boolean(row.yard_fenced),
      hasOwnPets: Boolean(row.has_own_pets),
      smokeFree: Boolean(row.smoke_free),
      maxConcurrentPets: Number(row.max_concurrent_pets ?? 1),

      services: (svcRows as unknown as Array<Record<string, unknown>>).map((s) => ({
        serviceType: s.service_type as ServiceType,
        priceCents: Number(s.price_cents),
        extraPetPriceCents: Number(s.extra_pet_price_cents ?? 0),
        holidaySurchargePct: Number(s.holiday_surcharge_pct ?? 0),
        priceUnit: String(s.price_unit),
        cancellationPolicy: s.cancellation_policy as 'flexible' | 'moderate' | 'strict',
        acceptsDogs: Boolean(s.accepts_dogs),
        acceptsCats: Boolean(s.accepts_cats),
        acceptsOther: Boolean(s.accepts_other),
        acceptedSizeMinKg: Number(s.accepted_size_min_kg ?? 0),
        acceptedSizeMaxKg: Number(s.accepted_size_max_kg ?? 100),
      })),

      reviews: (reviewRows as unknown as Array<Record<string, unknown>>).map((r) => ({
        id: String(r.id),
        rating: Number(r.rating),
        body: (r.body as string | null) ?? null,
        // Gizlilik: yorum yazan da yalnizca ad + bas harf
        authorFirstName: String(r.first_name ?? ''),
        authorInitial: String(r.last_name_initial ?? ''),
        authorAvatarUrl: (r.avatar_url as string | null) ?? null,
        publishedAt: new Date(r.published_at as Date).toISOString(),
        responseBody: (r.response_body as string | null) ?? null,
      })),

      openDays: Number(stats.open_days ?? 0),
      completedBookings: Number(stats.completed ?? 0),
      dataAsOf: new Date().toISOString(),
    } satisfies SitterProfile;

    void locale;
  });
}

/** Build'de uretilecek profiller — yalnizca Tier-1 ve gercekten aktif olanlar. */
export async function listSitterSlugsForBuild(
  db: Database, limitPerCity = 40,
): Promise<Array<{ slug: string; citySlugEn: string; citySlugFr: string }>> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT slug, city_slug_en, city_slug_fr FROM (
        SELECT st.slug, c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
               row_number() OVER (PARTITION BY c.id ORDER BY st.ranking_score DESC) AS rn
        FROM sitters st
        JOIN profiles p ON p.user_id = st.user_id
        JOIN cities c ON c.id = p.city_id
        WHERE st.status = 'active' AND st.slug IS NOT NULL AND c.tier = 1
      ) ranked
      WHERE rn <= ${limitPerCity}
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      slug: String(r.slug),
      citySlugEn: String(r.city_slug_en),
      citySlugFr: String(r.city_slug_fr),
    }));
  });
}

/**
 * ANA SAYFA REFERANSLARI.
 *
 * Uydurma alinti YOK: bunlar sitede yazilmis gercek yorum satirlarindan
 * geliyor (tohum veride demo yorumlar, canlida gercek musteriler). Ana
 * sayfaya elle "musterilerimiz ne diyor" metni yazmak, hicbir zaman
 * dogrulanamayacak bir iddia olurdu; bu sorgu sayesinde ana sayfadaki
 * referans, bakici profilindeki yorumla AYNI kaynaktan gelir.
 *
 * Yalnizca 5 yildizli, govdesi yeterince uzun ve YAYIMLANMIS yorumlar.
 */
export interface FeaturedReview {
  id: string;
  rating: number;
  body: string;
  authorFirstName: string;
  authorInitial: string;
  authorAvatarUrl: string | null;
  sitterFirstName: string;
  sitterSlug: string;
  citySlugEn: string;
  citySlugFr: string;
  cityNameEn: string;
  cityNameFr: string;
  publishedAt: string;
}

export async function listFeaturedReviews(
  db: Database, limit = 3,
): Promise<FeaturedReview[]> {
  return withDbErrors(async () => {
    /*
      DISTINCT ON (r.body): ilk denemede uc referansin UCU DE ayni cumleydi.
      Tohum verideki yorum havuzu kucuk ve en yeni uc bes yildizli yorum ayni
      metni tasiyabiliyor; canlida da iki musteri ayni sablonu yazabilir.
      Ayni ovguyu uc kez gostermek, referansin inandiriciligini bitirir.
    */
    const rows = await db.execute(sql`
      SELECT * FROM (
      SELECT DISTINCT ON (r.body)
             r.id, r.rating, r.body, r.published_at,
             a.first_name AS author_first, a.last_name_initial AS author_initial,
             a.avatar_url AS author_avatar,
             sp.first_name AS sitter_first, st.slug AS sitter_slug,
             c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
             c.name_en AS city_name_en, c.name_fr AS city_name_fr
      FROM reviews r
      JOIN sitters st ON st.user_id = r.subject_id AND st.status = 'active'
      JOIN profiles sp ON sp.user_id = st.user_id
      JOIN cities c ON c.id = sp.city_id
      LEFT JOIN profiles a ON a.user_id = r.author_id
      WHERE r.direction = 'owner_to_sitter'
        AND r.published_at IS NOT NULL
        AND r.rating = 5
        AND st.slug IS NOT NULL
        -- Alt sinir 90 idi ve tohum yorumlarinin tamami 63-91 karakterdi:
        -- filtreden tek bir cumle geciyordu, ana sayfada da tek referans
        -- kartı cikiyordu. Alt sinir kisa "harika, tesekkurler" tipi
        -- yorumlari eler; ust sinir kartin tasmasini onler.
        AND length(COALESCE(r.body, '')) BETWEEN 55 AND 320
      ORDER BY r.body, r.published_at DESC
      ) d
      ORDER BY d.published_at DESC
      LIMIT ${limit}
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      rating: Number(r.rating),
      body: String(r.body ?? ''),
      authorFirstName: String(r.author_first ?? ''),
      authorInitial: String(r.author_initial ?? ''),
      authorAvatarUrl: (r.author_avatar as string | null) ?? null,
      sitterFirstName: String(r.sitter_first ?? ''),
      sitterSlug: String(r.sitter_slug ?? ''),
      citySlugEn: String(r.city_slug_en),
      citySlugFr: String(r.city_slug_fr),
      cityNameEn: String(r.city_name_en),
      cityNameFr: String(r.city_name_fr),
      publishedAt: new Date(r.published_at as Date).toISOString(),
    }));
  });
}
