import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';
import type { Locale } from './types.js';
import { postalRegion } from '@havre/core';

/**
 * ARAMA KUTUSUNDAKI METNI HARITADA BIR NOKTAYA CEVIRIR.
 *
 * Sira bilincli — kesinden belirsize:
 *   1. Mahalle adi   -> gercek merkez noktasi (en kesin)
 *   2. Sehir adi     -> sehir merkezi
 *   3. Posta kodu    -> ilk harften il/sehir (YAKLASIK, kullaniciya soylenir)
 *   4. Hicbiri       -> null; arayuz "buray bulamadik" der ve sehir listeler
 *
 * DIS SERVIS YOK. Gerekce packages/core/src/postal.ts basliginda.
 *
 * AKSAN DUYARSIZ: "Montreal" yazan kullanici "Montréal" bulmali.
 * unaccent eklentisine BAGLANMIYORUZ (her kurulumda yuklu olmayabilir ve
 * migration'da CREATE EXTENSION superuser ister); translate() ile Fransizca
 * aksanli harfler sadelestiriliyor. Sadelestirme iki tarafa da uygulanir.
 */

const ACCENTED = 'àâäçéèêëîïôöùûüÿÀÂÄÇÉÈÊËÎÏÔÖÙÛÜŸ';
const PLAIN = 'aaaceeeeiioouuuyAAACEEEEIIOOUUUY';

/** Kolon adi icin — icine KULLANICI GIRDISI GIRMEZ. */
const normCol = (col: string) => sql.raw(`lower(translate(${col}, '${ACCENTED}', '${PLAIN}'))`);

/**
 * Kullanici girdisi icin — DEGER OLARAK BAGLANIR.
 * Girdiyi SQL metnine gommek (dolar tirnagiyla bile) enjeksiyon kapisidir:
 * kullanicinin yazdigi metin sorgunun kendisi olamaz.
 */
const normParam = (value: string) => sql`lower(translate(${value}, ${ACCENTED}, ${PLAIN}))`;

/**
 * LIKE joker karakterleri kacirilir: kullanicinin yazdigi "%" tum kayitlarla
 * eslesen bir desen olmamali. Kacis karakteri backslash, ESCAPE ile bildiriliyor.
 */
const likeSafe = (value: string) => value.replace(/[\\%_]/g, (ch) => `\\${ch}`);

export interface PlaceMatch {
  kind: 'neighbourhood' | 'city' | 'postal';
  /** Kullaniciya gosterilecek ad — "Leslieville, Toronto" */
  label: string;
  lon: number;
  lat: number;
  cityId: string;
  citySlugEn: string;
  citySlugFr: string;
  cityNameEn: string;
  cityNameFr: string;
  /** true ise konum sehir kesinliginde; arayuz bunu soylemek zorunda */
  approximate: boolean;
}

interface Row extends Record<string, unknown> {
  lon: number; lat: number;
  city_id: string; city_slug_en: string; city_slug_fr: string;
  city_name_en: string; city_name_fr: string;
  hood_en: string | null; hood_fr: string | null;
}

const toMatch = (
  r: Row, kind: PlaceMatch['kind'], locale: Locale, approximate: boolean,
): PlaceMatch => {
  const city = locale === 'fr-CA' ? String(r.city_name_fr) : String(r.city_name_en);
  const hood = locale === 'fr-CA' ? r.hood_fr : r.hood_en;
  return {
    kind,
    label: hood ? `${hood}, ${city}` : city,
    lon: Number(r.lon), lat: Number(r.lat),
    cityId: String(r.city_id),
    citySlugEn: String(r.city_slug_en), citySlugFr: String(r.city_slug_fr),
    cityNameEn: String(r.city_name_en), cityNameFr: String(r.city_name_fr),
    approximate,
  };
};

export async function resolvePlace(
  db: Database, query: string, locale: Locale,
): Promise<PlaceMatch | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  return withDbErrors(async () => {
    // --- 1. Mahalle ---
    /*
      TAM ESLESME YETMIYOR. Veritabaninda "Le Plateau-Mont-Royal" yaziyor,
      kullanici "Plateau" yaziyor ve hicbir sey bulunamiyordu. Sira:
      once birebir, sonra bastan, sonra iceren. ORDER BY bu siralamayi
      koruyor ki "Plateau" once "Le Plateau"yu bulsun, sonra icinde
      plateau gecen baska bir adi.
    */
    const like = likeSafe(q);
    const hoodRes = await db.execute(sql`
      SELECT
        ST_X(n.centroid::geometry) AS lon, ST_Y(n.centroid::geometry) AS lat,
        c.id AS city_id, c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
        c.name_en AS city_name_en, c.name_fr AS city_name_fr,
        n.name_en AS hood_en, n.name_fr AS hood_fr,
        LEAST(
          CASE WHEN ${normCol('n.name_en')} = ${normParam(q)} THEN 0
               WHEN ${normCol('n.name_en')} LIKE ${normParam(like)} || '%' ESCAPE '\\' THEN 1
               WHEN ${normCol('n.name_en')} LIKE '%' || ${normParam(like)} || '%' ESCAPE '\\' THEN 2
               ELSE 9 END,
          CASE WHEN ${normCol('n.name_fr')} = ${normParam(q)} THEN 0
               WHEN ${normCol('n.name_fr')} LIKE ${normParam(like)} || '%' ESCAPE '\\' THEN 1
               WHEN ${normCol('n.name_fr')} LIKE '%' || ${normParam(like)} || '%' ESCAPE '\\' THEN 2
               ELSE 9 END
        ) AS rank
      FROM neighbourhoods n
      JOIN cities c ON c.id = n.city_id
      WHERE n.centroid IS NOT NULL
        AND (${normCol('n.name_en')} LIKE '%' || ${normParam(like)} || '%' ESCAPE '\\'
          OR ${normCol('n.name_fr')} LIKE '%' || ${normParam(like)} || '%' ESCAPE '\\')
      ORDER BY rank ASC, c.tier ASC
      LIMIT 1
    `);
    const hood = (hoodRes as unknown as Row[])[0];
    if (hood) return toMatch(hood, 'neighbourhood', locale, false);

    // --- 2. Sehir ---
    const cityRes = await db.execute(sql`
      SELECT
        ST_X(c.centroid::geometry) AS lon, ST_Y(c.centroid::geometry) AS lat,
        c.id AS city_id, c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
        c.name_en AS city_name_en, c.name_fr AS city_name_fr,
        NULL::text AS hood_en, NULL::text AS hood_fr
      FROM cities c
      WHERE c.centroid IS NOT NULL
        AND (${normCol('c.name_en')} = ${normParam(q)}
          OR ${normCol('c.name_fr')} = ${normParam(q)}
          OR ${normCol('c.name_en')} LIKE ${normParam(like)} || '%' ESCAPE '\\'
          OR ${normCol('c.name_fr')} LIKE ${normParam(like)} || '%' ESCAPE '\\'
          OR c.slug_en = ${q.toLowerCase()} OR c.slug_fr = ${q.toLowerCase()})
      ORDER BY c.tier ASC
      LIMIT 1
    `);
    const city = (cityRes as unknown as Row[])[0];
    if (city) return toMatch(city, 'city', locale, false);

    // --- 3. Posta kodu ---
    const region = postalRegion(q);
    if (!region) return null;

    /*
      Harf bir sehri dogrudan veriyorsa (M/H) onu ariyoruz; vermiyorsa
      ildeki EN GUCLU sehri seciyoruz. "En guclu" = once tier, sonra aktif
      bakici sayisi: kullaniciyi bakicisi olmayan bir sehre dusurmek,
      bulunmayan bir yere dusurmekten daha kotu.
    */
    const postalRes = await db.execute(sql`
      SELECT
        ST_X(c.centroid::geometry) AS lon, ST_Y(c.centroid::geometry) AS lat,
        c.id AS city_id, c.slug_en AS city_slug_en, c.slug_fr AS city_slug_fr,
        c.name_en AS city_name_en, c.name_fr AS city_name_fr,
        NULL::text AS hood_en, NULL::text AS hood_fr
      FROM cities c
      LEFT JOIN profiles p ON p.city_id = c.id
      LEFT JOIN sitters s ON s.user_id = p.user_id AND s.status = 'active'
      WHERE c.centroid IS NOT NULL
        AND c.province = ${region.province}::province
        ${region.citySlug ? sql`AND c.slug_en = ${region.citySlug}` : sql``}
      GROUP BY c.id
      ORDER BY c.tier ASC, count(s.user_id) DESC
      LIMIT 1
    `);
    const byPostal = (postalRes as unknown as Row[])[0];
    return byPostal ? toMatch(byPostal, 'postal', locale, true) : null;
  });
}
