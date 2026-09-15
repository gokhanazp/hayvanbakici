import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';

/**
 * SAHIBIN HAYVANLARI.
 *
 * NEDEN AYRI BIR DOSYA: bugune kadar hayvanlar YALNIZCA rezervasyon
 * formunun icinde yaratilabiliyordu (booking.ts icindeki createPet) ve
 * yaratildiktan sonra hicbir ekranda gorulemiyordu. Kullanici adini
 * yanlis yazdiysa duzeltemiyor, fotograf ekleyemiyor, hayvani olmeyse
 * listeden cikaramiyordu. Rezervasyon sorgularinin arasinda duran bir
 * "createPet", hayvanin rezervasyonun bir alani oldugunu ima
 * ediyordu; degil — hesabin bir parcasi.
 */

export type Species = 'dog' | 'cat' | 'other';

export interface OwnerPet {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  birthDate: string | null;
  weightKg: number | null;
  photoUrl: string | null;
  temperamentNotes: string | null;
  /** En yakin zamanda dolan asi — kartta "asisi X tarihinde doluyor" */
  vaccinationExpiry: string | null;
}

export interface PetInput {
  name: string;
  species: Species;
  breed?: string | null | undefined;
  birthDate?: string | null | undefined;
  weightKg?: number | null | undefined;
  temperamentNotes?: string | null | undefined;
}

/** Bir sahibin tutabilecegi hayvan sayisi — yanlislikla yuzlerce kayit acilmasin. */
export const MAX_PETS = 12;

function mapRow(r: Record<string, unknown>): OwnerPet {
  return {
    id: String(r.id),
    name: String(r.name),
    species: String(r.species) as Species,
    breed: (r.breed as string | null) ?? null,
    birthDate: r.birth_date ? String(r.birth_date) : null,
    weightKg: r.weight_kg === null || r.weight_kg === undefined ? null : Number(r.weight_kg),
    photoUrl: (r.photo_url as string | null) ?? null,
    temperamentNotes: (r.temperament_notes as string | null) ?? null,
    vaccinationExpiry: r.vaccination_expiry ? String(r.vaccination_expiry) : null,
  };
}

const SELECT = sql`
  p.id::text, p.name, p.species::text AS species, p.breed,
  p.birth_date::text AS birth_date, p.weight_kg, p.photo_url,
  p.temperament_notes,
  (SELECT min(v.expires_on)::text FROM pet_vaccinations v
    WHERE v.pet_id = p.id AND v.expires_on IS NOT NULL) AS vaccination_expiry
`;

export async function listOwnerPets(db: Database, ownerId: string): Promise<OwnerPet[]> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT ${SELECT} FROM pets p
      WHERE p.owner_id = ${ownerId}::uuid AND p.deleted_at IS NULL
      ORDER BY p.created_at ASC
    `);
    return (rows as unknown as Array<Record<string, unknown>>).map(mapRow);
  });
}

/**
 * Tek hayvan — SAHIBIYLE BIRLIKTE sorgulaniyor.
 *
 * Kimlik kontrolu WHERE icinde: baskasinin hayvanini duzenlemeye
 * calisan istek hicbir satir bulamiyor, "yetkiniz yok" diye ayri bir
 * dal yazmaya gerek kalmiyor.
 */
export async function getOwnerPet(
  db: Database, petId: string, ownerId: string,
): Promise<OwnerPet | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT ${SELECT} FROM pets p
      WHERE p.id = ${petId}::uuid AND p.owner_id = ${ownerId}::uuid AND p.deleted_at IS NULL
      LIMIT 1
    `);
    const r = (rows as unknown as Array<Record<string, unknown>>)[0];
    return r ? mapRow(r) : null;
  });
}

export async function createOwnerPet(
  db: Database, ownerId: string, input: PetInput,
): Promise<{ ok: true; id: string } | { ok: false; error: 'too_many' }> {
  return withDbErrors(async () => {
    const countRows = await db.execute(sql`
      SELECT count(*)::int AS n FROM pets
      WHERE owner_id = ${ownerId}::uuid AND deleted_at IS NULL
    `);
    const n = Number((countRows as unknown as Array<{ n: number }>)[0]?.n ?? 0);
    if (n >= MAX_PETS) return { ok: false as const, error: 'too_many' as const };

    const rows = await db.execute(sql`
      INSERT INTO pets (owner_id, name, species, breed, birth_date, weight_kg, temperament_notes)
      VALUES (
        ${ownerId}::uuid, ${input.name}, ${input.species}::species,
        ${input.breed ?? null}, ${input.birthDate ?? null},
        ${input.weightKg ?? null}, ${input.temperamentNotes ?? null}
      )
      RETURNING id::text
    `);
    return { ok: true as const, id: String((rows as unknown as Array<{ id: string }>)[0]!.id) };
  });
}

export async function updateOwnerPet(
  db: Database, petId: string, ownerId: string, input: PetInput,
): Promise<boolean> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      UPDATE pets SET
        name = ${input.name},
        species = ${input.species}::species,
        breed = ${input.breed ?? null},
        birth_date = ${input.birthDate ?? null},
        weight_kg = ${input.weightKg ?? null},
        temperament_notes = ${input.temperamentNotes ?? null}
      WHERE id = ${petId}::uuid AND owner_id = ${ownerId}::uuid AND deleted_at IS NULL
      RETURNING id
    `);
    return (rows as unknown as unknown[]).length > 0;
  });
}

/**
 * Fotograf. Onceki adresi DONDURUYOR ki cagiran taraf eski dosyayi
 * depodan da silebilsin — silinmeyen dosya, kullanicinin sildigini
 * sandigi bir fotografin adresinin acik kalmasi demek.
 */
export async function setPetPhoto(
  db: Database, petId: string, ownerId: string, url: string | null,
): Promise<{ ok: boolean; previous: string | null }> {
  return withDbErrors(async () => {
    /*
      ONCE OKU, SONRA YAZ. Tek bir UPDATE ... RETURNING ile eski degeri
      almak Postgres'te calisir ama neden calistigi (anlik goruntu
      kurallari) okuyana gorunmuyor; iki adim burada daha ucuz.
    */
    const before = await db.execute(sql`
      SELECT photo_url FROM pets
      WHERE id = ${petId}::uuid AND owner_id = ${ownerId}::uuid AND deleted_at IS NULL
      LIMIT 1
    `);
    const prev = (before as unknown as Array<{ photo_url: string | null }>)[0];
    if (!prev) return { ok: false, previous: null };

    await db.execute(sql`
      UPDATE pets SET photo_url = ${url}
      WHERE id = ${petId}::uuid AND owner_id = ${ownerId}::uuid AND deleted_at IS NULL
    `);
    return { ok: true, previous: prev.photo_url ?? null };
  });
}

/**
 * SILME YUMUSAK.
 *
 * Gecmis rezervasyonlar bu hayvana bagli; satiri gercekten silmek, bir
 * yil once yapilmis bir rezervasyonun kimin icin oldugunu kaybetmek
 * olurdu. Kullanici icin sonuc ayni: listeden gidiyor ve yeni
 * rezervasyonda secilemiyor.
 */
export async function deleteOwnerPet(
  db: Database, petId: string, ownerId: string,
): Promise<string | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      UPDATE pets SET deleted_at = now()
      WHERE id = ${petId}::uuid AND owner_id = ${ownerId}::uuid AND deleted_at IS NULL
      RETURNING photo_url
    `);
    const r = (rows as unknown as Array<{ photo_url: string | null }>)[0];
    return r ? (r.photo_url ?? null) : null;
  });
}
