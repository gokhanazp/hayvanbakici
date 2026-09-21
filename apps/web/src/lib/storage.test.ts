import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { safeKey, keyFromUrl, getStorage, resetStorageForTests } from './storage';

/**
 * DEPOLAMA.
 *
 * Iki ayri sey olculuyor:
 *
 *  1. ANAHTAR DOGRULAMA ve SURUCU SECIMI — her zaman calisir, sunucu
 *     gerektirmez. Yol kacisi ve "uretimde yerel disk" korumasi burada.
 *  2. S3 GIDIS–DONUS — yalnizca `S3_TEST_ENDPOINT` verilmisse calisir
 *     (yerelde `python3 -m moto.server -p 5999` yeter). CI'da bir S3
 *     sunucusu olmadigi icin atlanmasi bilincli: calismayan bir testi
 *     kirmizi birakmaktansa acikca atlamak dogru.
 */
const ENV_KEYS = [
  'STORAGE_DRIVER', 'S3_ENDPOINT', 'S3_REGION', 'S3_BUCKET',
  'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_PREFIX',
  'NODE_ENV', 'ALLOW_LOCAL_STORAGE', 'UPLOAD_DIR',
] as const;

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  resetStorageForTests();
});

afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetStorageForTests();
});

describe('anahtar dogrulama', () => {
  it('gecerli anahtari kabul eder', () => {
    expect(safeKey('avatar/abc-123.webp')).toBe('avatar/abc-123.webp');
    expect(safeKey('home/XYZ_9.jpg')).toBe('home/XYZ_9.jpg');
    expect(safeKey('pet/a.png')).toBe('pet/a.png');
  });

  it('YOL KACISINI durdurur', () => {
    /* Bu fonksiyon `/media/...` rotasinin disaridan aldigi metni
       suzuyor; gecmeyen hicbir sey depoya dokunmuyor. */
    expect(safeKey('../../etc/passwd')).toBeNull();
    expect(safeKey('avatar/../../secret.webp')).toBeNull();
    expect(safeKey('/etc/passwd')).toBeNull();
    expect(safeKey('avatar\\..\\x.webp')).toBeNull();
  });

  it('taninmayan klasoru reddeder', () => {
    expect(safeKey('gizli/a.webp')).toBeNull();
    expect(safeKey('a.webp')).toBeNull();
  });

  it('adresten anahtari cikarir', () => {
    expect(keyFromUrl('/media/avatar/a-1.webp')).toBe('avatar/a-1.webp');
    expect(keyFromUrl('/baska/avatar/a-1.webp')).toBeNull();
    expect(keyFromUrl(null)).toBeNull();
    /* Adres uzerinden yol kacisi da burada duruyor. */
    expect(keyFromUrl('/media/../../etc/passwd')).toBeNull();
  });
});

describe('surucu secimi', () => {
  it('URETIMDE yerel disk ACIKCA reddediliyor', () => {
    /* Sunucusuz ortamda dosya sistemi kalici degil: sessizce kaybolan
       fotograf, acilista hata veren sunucudan kotudur. */
    process.env.STORAGE_DRIVER = 'local';
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_LOCAL_STORAGE;
    expect(() => getStorage()).toThrow(/yerel disk/i);
  });

  it('uretimde bilerek izin verilirse gecer', () => {
    process.env.STORAGE_DRIVER = 'local';
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_LOCAL_STORAGE = '1';
    expect(() => getStorage()).not.toThrow();
  });

  it('taninmayan surucu adini soyluyor', () => {
    process.env.STORAGE_DRIVER = 'ftp';
    expect(() => getStorage()).toThrow(/ftp/);
  });

  it('s3 secilip ayar eksikse HANGI degisken oldugunu soyluyor', () => {
    /* "Bir sey eksik" demek, gece yarisi dagitim yapan birine hicbir
       sey anlatmiyor. */
    process.env.STORAGE_DRIVER = 's3';
    for (const k of ['S3_REGION', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
      delete process.env[k];
    }
    expect(() => getStorage()).toThrow(/S3_REGION/);
  });
});

/*
  GERCEK S3 GIDIS–DONUSU.

  `S3_TEST_ENDPOINT` yoksa atlanir. Yerelde calistirmak icin:
    pip install "moto[s3,server]" && python3 -m moto.server -p 5999
    S3_TEST_ENDPOINT=http://127.0.0.1:5999 npm test -w @havre/web
*/
const endpoint = process.env.S3_TEST_ENDPOINT;
describe.skipIf(!endpoint)('s3 gidis-donusu', () => {
  const BUCKET = 'havre-media-test';

  async function withBucket() {
    const { S3Client, CreateBucketCommand } = await import('@aws-sdk/client-s3');
    const admin = new S3Client({
      region: 'ca-central-1', endpoint, forcePathStyle: true,
      credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
    });
    try { await admin.send(new CreateBucketCommand({ Bucket: BUCKET })); } catch { /* var */ }
    return admin;
  }

  function useS3() {
    process.env.STORAGE_DRIVER = 's3';
    process.env.S3_ENDPOINT = endpoint as string;
    process.env.S3_REGION = 'ca-central-1';
    process.env.S3_BUCKET = BUCKET;
    process.env.S3_ACCESS_KEY_ID = 'test';
    process.env.S3_SECRET_ACCESS_KEY = 'test';
    process.env.S3_PREFIX = 'uploads';
    resetStorageForTests();
  }

  it('yazar, ayni baytlari okur, siler', async () => {
    await withBucket();
    useS3();
    const st = getStorage();
    const body = Buffer.from('gercek-olmayan-webp');

    const put = await st.put('avatar', body, 'webp', 'image/webp');
    /* ADRES SURUCUDEN BAGIMSIZ: veritabaninda yine /media/... duruyor,
       yani depo degisince var olan satirlar bozulmuyor. */
    expect(put.url).toBe(`/media/${put.key}`);
    expect(put.key).toMatch(/^avatar\/[0-9a-f-]+\.webp$/);

    const got = await st.read(put.key);
    expect(got?.body.equals(body)).toBe(true);
    expect(got?.contentType).toBe('image/webp');

    await st.remove(put.key);
    expect(await st.read(put.key)).toBeNull();
  });

  it('yol kacisi depoya hic inmiyor', async () => {
    await withBucket();
    useS3();
    expect(await getStorage().read('../../etc/passwd')).toBeNull();
  });
});
