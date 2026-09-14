import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@havre/tokens/css';
import './admin.css';
import { requireAdmin } from '@/lib/admin';
import { getAdminCounts } from '@/lib/data';
import { AdminNav } from '@/components/admin/AdminNav';

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
 *  3. Tema `data-theme="admin"`: notr arduvaz palet. Musterinin koyu
 *     temasindan ayri — gerekce packages/tokens/src/color.ts icinde.
 *
 * Yetki kontrolu BURADA: her alt sayfa ayrica requireAdmin cagiriyor
 * (duzen kontrolune guvenip sayfada atlamak, bir gun birinin unutmasiyla
 * acik kapi birakir), ama menunun bile cizilmemesi icin ilk kapi bu.
 */
const display = localFont({
  src: '../fonts/bricolage-grotesque-latin-wght-normal.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '200 800',
});

const ui = localFont({
  src: '../fonts/schibsted-grotesk-latin-wght-normal.woff2',
  variable: '--font-ui',
  display: 'swap',
  weight: '400 900',
});

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Havre — internal',
  // Panel hicbir arama motorunda gorunmemeli; robots.txt zaten engelliyor,
  // bu ikinci kilit (yanlis yapilandirilmis bir vekil sunucu icin).
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const counts = await getAdminCounts();

  return (
    <html lang="en" data-theme="admin" className={`${display.variable} ${ui.variable}`}>
      <body className="a-body">
        <a href="#a-main" className="a-btn a-btn-ghost" style={{
          position: 'absolute', left: -9999, top: 0,
        }}>Skip to content</a>
        <div className="a-shell">
          <AdminNav counts={counts} email={session.user.email} />
          <div className="a-main" id="a-main">{children}</div>
        </div>
      </body>
    </html>
  );
}
