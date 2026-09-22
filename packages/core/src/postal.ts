/**
 * KANADA POSTA KODU -> BOLGE.
 *
 * Arama kutusuna posta kodu yazildiginda onu haritada bir noktaya
 * cevirmemiz gerekiyor. Bir cografi kodlama servisine baglanmiyoruz:
 *   - dis servis olmadan da calismali (build ve test dahil),
 *   - kullanicinin adresi ucuncu bir tarafa gitmemeli (Law 25),
 *   - saatlik kota ya da fiyatlandirma aramayi durdurmamali.
 *
 * Onun yerine posta kodunun ILK HARFI kullaniliyor. Bu harf Kanada
 * Postasi'nda bolgeyi belirler ve yillardir sabittir:
 *   M = Toronto, H = Montreal adasi, K/L/N/P = Ontario'nun diger
 *   bolgeleri, G/J = Quebec, V = BC, T = Alberta ...
 *
 * DIKKAT — BU BIR YAKLASIMDIR, kesin konum DEGIL. Yalnizca SEHIR
 * seviyesinde dogru kabul edilir ve arayuz kullaniciya neyi esledigini
 * ACIKCA soyler ("Toronto cevresi"). Mahalle kesinligi isteyen kullanici
 * mahalle adini yazar; o eslesme gercek merkez noktasindan gelir.
 *
 * Ileride gercek FSA merkez noktalari (Statistics Canada acik verisi)
 * bir tabloya yuklenirse bu dosya yalnizca geri dusus olur.
 */
import type { ProvinceCode } from './taxes.js';

/** Posta kodunun ilk harfi -> il. Kaynak: Kanada Postasi FSA duzeni. */
const LETTER_PROVINCE: Readonly<Record<string, ProvinceCode>> = {
  A: 'NL', B: 'NS', C: 'PE', E: 'NB',
  G: 'QC', H: 'QC', J: 'QC',
  K: 'ON', L: 'ON', M: 'ON', N: 'ON', P: 'ON',
  R: 'MB', S: 'SK', T: 'AB', V: 'BC',
  X: 'NT', Y: 'YT',
};

/**
 * Harfin dogrudan bir sehre karsilik geldigi iki durum. M yalnizca
 * Toronto'yu, H yalnizca Montreal adasini kapsar — bunlar tahmin degil,
 * tanimin kendisi.
 */
const LETTER_CITY: Readonly<Record<string, string>> = {
  M: 'toronto',
  H: 'montreal',
};

export interface PostalRegion {
  /** Ilk uc karakter — "M4M" */
  readonly fsa: string;
  readonly province: ProvinceCode;
  /** Harf tek bir sehri isaret ediyorsa o sehrin Ingilizce slug'i */
  readonly citySlug?: string;
}

/**
 * Girdi posta kodu gibi gorunuyorsa bolgeyi dondurur, degilse null.
 * Bosluk ve kucuk harf serbest; "m4m1a1" ve "M4M 1A1" ayni sey.
 */
export function postalRegion(raw: string): PostalRegion | null {
  const v = raw.replace(/\s+/g, '').toUpperCase();
  // Tam posta kodu ya da yalnizca FSA — ikisi de kabul
  if (!/^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ](\d[ABCEGHJKLMNPRSTVWXYZ]\d)?$/.test(v)) {
    return null;
  }
  const letter = v[0]!;
  const province = LETTER_PROVINCE[letter];
  if (!province) return null;
  const citySlug = LETTER_CITY[letter];
  return citySlug === undefined
    ? { fsa: v.slice(0, 3), province }
    : { fsa: v.slice(0, 3), province, citySlug };
}

/**
 * POSTA KODU SECILEN EYALETLE TUTUYOR MU?
 *
 * Posta kodunun ILK HARFI Kanada'da eyaleti belirler ve bu es gecilmesi
 * kolay bir tutarsizligi yakalamanin en ucuz yolu: sihirbazda Calgary
 * secip Toronto posta kodu yazmak hicbir uyari almadan kaydediliyordu.
 * Harita noktasi mahalleden turetildigi icin arama bozulmuyor — ama
 * bakicinin profilinde yanlis posta kodu duruyor ve o kod adres
 * dogrulamasindan faturaya kadar her yerde kullaniliyor.
 *
 * Kontrol EYALET duzeyinde, sehir duzeyinde DEGIL: Ottawa'da oturup
 * Gatineau tarafinda bir posta koduna sahip olmak mumkun degil ama
 * eyalet icinde sehirler arasi gecis normal (yeni tasinmis biri).
 *
 * Tanimsiz/bozuk posta kodu icin `true` donuyor: bicim hatasini zaten
 * `isValidPostalCode` yakaliyor, ayni girdi icin iki ayri hata mesaji
 * gostermek kullaniciyi sasirtir.
 */
export function postalMatchesProvince(raw: string, province: ProvinceCode): boolean {
  const region = postalRegion(raw);
  if (!region) return true;
  return region.province === province;
}
