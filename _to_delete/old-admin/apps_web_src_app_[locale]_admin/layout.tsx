import type { ReactNode } from 'react';
import type { Metadata } from 'next';

/** Panel her zaman kisiye ozel ve arama motorlarina kapali. */
export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
