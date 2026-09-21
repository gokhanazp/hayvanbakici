/**
 * YONETICI PANELI KAPISI — OTURUMDAN ONCEKI KAPI.
 *
 * /admin bugune kadar YALNIZCA oturumla korunuyordu: dogru e-posta ve
 * sifre bilen herkes, internetin herhangi bir yerinden giris ekranini
 * gorebiliyordu. Bu ekran 1790 rezervasyonu, kullanici e-postalarini ve
 * "mesaji ac" dugmesini tasiyor; tek savunma hatti bir sifre olmamali.
 *
 * KURAL (uretimde):
 *   ADMIN_IP_ALLOWLIST doluysa  → yalnizca o adresler girebilir
 *   liste yok + ADMIN_ALLOW_ANY_IP=1 → herkes (bilerek acilmis kapi)
 *   liste yok + izin yok        → PANEL KAPALI, 404
 *
 * Neden 403 degil 404: 403 "burada bir yonetici paneli var ama seni
 * almiyorum" demek. 404 hicbir sey soylemiyor.
 *
 * Neden varsayilan KAPALI: ayni desen depolamada da var
 * (ALLOW_LOCAL_STORAGE). Unutulan bir ayar yuzunden panel acikta
 * kalmaktansa, unutulan bir ayar yuzunden panel kapali kalsin —
 * ikincisi fark edilir, birincisi edilmez.
 *
 * Gelistirmede (NODE_ENV != production) kapi HIC devreye girmiyor.
 */

export type AdminGateReason =
  | 'development'      // yerel gelistirme — kapi kapali degil
  | 'allowlist'        // adres listede
  | 'explicitly_open'  // ADMIN_ALLOW_ANY_IP=1
  | 'not_in_allowlist' // adres listede degil
  | 'no_allowlist';    // uretimde ayar yok — panel kapali

export interface AdminGateResult {
  ok: boolean;
  reason: AdminGateReason;
}

/**
 * ISTEMCI ADRESI.
 *
 * Vercel ve benzeri vekiller `x-forwarded-for` basligini KENDILERI
 * yaziyor ve en soldaki deger gercek istemci. Tarayicidan gelen sahte
 * bir baslik vekil tarafindan EZILIYOR — bu yuzden en soldaki degere
 * guveniliyor. Kendi sunucunda vekilsiz calistiriyorsan bu varsayim
 * gecerli DEGIL; o durumda liste yerine ag seviyesinde kisitla.
 */
export function clientIp(headers: {
  get(name: string): string | null;
}): string | null {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return normalizeIp(first);
  }
  const real = headers.get('x-real-ip');
  return real ? normalizeIp(real.trim()) : null;
}

/** ::ffff:24.114.0.1 → 24.114.0.1 · köşeli parantezli IPv6 → düz */
function normalizeIp(ip: string): string {
  let v = ip;
  if (v.startsWith('[') && v.includes(']')) v = v.slice(1, v.indexOf(']'));
  if (v.toLowerCase().startsWith('::ffff:') && v.includes('.')) v = v.slice(7);
  return v;
}

/** "1.2.3.4, 10.0.0.0/8 , ::1" → ['1.2.3.4','10.0.0.0/8','::1'] */
export function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let out = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out = (out << 8) | n;
  }
  return out >>> 0;
}

/**
 * Adres listede mi? IPv4'te CIDR destekleniyor (10.0.0.0/8), IPv6'da
 * yalnizca birebir esitlik — IPv6 maskesi yazmak nadir ve yanlis
 * yazilmasi kolay; sessizce yanlis eslesmektense desteklememek iyi.
 */
export function ipAllowed(ip: string | null, allowlist: readonly string[]): boolean {
  if (!ip) return false;
  const ipInt = ipv4ToInt(ip);

  for (const entry of allowlist) {
    const slash = entry.indexOf('/');
    if (slash < 0) {
      if (entry.toLowerCase() === ip.toLowerCase()) return true;
      continue;
    }
    const base = entry.slice(0, slash);
    const bits = Number(entry.slice(slash + 1));
    const baseInt = ipv4ToInt(base);
    if (ipInt === null || baseInt === null) continue;
    if (!Number.isInteger(bits) || bits < 0 || bits > 32) continue;
    if (bits === 0) return true;
    const mask = (0xffffffff << (32 - bits)) >>> 0;
    if ((ipInt & mask) === (baseInt & mask)) return true;
  }
  return false;
}

export function adminGate(input: {
  ip: string | null;
  allowlist: string | undefined;
  allowAny: string | undefined;
  isProduction: boolean;
}): AdminGateResult {
  if (!input.isProduction) return { ok: true, reason: 'development' };

  const list = parseAllowlist(input.allowlist);
  if (list.length > 0) {
    return ipAllowed(input.ip, list)
      ? { ok: true, reason: 'allowlist' }
      : { ok: false, reason: 'not_in_allowlist' };
  }
  if (input.allowAny === '1') return { ok: true, reason: 'explicitly_open' };
  return { ok: false, reason: 'no_allowlist' };
}

/** Kapinin ilgilendigi yollar: /admin ve altindaki her sey. */
export function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}
