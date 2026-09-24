/** Hizmet tipleri ve fazlandirma (yol haritasi §5.1) */

export const SERVICE_TYPES = [
  'boarding',       // Konaklama — bakici evinde
  'house_sitting',  // Evde bakim — sahibin evinde
  'drop_in',        // Gunluk ziyaret
  'dog_walking',    // Kopek gezdirme
  'day_care',       // Gunduz bakimi
  'training',       // Egitim
  'grooming',       // Timar
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export type PriceUnit = 'night' | 'visit' | 'walk' | 'day' | 'session';

export interface ServiceDefinition {
  readonly type: ServiceType;
  readonly unit: PriceUnit;
  /** Hangi surumde canliya alinacak */
  readonly phase: 'v1' | 'v1_5' | 'v2';
  /** Ayni anda birden fazla gun/gece kapsayabilir mi */
  readonly multiDay: boolean;
}

export const SERVICES: Readonly<Record<ServiceType, ServiceDefinition>> = {
  boarding:      { type: 'boarding',      unit: 'night',   phase: 'v1',   multiDay: true },
  house_sitting: { type: 'house_sitting', unit: 'night',   phase: 'v1',   multiDay: true },
  drop_in:       { type: 'drop_in',       unit: 'visit',   phase: 'v1',   multiDay: true },
  dog_walking:   { type: 'dog_walking',   unit: 'walk',    phase: 'v1',   multiDay: false },
  day_care:      { type: 'day_care',      unit: 'day',     phase: 'v1_5', multiDay: true },
  training:      { type: 'training',      unit: 'session', phase: 'v2',   multiDay: false },
  grooming:      { type: 'grooming',      unit: 'session', phase: 'v2',   multiDay: false },
};

export function servicesForPhase(phase: 'v1' | 'v1_5' | 'v2'): ServiceType[] {
  const order = { v1: 0, v1_5: 1, v2: 2 } as const;
  return SERVICE_TYPES.filter((s) => order[SERVICES[s].phase] <= order[phase]);
}

/**
 * VITRIN HIZMETI — bir bakicinin birden fazla hizmeti varsa hangisi one cikar.
 *
 * Eskiden profil "en ucuz" hizmetin fiyatini gosteriyordu. Sonuc: liste
 * sayfasinda "konaklama 62 $" gorup profile giren kisi 31 $ (gezdirme)
 * goruyordu; rezervasyon formu da ayni sekilde gezdirmeyle aciliyordu ve
 * gercek tutar ancak gonderim ekraninda ortaya cikiyordu. Beklenti
 * kirilmasi.
 *
 * Sira SERVICE_TYPES sirasi: konaklama > evde bakim > ziyaret > gezdirme.
 * Bu, aramanin ve sayfalarin da agirlik sirasi — rastgele degil.
 *
 * NOT: ziyaretcinin gercek NIYETI varsa (arama sayfasindan gelen
 * ?service=) o kazanir; bu yalnizca niyet bilinmediginde kullanilan
 * belirlenimci varsayilan.
 */
export function primaryService<T extends { serviceType: ServiceType }>(
  offered: readonly T[],
): T | undefined {
  for (const type of SERVICE_TYPES) {
    const hit = offered.find((s) => s.serviceType === type);
    if (hit) return hit;
  }
  return offered[0];
}

/**
 * HAYVAN BOYUT KADEMELERI.
 *
 * NEDEN KADEME: bakici "45 kilodan buyugunu alamam" diye dusunmuyor,
 * "buyuk kopek alamam" diye dusunuyor. Sahip de kopeginin kilosunu
 * degil bedenini biliyor.
 *
 * Sinirlar metrik ve Kanada'da yaygin bolumlemeye yakin:
 * 7 kg (kucuk irk), 18 kg (orta), 45 kg (buyuk), ustu dev.
 */
export const PET_SIZE_STEPS = [
  { key: 'small', minKg: 0, maxKg: 7 },
  { key: 'medium', minKg: 7, maxKg: 18 },
  { key: 'large', minKg: 18, maxKg: 45 },
  { key: 'giant', minKg: 45, maxKg: 100 },
] as const;

export type PetSizeKey = (typeof PET_SIZE_STEPS)[number]['key'];

export const PET_SIZE_KEYS: readonly PetSizeKey[] = PET_SIZE_STEPS.map((s) => s.key);

/**
 * KABUL EDILEN BOYUTLAR BIR KUME, TEK BIR TAVAN DEGIL.
 *
 * Onceden tek bir "en buyuk kilo" sakliyorduk; bu, kabul edilebilir
 * her cevabin sifirdan baslayan KESINTISIZ bir aralik olmasini
 * zorunlu kiliyordu. Gercekte oyle degil: kendi iri kopegi olan bir
 * bakici "buyuk kopek alirim ama 3 kiloluk yavru alamam, benimki sert
 * oynuyor" diyebiliyor. Tavan modeli bu cumleyi kuramiyordu, bakiciyi
 * ya yanlis soz vermeye ya da hizmeti hic acmamaya zorluyordu.
 *
 * Artik her kademe bagimsiz isaretleniyor ve arama da (search.ts)
 * hayvanin kilosunu kademeye cevirip bu kumede ariyor. Tek kaynak:
 * sitter_services.accepted_sizes.
 */

/** Bir kilonun dustugu kademe. Sinir degeri ALT kademeye ait: 7 kg = kucuk. */
export function petSizeForKg(kg: number): PetSizeKey {
  for (const s of PET_SIZE_STEPS) {
    if (kg <= s.maxKg) return s.key;
  }
  return 'giant';
}

/**
 * Disaridan gelen listeyi temizler: yalnizca gecerli anahtarlar,
 * tekrarsiz ve HER ZAMAN kademe sirasinda. Sira onemli cunku hem
 * profildeki siluet listesi hem de testler bu diziyi dogrudan
 * karsilastiriyor.
 */
export function normalizePetSizes(input: readonly string[] | null | undefined): PetSizeKey[] {
  if (!input) return [];
  return PET_SIZE_STEPS.filter((s) => input.includes(s.key)).map((s) => s.key);
}
