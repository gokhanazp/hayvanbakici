import { redirect } from 'next/navigation';

/**
 * Kok dizin -> varsayilan dil.
 * DIKKAT: IP tabanli otomatik yonlendirme YAPILMAZ (yol haritasi §7.2).
 * Bu yalnizca kok URL icin statik bir yonlendirmedir.
 */
export default function RootPage() {
  redirect('/en');
}
