import Link from 'next/link';
import { requireAdmin, auditView, one, money, day } from '@/lib/admin';
import { listAllBookings } from '@/lib/data';
import { Page, Badge, Empty } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * Filtre degerleri BEYAZ LISTEDEN geciyor: listAllBookings gelen metni
 * booking_status'a cast ediyor ve adres cubugundan gelen uydurma bir deger
 * veritabani hatasi olurdu. Listede olmayan filtre yok sayilir.
 */
const FILTERS = [
  'requested', 'confirmed', 'in_progress', 'completed', 'payout_released',
  'declined', 'cancelled', 'expired',
] as const;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const raw = one((await searchParams).status);
  const status = FILTERS.find((f) => f === raw);

  const rows = await listAllBookings(status);
  await auditView(session.user.id, 'bookings', status);

  return (
    <Page
      title="Bookings"
      lead="Every booking on the platform, newest first. Amounts are what the owner was quoted — Havre is not collecting payments yet."
    >
      <div className="a-chips">
        <Link href="?" className={`a-chip${status ? '' : ' is-on'}`}>All</Link>
        {FILTERS.map((f) => (
          <Link key={f} href={`?status=${f}`} className={`a-chip${status === f ? ' is-on' : ''}`}>
            {f.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>{status ? 'No bookings with this status.' : 'No bookings yet.'}</Empty>
      ) : (
        <>
          <div className="a-tablewrap" tabIndex={0}>
            <table className="a-table">
              <thead>
                <tr>
                  <th scope="col">Requested</th>
                  <th scope="col">Service</th>
                  <th scope="col">Owner</th>
                  <th scope="col">Sitter</th>
                  <th scope="col">Starts</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="a-right">Owner pays</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="a-num a-dim">
                      <Link href={`/admin/bookings/${b.id}/`}>{day(b.createdAt)}</Link>
                    </td>
                    <td className="a-sec">{b.serviceType.replace(/_/g, ' ')}</td>
                    <td>{b.ownerName}</td>
                    <td>{b.sitterName}</td>
                    <td className="a-num">{day(b.startAt)}</td>
                    <td><Badge value={b.status} /></td>
                    <td className="a-right a-num" style={{ fontWeight: 600 }}>
                      {money(b.ownerTotalCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="a-hint" style={{ marginTop: 10 }}>Showing the 100 most recent.</p>
        </>
      )}
    </Page>
  );
}
