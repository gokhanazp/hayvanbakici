import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import { recordAudit } from './admin.js';

/**
 * KAPSAM — HANGI SEHIRDE HIZMET VERIYORUZ.
 *
 * NEDEN PANELDE: yeni bir sehre acilmak bir IS KARARI, kod degisikligi
 * degil. Bir sehri acmak icin surum cikarmak gerekseydi ayni zincir
 * KAPATMAYI da baglardi — ve kapatmak acmaktan aciliyken gerekebilir
 * (bakicilar cekildi, sikayet geldi, bolgeden cikiyoruz).
 *
 * KAPALI SEHIR NE DEMEK:
 *   - arama o sehirdeki bakicilari HIC dondurmuyor (search.ts),
 *   - bakicinin herkese acik profili acilmiyor (sitter.ts),
 *   - sehir sayfasi bekleme listesine donuyor ve noindex oluyor,
 *   - ama BASVURU acik: sehir acildiginda arz hazir olsun diye.
 *
 * ACMA/KAPATMA DENETIM KAYDINA yaziliyor. Bir sehrin bir sabah
 * kapali olmasinin sebebi "kim, ne zaman" diye sorulabilmeli.
 */

export interface CoverageCity {
  id: string;
  slugEn: string;
  slugFr: string;
  nameEn: string;
  nameFr: string;
  province: string;
  tier: number;
  isLive: boolean;
  liveSince: string | null;
  /** Aktif bakici sayisi — sehri acmadan once bakilacak tek sayi */
  sitterCount: number;
  /** Onaylanmayi bekleyen basvurular */
  pendingCount: number;
  /** Bekleme listesinde kac kisi var — hangi sehre acilmali sorusunun verisi */
  waitlistCount: number;
}

export async function listCoverage(db: Database): Promise<CoverageCity[]> {
  const rows = await withDbErrors(() => db.execute(sql`
    SELECT
      c.id, c.slug_en, c.slug_fr, c.name_en, c.name_fr,
      c.province::text AS province, c.tier, c.is_live, c.live_since,
      (SELECT count(*)::int FROM profiles p
         JOIN sitters s ON s.user_id = p.user_id
        WHERE p.city_id = c.id AND s.status = 'active')          AS sitter_count,
      (SELECT count(*)::int FROM profiles p
         JOIN sitters s ON s.user_id = p.user_id
        WHERE p.city_id = c.id AND s.status = 'pending')         AS pending_count,
      (SELECT count(DISTINCT w.email)::int FROM waitlist_signups w
        WHERE w.city_id = c.id)                                  AS waitlist_count
    FROM cities c
    /* Acik olanlar once, sonra talebi en yuksek olanlar: bir sonraki
       sehri secerken bakilacak sira bu. */
    ORDER BY c.is_live DESC, waitlist_count DESC, c.tier ASC, c.name_en ASC
  `));

  return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    slugEn: String(r.slug_en),
    slugFr: String(r.slug_fr),
    nameEn: String(r.name_en),
    nameFr: String(r.name_fr),
    province: String(r.province),
    tier: Number(r.tier),
    isLive: Boolean(r.is_live),
    liveSince: r.live_since ? new Date(r.live_since as string).toISOString() : null,
    sitterCount: Number(r.sitter_count ?? 0),
    pendingCount: Number(r.pending_count ?? 0),
    waitlistCount: Number(r.waitlist_count ?? 0),
  }));
}

/**
 * Sehri ac ya da kapat.
 *
 * `liveSince` yalnizca KAPALIDAN ACIGA gecerken damgalaniyor; kapatip
 * tekrar acmak tarihi yeniliyor ama acikken tekrar "ac" demek
 * degistirmiyor. Kapatirken tarih SILINMIYOR: "bir sure acikti"
 * bilgisi, kapaliyken de dogru bir bilgi.
 */
export async function setCityLive(
  db: Database, cityId: string, live: boolean, actorId: string,
): Promise<{ ok: true; name: string } | { ok: false; error: 'not_found' }> {
  return withDbErrors(async () => {
    const before = await db.execute(sql`
      SELECT name_en, is_live FROM cities WHERE id = ${cityId} LIMIT 1
    `);
    const row = (before as unknown as Array<Record<string, unknown>>)[0];
    if (!row) return { ok: false as const, error: 'not_found' as const };

    const wasLive = Boolean(row.is_live);
    await db.execute(sql`
      UPDATE cities
         SET is_live = ${live},
             live_since = CASE WHEN ${live} AND NOT is_live THEN now() ELSE live_since END
       WHERE id = ${cityId}
    `);

    await recordAudit(db, {
      actorId,
      action: live ? 'coverage.cityOpened' : 'coverage.cityClosed',
      entity: 'city',
      entityId: cityId,
      before: { isLive: wasLive },
      after: { isLive: live, name: String(row.name_en) },
    });

    return { ok: true as const, name: String(row.name_en) };
  });
}

export interface NewCity {
  nameEn: string;
  nameFr: string;
  slugEn: string;
  slugFr: string;
  province: string;
  lat: number;
  lon: number;
  tier: number;
}

/**
 * Yeni sehir ekler — HER ZAMAN KAPALI baslar.
 *
 * Eklemek ve acmak ayri iki karar: bir sehri listeye koymak, o sehirde
 * hizmet verdigimizi ilan etmekle ayni sey degil. Aci acmak ikinci bir
 * tiklama istiyor ve o tiklama denetim kaydina yaziliyor.
 *
 * Merkez noktasi ZORUNLU: arama yaricapi oradan olculuyor, noktasiz bir
 * sehirde arama hicbir sey bulamaz ve sebebi gorunmezdi.
 */
export async function createCity(
  db: Database, input: NewCity, actorId: string,
): Promise<{ ok: true; id: string } | { ok: false; error: 'duplicate_slug' }> {
  return withDbErrors(async () => {
    const clash = await db.execute(sql`
      SELECT 1 FROM cities
       WHERE province = ${input.province}::province
         AND (slug_en = ${input.slugEn} OR slug_fr = ${input.slugFr})
       LIMIT 1
    `);
    if ((clash as unknown as unknown[]).length > 0) {
      return { ok: false as const, error: 'duplicate_slug' as const };
    }

    const rows = await db.execute(sql`
      INSERT INTO cities (slug_en, slug_fr, name_en, name_fr, province, tier, centroid, is_live)
      VALUES (${input.slugEn}, ${input.slugFr}, ${input.nameEn}, ${input.nameFr},
              ${input.province}::province, ${input.tier},
              ST_SetSRID(ST_MakePoint(${input.lon}, ${input.lat}), 4326)::geography,
              false)
      RETURNING id
    `);
    const id = String((rows as unknown as Array<{ id: string }>)[0]!.id);

    await recordAudit(db, {
      actorId,
      action: 'coverage.cityAdded',
      entity: 'city',
      entityId: id,
      after: { name: input.nameEn, province: input.province, tier: input.tier },
    });

    return { ok: true as const, id };
  });
}
