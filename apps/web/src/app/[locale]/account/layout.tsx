import type { ReactNode } from 'react';
import type { Metadata } from 'next';

/**
 * HESAP BOLUMU — kisiye ozel, arama motorlarina KAPALI.
 *
 * Giris/kayit ekranlari `(auth)` rota grubunda ve kendi duzenini
 * (solda form, sagda fotograf) kullaniyor. Rota grubu adresi
 * DEGISTIRMEZ: /account/sign-in hala /account/sign-in.
 *
 * Buradaki duzen hesap UYGULAMASI icin: rezervasyonlar, bakici paneli.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
