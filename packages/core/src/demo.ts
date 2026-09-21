/**
 * DEMO YAYINI — "bu sitedeki insanlar gercek degil" anahtari.
 *
 * Tek bir tanim, cunku birden fazla yerde karar veriyor: arama
 * motoruna kapatma ve uyari seridi (apps/web), sahte adli sicil
 * saglayicisina izin (packages/screening). Iki ayri tanim olsaydi
 * biri acik biri kapali kalabilirdi — en kotusu de bu: uyari seridi
 * olmayan ama sahte dogrulama yapan bir site.
 *
 * `VERCEL_ENV=preview` de demo sayilir: onizleme dagitimlarini elle
 * isaretlemeyi unutmak cok kolay.
 */
export function isDemoEnv(env: {
  DEMO_MODE?: string | undefined;
  VERCEL_ENV?: string | undefined;
}): boolean {
  if (env.DEMO_MODE === '1') return true;
  if (env.DEMO_MODE === '0') return false;
  return env.VERCEL_ENV === 'preview';
}
