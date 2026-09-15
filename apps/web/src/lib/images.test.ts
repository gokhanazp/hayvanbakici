import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { processImage, MAX_UPLOAD_BYTES } from './images';
import { safeKey, keyFromUrl } from './storage';

/**
 * YUKLENEN DOSYA TESTLERI.
 *
 * Buradaki her test bir GUVENLIK ya da GIZLILIK sozunun karsiligi:
 *  - uzantisi resim olan her sey resim degildir (icerikten dogrulama)
 *  - telefon fotografindaki GPS koordinati yayina CIKMAMALI
 *  - depolama anahtari disaridan geliyor: yol kacisi denemesi diske inmemeli
 */

async function jpeg(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 120, b: 90 } },
  }).jpeg().toBuffer();
}

describe('gorsel isleme', () => {
  it('gecerli bir JPEG webp olarak donuyor', async () => {
    const res = await processImage(await jpeg(800, 600), 'home');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.ext).toBe('webp');
    const meta = await sharp(res.body).metadata();
    expect(meta.format).toBe('webp');
  });

  it('avatar KARE kirpiliyor', async () => {
    const res = await processImage(await jpeg(1200, 400), 'avatar');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.width).toBe(res.height);
    expect(res.width).toBeLessThanOrEqual(512);
  });

  it('ev fotografi orani BOZULMADAN kuculuyor', async () => {
    const res = await processImage(await jpeg(3000, 2000), 'home');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.width).toBe(1600);
    expect(res.height).toBe(Math.round(1600 * (2000 / 3000)));
  });

  it('kucuk gorsel BUYUTULMUYOR', async () => {
    const res = await processImage(await jpeg(320, 240), 'home');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.width).toBe(320);
  });

  /*
    EN ONEMLI TEST. Telefon fotograflari GPS tasir; bakicinin tam adresini
    sifreleyip haritadaki noktayi kaydirdiktan sonra ayni adresi fotografin
    ust verisinde dagitmak, tum o isi bosa cikarirdi.
  */
  it('EXIF ust verisi (konum dahil) SILINIYOR', async () => {
    const withExif = await sharp({
      create: { width: 600, height: 400, channels: 3, background: { r: 10, g: 80, b: 60 } },
    })
      .withExif({ IFD0: { Copyright: 'Havre', Software: 'test' } })
      .jpeg()
      .toBuffer();

    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const res = await processImage(withExif, 'home');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect((await sharp(res.body).metadata()).exif).toBeUndefined();
  });

  it('resim OLMAYAN dosya reddediliyor', async () => {
    const notImage = Buffer.from('%PDF-1.7\n%aaa\n1 0 obj\n', 'utf8');
    expect(await processImage(notImage, 'home')).toEqual({ ok: false, error: 'not_an_image' });
  });

  it('adi .jpg olan metin de reddediliyor — karar ICERIKTEN', async () => {
    const fake = Buffer.from('<?php echo "merhaba"; ?>', 'utf8');
    const res = await processImage(fake, 'avatar');
    expect(res.ok).toBe(false);
  });

  it('cok buyuk dosya sharp\'a hic girmeden reddediliyor', async () => {
    const huge = Buffer.alloc(MAX_UPLOAD_BYTES + 1);
    expect(await processImage(huge, 'home')).toEqual({ ok: false, error: 'too_large' });
  });
});

describe('depolama anahtari', () => {
  it('gecerli anahtari kabul ediyor', () => {
    expect(safeKey('avatar/abc-123.webp')).toBe('avatar/abc-123.webp');
    expect(safeKey('home/AbC_9.webp')).toBe('home/AbC_9.webp');
  });

  it('yol kacisi ve mutlak yol reddediliyor', () => {
    expect(safeKey('../../etc/passwd')).toBeNull();
    expect(safeKey('avatar/../../secret.webp')).toBeNull();
    expect(safeKey('/etc/passwd')).toBeNull();
    expect(safeKey('avatar\\..\\x.webp')).toBeNull();
  });

  it('taninmayan klasor reddediliyor', () => {
    expect(safeKey('secrets/x.webp')).toBeNull();
    expect(safeKey('x.webp')).toBeNull();
  });

  it('adresten anahtar cikariyor, yabanci adresi reddediyor', () => {
    expect(keyFromUrl('/media/avatar/a-1.webp')).toBe('avatar/a-1.webp');
    expect(keyFromUrl('https://example.com/media/avatar/a-1.webp')).toBeNull();
    expect(keyFromUrl('/photos/hero.jpg')).toBeNull();
    expect(keyFromUrl(null)).toBeNull();
  });
});

describe('bozuk dosya', () => {
  it('BASLIGI GECERLI ama govdesi bozuk dosya HATA DONER, patlamaz', async () => {
    /*
      Tarayicida yakalandi: boyle bir dosya metadata()'yi geciyor, sonra
      olcekleme sirasinda "libpng read error" firlatiyordu. Hata
      yakalanmadigi icin sunucu eylemi 500 veriyor ve kullanici
      "fotografiniz okunamadi" yerine cokmus bir ekran goruyordu.
    */
    const header = Buffer.from('89504e470d0a1a0a', 'hex');
    const ihdr = Buffer.concat([
      Buffer.from([0, 0, 0, 13]),
      Buffer.from('IHDR'),
      Buffer.from([0, 0, 0, 8, 0, 0, 0, 8, 8, 6, 0, 0, 0]),
      Buffer.from([0x7a, 0x7a, 0xd4, 0xdd]),
    ]);
    const junk = Buffer.alloc(64, 0xab);
    const broken = Buffer.concat([header, ihdr, junk]);

    const res = await processImage(broken, 'avatar');
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toBe('not_an_image');
  });

  it('gorsel olmayan dosya da hata doner', async () => {
    const res = await processImage(Buffer.from('bu bir metin dosyasi'), 'home');
    expect(res.ok).toBe(false);
  });
});
