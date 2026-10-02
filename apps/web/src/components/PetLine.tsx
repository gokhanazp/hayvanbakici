import { getMessages, interpolate, type Locale, type Messages } from '@havre/i18n';

export interface PetLike {
  name: string;
  species: string;
  weightKg?: number | null | undefined;
}

/**
 * BIR HAYVANIN TEK SATIRLIK TARIFI: "Max · Kopek · 12 kg".
 *
 * TUR ISIMDEN SONRA, AGIRLIKTAN ONCE geliyor. Bakicinin bir talebi
 * degerlendirirken sordugu ilk soru "ne?" — 12 kilonun kopek mi kedi mi
 * oldugu, kabul edip etmeyecegini belirliyor. Tur bugune kadar
 * kaydediliyor ama hicbir ekranda gosterilmiyordu.
 *
 * Tanimsiz tur ham degeriyle yaziliyor: bos birakmak, bilgiyi
 * kaybetmenin sessiz hali olurdu.
 */
export function petLabel(pet: PetLike, locale: Locale): string {
  const m = getMessages(locale);
  const species = (m.species[pet.species as keyof Messages['species']] as string | undefined)
    ?? pet.species;
  const weight = pet.weightKg ? ` · ${pet.weightKg} kg` : '';
  return `${pet.name} · ${species}${weight}`;
}

export function PetLine({ pet, locale }: { pet: PetLike; locale: Locale }) {
  return <span>{petLabel(pet, locale)}</span>;
}

/**
 * KART ICIN DAHA UZUN TARIF: "Golden Retriever · 2 yas · 12 kg".
 *
 * Tek satirlik `petLabel` turu yaziyor ("Kopek"); kartta hayvanin
 * fotografi zaten turu soyluyor ve orada degerli olan IRK. Irk
 * kayitli degilse tura dusuyor — bos birakmak bilgiyi kaybetmek
 * olurdu.
 *
 * Yas DOGUM TARIHINDEN hesaplaniyor, kayitli bir sayi degil: "2 yas"
 * yazip bir yil sonra hala "2 yas" demek, dogru baslayip sessizce
 * yanlisa donen bir veri olurdu. Bir yasin altinda ay olarak.
 */
export function petDetail(
  pet: PetLike & { breed?: string | null; birthDate?: string | null },
  locale: Locale,
): string {
  const m = getMessages(locale);
  const species = (m.species[pet.species as keyof Messages['species']] as string | undefined)
    ?? pet.species;
  const parts: string[] = [pet.breed?.trim() || species];

  if (pet.birthDate) {
    const born = new Date(`${pet.birthDate}T00:00:00Z`);
    if (!Number.isNaN(born.getTime())) {
      const months = Math.max(
        0,
        Math.floor((Date.now() - born.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)),
      );
      /*
        TEKIL HALLER AYRI ANAHTAR: katalogda `ageMonthOne` ve
        `ageYearOne` zaten vardi. "1 months old" yazmak, cogul
        kurallarini ayri anahtarla cozmus bir katalogda elle
        uretilmis bir hata olurdu.
      */
      const years = Math.floor(months / 12);
      parts.push(
        months < 12
          ? (months === 1 ? m.pets.ageMonthOne : interpolate(m.pets.ageMonths, { count: months }))
          : (years === 1 ? m.pets.ageYearOne : interpolate(m.pets.ageYears, { count: years })),
      );
    }
  }
  if (pet.weightKg) parts.push(`${pet.weightKg} kg`);
  return parts.join(' · ');
}
