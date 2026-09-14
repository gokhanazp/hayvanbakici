'use server';

import { revalidatePath } from 'next/cache';
import { isLocale } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import {
  setAvatar, addSitterPhoto, deleteSitterPhoto, updateProfile, getSitterStatus,
} from '@/lib/data';
import { getStorage, keyFromUrl } from '@/lib/storage';
import { processImage, MAX_UPLOAD_BYTES, type Preset } from '@/lib/images';

export type UploadState = { error?: string | undefined; done?: string | undefined };

/**
 * FOTOGRAF YUKLEME.
 *
 * SIRA ONEMLI: once gorseli ISLE (dogrula + yeniden kodla), sonra
 * DEPOLA, en son VERITABANINA yaz. Ters sirada, dogrulamayi gecemeyen
 * bir dosyanin adresi kayda girebilir ya da diskte sahipsiz dosya kalir.
 *
 * ESKI DOSYA SILINIYOR: yeni bir profil fotografi yuklendiginde eskisi
 * diskte kalirsa, kullanici \"sildim\" sandigi fotograf adresini bilen
 * herkese acik kalmaya devam eder.
 */
async function readImage(form: FormData, field: string): Promise<
  { ok: true; buf: Buffer } | { ok: false; error: string }
> {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'no_file' };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' };
  return { ok: true, buf: Buffer.from(await file.arrayBuffer()) };
}

async function store(buf: Buffer, preset: Preset) {
  const img = await processImage(buf, preset);
  if (!img.ok) return { ok: false as const, error: img.error };
  const saved = await getStorage().put(preset, img.body, img.ext, img.contentType);
  return { ok: true as const, url: saved.url };
}

export async function uploadAvatarAction(
  _prev: UploadState, form: FormData,
): Promise<UploadState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const read = await readImage(form, 'file');
  if (!read.ok) return { error: read.error };

  const saved = await store(read.buf, 'avatar');
  if (!saved.ok) return { error: saved.error };

  const previous = await setAvatar(session.user.id, saved.url);
  const oldKey = keyFromUrl(previous);
  if (oldKey) await getStorage().remove(oldKey);

  revalidatePath('/', 'layout');
  return { done: 'avatar' };
}

export async function removeAvatarAction(
  _prev: UploadState, _form: FormData,
): Promise<UploadState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const previous = await setAvatar(session.user.id, null);
  const oldKey = keyFromUrl(previous);
  if (oldKey) await getStorage().remove(oldKey);

  revalidatePath('/', 'layout');
  return { done: 'removed' };
}

/** Ev fotografi — yalnizca bakici kaydi olanlar. */
export async function uploadHomePhotoAction(
  _prev: UploadState, form: FormData,
): Promise<UploadState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };
  if (!(await getSitterStatus(session.user.id))) return { error: 'not_allowed' };

  const read = await readImage(form, 'file');
  if (!read.ok) return { error: read.error };

  const saved = await store(read.buf, 'home');
  if (!saved.ok) return { error: saved.error };

  const alt = String(form.get('alt') ?? '').trim().slice(0, 140);
  const res = await addSitterPhoto({
    sitterId: session.user.id, url: saved.url, ...(alt ? { alt } : {}),
  });
  if (!res.ok) {
    // Kayit alinmadiysa dosya da kalmamali
    const key = keyFromUrl(saved.url);
    if (key) await getStorage().remove(key);
    return { error: res.error };
  }

  revalidatePath('/', 'layout');
  return { done: 'photo' };
}

export async function deleteHomePhotoAction(
  _prev: UploadState, form: FormData,
): Promise<UploadState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const url = await deleteSitterPhoto(String(form.get('photoId') ?? ''), session.user.id);
  if (!url) return { error: 'not_found' };

  const key = keyFromUrl(url);
  if (key) await getStorage().remove(key);

  revalidatePath('/', 'layout');
  return { done: 'removed' };
}

/** Ad ve dil tercihi. */
export async function saveProfileAction(
  _prev: UploadState, form: FormData,
): Promise<UploadState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const firstName = String(form.get('firstName') ?? '').trim().slice(0, 60);
  const initialRaw = String(form.get('lastNameInitial') ?? '').trim().slice(0, 1);
  const locale = String(form.get('locale') ?? '');

  if (firstName.length < 1) return { error: 'name_required' };
  if (initialRaw.length !== 1) return { error: 'initial_required' };
  if (!isLocale(locale)) return { error: 'invalid' };

  await updateProfile({
    userId: session.user.id,
    firstName,
    lastNameInitial: initialRaw.toUpperCase(),
    locale,
  });

  revalidatePath('/', 'layout');
  return { done: 'profile' };
}
