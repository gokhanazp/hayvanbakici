/**
 * HATA IZLEME — NE GONDERILIR, NE GONDERILMEZ.
 *
 * Sentry'nin varsayilanlari bir pazar yeri icin yeterince dar degil.
 * Buradaki iki islev, olayin ONE CIKAN kisisel veriyi tasimadigini
 * garanti ediyor ve ikisi de saf: Sentry kurulu olmadan test ediliyor.
 *
 * ASIL TEHLIKE SORGU DIZESI. Sifre sifirlama ve e-posta dogrulama
 * adresleri jeton tasiyor:
 *
 *   /en/account/reset-password/?token=abc123
 *
 * Bu adres bir hata olayiyla birlikte Sentry'ye giderse, hata kaydini
 * okuyabilen herkes o hesabin sifresini degistirebilir. Jeton bir
 * "kisisel veri" degil, dogrudan bir ANAHTAR.
 *
 * Ikinci tehlike e-posta adresi: giris ve kayit formlarinda sorguya
 * dusebiliyor ve Law 25 anlaminda kisisel veri. Hata ayiklamak icin
 * hangi hesabin oldugunu bilmek gerekmiyor — hangi SAYFA oldugunu
 * bilmek yetiyor.
 */

/** Degeri silinen sorgu anahtarlari. Kucuk harfle karsilastiriliyor. */
export const SENSITIVE_QUERY_KEYS: readonly string[] = [
  'token',
  'code',
  'state',
  'secret',
  'key',
  'signature',
  'sig',
  'password',
  'otp',
  'email',
  'id_token',
  'access_token',
  'refresh_token',
  'callbackurl',
  'callback_url',
];

export const REDACTED = '[redacted]';

const sensitive = new Set(SENSITIVE_QUERY_KEYS);

/**
 * Adresteki hassas sorgu DEGERLERINI siler, anahtarlari birakir.
 *
 * Anahtar kaliyor cunku "token parametresiyle gelen istek patliyor"
 * bilgisi hata ayiklamanin ta kendisi; degeri ise hicbir ise yaramiyor.
 *
 * Gorece adres de (yalnizca yol + sorgu) kabul ediliyor: Next'in
 * `onRequestError` cagrisi adresi boyle veriyor.
 */
export function scrubUrl(raw: string): string {
  const cut = raw.indexOf('?');
  if (cut < 0) return raw;

  const head = raw.slice(0, cut);
  const tail = raw.slice(cut + 1);
  // Cipa (#) sorgunun sonunda kalabilir; oldugu gibi tasiniyor.
  const hashAt = tail.indexOf('#');
  const query = hashAt < 0 ? tail : tail.slice(0, hashAt);
  const hash = hashAt < 0 ? '' : tail.slice(hashAt);

  const parts = query.split('&').map((pair) => {
    if (!pair) return pair;
    const eq = pair.indexOf('=');
    const key = eq < 0 ? pair : pair.slice(0, eq);
    if (!sensitive.has(decodeURIComponent(key).toLowerCase())) return pair;
    return `${key}=${REDACTED}`;
  });

  return `${head}?${parts.join('&')}${hash}`;
}

/** Sentry olayinin ilgilendigimiz kadari — SDK'ya bagimlilik yok. */
export interface ScrubbableEvent {
  request?: {
    url?: string;
    query_string?: string | Record<string, string> | Array<[string, string]>;
    cookies?: unknown;
    headers?: Record<string, string>;
    data?: unknown;
    method?: string;
  };
  user?: unknown;
}

/**
 * Giden olaydan kisisel veriyi cikarir.
 *
 * - Adres ve sorgu dizesi temizleniyor (yukaridaki kural).
 * - Cerezler TAMAMEN gidiyor: oturum cerezi bir anahtar.
 * - Basliklardan yalnizca UC tanesi kaliyor. `authorization`, `cookie`
 *   ve istemci IP'sini tasiyan `x-forwarded-for` bilerek yok.
 * - Istek GOVDESI gidiyor: form gonderimleri sifre ve adres tasiyor.
 * - `user` gidiyor: kimin oldugu degil, NEREDE patladigi lazim.
 */
const KEEP_HEADERS = new Set(['content-type', 'user-agent', 'accept-language']);

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
  const req = event.request;
  if (req) {
    if (typeof req.url === 'string') req.url = scrubUrl(req.url);

    if (typeof req.query_string === 'string' && req.query_string.length > 0) {
      // scrubUrl yol bekliyor; sorgu dizesini tek basina temizlemek icin
      // basina bos bir yol koyup sonucu geri aliyoruz.
      req.query_string = scrubUrl(`?${req.query_string}`).slice(1);
    } else if (req.query_string && typeof req.query_string === 'object') {
      const entries = Array.isArray(req.query_string)
        ? req.query_string
        : Object.entries(req.query_string);
      const cleaned = entries.map(([k, v]) =>
        sensitive.has(String(k).toLowerCase()) ? [k, REDACTED] : [k, v],
      ) as Array<[string, string]>;
      req.query_string = Array.isArray(req.query_string)
        ? cleaned
        : Object.fromEntries(cleaned);
    }

    delete req.cookies;
    delete req.data;

    if (req.headers) {
      const kept: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (KEEP_HEADERS.has(k.toLowerCase())) kept[k] = v;
      }
      req.headers = kept;
    }
  }

  delete event.user;
  return event;
}
