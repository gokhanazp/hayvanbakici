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
  /**
   * Yorumun HANGI HIZMET icin yazildigi. Bes yildizli bir gezdirme
   * yorumu, konaklama arayan birine ayni seyi soylemiyor; rakip
   * sayfalarda bu etiket her yorumun ustunde duruyor.
   * Rezervasyona bagli olmayan bir yorumda null.
   */
  serviceType: ServiceType | null;
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
  /**
   * Bakicinin KENDI hayvanlarinin fotograflari.
   *
   * hasOwnPets ile birlikte okunur: sahip, hayvanini baska bir hayvanla
   * ayni eve koyuyor. "Evimde hayvan var" cumlesini goruyorsa o hayvani
   * da gorebilmeli — bu yuzden iddia artik fotografa bagli
   * (bkz. showsOwnPets).
   */
  petPhotos: Array<{ url: string; alt: string | null }>;

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
  /**
   * Cevaplanan istek orani (0-1) — hic cevaplanabilir istek yoksa null.
   * Kabul oranindan FARKLI: burada RET de cevaptir. Sahibin sordugu
   * "bana doner mi", "beni kabul eder mi" degil.
   */
  responseRate: number | null;
  /** Puan dagilimi — 5'ten 1'e kac yorum */
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  memberSince: string;

  homeType: string | null;
  hasYard: boolean;
  yardFenced: boolean;
  hasOwnPets: boolean;
  /**
   * "Evde hayvan var" cumlesi EKRANDA gosterilsin mi.
   *
   * Kutuyu isaretlemek yetmiyor: en az bir hayvan fotografi da olmali.
   * Dogrulanmamis bir cumle, sahibin en cok onemsedigi konuda
   * (hayvanim baska bir hayvanla mi kalacak) verilmis bos bir soz
   * olurdu. Kutuyu isaretleyip fotograf koymayan bakicinin profilinde
   * bu satir HIC cikmiyor — "hayvan yok" da demiyoruz, cunku bilmiyoruz.
   */
  showsOwnPets: boolean;
  smokeFree: boolean;
  maxConcurrentPets: number;

  /**
   * EV KURALLARI — null = bakici cevaplamadi, satir CIZILMEZ.
   * Sessiz kalmak, vermedigi bir sozu ona soyletmekten iyidir.
   */
  hasChildren: boolean | null;
  petsOnBed: boolean | null;
  petsOnFurniture: boolean | null;
  pottyBreakHours: number | null;

  /**
   * KABUL KOSULLARI — "hangi hayvana bakmam".
   * false = boyle bir sart yok, satir cizilmez.
   */
  spayedNeuteredOnly: boolean;
  noFemalesInHeat: boolean;
  houseTrainedOnly: boolean;
  minPetAgeMonths: number | null;

  /** Bakicinin kendi cumleleri — DOGRULANMAMIS beyan, oyle etiketleniyor. */
  scheduleText: string | null;
  typicalDayText: string | null;
  safetyText: string | null;
  /** "Bakicinin sizden bilmek istedikleri" */
  ownerPrefsText: string | null;

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
        st.has_children, st.pets_on_bed, st.pets_on_furniture, st.potty_break_hours,
        st.schedule_text, st.typical_day_text, st.safety_text, st.owner_prefs_text,
        st.spayed_neutered_only, st.no_females_in_heat, st.house_trained_only,
        st.min_pet_age_months,
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
               p.first_name, p.last_name_initial, p.avatar_url,
               bk.service_type::text AS service_type
        FROM reviews r
        -- Hangi hizmet icin yazildigi rezervasyondan geliyor. LEFT:
        -- rezervasyonsuz bir kayit yorumu listeden dusurmemeli.
        LEFT JOIN bookings bk ON bk.id = r.booking_id
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
        -- Moderasyonda gizlenen yorum HICBIR genel listede gorunmez
        AND r.hidden_at IS NULL
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
              AND a.date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS open_days,
          /*
            YANIT ORANI — cevaplanan istek / gelen istek.

            "Cevap" onay ya da RET olabilir; olcülen sey nezaket degil,
            insanin cevap alip alamadigi. Cevapsiz kalip suresi dolan
            istek ('expired') paydada var, payda degil.

            Hala 'requested' durumda BEKLEYEN istekler hicbir yerde
            sayilmiyor: suresi dolmadan once onlari "cevapsiz" saymak,
            daha dun gelen bir istek yuzunden bakiciyi cezalandirmak
            olurdu.
          */
          (SELECT count(*)::int FROM bookings b
            WHERE b.sitter_id = ${userId}
              AND b.status <> 'requested') AS answerable,
          (SELECT count(*)::int FROM bookings b
            WHERE b.sitter_id = ${userId}
              AND b.status NOT IN ('requested', 'expired')) AS answered,
          /* Puan dagilimi — 5'ten 1'e. Ortalama tek basina "kac kisi
             kac verdi" sorusunu cevaplamiyor. */
          (SELECT count(*)::int FROM reviews r WHERE r.subject_id = ${userId}
            AND r.direction = 'owner_to_sitter' AND r.published_at IS NOT NULL
            AND r.hidden_at IS NULL AND r.rating = 5) AS r5,
          (SELECT count(*)::int FROM reviews r WHERE r.subject_id = ${userId}
            AND r.direction = 'owner_to_sitter' AND r.published_at IS NOT NULL
            AND r.hidden_at IS NULL AND r.rating = 4) AS r4,
          (SELECT count(*)::int FROM reviews r WHERE r.subject_id = ${userId}
            AND r.direction = 'owner_to_sitter' AND r.published_at IS NOT NULL
            AND r.hidden_at IS NULL AND r.rating = 3) AS r3,
          (SELECT count(*)::int FROM reviews r WHERE r.subject_id = ${userId}
            AND r.direction = 'owner_to_sitter' AND r.published_at IS NOT NULL
            AND r.hidden_at IS NULL AND r.rating = 2) AS r2,
          (SELECT count(*)::int FROM reviews r WHERE r.subject_id = ${userId}
            AND r.direction = 'owner_to_sitter' AND r.published_at IS NOT NULL
            AND r.hidden_at IS NULL AND r.rating = 1) AS r1
      `),
      db.execute(sql`
        SELECT url, alt, kind::text FROM sitter_photos
        WHERE sitter_id = ${userId}
        ORDER BY sort_order ASC
        LIMIT 12
      `),
    ]);

    const stats = (statRows as unknown as Array<Record<string, unknown>>)[0] ?? {};

    const allPhotos = (photoRows as unknown as Array<Record<string, unknown>>).map((ph) => ({
      url: String(ph.url),
      alt: (ph.alt as string | null) ?? null,
      kind: String(ph.kind),
    }));
    const petPhotos = allPhotos.filter((ph) => ph.kind === 'pet').slice(0, 4);

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
      photos: allPhotos.filter((ph) => ph.kind === 'home').slice(0, 6)
        .map(({ url, alt }) => ({ url, alt })),
      petPhotos: petPhotos.map(({ url, alt }) => ({ url, alt })),

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
      showsOwnPets: Boolean(row.has_own_pets) && petPhotos.length > 0,
      smokeFree: Boolean(row.smoke_free),
      maxConcurrentPets: Number(row.max_concurrent_pets ?? 1),

      /*
        Boolean(null) = false olurdu ve "evde cocuk yok" diye
        DOGRULANMAMIS bir cumle cizerdik. Uc durum korunuyor.
      */
      hasChildren: (row.has_children as boolean | null) ?? null,
      petsOnBed: (row.pets_on_bed as boolean | null) ?? null,
      petsOnFurniture: (row.pets_on_furniture as boolean | null) ?? null,
      pottyBreakHours: row.potty_break_hours === null || row.potty_break_hours === undefined
        ? null : Number(row.potty_break_hours),

      spayedNeuteredOnly: Boolean(row.spayed_neutered_only),
      noFemalesInHeat: Boolean(row.no_females_in_heat),
      houseTrainedOnly: Boolean(row.house_trained_only),
      minPetAgeMonths: row.min_pet_age_months === null || row.min_pet_age_months === undefined
        ? null : Number(row.min_pet_age_months),

      scheduleText: (row.schedule_text as string | null) ?? null,
      typicalDayText: (row.typical_day_text as string | null) ?? null,
      safetyText: (row.safety_text as string | null) ?? null,
      ownerPrefsText: (row.owner_prefs_text as string | null) ?? null,

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
        serviceType: (r.service_type as ServiceType | null) ?? null,
        publishedAt: new Date(r.published_at as Date).toISOString(),
        responseBody: (r.response_body as string | null) ?? null,
      })),

      openDays: Number(stats.open_days ?? 0),
      completedBookings: Number(stats.completed ?? 0),
      /*
        YANIT ORANI: cevaplanabilir istek yoksa ORAN YOK — null.
        Sifira bolmemek icin degil, DOGRU OLMADIGI icin: hic istek
        almamis bir bakicinin yanit orani "%0" degil, "henuz yok".
      */
      responseRate: Number(stats.answerable ?? 0) > 0
        ? Number(stats.answered ?? 0) / Number(stats.answerable ?? 0)
        : null,
      ratingCounts: {
        5: Number(stats.r5 ?? 0),
        4: Number(stats.r4 ?? 0),
        3: Number(stats.r3 ?? 0),
        2: Number(stats.r2 ?? 0),
        1: Number(stats.r1 ?? 0),
      },
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
  sitterInitial: string;
  /** Yorumun konusu olan kisinin fotografi — kartin guven capasi */
  sitterAvatarUrl: string | null;
  sitterSlug: string;
  citySlugEn: string;
  citySlugFr: string;
  cityNameEn: string;
  cityNameFr: string;
  /**
   * Yorumun geldigi rezervasyonun bilgileri. Hepsi NULL olabilir:
   * rezervasyona baglanmamis bir yorum kaydi teknik olarak mumkun ve
   * arayuz o durumda bu satirlari HIC cizmiyor — bos bir rozet
   * "dogrulanmis" demekten daha kotu.
   */
  serviceType: ServiceType | null;
  petName: string | null;
  petSpecies: string | null;
  petPhotoUrl: string | null;
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
             sp.first_name AS sitter_first, sp.last_name_initial AS sitter_initial,
             sp.avatar_url AS sitter_avatar, st.slug AS sitter_slug,
             c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
             c.name_en AS city_name_en, c.name_fr AS city_name_fr,
             bk.service_type::text AS service_type,
             pet.name AS pet_name, pet.species::text AS pet_species,
             pet.photo_url AS pet_photo
      FROM reviews r
      JOIN sitters st ON st.user_id = r.subject_id AND st.status = 'active'
      JOIN profiles sp ON sp.user_id = st.user_id
      JOIN cities c ON c.id = sp.city_id
      LEFT JOIN profiles a ON a.user_id = r.author_id
      /*
        Yorumun geldigi rezervasyon: hangi hizmet ve HANGI HAYVAN icin
        yazildigi buradan geliyor. LEFT: rezervasyonsuz bir yorum kaydi
        listeyi dusurmemeli.
      */
      LEFT JOIN bookings bk ON bk.id = r.booking_id
      /*
        Rezervasyondaki ILK hayvan. pet_ids bir JSONB dizisi; iki
        hayvanli bir rezervasyonda kartta ikisini birden gostermek
        yerini doldurmuyor, ilki yeterli.
      */
      LEFT JOIN pets pet
        ON pet.id = NULLIF(bk.pet_ids->>0, '')::uuid
       AND pet.deleted_at IS NULL
      WHERE r.direction = 'owner_to_sitter'
        AND r.published_at IS NOT NULL
        -- Moderasyonda gizlenen yorum HICBIR genel listede gorunmez
        AND r.hidden_at IS NULL
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
      sitterInitial: String(r.sitter_initial ?? ''),
      sitterAvatarUrl: (r.sitter_avatar as string | null) ?? null,
      sitterSlug: String(r.sitter_slug ?? ''),
      citySlugEn: String(r.city_slug_en),
      citySlugFr: String(r.city_slug_fr),
      cityNameEn: String(r.city_name_en),
      cityNameFr: String(r.city_name_fr),
      serviceType: (r.service_type as ServiceType | null) ?? null,
      petName: (r.pet_name as string | null) ?? null,
      petSpecies: (r.pet_species as string | null) ?? null,
      petPhotoUrl: (r.pet_photo as string | null) ?? null,
      publishedAt: new Date(r.published_at as Date).toISOString(),
    }));
  });
}

/* ------------------------------------------------- bakici panosu */

export interface SitterDashboard {
  status: 'draft' | 'pending' | 'active' | 'deactivated';
  slug: string | null;
  citySlugEn: string | null;
  citySlugFr: string | null;
  badgeLevel: number;
  /** Profil gucu icin — @havre/core profileCompleteness girdisi */
  steps: {
    hasAbout: boolean;
    hasLocation: boolean;
    serviceCount: number;
    hasHome: boolean;
    screeningStarted: boolean;
    photoCount: number;
  };
  /** Onumuzdeki 30 gunde rezervasyona acik gun sayisi */
  openDays: number;
  /** Ek hayvan ucreti GIRILMEMIS hizmet sayisi */
  servicesWithoutExtraPet: number;
  /**
   * ANLASILAN tutarlar — odenmis degil.
   *
   * Havre henuz odeme almiyor; bu rakamlar rezervasyonda donmus
   * sitter_payout_cents toplamlari. Ekranda "kazandiniz" DEMIYORUZ.
   */
  earnings: {
    awaitingAnswerCents: number;
    awaitingAnswerCount: number;
    upcomingCents: number;
    upcomingCount: number;
    doneCents: number;
    doneCount: number;
  };
}

/**
 * BAKICI PANOSU — tek sorgu.
 *
 * Onaylandiktan sonra bakicinin gordugu tek sey bos bir talep listesiydi:
 * profilinin yayinda oldugunu soyleyen bir satir, ne kadar para
 * konustugu, neyin eksik oldugu ve siradaki adim yoktu. Yapacak bir sey
 * bulamayan bakici geri gelmiyor.
 */
export async function getSitterDashboard(
  db: Database, sitterId: string,
): Promise<SitterDashboard | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT
        s.status::text AS status,
        s.slug,
        s.badge_level,
        c.slug_en AS city_slug_en,
        c.slug_fr AS city_slug_fr,

        (p.bio IS NOT NULL AND s.date_of_birth IS NOT NULL AND u.phone IS NOT NULL) AS has_about,
        (p.city_id IS NOT NULL AND p.exact_address_enc IS NOT NULL)                 AS has_location,
        (s.home_type IS NOT NULL)                                                   AS has_home,
        (SELECT count(*)::int FROM sitter_services ss WHERE ss.sitter_id = u.id)    AS service_count,
        EXISTS (SELECT 1 FROM verifications v
                WHERE v.sitter_id = u.id AND v.type = 'criminal')                   AS screening_started,
        ((p.avatar_url IS NOT NULL)::int
         + (SELECT count(*)::int FROM sitter_photos sp WHERE sp.sitter_id = u.id))  AS photo_count,

        -- Onumuzdeki 30 gun: kayit YOKSA gun aciktir (varsayilan 'open')
        (SELECT count(*)::int
           FROM generate_series(CURRENT_DATE, CURRENT_DATE + 29, interval '1 day') d
          WHERE COALESCE((SELECT a.status FROM sitter_availability a
                           WHERE a.sitter_id = u.id AND a.date = d::date), 'open') = 'open')
                                                                                    AS open_days,

        (SELECT count(*)::int FROM sitter_services ss
          WHERE ss.sitter_id = u.id AND ss.is_active
            AND COALESCE(ss.extra_pet_price_cents, 0) = 0)                          AS no_extra_pet,

        COALESCE((SELECT sum(b.sitter_payout_cents)::int FROM bookings b
                   WHERE b.sitter_id = u.id AND b.status = 'requested'), 0)         AS wait_cents,
        (SELECT count(*)::int FROM bookings b
          WHERE b.sitter_id = u.id AND b.status = 'requested')                      AS wait_count,
        COALESCE((SELECT sum(b.sitter_payout_cents)::int FROM bookings b
                   WHERE b.sitter_id = u.id
                     AND b.status IN ('confirmed','paid','in_progress')), 0)        AS up_cents,
        (SELECT count(*)::int FROM bookings b
          WHERE b.sitter_id = u.id
            AND b.status IN ('confirmed','paid','in_progress'))                     AS up_count,
        COALESCE((SELECT sum(b.sitter_payout_cents)::int FROM bookings b
                   WHERE b.sitter_id = u.id
                     AND b.status IN ('completed','payout_released')), 0)           AS done_cents,
        (SELECT count(*)::int FROM bookings b
          WHERE b.sitter_id = u.id
            AND b.status IN ('completed','payout_released'))                        AS done_count

      FROM sitters s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      LEFT JOIN cities c ON c.id = p.city_id
      WHERE s.user_id = ${sitterId}
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    if (!r) return null;

    return {
      status: String(r.status) as SitterDashboard['status'],
      slug: (r.slug as string | null) ?? null,
      citySlugEn: (r.city_slug_en as string | null) ?? null,
      citySlugFr: (r.city_slug_fr as string | null) ?? null,
      badgeLevel: Number(r.badge_level ?? 0),
      steps: {
        hasAbout: Boolean(r.has_about),
        hasLocation: Boolean(r.has_location),
        serviceCount: Number(r.service_count ?? 0),
        hasHome: Boolean(r.has_home),
        screeningStarted: Boolean(r.screening_started),
        photoCount: Number(r.photo_count ?? 0),
      },
      openDays: Number(r.open_days ?? 0),
      servicesWithoutExtraPet: Number(r.no_extra_pet ?? 0),
      earnings: {
        awaitingAnswerCents: Number(r.wait_cents ?? 0),
        awaitingAnswerCount: Number(r.wait_count ?? 0),
        upcomingCents: Number(r.up_cents ?? 0),
        upcomingCount: Number(r.up_count ?? 0),
        doneCents: Number(r.done_cents ?? 0),
        doneCount: Number(r.done_count ?? 0),
      },
    };
  });
}
