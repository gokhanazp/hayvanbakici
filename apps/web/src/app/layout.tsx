import type { ReactNode } from 'react';

/**
 * KOK DUZEN — bilerek BOS.
 *
 * Altinda iki AYRI agac var ve her biri kendi <html>'ini, kendi fontlarini
 * ve kendi stil dosyasini yukluyor:
 *   [locale]/  → site (globals.css)
 *   admin/     → yonetici paneli (admin.css)
 *
 * Global CSS burada DEGIL: burada olsaydi panel, sitenin butun bilesen
 * siniflarini da indirirdi ve sitede bir dugmeyi degistirmek operasyon
 * ekranini bozabilirdi.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
