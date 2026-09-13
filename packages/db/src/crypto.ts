import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * ALAN DUZEYINDE SIFRELEME.
 *
 * Tam adres ve SIN gibi alanlar veritabaninda DUZ METIN durmaz. Gerekce
 * (yol haritasi §8.5): bir yedek dosyasi ya da bir okuma yetkisi sizdiginda
 * aradaki fark, "rahatsiz edici bir olay" ile "PIPEDA RROSH bildirimi
 * gerektiren ihlal" arasindaki farktir.
 *
 * AES-256-GCM secildi: sifrelemenin yani sira BUTUNLUK de doguruyor
 * (kurcalanmis sifreli metin cozulmez, sessizce yanlis veri uretmez).
 *
 * BICIM: v1.<iv>.<etiket>.<sifreli metin>, hepsi base64url.
 * Surum oneki ileride anahtar/algoritma degistiginde eski kayitlari
 * okuyabilmek icin — sonradan eklenemeyecek tek sey budur.
 *
 * NE DEGIL: bu, arama yapilabilir sifreleme DEGIL. Sifreli alanlarda
 * WHERE calismaz. Aramasi gereken bir alan varsa ya duz metin tutulur ya
 * da ayrica hash sutunu eklenir.
 */

const VERSION = 'v1';

function keyFrom(env: NodeJS.ProcessEnv): Buffer {
  const raw = env.FIELD_ENCRYPTION_KEY;

  if (raw) {
    const key = Buffer.from(raw, 'base64');
    if (key.length !== 32) {
      throw new Error(
        'FIELD_ENCRYPTION_KEY 32 bayt olmali (base64). Uretmek icin: openssl rand -base64 32',
      );
    }
    return key;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'FIELD_ENCRYPTION_KEY tanimli degil. Tam adres ve SIN gibi alanlar ' +
        'sifrelenmeden saklanamaz. Uretmek icin: openssl rand -base64 32',
    );
  }

  /**
   * Gelistirmede sabit bir anahtar turetiliyor ki kurulum bir adim daha
   * uzamasin. Uretimde bu yola HIC girilmiyor (yukaridaki kontrol).
   */
  return createHash('sha256').update('havre-gelistirme-anahtari').digest();
}

export function encryptField(plain: string, env: NodeJS.ProcessEnv = process.env): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(env), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ct.toString('base64url')].join('.');
}

export function decryptField(stored: string, env: NodeJS.ProcessEnv = process.env): string {
  const [version, ivB64, tagB64, ctB64] = stored.split('.');
  if (version !== VERSION || !ivB64 || !tagB64 || !ctB64) {
    throw new Error('Sifreli alan bicimi taninmadi.');
  }
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(env), Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64url')), decipher.final()]).toString('utf8');
}

/**
 * Haritada gosterilecek YAKLASIK konum.
 *
 * Bakicinin tam adresi harita uzerinde ASLA gosterilmez; rezervasyon
 * onaylanana kadar acilmaz. Gosterilen nokta, mahalle merkezinden
 * ~150-350 m kaydirilmis bir noktadir.
 *
 * KAYDIRMA DETERMINISTIK: ayni bakici icin her zaman ayni nokta. Rastgele
 * olsaydi nokta her sayfa yenilemede zipladigi icin, birkac gozlemin
 * ortalamasi gercek konumu ele verirdi.
 */
export function approximatePoint(
  seed: string,
  centroidLon: number,
  centroidLat: number,
): { lon: number; lat: number } {
  const h = createHash('sha256').update(seed).digest();
  const angle = ((h[0] ?? 0) / 255) * Math.PI * 2;
  const metres = 150 + ((h[1] ?? 0) / 255) * 200;

  const dLat = (metres * Math.sin(angle)) / 111_320;
  const dLon = (metres * Math.cos(angle)) / (111_320 * Math.cos((centroidLat * Math.PI) / 180));

  return {
    lon: Number((centroidLon + dLon).toFixed(6)),
    lat: Number((centroidLat + dLat).toFixed(6)),
  };
}
