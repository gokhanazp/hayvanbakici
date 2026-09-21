/**
 * TOHUM GUVENLIGI.
 *
 * `npm run db:seed` 144 UYDURMA bakici, 1.760 uydurma rezervasyon ve
 * 1.136 uydurma yorum uretiyor. Bu, canli bir veritabaninda calisirsa
 * site bastan sona yalan soylemeye baslar — ve bunu geri almanin kolay
 * bir yolu yok.
 *
 * Tek gereken, yanlis terminalde yukari ok tusuna basmak. Bu dosya o
 * kazanin maliyetini bir hata mesajina indiriyor.
 *
 * KURAL: gelistirme tohumu YALNIZCA yerel bir veritabaninda calisir.
 * "Yerel" = baglanti adresindeki sunucu localhost / 127.0.0.1 / ::1
 * ya da bir Docker servis adi. Bilerek uzak bir veritabanina
 * tohumlamak isteyen SEED_ALLOW_REMOTE=1 verir; o zaman da hangi
 * sunucuya yazdigi ekrana basiliyor.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'db', 'postgres']);

/** Baglanti adresindeki sunucu adi — sifreyi ve kullaniciyi HIC okumadan. */
export function hostOf(url: string): string {
  try {
    /* postgres:// URL'i WHATWG URL ile ayristirilabiliyor; hostname
       zaten koseli parantezsiz geliyor. */
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function isLocalDatabase(url: string): boolean {
  return LOCAL_HOSTS.has(hostOf(url));
}

/**
 * Gelistirme tohumunun basinda cagriliyor. Uzak bir veritabaniysa
 * ISLEM HIC BASLAMADAN duruyor.
 */
export function assertSeedTarget(url: string, env: NodeJS.ProcessEnv = process.env): void {
  if (isLocalDatabase(url)) return;

  const host = hostOf(url) || '(cozulemedi)';
  if (env.SEED_ALLOW_REMOTE === '1') {
    console.warn(
      `\n⚠️  UZAK VERITABANINA TOHUMLANIYOR: ${host}\n` +
      '   SEED_ALLOW_REMOTE=1 verildigi icin devam ediliyor.\n' +
      '   Bu veritabanindaki rezervasyonlar, yorumlar ve tohum hesaplari SILINECEK.\n',
    );
    return;
  }

  throw new Error(
    `Gelistirme tohumu UZAK bir veritabaninda calistirilamaz (sunucu: ${host}).\n` +
    'Bu betik 144 uydurma bakici, 1.760 uydurma rezervasyon ve 1.136 uydurma yorum uretir;\n' +
    'canli bir sitede bunlarin hepsi ekranda gercekmis gibi gorunur.\n\n' +
    'Uretim veritabanina YALNIZCA sehir ve mahalle verisi yuklemek icin:\n' +
    '  npm run db:seed:prod\n\n' +
    'Gercekten bu uzak veritabanina uydurma veri yazmak istiyorsan:\n' +
    '  SEED_ALLOW_REMOTE=1 npm run db:seed',
  );
}
