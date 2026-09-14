'use client';

import { useEffect } from 'react';

/**
 * ACIK MENUYU KAPATAN TEK PARCA.
 *
 * Baslik menuleri <details>/<summary> uzerine kurulu — JS'siz de acilip
 * kapaniyor, klavye ve ekran okuyucu davranisi tarayicidan geliyor. Ama
 * <details> bir MENU degil, bir aciklama kutusu: tarayici disariya
 * tiklandiginda ya da Escape'e basildiginda KAPATMAZ. Kullanici menuyu
 * acip baska bir yere tikliyor, menu acik kaliyordu.
 *
 * Bu bilesen o eksigi kapatiyor ve BASKA HICBIR SEY YAPMIYOR: acma/kapama
 * hala tarayicinin isi, burada yalnizca uc olay dinleniyor.
 *   • disariya isaretci basisi
 *   • Escape (odak menunun basligina geri veriliyor)
 *   • menunun icindeki bir baglantiya tiklama (Next istemci gezinmesi
 *     sayfayi yeniden kurmadigi icin menu aksi halde acik kalirdi)
 *
 * pointerdown, click'ten ONCE gelir: menu, tiklanan seyin kendi olayi
 * calismadan once kapanir, dolayisiyla altta kalan bir dugmeye basmak
 * "once kapat, sonra tekrar tikla" gerektirmez.
 */
const OPEN = 'details.nav-menu[open], details.nav-drawer[open]';
const ANY = 'details.nav-menu, details.nav-drawer';

export function NavDismiss() {
  useEffect(() => {
    const openMenus = () => Array.from(document.querySelectorAll<HTMLDetailsElement>(OPEN));

    const closeAll = (except?: Element | null) => {
      for (const d of openMenus()) if (d !== except) d.open = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      // Tiklanan oge bir menunun icindeyse o menu acik kalir, digerleri kapanir
      closeAll(target?.closest?.(ANY) ?? null);
    };

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.('a');
      if (link && link.closest(ANY)) closeAll();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const [first] = openMenus();
      if (!first) return;
      closeAll();
      // WCAG 2.1.2: Escape ile kapatinca odak kaybolmamali, basliga donmeli
      first.querySelector('summary')?.focus();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return null;
}
