'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import {
  createOwnerPet, updateOwnerPet, deleteOwnerPet, setPetPhoto, getOwnerPet,
} from '@/lib/data';
import { getStorage, keyFromUrl } from '@/lib/storage';
import { processImage, MAX_UPLOAD_BYTES } from '@/lib/images';
import type { Species } from '@/lib/data';

export type PetState = {
  error?: string | undefined;
  /** Kaydedilen hayvanin kimligi — ekran "kaydedildi" diyebilsin diye */
  savedId?: string | undefined;
  savedAt?: number | undefined;
};

const SPECIES = new Set<Species>(['dog', 'cat', 'other']);

/**
 * FORMDAN GELEN HAYVAN BILGISI.
 *
 * Bos alanlar null oluyor, bos DIZE degil: veritabaninda '' ile NULL
 * ayni sey degil ve kart "irk: " diye bos bir satir cizerdi.
 *
 * Dogum tarihi GELECEKTE olamaz ve makul bir gecmisten eski olamaz:
 * yanlis girilen bir yil, kartta "43 yasinda" yazan bir kopek demek.
 */
function parse(form: FormData): { ok: true; value: Parameters<typeof createOwnerPet>[1] }
  | { ok: false; error: string } {
  const name = String(form.get('name') ?? '').trim().slice(0, 60);
  if (!name) return { ok: false, error: 'name_required' };

  const speciesRaw = String(form.get('species') ?? '');
  if (!SPECIES.has(speciesRaw as Species)) return { ok: false, error: 'species_required' };

  const breed = String(form.get('breed') ?? '').trim().slice(0, 60) || null;
  const notes = String(form.get('temperamentNotes') ?? '').trim().slice(0, 500) || null;

  const birthRaw = String(form.get('birthDate') ?? '').trim();
  let birthDate: string | null = null;
  if (birthRaw) {
    const t = Date.parse(`${birthRaw}T00:00:00Z`);
    if (!Number.isFinite(t)) return { ok: false, error: 'birth_invalid' };
    if (t > Date.now()) return { ok: false, error: 'birth_future' };
    if (t < Date.parse('1985-01-01T00:00:00Z')) return { ok: false, error: 'birth_invalid' };
    birthDate = birthRaw;
  }

  const weightRaw = String(form.get('weightKg') ?? '').trim();
  let weightKg: number | null = null;
  if (weightRaw) {
    const n = Number(weightRaw);
    if (!Number.isFinite(n) || n <= 0 || n > 120) return { ok: false, error: 'weight_invalid' };
    weightKg = Math.round(n * 10) / 10;
  }

  return { ok: true, value: { name, species: speciesRaw as Species, breed, birthDate, weightKg, temperamentNotes: notes } };
}

export async function savePetAction(_prev: PetState, form: FormData): Promise<PetState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const parsed = parse(form);
  if (!parsed.ok) return { error: parsed.error };

  const petId = String(form.get('petId') ?? '');
  const seg = String(form.get('locale') ?? 'en');

  if (petId) {
    /* Sahiplik kontrolu sorgunun WHERE'inde: baskasinin hayvani
       hicbir satir bulamiyor ve false donuyor. */
    const ok = await updateOwnerPet(petId, session.user.id, parsed.value);
    if (!ok) return { error: 'not_found' };
    revalidatePath(`/${seg}/account/pets/`);
    return { savedId: petId, savedAt: Date.now() };
  }

  const res = await createOwnerPet(session.user.id, parsed.value);
  if (!res.ok) return { error: res.error };
  revalidatePath(`/${seg}/account/pets/`);
  revalidatePath(`/${seg}/account/`);
  return { savedId: res.id, savedAt: Date.now() };
}

export async function deletePetAction(_prev: PetState, form: FormData): Promise<PetState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const petId = String(form.get('petId') ?? '');
  const seg = String(form.get('locale') ?? 'en');

  const photo = await deleteOwnerPet(petId, session.user.id);
  /* Kayit gittiyse fotograf da gitmeli — silindigini saniyor ama
     adresi acik duruyor olsaydi, bu bir gizlilik sorunu olurdu. */
  if (photo) {
    const key = keyFromUrl(photo);
    if (key) await getStorage().remove(key);
  }
  revalidatePath(`/${seg}/account/pets/`);
  revalidatePath(`/${seg}/account/`);
  return { savedAt: Date.now() };
}

export type PetPhotoState = { error?: string | undefined; done?: string | undefined };

export async function uploadPetAvatarAction(
  _prev: PetPhotoState, form: FormData,
): Promise<PetPhotoState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const petId = String(form.get('petId') ?? '');
  if (!(await getOwnerPet(petId, session.user.id))) return { error: 'not_found' };

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'no_file' };
  if (file.size > MAX_UPLOAD_BYTES) return { error: 'too_large' };
  const buf = Buffer.from(await file.arrayBuffer());

  /* Hayvan fotografi da KARE kirpiliyor: kartta daire icinde duruyor. */
  const img = await processImage(buf, 'avatar');
  if (!img.ok) return { error: img.error };

  const saved = await getStorage().put('pet', img.body, img.ext, img.contentType);
  const res = await setPetPhoto(petId, session.user.id, saved.url);
  if (!res.ok) {
    const key = keyFromUrl(saved.url);
    if (key) await getStorage().remove(key);
    return { error: 'not_found' };
  }
  if (res.previous) {
    const old = keyFromUrl(res.previous);
    if (old) await getStorage().remove(old);
  }

  revalidatePath('/', 'layout');
  return { done: 'photo' };
}

export async function removePetAvatarAction(
  _prev: PetPhotoState, form: FormData,
): Promise<PetPhotoState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const res = await setPetPhoto(String(form.get('petId') ?? ''), session.user.id, null);
  if (!res.ok) return { error: 'not_found' };
  if (res.previous) {
    const key = keyFromUrl(res.previous);
    if (key) await getStorage().remove(key);
  }
  revalidatePath('/', 'layout');
  return { done: 'removed' };
}
