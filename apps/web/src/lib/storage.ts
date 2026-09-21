import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import {
  S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';

/**
 * DOSYA DEPOLAMA — yerel disk (gelistirme) ya da S3 uyumlu depo (uretim).
 *
 * TEK ARAYUZ, IKI UYGULAMA. Ekranlar ve sunucu eylemleri yalnizca bu
 * arayuzu taniyor; depo degisince degisen tek sey bu dosyanin icidir,
 * yukleme formlari ve sorgular degil.
 *
 * S3 SURUCUSU SAGLAYICIYA BAGLI DEGIL. Uc nokta (`S3_ENDPOINT`) bir
 * ortam degiskeni: Supabase Storage, AWS S3, Cloudflare R2 ve MinIO
 * ayni kodla calisiyor. Boylece "hangi depoyu kullaniyoruz" sorusu bir
 * kod karari olmaktan cikip bir yapilandirma karari oluyor — yayina
 * alma yolunu secmeden once bu dosyayi yazabilmemizin sebebi bu.
 *
 * URETIMDE YEREL DISK YETMEZ. Vercel benzeri ortamlarda dosya sistemi
 * salt okunur ve her dagitimda sifirlanir; birden fazla sunucu olunca da
 * bir sunucuya yuklenen dosyayi digeri goremez. Bu yuzden depolama
 * `STORAGE_DRIVER` ile secilir ve uretimde `local` secilirse sunucu
 * ACILISTA HATA VERIR — sessizce kaybolan fotograf, hata veren sunucudan
 * kotudur.
 *
 * ADRESLER TAHMIN EDILEMEZ: anahtar rastgele uretiliyor ve kullanici
 * kimligi ICERMIYOR. Bir fotografin adresini bilen onu gorebilir (public
 * bucket mantigi), ama kimse bir kullanicinin fotograflarini adres
 * tahmin ederek listeleyemez.
 */
export interface Stored {
  /** Depodaki anahtar — veritabaninda degil, adres saklaniyor */
  key: string;
  /** Uygulamanin kullandigi adres (`/media/...` veya ileride CDN) */
  url: string;
}

export interface Storage {
  put(kind: MediaKind, body: Buffer, ext: string, contentType: string): Promise<Stored>;
  read(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  remove(key: string): Promise<void>;
}

export type MediaKind = 'avatar' | 'home' | 'pet';

const KINDS: readonly MediaKind[] = ['avatar', 'home', 'pet'];

/**
 * Anahtar dogrulama — YOL KACISI (path traversal) burada duruyor.
 * `/media/...` rotasi disaridan gelen metni buraya veriyor; bu fonksiyon
 * gecmeyen hicbir sey diske dokunmuyor.
 */
export function safeKey(key: string): string | null {
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) return null;
  if (!/^[a-z]+\/[A-Za-z0-9_-]+\.[a-z0-9]{2,5}$/.test(key)) return null;
  const kind = key.split('/')[0] as MediaKind;
  return KINDS.includes(kind) ? key : null;
}

const TYPES: Record<string, string> = {
  webp: 'image/webp',
  jpg: 'image/jpeg',
  png: 'image/png',
};

class LocalDisk implements Storage {
  constructor(private readonly root: string) {}

  private full(key: string): string {
    return path.join(this.root, key);
  }

  async put(kind: MediaKind, body: Buffer, ext: string, _contentType: string): Promise<Stored> {
    const key = `${kind}/${randomUUID()}.${ext}`;
    const file = this.full(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
    return { key, url: `/media/${key}` };
  }

  async read(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    const safe = safeKey(key);
    if (!safe) return null;
    try {
      const body = await readFile(this.full(safe));
      const ext = safe.split('.').pop() ?? '';
      return { body, contentType: TYPES[ext] ?? 'application/octet-stream' };
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    const safe = safeKey(key);
    if (!safe) return;
    try { await unlink(this.full(safe)); } catch { /* zaten yok */ }
  }
}

/**
 * S3 UYUMLU DEPO.
 *
 * ANAHTAR BICIMI YEREL DISKLE AYNI (`kind/uuid.ext`) ve veritabaninda
 * yine `/media/<key>` adresi saklaniyor. Yani depo degistiginde var olan
 * satirlarin hicbiri bozulmuyor ve tasima betigi gerekmiyor.
 *
 * BAYTLAR `/media` ROTASINDAN GECIYOR, herkese acik kova adresine
 * YONLENDIRILMIYOR. Sebep: fotograflar `next/image` ile ciziliyor ve
 * optimizasyon katmani kendi kaynagini AYNI koken sayiyor. Yonlendirme
 * koysaydik `remotePatterns` ayari, olasi yonlendirme takibi sorunlari
 * ve veritabanindaki eski `/media/...` satirlariyla uyumsuzluk riski
 * gelirdi. Optimize edilmis gorsel zaten CDN'de onbellekleniyor, yani
 * bu rota yalnizca onbellek isabetsizliginde calisiyor.
 *
 * Bant genisligi ileride sorun olursa cozum tek fonksiyonluk: bu rota
 * 302 ile CDN adresine yonlendirir.
 */
class S3Bucket implements Storage {
  constructor(
    private readonly client: S3Client,
    private readonly bucket: string,
    private readonly prefix: string,
  ) {}

  private full(key: string): string {
    return this.prefix ? `${this.prefix}/${key}` : key;
  }

  async put(kind: MediaKind, body: Buffer, ext: string, contentType: string): Promise<Stored> {
    const key = `${kind}/${randomUUID()}.${ext}`;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: this.full(key),
      Body: body,
      ContentType: contentType,
      /* Anahtar rastgele ve degismez — uzun onbellek guvenli. */
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    return { key, url: `/media/${key}` };
  }

  async read(key: string): Promise<{ body: Buffer; contentType: string } | null> {
    const safe = safeKey(key);
    if (!safe) return null;
    try {
      const res = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket, Key: this.full(safe),
      }));
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      const ext = safe.split('.').pop() ?? '';
      return {
        body: Buffer.from(bytes),
        /* Kovadaki tip once; yoksa uzantidan. Dosyayi biz yazdigimiz
           icin ikisi normalde ayni. */
        contentType: res.ContentType ?? TYPES[ext] ?? 'application/octet-stream',
      };
    } catch {
      /* Yok, silinmis ya da erisilemiyor — cagiran icin ucu de 404. */
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    const safe = safeKey(key);
    if (!safe) return;
    try {
      await this.client.send(new DeleteObjectCommand({
        Bucket: this.bucket, Key: this.full(safe),
      }));
    } catch { /* zaten yok */ }
  }
}

/** Zorunlu ortam degiskeni — eksikse ACIKCA soyluyor, sessizce gecmiyor. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `STORAGE_DRIVER="s3" secildi ama ${name} tanimli degil. ` +
      'Gerekenler: S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY ' +
      '(S3_ENDPOINT yalnizca AWS disi saglayicilarda).',
    );
  }
  return v;
}

let instance: Storage | null = null;

export function getStorage(): Storage {
  if (instance) return instance;

  const driver = process.env.STORAGE_DRIVER ?? 'local';

  if (driver === 's3') {
    const endpoint = process.env.S3_ENDPOINT;
    instance = new S3Bucket(
      new S3Client({
        region: required('S3_REGION'),
        ...(endpoint ? { endpoint } : {}),
        /*
          AWS DISI SAGLAYICILARDA YOL BICIMI. Supabase Storage, R2 ve
          MinIO kova adini alan adina degil yola koyuyor
          (`https://uc-nokta/bucket/key`). AWS'te bunu acmak gereksiz,
          bu yuzden yalnizca ozel bir uc nokta verildiyse aciliyor.
        */
        forcePathStyle: Boolean(endpoint),
        credentials: {
          accessKeyId: required('S3_ACCESS_KEY_ID'),
          secretAccessKey: required('S3_SECRET_ACCESS_KEY'),
        },
      }),
      required('S3_BUCKET'),
      process.env.S3_PREFIX ?? '',
    );
    return instance;
  }

  if (driver !== 'local') {
    throw new Error(
      `STORAGE_DRIVER="${driver}" tanimli degil. Gecerli degerler: "local", "s3".`,
    );
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_STORAGE !== '1') {
    throw new Error(
      'Uretimde yerel disk depolamasi kullanilamaz: dosya sistemi kalici degil ve ' +
      'yuklenen fotograflar sessizce kaybolur. STORAGE_DRIVER=s3 verin ya da bilerek ' +
      'tek sunucuda calisiyorsaniz ALLOW_LOCAL_STORAGE=1 verin.',
    );
  }

  const root = process.env.UPLOAD_DIR ?? path.join(process.cwd(), '.uploads');
  instance = new LocalDisk(root);
  return instance;
}

/** Testler icin: ortam degisince fabrikanin yeniden kurulmasi gerekiyor. */
export function resetStorageForTests(): void {
  instance = null;
}

/** Adresten anahtari cikarir — silme icin. */
export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/media/')) return null;
  return safeKey(url.slice('/media/'.length));
}
