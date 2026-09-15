import Image from 'next/image';
import { getMessages, interpolate, type Locale, type Messages } from '@havre/i18n';
import type { OwnerPet } from '@/lib/data';
import { resolvePhoto } from '@/lib/photos';

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
 * TUR SIMGELERI — dekoratif (tur adi her zaman yaninda yaziyor).
 *
 * SILUETLER BIRBIRINDEN AYIRT EDILEBILIR olmali: 14 pikselde ayrinti
 * kayboluyor, geriye yalnizca dis hat kaliyor. Kopekte kulaklar YANDAN
 * SARKIYOR, kedide UCGEN ve yukarida — ilk surumde ikisi de yuvarlak bir
 * kafaydi ve kopek kartinda kedi simgesi varmis gibi duruyordu.
 */
const SPECIES_PATH: Record<string, string> = {
  dog: 'M7.5 5.5C6 5.5 5 7.3 5 9.8s1 4.7 2.5 4.7 M16.5 5.5c1.5 0 2.5 1.8 2.5 4.3s-1 4.7-2.5 4.7 M7.5 5.5h9v7.2a4.5 4.5 0 0 1-9 0Z M10.2 10.8v.01 M13.8 10.8v.01',
  cat: 'M5.6 4.8 6 9.6 M5.6 4.8 9.8 7.4 M18.4 4.8 18 9.6 M18.4 4.8 14.2 7.4 M6 9.6v2.2a6 6 0 0 0 12 0V9.6 M9.8 12v.01 M14.2 12v.01',
  other: 'M12 5.5c-3 0-5.5 2.2-5.5 5 0 3.4 3.4 6.2 5.5 8 2.1-1.8 5.5-4.6 5.5-8 0-2.8-2.5-5-5.5-5Z',
};

/** Fotografsiz kartin zemin tonu — ada gore sabit, her yenilemede ayni. */
const TINTS = ['tile-rose', 'tile-sage', 'tile-apricot', 'tile-peri'] as const;
function tintFor(seed: string): string {
  let n = 0;
  for (const ch of seed) n = (n + ch.charCodeAt(0)) % 997;
  return TINTS[n % TINTS.length]!;
}

/**
 * HAYVAN KARTI.
 *
 * FOTOGRAF KARTIN KENDISI, kosede kucuk bir daire degil.
 *
 * Ilk surumde 72 piksellik bir avatar ve yaninda metin vardi: hayvanin
 * fotografini yuklemis kullanici onu gorunce "bu kadar mi" diyordu, ve
 * yuklememis olan da yuklemek icin bir sebep gormuyordu. Kart artik
 * arama sonuclarindaki bakici kartiyla ayni gorsel dili konusuyor —
 * uygulamanin geri kalani zaten boyle gorunuyor, yalnizca hesap
 * ekranlari geride kalmisti.
 *
 * Fotograf yoksa kart BOS GRI BIR KUTU DEGIL: ada gore sabit bir pastel
 * ton, bas harf ve tur simgesi. Bos gri, fotograf yuklememis olani
 * cezalandiriyordu.
 *
 * Kartta yalnizca BILINEN seyler yaziyor. Irk, yas ve kilo yoksa o cip
 * hic cizilmiyor — "Irk: —" gibi bir satir, doldurulmasi gereken bir
 * eksik gibi okunuyor ve cogu melez kopek icin zaten cevapsiz.
 */
export function PetCard({
  pet, locale, actions,
}: {
  pet: OwnerPet;
  locale: Locale;
  /** Duzenle/sil gibi islemler — ozet gorunumde verilmiyor. */
  actions?: React.ReactNode | undefined;
}) {
  const m = getMessages(locale);
  const species = (m.species[pet.species as keyof Messages['species']] as string | undefined)
    ?? pet.species;
  const age = petAge(pet.birthDate, locale);
  const photo = resolvePhoto(pet.photoUrl);

  const chips = [age, pet.weightKg ? `${pet.weightKg} kg` : null, pet.breed]
    .filter((x): x is string => Boolean(x));

  return (
    <article className="pet-card">
      <div className={`pet-photo-tile ${photo ? '' : tintFor(pet.name)}`}>
        {photo
          ? <Image src={photo} alt="" width={640} height={480} sizes="(min-width: 760px) 20rem, 90vw" />
          : (
            <span className="pet-placeholder" aria-hidden="true">
              {(pet.name.slice(0, 1) || '?').toUpperCase()}
            </span>
          )}
        {/* Tur rozeti fotografin uzerinde: kart kucukken bile "ne" belli. */}
        <span className="pet-species">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={SPECIES_PATH[pet.species] ?? SPECIES_PATH.other!} />
          </svg>
          {species}
        </span>
      </div>

      <div className="pet-body">
        <h3 className="text-h4" style={{ margin: 0 }}>{pet.name}</h3>

        {chips.length > 0 && (
          <ul className="pet-chips">
            {chips.map((c) => <li key={c}>{c}</li>)}
          </ul>
        )}

        {pet.temperamentNotes && (
          <p className="dim text-body-sm pet-notes">{pet.temperamentNotes}</p>
        )}

        {actions && <div className="pet-card-actions">{actions}</div>}
      </div>
    </article>
  );
}
