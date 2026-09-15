import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import type { Locale } from './types.js';
import type { SitterSummary } from './landing.js';
import type { ServiceType } from '@havre/core';

/**
 * FAVORI BAKICILAR — okuma ve yazma.
 *
 * Tarayicida (cerezde) tutulan favorilerle ayni veri modelini
 * kullaniyor: her ikisi de bir BAKICI KIMLIK listesi. Boylece giris
 * yapmis ve yapmamis kullanici icin ekranin cizdigi sey ayni, yalnizca
 * listenin geldigi yer farkli.
 */

/** Favoriye ekle. Zaten varsa sessizce gecer — cift tiklama hata degil. */
export async function addFavourite(
  db: Database, userId: string, sitterId: string,
): Promise<void> {
  await withDbErrors(() => db.execute(sql`
    INSERT INTO favourites (user_id, sitter_id)
    VALUES (${userId}::uuid, ${sitterId}::uuid)
    ON CONFLICT DO NOTHING
  `));
}

export async function removeFavourite(
  db: Database, userId: string, sitterId: string,
): Promise<void> {
  await withDbErrors(() => db.execute(sql`
    DELETE FROM favourites
    WHERE user_id = ${userId}::uuid AND sitter_id = ${sitterId}::uuid
  `));
}

/**
 * Kullanicinin favori bakici kimlikleri.
 *
 * Kart uzerindeki kalbin dolu mu bos mu cizilecegi buna bakiyor; arama
 * sayfasi 24 kart icin 24 sorgu degil TEK sorgu yapiyor.
 */
export async function favouriteIds(db: Database, userId: string): Promise<Set<string>> {
  const rows = await withDbErrors(() => db.execute(sql`
    SELECT sitter_id::text AS id FROM favourites WHERE user_id = ${userId}::uuid
  `));
  return new Set((rows as unknown as Array<{ id: string }>).map((r) => r.id));
}

/**
 * VERILEN KIMLIKLERDEN HANGILERI GERCEK, YAYINDA BAKICI.
 *
 * Cerezdeki liste kullanicinin tarayicisindan geliyor: elle
 * degistirilmis, eskimis ya da artik yayinda olmayan bir hesaba ait
 * olabilir. Cereze YAZARKEN degil, KULLANIRKEN suzuyoruz — cerezi
 * dogrulanmis veri saymak, disaridan gelen veriyi dogru saymak olurdu.
 */
export async function existingSitterIds(
  db: Database, ids: readonly string[],
): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await withDbErrors(() => db.execute(sql`
    SELECT user_id::text AS id FROM sitters
    WHERE user_id = ANY(${sql`ARRAY[${sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `)}]`})
      AND status = 'active' AND slug IS NOT NULL
  `));
  return (rows as unknown as Array<{ id: string }>).map((r) => r.id);
}

/**
 * TARAYICIDAKI FAVORILERI HESABA TASI.
 *
 * Giris yapmadan favorilemis kullanici, giris yaptiginda listesini
 * kaybetmemeli — kaybederse ozellik hic olmamis gibi olur. Tasima
 * EKLEMEDIR, silme degil: hesapta zaten olanlar oldugu gibi kaliyor ve
 * ON CONFLICT ikisinin kesisimini sorunsuz yutuyor.
 *
 * Kac kaydin gercekten eklendigini doner — ekran "3 favori hesabiniza
 * tasindi" diyebilsin diye; "tasindi" demek icin tasinmis olmasi lazim.
 */
export async function claimFavourites(
  db: Database, userId: string, ids: readonly string[],
): Promise<number> {
  const valid = await existingSitterIds(db, ids);
  if (valid.length === 0) return 0;
  const before = await favouriteIds(db, userId);
  for (const id of valid) await addFavourite(db, userId, id);
  const after = await favouriteIds(db, userId);
  return after.size - before.size;
}

export interface FavouriteSitter extends SitterSummary {
  /** Kart adresini kurmak icin: /en/<sehir>/sitter/<slug>/ */
  citySlugEn: string;
  citySlugFr: string;
  /** Kartta gosterilecek hizmet — bakicinin sundugu ilk hizmet. */
  serviceType: ServiceType;
  favouritedAt: string;
}

/**
 * FAVORI LISTESI — kart cizmeye yetecek kadar bilgi.
 *
 * Arama karti ile AYNI bilesen kullaniliyor, bu yuzden ayni alanlar
 * gerekiyor; ustune sehir dilimi (kart adresi icin) ve hizmet turu.
 *
 * ids disaridan geliyor (hesaptan ya da cerezden) — sorgu kimin listesi
 * oldugunu sormuyor, yalnizca verilen kimlikleri ciziyor. Cerez yolunda
 * kullanici kimligi zaten yok.
 */
export async function favouriteSitters(
  db: Database, ids: readonly string[], locale: Locale,
): Promise<FavouriteSitter[]> {
  if (ids.length === 0) return [];
  const nameCol = locale === 'fr-CA' ? 'n.name_fr' : 'n.name_en';

  const rows = await withDbErrors(() => db.execute(sql`
    SELECT
      st.user_id::text AS id, st.slug,
      pr.first_name, pr.last_name_initial, pr.avatar_url,
      ${sql.raw(nameCol)} AS neighbourhood,
      c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
      st.average_rating::float8 AS rating, st.review_count::int,
      st.median_response_minutes::int AS response_minutes,
      st.badge_level::int, st.has_yard, st.yard_fenced,
      COALESCE(st.home_type::text, 'house') AS home_type,
      /*
        BASLICA HIZMET — konaklama, sonra evde bakim, sonra ziyaret...
        (SERVICE_TYPES sirasi; service_type enum'u ayni sirada
        tanimli, bu yuzden ORDER BY dogrudan o sirayi veriyor.)

        Once "en ucuz hizmet" seciliyordu ve kart, konaklama arayip
        favorilemis kullaniciya o bakicinin gezdirme fiyatini
        gosteriyordu: rakam dogru ama SORU bu degildi. Ayni kural
        profil sayfasinda da kullaniliyor (primaryService).
      */
      s1.service_type::text AS service_type,
      s1.price_cents::int,
      s1.accepts_cats,
      (SELECT count(*)::int FROM bookings b
        WHERE b.sitter_id = st.user_id AND b.attribution IN ('repeat','sitter_referral')
      ) AS repeat_clients
    FROM sitters st
    JOIN profiles pr ON pr.user_id = st.user_id
    JOIN neighbourhoods n ON n.id = pr.neighbourhood_id
    JOIN cities c ON c.id = pr.city_id
    JOIN LATERAL (
      SELECT ss.service_type, ss.price_cents, ss.accepts_cats
      FROM sitter_services ss
      WHERE ss.sitter_id = st.user_id AND ss.is_active
      ORDER BY ss.service_type
      LIMIT 1
    ) s1 ON TRUE
    WHERE st.user_id = ANY(${sql`ARRAY[${sql.join(ids.map((i) => sql`${i}::uuid`), sql`, `)}]`})
      AND st.status = 'active' AND st.slug IS NOT NULL
  `));

  const byId = new Map<string, FavouriteSitter>();
  for (const row of rows as unknown as Array<Record<string, unknown>>) {
    const first = String(row.first_name);
    const initial = String(row.last_name_initial);
    byId.set(String(row.id), {
      id: String(row.id),
      slug: String(row.slug ?? ''),
      firstName: first,
      lastNameInitial: initial,
      neighbourhood: String(row.neighbourhood),
      priceCents: Number(row.price_cents),
      rating: Math.round(Number(row.rating) * 10) / 10,
      reviewCount: Number(row.review_count),
      repeatClients: Number(row.repeat_clients),
      responseMinutes: Number(row.response_minutes),
      badgeLevel: Number(row.badge_level) as 0 | 1 | 2 | 3 | 4,
      hasYard: Boolean(row.has_yard),
      yardFenced: Boolean(row.yard_fenced),
      acceptsCats: Boolean(row.accepts_cats),
      homeType: String(row.home_type),
      photoInitials: `${first[0] ?? 'A'}${initial}`,
      avatarUrl: (row.avatar_url as string | null) ?? null,
      citySlugEn: String(row.city_slug_en),
      citySlugFr: String(row.city_slug_fr),
      serviceType: String(row.service_type) as ServiceType,
      favouritedAt: '',
    });
  }

  /*
    SIRA CAGIRANIN VERDIGI SIRA. Hesapta "en son eklenen ustte", cerezde
    de oyle; SQL'in dondugu sira ise tanimsiz. Siralamayi burada
    yapmasaydik liste her yenilemede karisabilirdi.
  */
  return ids.map((id) => byId.get(id)).filter((s): s is FavouriteSitter => s !== undefined);
}

/** Favorilerin kimlikleri, en son eklenen ustte. */
export async function favouriteIdsOrdered(db: Database, userId: string): Promise<string[]> {
  const rows = await withDbErrors(() => db.execute(sql`
    SELECT sitter_id::text AS id FROM favourites
    WHERE user_id = ${userId}::uuid
    ORDER BY created_at DESC, sitter_id
  `));
  return (rows as unknown as Array<{ id: string }>).map((r) => r.id);
}
