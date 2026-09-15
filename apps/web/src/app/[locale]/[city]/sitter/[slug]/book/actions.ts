'use server';

import { redirect } from 'next/navigation';
import type { ServiceType } from '@havre/core';
import { getSession } from '@/lib/auth';
import { createBookingRequest, createPet } from '@/lib/data';
import { notifyNewRequest } from '@/lib/notify';

export type RequestState = { error?: string | undefined };

/**
 * Rezervasyon talebi.
 *
 * ISTEMCIDEN GELEN FIYAT KULLANILMAZ. Form fiyati yalnizca GOSTERIYOR;
 * kaydedilen tutar sunucuda bakicinin guncel fiyatindan yeniden
 * hesaplaniyor (createBookingRequest). Aksi halde tarayici konsolundan
 * fiyat degistirilebilirdi.
 *
 * Ayni sekilde komisyon orani da (attribution) sunucuda belirleniyor.
 */
export async function requestBookingAction(
  _prev: RequestState, formData: FormData,
): Promise<RequestState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };

  const sitterId = String(formData.get('sitterId') ?? '');
  const serviceType = String(formData.get('service') ?? '') as ServiceType;
  const startDate = String(formData.get('start') ?? '');
  const endDate = String(formData.get('end') ?? '');
  const notes = String(formData.get('notes') ?? '').trim();
  const locale = String(formData.get('locale') ?? 'en');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return { error: 'dates_invalid' };
  }
  if (endDate < startDate) return { error: 'dates_invalid' };

  // Var olan hayvanlar + (istege bagli) yeni eklenen
  const petIds = formData.getAll('petId').map((p) => String(p)).filter(Boolean);
  const newName = String(formData.get('newPetName') ?? '').trim();
  if (newName) {
    const species = String(formData.get('newPetSpecies') ?? 'dog');
    const weight = Number(formData.get('newPetWeight'));
    petIds.push(await createPet({
      ownerId: session.user.id,
      name: newName,
      species: species === 'cat' || species === 'other' ? species : 'dog',
      ...(Number.isFinite(weight) && weight > 0 ? { weightKg: weight } : {}),
    }));
  }
  if (petIds.length === 0) return { error: 'pets_missing' };

  const res = await createBookingRequest({
    ownerId: session.user.id,
    sitterId,
    serviceType,
    startDate,
    endDate,
    petIds,
    ...(notes ? { specialInstructions: notes } : {}),
  });
  if (!res.ok) return { error: res.error };

  /*
    Bakiciya haber ver. AWAIT EDILIYOR ama gonderimin kendisi
    ateşle-unut (bkz. lib/notify.ts): burada beklenen yalnizca alici
    bilgisini okuyan sorgu, e-posta cagrisi degil. Talep kaydedildi
    bile olsa bir e-posta hatasi kullaniciya hata gostermemeli.
  */
  await notifyNewRequest(res.bookingId).catch(() => undefined);

  redirect(`/${locale}/account/bookings/${res.bookingId}/`);
}
