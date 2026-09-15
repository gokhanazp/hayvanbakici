'use client';

import { useState } from 'react';
import { getMessages, type Locale } from '@havre/i18n';
import { PetForm } from './PetForm';
import type { OwnerPet } from '@/lib/data';

/**
 * EKLEME VE DUZENLEME FORMLARINI ACIP KAPATAN KABUK.
 *
 * Formlar KAPALI baslıyor. Uc hayvani olan bir kullaniciya uc uzun form
 * birden gostermek, sayfayi okunmaz yapiyor ve "burada bir sey
 * doldurmam mi gerekiyor?" hissi veriyordu. Kartlar acik, formlar
 * istendiginde.
 */
export function AddPet({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const [open, setOpen] = useState(false);

  /*
    KAPALIYKEN SARMALAYICI YOK.

    Dugme 40rem'lik bir sutunun icine konunca o sutunun SOLUNA
    yapisiyordu: sayfanin geri kalani ortaliyken dugme kayik
    duruyordu (kullanici bildirdi). Sarmalayici yalnizca form
    acildiginda gerekiyor — orada satirin okunabilir genislikte
    kalmasi icin.
  */
  if (!open) {
    return (
      <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
        {m.pets.add}
      </button>
    );
  }

  return (
    <section className="card card-pad add-pet-card">
      <h2 className="text-h4">{m.pets.add}</h2>
      <PetForm locale={locale} onDone={() => setOpen(false)} />
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
        {m.pets.cancel}
      </button>
    </section>
  );
}

export function EditPet({ locale, pet }: { locale: Locale; pet: OwnerPet }) {
  const m = getMessages(locale);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>
        {m.pets.edit}
      </button>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <PetForm locale={locale} pet={pet} />
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
        {m.pets.close}
      </button>
    </div>
  );
}
