import Link from 'next/link';
import { requireAdmin, auditView, one, money, day } from '@/lib/admin';
import { countAllBookings, listAllBookings } from '@/lib/data';
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

/** Bir sayfada kac satir. */
const PER_PAGE = 50;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[]; q?: string | string[]; page?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const raw = one(sp.status);
  const status = FILTERS.find((f) => f === raw);
  const q = (one(sp.q) ?? '').trim().slice(0, 80);

  /*
    ARAMA VE SAYFALAMA — DUZELTILEN EKSIK.
    1770 rezervasyonun 100'u goruluyordu ve baska hicbir yol yoktu;
    destek "400. rezervasyona bak" dendiginde bulamiyordu.
  */
  const total = await countAllBookings(status, q || undefined);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1));

  const rows = await listAllBookings(status, q || undefined, PER_PAGE, (page - 1) * PER_PAGE);
  await auditView(session.user.id, 'bookings', status);

  /** Filtre + arama korunarak sayfa degistiren adres. */
  const at = (n: number) => {
    const p = new URLSearchParams();
    if (status) p.set('status', status);
    if (q) p.set('q', q);
    if (n > 1) p.set('page', String(n));
    const s2 = p.toString();
    return s2 ? `?${s2}` : '?';
  };

  return (
    <Page
      title="Bookings"
      lead="Every booking on the platform, newest first. Amounts are what the owner was quoted — Havre is not collecting payments yet."
    >
      {/* JS'siz arama: GET formu — panelin her yerinde ayni desen. */}
      <form method="get" className="a-row" style={{ marginBottom: 12 }}>
        {status && <input type="hidden" name="status" value={status} />}
        <input
          className="a-input" name="q" defaultValue={q}
          placeholder="Booking id, name or email…"
          style={{ maxWidth: 300 }} aria-label="Search bookings"
        />
        <button type="submit" className="a-btn a-btn-ghost">Search</button>
        {q && <Link href={status ? `?status=${status}` : '?'} className="a-chip">Clear “{q}”</Link>}
      </form>

      <div className="a-chips">
        <Link href={q ? `?q=${encodeURIComponent(q)}` : '?'} className={`a-chip${status ? '' : ' is-on'}`}>All</Link>
        {FILTERS.map((f) => {
          const p = new URLSearchParams({ status: f });
          if (q) p.set('q', q);
          return (
            <Link key={f} href={`?${p.toString()}`} className={`a-chip${status === f ? ' is-on' : ''}`}>
              {f.replace(/_/g, ' ')}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Empty>
          {q ? `Nothing matches “${q}”.`
            : status ? 'No bookings with this status.' : 'No bookings yet.'}
        </Empty>
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
          <div className="a-pager">
            <span className="a-hint">
              {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
            </span>
            <span className="a-pager-links">
              {page > 1 && <Link href={at(page - 1)} className="a-chip">Newer</Link>}
              {page < pages && <Link href={at(page + 1)} className="a-chip">Older</Link>}
            </span>
          </div>
        </>
      )}
    </Page>
  );
}
