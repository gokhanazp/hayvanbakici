import type { ReactNode } from 'react';
import type { Metadata } from 'next';

/**
 * Hesap ekranlari ARAMA MOTORLARINA KAPALI.
 * Giris ve sifre sifirlama sayfalarinin indekslenmesinin hicbir faydasi yok;
 * ayrica jeton tasiyan URL'lerin (reset-password?token=...) taranmasi
 * guvenlik acisindan istenmeyen bir durum.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container auth-shell">
      <div className="auth-card">{children}</div>
    </div>
  );
}
