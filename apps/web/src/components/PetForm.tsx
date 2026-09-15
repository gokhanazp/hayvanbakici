'use client';

import { useActionState, useState } from 'react';
import { getMessages, segmentFor, type Locale, type Messages } from '@havre/i18n';
import { Select } from '@/components/ui/Select';
import { savePetAction, deletePetAction, type PetState } from '@/app/[locale]/account/pets/actions';
import type { OwnerPet } from '@/lib/data';

const EMPTY: PetState = {};

/**
 * HAYVAN EKLEME / DUZENLEME FORMU.
 *
 * YALNIZCA AD VE TUR ZORUNLU. Irk, dogum tarihi, kilo ve notlar
 * istege bagli ve bu ekranda YAZIYOR: bir rezervasyon gondermek icin
 * on alan doldurmak gerektigini sanan kullanici, formu hic
 * doldurmuyordu. Bakicinin talebi degerlendirmek icin gercekten
 * ihtiyaci olan sey ad ve tur; gerisi yardimci.
 *
 * Kilo yine de degerli — bakicilar "kabul ettigim agirlik araligi"
 * tanimliyor ve arama bu araliga gore suzuyor. Bu yuzden alanin
 * yaninda NEDEN sorulduğu yaziyor, "zorunlu" demeden.
 */
export function PetForm({
  locale, pet, onDone,
}: {
  locale: Locale;
  /** Verilmezse yeni hayvan formu. */
  pet?: OwnerPet | undefined;
  /** Kaydedildikten sonra formu kapatan ekran — yeni hayvan formunda. */
  onDone?: (() => void) | undefined;
}) {
  const m = getMessages(locale);
  const [state, action, busy] = useActionState<PetState, FormData>(savePetAction, EMPTY);
  const [species, setSpecies] = useState(pet?.species ?? 'dog');

  const err = state.error
    ? ((m.pets[`error.${state.error}` as keyof Messages['pets']] as string | undefined)
        ?? state.error)
    : null;

  if (state.savedAt && onDone) {
    /* Yeni hayvan kaydedildi: formu kapatmak cagirana ait. Burada
       dogrudan cagirmak cizim sirasinda durum degistirmek olurdu. */
    queueMicrotask(onDone);
  }

  return (
    <form action={action} className="auth-form pet-form">
      <input type="hidden" name="locale" value={segmentFor(locale)} />
      {pet && <input type="hidden" name="petId" value={pet.id} />}

      {err && <p className="alert alert-error" role="alert">{err}</p>}
      {state.savedAt && !err && (
        <p className="alert alert-ok" role="status">{m.pets.saved}</p>
      )}

      <div className="field-block">
        <label htmlFor={`name-${pet?.id ?? 'new'}`}>{m.pets.nameLabel}</label>
        <input
          id={`name-${pet?.id ?? 'new'}`} name="name" required maxLength={60}
          defaultValue={pet?.name ?? ''} autoComplete="off"
        />
      </div>

      <div className="field-block">
        <label htmlFor={`species-${pet?.id ?? 'new'}`}>{m.pets.speciesLabel}</label>
        <Select
          id={`species-${pet?.id ?? 'new'}`}
          name="species"
          value={species}
          required
          onChange={(next) => setSpecies(next as 'dog' | 'cat' | 'other')}
          options={(['dog', 'cat', 'other'] as const).map((s) => ({
            value: s, label: m.species[s],
          }))}
        />
      </div>

      <p className="field-hint">{m.pets.optionalNote}</p>

      <div className="pet-form-row">
        <div className="field-block">
          <label htmlFor={`breed-${pet?.id ?? 'new'}`}>{m.pets.breedLabel}</label>
          <input
            id={`breed-${pet?.id ?? 'new'}`} name="breed" maxLength={60}
            defaultValue={pet?.breed ?? ''} autoComplete="off"
          />
        </div>

        <div className="field-block">
          <label htmlFor={`birthDate-${pet?.id ?? 'new'}`}>{m.pets.birthLabel}</label>
          <input
            id={`birthDate-${pet?.id ?? 'new'}`} name="birthDate" type="date"
            defaultValue={pet?.birthDate ?? ''}
          />
        </div>

        <div className="field-block">
          <label htmlFor={`weightKg-${pet?.id ?? 'new'}`}>{m.pets.weightLabel}</label>
          <input
            id={`weightKg-${pet?.id ?? 'new'}`} name="weightKg" type="number"
            min={0.1} max={120} step={0.1} defaultValue={pet?.weightKg ?? ''}
          />
          {/* Kilo neden soruluyor: bakicilar agirlik araligi tanimliyor */}
          <span className="field-hint">{m.pets.weightHint}</span>
        </div>
      </div>

      <div className="field-block">
        <label htmlFor={`notes-${pet?.id ?? 'new'}`}>{m.pets.notesLabel}</label>
        <textarea
          id={`notes-${pet?.id ?? 'new'}`} name="temperamentNotes" rows={3} maxLength={500}
          defaultValue={pet?.temperamentNotes ?? ''}
          placeholder={m.pets.notesPlaceholder}
        />
        <span className="field-hint">{m.pets.notesHint}</span>
      </div>

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? m.pets.saving : (pet ? m.pets.save : m.pets.add)}
      </button>
    </form>
  );
}

/**
 * SILME — IKI ADIM.
 *
 * Tek tikla silinen bir hayvan, yanlislikla basildiginda geri
 * alinamayan bir kayip gibi gorunur (kayit aslinda yumusak siliniyor
 * ama kullanici bunu bilmiyor ve bilmesi de gerekmiyor). Once "emin
 * misiniz", sonra sil.
 */
export function PetDelete({ locale, pet }: { locale: Locale; pet: OwnerPet }) {
  const m = getMessages(locale);
  const [armed, setArmed] = useState(false);
  const [state, action, busy] = useActionState<PetState, FormData>(deletePetAction, EMPTY);
  void state;

  if (!armed) {
    return (
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArmed(true)}>
        {m.pets.remove}
      </button>
    );
  }

  return (
    <form action={action} className="row" style={{ gap: 'var(--space-2)', alignItems: 'center' }}>
      <input type="hidden" name="petId" value={pet.id} />
      <input type="hidden" name="locale" value={segmentFor(locale)} />
      <span className="text-body-sm">{m.pets.removeConfirm}</span>
      <button type="submit" className="btn btn-danger btn-sm" disabled={busy}>
        {m.pets.removeYes}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArmed(false)}>
        {m.pets.removeNo}
      </button>
    </form>
  );
}
