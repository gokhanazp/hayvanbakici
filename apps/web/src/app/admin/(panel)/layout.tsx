import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/admin';
import { getAdminCounts } from '@/lib/data';
import { AdminNav } from '@/components/admin/AdminNav';

/**
 * KORUNAN EKRANLARIN CERCEVESI.
 *
 * `(panel)` bir ROTA GRUBU: adreste gorunmez, yani /admin/users hala
 * /admin/users. Var olma sebebi tek: yetki duvarini giris ekraninin
 * DISINDA tutmak. Giris ekrani bir ust duzende yasiyor; kontrol orada
 * olsaydi giris ekrani kendi kendini yonlendirirdi.
 *
 * Yetki kontrolu BURADA ve ayrica her sayfada. Tekrar gibi gorunuyor ama
 * degil: duzen GORUNURLUK icin (menu bile cizilmesin), sayfadaki kontrol
 * o sayfanin kendi kapisi. Bir gun biri yeni bir sayfayi yanlis yere
 * koyarsa, sayfanin kendi kontrolu onu yine de korur.
 */
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();
  const counts = await getAdminCounts();

  return (
    <>
      <a href="#a-main" className="a-skip">Skip to content</a>
      <div className="a-shell">
        <AdminNav counts={counts} email={session.user.email} />
        <div className="a-main" id="a-main">{children}</div>
      </div>
    </>
  );
}
