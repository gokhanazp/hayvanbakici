import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { OutgoingEmail } from './mail.js';

/**
 * GELISTIRME POSTA KUTUSU.
 *
 * Gelistirmede e-posta gonderilmiyor; dogrulama ve sifirlama baglantilarini
 * terminalde aramak zorunda kalmayin diye gonderilen son e-postalar buraya
 * yaziliyor ve /account/dev-inbox sayfasinda listeleniyor.
 *
 * NEDEN DOSYA, NEDEN BELLEK DEGIL: Next gelistirmede her rotayi ayri
 * paketliyor; modul icindeki bir dizi, e-postayi yazan kod ile okuyan sayfa
 * arasinda PAYLASILMAYABILIR. Isletim sisteminin gecici dizinindeki tek bir
 * dosya bu belirsizligi ortadan kaldiriyor.
 *
 * NEREDE DURUYOR: os.tmpdir() — projenin icinde DEGIL. Yanlislikla commit
 * edilmesi ya da bir imaja kopyalanmasi mumkun olmasin diye.
 */

const DIR = join(tmpdir(), 'havre-dev');
const FILE = join(DIR, 'mailbox.json');
const KEEP = 20;

export interface DevEmail extends OutgoingEmail {
  at: string;
  link: string | null;
}

/** Uretimde bu modul HICBIR SEY yapmaz — cift kilit: burada ve sayfada. */
function enabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

export function recordDevEmail(email: OutgoingEmail): void {
  if (!enabled()) return;
  try {
    const link = email.text.match(/https?:\/\/\S+/)?.[0] ?? null;
    const entry: DevEmail = { ...email, at: new Date().toISOString(), link };
    const all = [entry, ...readDevInbox()].slice(0, KEEP);
    mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, JSON.stringify(all), 'utf8');
  } catch {
    // Posta kutusu bir kolaylik; yazilamazsa kayit akisi durmamali.
  }
}

export function readDevInbox(): DevEmail[] {
  if (!enabled()) return [];
  try {
    const parsed: unknown = JSON.parse(readFileSync(FILE, 'utf8'));
    return Array.isArray(parsed) ? (parsed as DevEmail[]) : [];
  } catch {
    return [];
  }
}

export function clearDevInbox(): void {
  if (!enabled()) return;
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(FILE, '[]', 'utf8');
  } catch {
    // yoksay
  }
}
