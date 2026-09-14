import Link from 'next/link';
import { requireAdmin, auditView, one, day, ago } from '@/lib/admin';
import { listUsers, type UserFilter } from '@/lib/data';
import { Page, Badge, Empty } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

const FILTERS: Array<{ key: UserFilter; label: string }> = [
  { key: 'all', label: 'Everyone' },
  { key: 'owners', label: 'Owners' },
  { key: 'sitters', label: 'Sitters' },
  { key: 'admins', label: 'Admins' },
  { key: 'suspended', label: 'Suspended' },
];

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; filter?: string | string[]; page?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;

  const q = (one(sp.q) ?? '').slice(0, 100);
  const filter = FILTERS.find((f) => f.key === one(sp.filter))?.key ?? 'all';
  const page = Math.max(1, Number(one(sp.page) ?? 1) || 1);

  const { rows, total } = await listUsers({ q, filter, page });
  // Kullanici listesi kisisel veri: kimin actigi kayda geciyor
  await auditView(session.user.id, 'users', q || filter);

  const pages = Math.ceil(total / 50);
  const keep = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (filter !== 'all') p.set('filter', filter);
    for (const [k, v] of Object.entries(extra)) p.set(k, v);
    const s = p.toString();
    return s ? `?${s}` : '';
  };

  return (
    <Page
      title="Users"
      lead="Everyone with an account. Search by email or name. Passwords, sessions and SIN are never shown here."
    >
      {/* JS'siz arama: GET formu. Panelde tarayici gerektiren tek sey
          kalmasin diye her filtre bir adres. */}
      <form method="get" className="a-row" style={{ marginBottom: 12 }}>
        {filter !== 'all' && <input type="hidden" name="filter" value={filter} />}
        <input
          className="a-input" name="q" defaultValue={q} placeholder="Email or name…"
          style={{ maxWidth: 280 }} aria-label="Search users"
        />
        <button type="submit" className="a-btn a-btn-ghost">Search</button>
        {q && <Link href={keep({})} className="a-chip">Clear “{q}”</Link>}
      </form>

      <div className="a-chips">
        {FILTERS.map((f) => {
          const p = new URLSearchParams();
          if (q) p.set('q', q);
          if (f.key !== 'all') p.set('filter', f.key);
          const href = p.toString() ? `?${p}` : '?';
          return (
            <Link key={f.key} href={href} className={`a-chip${f.key === filter ? ' is-on' : ''}`}>
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Empty>{q ? `Nobody matches “${q}”.` : 'No users in this view.'}</Empty>
      ) : (
        <>
          <div className="a-tablewrap" tabIndex={0}>
            <table className="a-table">
              <thead>
                <tr>
                  <th scope="col">Person</th>
                  <th scope="col">Role</th>
                  <th scope="col">Sitter</th>
                  <th scope="col">City</th>
                  <th scope="col" className="a-right">Bookings</th>
                  <th scope="col">Joined</th>
                  <th scope="col">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <Link href={`/admin/users/${u.id}/`} style={{ fontWeight: 600 }}>
                        {u.name || u.email}
                      </Link>
                      {u.name && <span className="a-dim"> · {u.email}</span>}
                      {u.suspended && <> <Badge value="suspended" /></>}
                    </td>
                    <td><Badge value={u.role} /></td>
                    <td>{u.sitterStatus ? <Badge value={u.sitterStatus} /> : <span className="a-dim">—</span>}</td>
                    <td className="a-sec">{u.cityName ?? '—'}</td>
                    <td className="a-right a-num">{u.bookingCount}</td>
                    <td className="a-num a-dim">{day(u.createdAt)}</td>
                    <td className="a-dim">{u.lastActiveAt ? ago(u.lastActiveAt) : 'never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="a-row" style={{ marginTop: 12, justifyContent: 'space-between' }}>
            <p className="a-dim">
              {total} match{total === 1 ? '' : 'es'} · page {page} of {Math.max(1, pages)}
            </p>
            <div className="a-row">
              {page > 1 && (
                <Link href={keep({ page: String(page - 1) })} className="a-chip">← Previous</Link>
              )}
              {page < pages && (
                <Link href={keep({ page: String(page + 1) })} className="a-chip">Next →</Link>
              )}
            </div>
          </div>
        </>
      )}
    </Page>
  );
}
