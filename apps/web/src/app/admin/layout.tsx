import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@havre/tokens/css';
import './admin.css';

/**
 * YONETICI PANELI — SITENIN DISINDA.
 *
 * Bu duzen `[locale]` segmentinin DISINDA duruyor ve kendi <html>'ini
 * ciziyor. Uc sonucu var, ucu de bilincli:
 *
 *  1. Site basligi/alt bilgisi YOK. Panel bir pazarlama sayfasi degil;
 *     "Bakici ol" dugmesinin operasyon ekraninda isi yok.
 *  2. Adres TEK: /admin. Panelin EN/FR ikizi yok — ic arac tek dilde
 *     (Ingilizce) tutuluyor. Bill 96 MUSTERIYE sunulan arayuzu baglar;
 *     ekibin kendi araci ayri bir mesele ve iki dilde bir panel, iki kat
 *     bakim ve iki kat "ceviri eksik" hatasi demekti.
 *  3. RENK sitenin kendisi, YAZI TIPI degil. Panel icin ayri bir arduvaz
 *     palet denendi ve geri alindi (ayni urunun iki renk dunyasi olmasi
 *     paneli "baska bir yazilim" gibi gosteriyordu); ayrim renkle degil
 *     yerlesimle ve tipografiyle yapiliyor.
 *
 * BU DUZEN YETKI KONTROLU YAPMIYOR — bilerek.
 * Giris ekrani da (/admin/sign-in) bu agacin altinda ve ayni gorunumu
 * kullaniyor; kontrol burada olsaydi giris ekrani kendi kendini
 * yonlendiren bir dongu olurdu. Kontrol `(panel)/layout.tsx` icinde,
 * korunan her sayfanin ustunde.
 *
 * PANELDE TEK YAZI TIPI: Inter.
 *
 * Sitenin yazi tipleri (Bricolage + Schibsted) burada KULLANILMIYOR.
 * Marka yazi tipi bir pazarlama sayfasinda karakter katar; gunde
 * saatlerce bakilan bir tablo ekraninda istenen sey karakter degil
 * NOTRLUK — rakamlarin ayni genislikte hizalanmasi, kucuk puntoda
 * kirilmamasi. Inter degisken agirlikli tek bir dosya (48 KB) ve
 * sitedeki fontlarla ayni yolla kendi sunucumuzdan gidiyor.
 */
const inter = localFont({
  src: '../fonts/inter-latin-wght-normal.woff2',
  variable: '--font-ui-src',
  display: 'swap',
  weight: '100 900',
});

const interDisplay = localFont({
  src: '../fonts/inter-latin-wght-normal.woff2',
  variable: '--font-display-src',
  display: 'swap',
  weight: '100 900',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Havre — internal',
  // Panel hicbir arama motorunda gorunmemeli; robots.txt zaten engelliyor,
  // bu ikinci kilit (yanlis yapilandirilmis bir vekil sunucu icin).
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${interDisplay.variable}`}>
      <body className="a-body">{children}</body>
    </html>
  );
}
