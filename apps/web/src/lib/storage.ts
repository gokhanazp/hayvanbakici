import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';

/**
 * DOSYA DEPOLAMA — bugun yerel disk, yarin S3/R2.
 *
 * TEK ARAYUZ, IKI UYGULAMA planlaniyor. Ekranlar ve sunucu eylemleri
 * yalnizca bu arayuzu taniyor; S3 geldiginde degisen tek sey bu dosyanin
 * icidir, yukleme formlari ve sorgular degil.
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

export type MediaKind = 'avatar' | 'home';

const KINDS: readonly MediaKind[] = ['avatar', 'home'];

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

let instance: Storage | null = null;

export function getStorage(): Storage {
  if (instance) return instance;

  const driver = process.env.STORAGE_DRIVER ?? 'local';
  if (driver !== 'local') {
    throw new Error(
      `STORAGE_DRIVER="${driver}" tanimli degil. Bugun yalnizca "local" var; ` +
      'S3/R2 surucusu eklenince buraya baglanacak.',
    );
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_STORAGE !== '1') {
    throw new Error(
      'Uretimde yerel disk depolamasi kullanilamaz: dosya sistemi kalici degil ve ' +
      'yuklenen fotograflar sessizce kaybolur. S3/R2 baglayin ya da bilerek ' +
      'tek sunucuda calisiyorsaniz ALLOW_LOCAL_STORAGE=1 verin.',
    );
  }

  const root = process.env.UPLOAD_DIR ?? path.join(process.cwd(), '.uploads');
  instance = new LocalDisk(root);
  return instance;
}

/** Adresten anahtari cikarir — silme icin. */
export function keyFromUrl(url: string | null | undefined): string | null {
  if (!url || !url.startsWith('/media/')) return null;
  return safeKey(url.slice('/media/'.length));
}
