'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * SOL MENU.
 *
 * Istemci bileseni olmasinin tek sebebi `usePathname`: aktif satiri
 * isaretlemek icin. Veri almiyor, durum tutmuyor.
 *
 * BEKLEYEN IS SAYILARI MENUDE. Bir yonetici gunun basinda menuye bakar;
 * "3 basvuru, 2 sikayet bekliyor" bilgisi ancak ilk bakilan yerde ise
 * yarar. Gosterge panelini acmayi gerektiren bir uyari, uyari degildir.
 */
export interface AdminCounts {
  applications: number;
  reports: number;
  requestedBookings: number;
}

const ITEMS = [
  { href: '/admin/', label: 'Dashboard', exact: true },
  { href: '/admin/applications/', label: 'Applications', badge: 'applications' },
  { href: '/admin/users/', label: 'Users' },
  { href: '/admin/bookings/', label: 'Bookings', badge: 'requestedBookings' },
  { href: '/admin/reviews/', label: 'Reviews' },
  { href: '/admin/reports/', label: 'Reports', badge: 'reports' },
  { href: '/admin/audit/', label: 'Audit log' },
] as const;

export function AdminNav({ counts, email }: { counts: AdminCounts; email: string }) {
  const pathname = usePathname() ?? '/admin/';

  return (
    <nav className="a-side" aria-label="Admin sections">
      <p className="a-brand">havre <span>internal</span></p>

      {ITEMS.map((item) => {
        const active = item.href === '/admin/'
          ? pathname === '/admin' || pathname === '/admin/'
          : pathname.startsWith(item.href.slice(0, -1));
        const n = 'badge' in item ? counts[item.badge as keyof AdminCounts] : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`a-nav${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span>{item.label}</span>
            {n > 0 && <b aria-label={`${n} waiting`}>{n}</b>}
          </Link>
        );
      })}

      <div className="a-side-foot">
        <p>{email}</p>
        {/*
          Siteye donus baglantisi: panel siteden ayri bir uygulama gibi
          davraniyor, kapisi da acikca gorunmeli.
        */}
        <p style={{ marginTop: 6 }}>
          <Link href="/en/">← Back to the site</Link>
        </p>
      </div>
    </nav>
  );
}
