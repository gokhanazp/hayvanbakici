import { getMessages, interpolate, type Locale, type Messages } from '@havre/i18n';
import type { OwnerPet } from '@/lib/data';
import { Avatar } from './Avatar';

/**
 * YAS — DOGUM TARIHINDEN.
 *
 * Bir yasin altinda AY olarak yaziliyor: dort aylik bir yavru ile bir
 * yasindaki bir kopek bakici icin farkli isler ve "0 yasinda" hicbir
 * sey soylemiyor.
 */
export function petAge(birthDate: string | null, locale: Locale): string | null {
  if (!birthDate) return null;
  const born = Date.parse(`${birthDate}T00:00:00Z`);
  if (!Number.isFinite(born)) return null;

  const now = new Date();
  const b = new Date(born);
  let months = (now.getUTCFullYear() - b.getUTCFullYear()) * 12
    + (now.getUTCMonth() - b.getUTCMonth());
  if (now.getUTCDate() < b.getUTCDate()) months -= 1;
  if (months < 0) return null;

  const m = getMessages(locale);
  if (months < 12) {
    return months <= 1
      ? m.pets.ageMonthOne
      : interpolate(m.pets.ageMonths, { count: String(months) });
  }
  const years = Math.floor(months / 12);
  return years === 1
    ? m.pets.ageYearOne
    : interpolate(m.pets.ageYears, { count: String(years) });
}

/**
 * HAYVAN KARTI.
 *
 * Bu ekran bugune kadar HIC yoktu: hayvanlar yalnizca rezervasyon
 * formunun icinde yaratilabiliyor, sonra bir daha gorulemiyordu.
 * Kullanici adini yanlis yazdiysa duzeltemiyor, fotograf ekleyemiyordu.
 *
 * Kartta yalnizca BILINEN seyler yaziyor. Irk, yas ve kilo yoksa o
 * parca hic cizilmiyor — "Irk: —" gibi bir satir, doldurulmasi gereken
 * bir eksik gibi okunuyor ve cogu melez kopek icin zaten cevapsiz.
 */
export function PetCard({
  pet, locale, actions, bare = false,
}: {
  pet: OwnerPet;
  locale: Locale;
  /** Duzenle/sil gibi islemler — ozet gorunumde verilmiyor. */
  actions?: React.ReactNode | undefined;
  /**
   * Kendi cercevesini CIZMEZ. Hayvanlar sayfasinda kart zaten bir
   * kartin icinde duruyor ve ic ice iki cerceve, kullaniciya iki ayri
   * sey varmis gibi gorunuyordu.
   */
  bare?: boolean | undefined;
}) {
  const m = getMessages(locale);
  const species = (m.species[pet.species as keyof Messages['species']] as string | undefined)
    ?? pet.species;
  const age = petAge(pet.birthDate, locale);

  const facts = [species, pet.breed, age, pet.weightKg ? `${pet.weightKg} kg` : null]
    .filter((x): x is string => Boolean(x));

  return (
    <article className={bare ? 'pet-card pet-card-bare' : 'pet-card'}>
      <Avatar
        src={pet.photoUrl}
        initials={(pet.name.slice(0, 1) || '?').toUpperCase()}
        size={72}
      />
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3 className="text-h4" style={{ margin: 0 }}>{pet.name}</h3>
        <p className="muted text-body-sm" style={{ marginTop: 'var(--space-1)' }}>
          {facts.join(' · ')}
        </p>
        {pet.temperamentNotes && (
          <p className="dim text-body-sm pet-notes">{pet.temperamentNotes}</p>
        )}
        {actions && <div className="pet-card-actions">{actions}</div>}
      </div>
    </article>
  );
}
