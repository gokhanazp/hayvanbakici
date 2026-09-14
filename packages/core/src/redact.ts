/**
 * MESAJ MASKELEME.
 *
 * Mesajlarda telefon, e-posta ve para transferi bilgisi MASKELENIR;
 * gosterilen metin maskeli olandir, ham metin yalnizca sikayet uzerine ve
 * denetim kaydi birakilarak acilir (yol haritasi §2.2).
 *
 * AMAC CEZA DEGIL KORUMA. Bakicinin kendi getirdigi musteride komisyon
 * zaten %0; platform disina cikmanin ekonomik gerekcesi yok. Maskeleme,
 * musteriyi "once para gonder" dolandiriciligindan ve iki tarafi da
 * kaydi olmayan bir anlasmadan korumak icin var. Bu yuzden mesaj
 * ENGELLENMIYOR, yalnizca iletisim bilgisi gizleniyor ve iki taraf da
 * bunun olduğunu goruyor.
 *
 * EN ONEMLI KURAL: YANLIS MASKELEME YAPMA.
 * Bir fiyati ("$55.00"), bir tarihi ("2026-09-14"), bir kopegin yasini
 * ("7 yasinda") ya da bir kapi numarasini maskeleyen bir sistem, insanlari
 * normal konusmaktan alikoyar ve guveni asil o zaman kaybederiz. Buradaki
 * her kural, once neyi maskeLEMEYECEGINE gore yazildi; testler de once
 * bunu olcuyor.
 */

/**
 * Bir mesajin en fazla uzunlugu.
 *
 * Burada, `packages/db` icinde DEGIL: bu sayiyi yazma kutusu da (istemci
 * bileseni) kullaniyor ve istemci tarafinda @havre/db'yi ice aktarmak
 * butun veritabani katmanini tarayici paketine tasirdi.
 */
export const MAX_MESSAGE = 2000;

export interface Redaction {
  /** Gosterilecek metin */
  text: string;
  /** Maskelenen sey sayisi — arayuz "1 bilgi gizlendi" diyebilsin diye */
  count: number;
  /** Hangi turler maskelendi */
  kinds: ReadonlyArray<'email' | 'phone' | 'payment'>;
}

const MASK = '•••••';

/*
  E-POSTA. Standart bicim; bosluklu kacamaklar ("ali [at] ornek.com")
  bilincli olarak kapsam disi — onlari yakalamaya calisan bir kural
  "at" gecen her cumleyi bozuyordu.
*/
const EMAIL = /\b[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}\b/gu;

/*
  TELEFON.

  Kanada/ABD bicimi: istege bagli +1, sonra 3-3-4. Ayirici olarak bosluk,
  nokta, tire ve parantez kabul ediliyor; ayirici YOKSA da (4165551234)
  yakalaniyor.

  ONEMLI: en az 10 RAKAM sarti var. Bu sayede
    "$1,234.56"            (6 rakam)   → dokunulmaz
    "2026-09-14"           (8 rakam)   → dokunulmaz
    "7 yasinda, 22 kg"     (3 rakam)   → dokunulmaz
    "sabah 8, aksam 19:30" (5 rakam)   → dokunulmaz
  Kanada posta kodu (M5V 2T6) harf-rakam karisimi oldugu icin zaten
  eslesmiyor.
*/
const PHONE = /(?<![\d.-])(?:\+?1[\s.-]*)?\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}(?!\d)/g;

/*
  PARA TRANSFERI. Kanada'da platform disina cikmanin standart yolu
  Interac e-Transfer. Kelimenin kendisi maskelenmiyor — "e-Transfer ile
  odeyebilir miyim" sorusu mesru bir soru ve cevabi "hayir, Havre
  uzerinden" olmali. Maskelenen sey, o kelimenin yanindaki HESAP
  bilgisi; onu zaten e-posta/telefon kurallari yakaliyor.

  Burada yalnizca acikca hesap numarasi gibi duran uzun rakam dizileri
  var: 11-19 hane, ayiricisiz. Kart numarasi ve IBAN benzeri diziler.

  TELEFONDAN SONRA calisiyor: "+1 416 555 1234" ayiricilari atilinca 11
  haneye dusuyor ve bu kurala takiliyordu — telefon "hesap numarasi" diye
  isaretleniyordu (testte yakalandi). Telefon kurali once calisip kendi
  payini aliyor, buraya yalnizca gercekten uzun diziler kaliyor.
*/
const LONG_NUMBER = /\b\d{11,19}\b/g;

function digitsIn(value: string): number {
  let n = 0;
  for (const ch of value) if (ch >= '0' && ch <= '9') n += 1;
  return n;
}

/**
 * Maskeli metni ve ne maskelendigini dondurur.
 *
 * SIRA ONEMLI: e-posta → telefon → uzun rakam dizisi.
 *   - E-posta once: icinde nokta ve rakam olabiliyor ("555.1234@x.com").
 *   - Telefon, uzun diziden once: "+1 416 555 1234" 11 hane ve aksi halde
 *     "hesap numarasi" sayiliyordu.
 *   - Telefon kalibinin basindaki (?<![\d.-]) guvenligi sayesinde 16 haneli
 *     bir kart numarasinin ortasindan telefon cikmiyor.
 */
export function redactContact(input: string): Redaction {
  const kinds = new Set<'email' | 'phone' | 'payment'>();
  let count = 0;

  let text = input.replace(EMAIL, () => {
    kinds.add('email'); count += 1; return MASK;
  });

  text = text.replace(PHONE, (match) => {
    if (digitsIn(match) < 10) return match;
    kinds.add('phone'); count += 1; return MASK;
  });

  text = text.replace(LONG_NUMBER, () => {
    kinds.add('payment'); count += 1; return MASK;
  });

  return { text, count, kinds: [...kinds] };
}

/** Maskelenecek bir sey var mi — mesaji kaydetmeden once uyarmak icin. */
export function hasContactInfo(input: string): boolean {
  return redactContact(input).count > 0;
}
