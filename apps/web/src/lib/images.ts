import sharp, { type Metadata } from 'sharp';

/**
 * YUKLENEN GORSELIN ISLENMESI.
 *
 * UC SEY BURADA OLUYOR:
 *
 * 1. DOGRULAMA ICERIKTEN. Tarayicinin bildirdigi `Content-Type` ve dosya
 *    uzantisi kullanicinin yazdigi metindir; `.jpg` adinda bir PHP dosyasi
 *    da gelebilir. Karar sharp'in dosyayi GERCEKTEN acabilmesine ve
 *    okudugu bicime gore veriliyor.
 *
 * 2. YENIDEN KODLAMA — yani EXIF'in silinmesi. Telefon fotograflari GPS
 *    KOORDINATI tasir. Bir bakicinin ev fotografini oldugu gibi yayina
 *    koymak, gizlemek icin ugrastigimiz tam adresi fotografin icinde
 *    dagitmak olurdu (adres AES ile sifreli, harita noktasi kaydirilmis).
 *    Yeniden kodlama tum ust veriyi dusuruyor.
 *
 * 3. BOYUT SINIRI. Cok buyuk bir gorsel hem yavas hem de bellek
 *    tuketimiyle sunucuyu dusurebilir; sharp'a girmeden once BAYT siniri,
 *    girdikten sonra PIKSEL siniri var.
 */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** sharp'in taniyip kabul ettigimiz bicimler — HEIC yok (libheif gerekir). */
const ACCEPTED = new Set(['jpeg', 'png', 'webp']);

/** Gorsel bombasina karsi: 50 megapiksel ustu hicbir fotograf gerekli degil. */
const MAX_PIXELS = 50_000_000;

export type ImageError = 'too_large' | 'not_an_image' | 'unsupported_format' | 'too_many_pixels';

export type ImageResult =
  | { ok: true; body: Buffer; ext: 'webp'; contentType: 'image/webp'; width: number; height: number }
  | { ok: false; error: ImageError };

export type Preset = 'avatar' | 'home' | 'pet';

/*
  Avatar KARE ve kirpiliyor: profil fotografi her yerde daire icinde
  gorunuyor, kirpmayi kullaniciya birakmak yerine merkezden aliyoruz.
  Ev fotografi kirpilmiyor — oranini bozmak odayi yanlis gosterir.

  Hayvan fotografi kare ve kirpiliyor: profilde kucuk karelerden olusan
  bir izgarada duruyor ve orada asil soru "bu hangi hayvan", odanin
  orani degil. Avatardan kucuk — tam boy gosterilmiyor.
*/
const PRESETS: Record<Preset, { width: number; height?: number; fit: 'cover' | 'inside' }> = {
  avatar: { width: 512, height: 512, fit: 'cover' },
  home: { width: 1600, fit: 'inside' },
  pet: { width: 640, height: 640, fit: 'cover' },
};

export async function processImage(input: Buffer, preset: Preset): Promise<ImageResult> {
  if (input.byteLength > MAX_UPLOAD_BYTES) return { ok: false, error: 'too_large' };

  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    return { ok: false, error: 'not_an_image' };
  }

  if (!meta.format || !ACCEPTED.has(meta.format)) return { ok: false, error: 'unsupported_format' };
  if ((meta.width ?? 0) * (meta.height ?? 0) > MAX_PIXELS) {
    return { ok: false, error: 'too_many_pixels' };
  }

  const p = PRESETS[preset];

  /*
    AVATAR HER ZAMAN KARE. `withoutEnlargement` ile birlikte 512x512
    istemek, 1200x400 gibi genis bir karede 512x400 uretiyordu — daire
    icinde ezilmis bir fotograf. Kare kenari, istenen olcu ile gorselin
    KISA KENARININ kucugu: hem kare kaliyor hem kucuk bir fotograf
    buyutulup bulaniklasmiyor.
  */
  const side = preset === 'avatar'
    ? Math.min(p.width, meta.width ?? p.width, meta.height ?? p.width)
    : p.width;

  const pipeline = sharp(input, { limitInputPixels: MAX_PIXELS })
    /* EXIF'i TASIMIYORUZ: rotate() yalnizca yonelim bilgisini uygulayip
       atiyor, boylece fotograf dik duruyor ama konum verisi gitmis oluyor. */
    .rotate()
    .resize({
      width: side,
      ...(p.height ? { height: side } : {}),
      fit: p.fit,
      withoutEnlargement: preset !== 'avatar',
    })
    .webp({ quality: 82 });

  /*
    ISLEME DE BASARISIZ OLABILIR, yalnizca basligi okumak degil.

    Basligi gecerli ama govdesi bozuk bir dosya metadata()'yi geciyor,
    sonra toBuffer() "libpng read error" firlatiyordu. Bu hata
    yakalanmadigi icin sunucu eylemi 500 veriyor ve kullanici
    "fotografiniz okunamadi" yerine cokmus bir ekran goruyordu
    (tarayicida yakalandi). Ayni kapi avatar ve ev fotografi icin de
    acikti.
  */
  let data: Buffer;
  let info: { width: number; height: number };
  try {
    const out = await pipeline.toBuffer({ resolveWithObject: true });
    data = out.data;
    info = { width: out.info.width, height: out.info.height };
  } catch {
    return { ok: false, error: 'not_an_image' };
  }

  return {
    ok: true, body: data, ext: 'webp', contentType: 'image/webp',
    width: info.width, height: info.height,
  };
}
