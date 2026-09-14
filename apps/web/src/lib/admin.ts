import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { isAdmin, recordAudit } from '@/lib/data';

/**
 * YONETICI KORUMASI.
 *
 * IKI FARKLI DURUM, IKI FARKLI CEVAP:
 *
 *  - Oturum YOK  → giris ekranina yonlendir.
 *    Kimsenin kimligi bilinmiyorken 404 dondurmek, panele girmesi gereken
 *    kisiyi de disari atiyordu (bizzat yasandi: "/en/admin 404 veriyor").
 *    /admin adresinin var oldugunu ogrenmek bir sir degil; koruma
 *    adresin gizliligi degil, yetkinin kontrolu.
 *
 *  - Oturum VAR ama yonetici DEGIL → 404.
 *    Burada "giremezsiniz" demek, giris yapmis siradan bir kullaniciya
 *    bir yonetim paneli oldugunu ve hesabinin yetersiz kaldigini
 *    soylemektir. Soylemiyoruz.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect('/en/account/sign-in/?next=/admin/');
  if (!(await isAdmin(session.user.id))) notFound();
  return session;
}

/** Hassas bir listeyi/kaydi acan yonetici islemini kaydeder. */
export async function auditView(
  actorId: string, entity: string, entityId?: string | undefined,
): Promise<void> {
  const h = await headers();
  await recordAudit({
    actorId,
    action: 'admin.view',
    entity,
    ...(entityId ? { entityId } : {}),
    // Vekil sunucu arkasinda gercek IP bu baslikta gelir
    ...(h.get('x-forwarded-for') ? { ip: h.get('x-forwarded-for')! } : {}),
  });
}

/** Sunucu eyleminden IP okumak icin — karar kayitlarinda kullaniliyor. */
export async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get('x-forwarded-for') ?? undefined;
}

/** Adres cubugundan gelen tek degeri okur (dizi gelirse ilkini). */
export function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Yonetici ekranlarinin ortak bicimlendirmeleri — hepsi tek dil, UTC. */
export function money(cents: number): string {
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' })
    .format(cents / 100);
}

/** Grafik ekseni icin kisa para birimi: $46.5k. Tam deger kartin ustunde. */
export function moneyShort(cents: number): string {
  const d = cents / 100;
  if (Math.abs(d) >= 1000) return `$${Math.round(d / 100) / 10}k`;
  return `$${Math.round(d)}`;
}

export function day(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'UTC' })
    .format(new Date(iso));
}

export function stamp(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'UTC' }).format(d);
  const time = new Intl.DateTimeFormat('en-CA', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  }).format(d);
  return `${date} ${time} UTC`;
}

/** "3 gun once" — bekleme suresi, tarihten daha okunakli bir olcu. */
export function ago(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(0, mins)} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}
