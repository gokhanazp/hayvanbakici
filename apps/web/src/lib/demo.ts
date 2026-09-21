/**
 * DEMO YAYINI — "bu sitedeki insanlar gercek degil" anahtari.
 *
 * Tohum veriyle dolu bir dagitim (144 uydurma bakici, 1136 uydurma
 * yorum) urunu gezmek icin en iyisi; ama ayni dagitim, hicbir uyari
 * olmadan internete acilirsa sitenin ekranda YALAN SOYLEDIGI anlamina
 * gelir — bu depodaki en temel kurala aykiri.
 *
 * Bu anahtar acikken iki sey birden oluyor:
 *
 *   1. ARAMA MOTORLARINA TAMAMEN KAPALI. robots.txt her seyi
 *      yasakliyor, sitemap bosaliyor, her sayfa noindex. Aksi halde
 *      uydurma bakici profilleri Google'a girer ve gercek site
 *      yayina girdiginde ayni icerik iki adreste cikar.
 *   2. HER SAYFANIN TEPESINDE UYARI. Ziyaretci "demo" oldugunu
 *      arayuzden okuyor; robots.txt kullaniciya gorunmez.
 *
 * `VERCEL_ENV=preview` de demo sayilir: onizleme dagitimlarini
 * elle isaretlemeyi unutmak cok kolay ve bedeli indekslenmis
 * uydurma veri.
 */
export function isDemoEnv(env: {
  DEMO_MODE?: string | undefined;
  VERCEL_ENV?: string | undefined;
}): boolean {
  if (env.DEMO_MODE === '1') return true;
  if (env.DEMO_MODE === '0') return false;
  return env.VERCEL_ENV === 'preview';
}

export function isDemo(): boolean {
  return isDemoEnv({
    DEMO_MODE: process.env.DEMO_MODE,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}

/** Uyari seridinin metni — iki dilde, sus yok. */
export function demoNotice(locale: string): { title: string; body: string } {
  return locale === 'fr-CA'
    ? {
        title: 'Démonstration',
        body: 'Les gardiens, les avis et les réservations de ce site sont fictifs. Aucune personne réelle, aucun paiement.',
      }
    : {
        title: 'Demo',
        body: 'The sitters, reviews and bookings on this site are made up. No real people, no payments.',
      };
}
