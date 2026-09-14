import { getMessages, type Locale, type Messages } from '@havre/i18n';

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
