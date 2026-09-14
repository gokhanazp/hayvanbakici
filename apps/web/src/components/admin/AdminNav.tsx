'use client';

import { Fragment, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, type IconName } from './icons';

/**
 * SOL MENU.
 *
 * Istemci bileseni olmasinin iki sebebi var: aktif satiri isaretlemek
 * (`usePathname`) ve daraltma tercihini hatirlamak. Veri cekmiyor.
 *
 * BEKLEYEN IS SAYILARI MENUDE. Bir yonetici gunun basinda menuye bakar;
 * "3 basvuru, 2 sikayet bekliyor" bilgisi ancak ilk bakilan yerde ise
 * yarar. Gosterge panelini acmayi gerektiren bir uyari, uyari degildir.
 * Menu daraldiginda sayi, ikonun kosesinde bir noktaya donusuyor —
 * bekleyen is hicbir durumda gorunmez olmuyor.
 */
export interface AdminCounts {
  applications: number;
  reports: number;
  requestedBookings: number;
}

/**
 * Menu IKI BOLUME ayrildi. Duz bir yedi maddelik liste hepsini esit
 * onemde gosteriyordu; oysa ust grup gunluk isin yapildigi yer, alt grup
 * denetim.
 */
const GROUPS: ReadonlyArray<{
  label: string | null;
  items: ReadonlyArray<{ href: string; label: string; icon: IconName; badge?: keyof AdminCounts }>;
}> = [
  {
    label: null,
    items: [{ href: '/admin/', label: 'Dashboard', icon: 'dashboard' }],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/applications/', label: 'Applications', icon: 'applications', badge: 'applications' },
      { href: '/admin/users/', label: 'Users', icon: 'users' },
      { href: '/admin/bookings/', label: 'Bookings', icon: 'bookings', badge: 'requestedBookings' },
    ],
  },
  {
    label: 'Oversight',
    items: [
      { href: '/admin/reviews/', label: 'Reviews', icon: 'reviews' },
      { href: '/admin/reports/', label: 'Reports', icon: 'reports', badge: 'reports' },
      { href: '/admin/audit/', label: 'Audit log', icon: 'audit' },
    ],
  },
];

const STORE_KEY = 'havre.admin.nav';

export function AdminNav({ counts, email }: { counts: AdminCounts; email: string }) {
  const pathname = usePathname() ?? '/admin/';

  /*
    Daraltma tercihi TARAYICIDA saklaniyor, sunucuda degil: bu bir kisinin
    o bilgisayardaki goruntuleme tercihi, hesabinin bir ozelligi degil.

    Ilk cizim her zaman GENIS. Sunucunun bilemedigi bir degerle render
    etmek hydration uyusmazligi olurdu; tercih bagli olduktan sonra
    uygulaniyor.
  */
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORE_KEY) === 'collapsed');
    } catch { /* gizli sekme / kapali depolama: genis kalir */ }
  }, []);

  const toggle = () => {
    setCollapsed((was) => {
      const next = !was;
      try {
        window.localStorage.setItem(STORE_KEY, next ? 'collapsed' : 'wide');
      } catch { /* onemli degil */ }
      return next;
    });
  };

  return (
    <nav className={`a-side${collapsed ? ' is-narrow' : ''}`} aria-label="Admin sections">
      <div className="a-brand">
        <Link href="/admin/" className="a-brand-mark">
          havre<span>internal</span>
        </Link>
        <button
          type="button"
          className="a-collapse"
          onClick={toggle}
          aria-pressed={collapsed}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}
        >
          <Icon name={collapsed ? 'expand' : 'collapse'} />
          <span className="a-sr">{collapsed ? 'Expand menu' : 'Collapse menu'}</span>
        </button>
      </div>

      {GROUPS.map((group) => (
        <Fragment key={group.label ?? 'top'}>
          {group.label && <p className="a-navlabel">{group.label}</p>}
          {group.items.map((item) => {
            const active = item.href === '/admin/'
              ? pathname === '/admin' || pathname === '/admin/'
              : pathname.startsWith(item.href.slice(0, -1));
            const n = item.badge ? counts[item.badge] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`a-nav${active ? ' is-active' : ''}${n > 0 ? ' has-dot' : ''}`}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <span className="a-nav-icon"><Icon name={item.icon} /></span>
                <span className="a-nav-label">{item.label}</span>
                {n > 0 && <b>{n}</b>}
              </Link>
            );
          })}
        </Fragment>
      ))}

      <div className="a-side-foot">
        <p className="a-side-email" title={email}>{email}</p>
        {/* Siteye donus: panel ayri bir uygulama gibi davraniyor, kapisi
            da acikca gorunmeli. */}
        <Link href="/en/" className="a-nav a-nav-quiet">
          <span className="a-nav-icon"><Icon name="back" /></span>
          <span className="a-nav-label">Back to the site</span>
        </Link>
      </div>
    </nav>
  );
}
