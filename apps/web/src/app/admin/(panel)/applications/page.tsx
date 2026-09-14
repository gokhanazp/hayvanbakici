import Link from 'next/link';
import { requireAdmin, auditView, one, day, ago } from '@/lib/admin';
import { listApplications } from '@/lib/data';
import { Page, Badge, Empty } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const showAll = one((await searchParams).all) === '1';

  const rows = await listApplications(showAll ? 'all' : 'pending');
  await auditView(session.user.id, 'sitter_applications');

  return (
    <Page
      title="Applications"
      lead="Oldest first — a forgotten application is worse than a refused one. Refusing takes a written reason."
    >
      <div className="a-chips">
        <Link href="?" className={`a-chip${showAll ? '' : ' is-on'}`}>Waiting</Link>
        <Link href="?all=1" className={`a-chip${showAll ? ' is-on' : ''}`}>All</Link>
      </div>

      {rows.length === 0 ? (
        <Empty>Nothing waiting.</Empty>
      ) : (
        <div className="a-tablewrap" tabIndex={0}>
          <table className="a-table">
            <thead>
              <tr>
                <th scope="col">Applicant</th>
                <th scope="col">City</th>
                <th scope="col">Status</th>
                <th scope="col">Checks</th>
                <th scope="col">Applied</th>
                <th scope="col">Waiting</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.userId}>
                  <td>
                    <Link href={`/admin/applications/${a.userId}/`} style={{ fontWeight: 600 }}>
                      {a.firstName} {a.lastNameInitial}.
                    </Link>
                    <span className="a-dim"> · {a.email}</span>
                  </td>
                  <td className="a-sec">{a.cityName ?? '—'}</td>
                  <td><Badge value={a.status} /></td>
                  <td className="a-sec">
                    {a.verifications.length === 0
                      ? <span className="a-dim">no checks yet</span>
                      : a.verifications.map((v) => `${v.type}: ${v.status}`).join(' · ')}
                  </td>
                  <td className="a-num a-dim">{day(a.submittedAt)}</td>
                  {/* Bekleme SURESI ayri bir sutun: tarihten cikarma yapmak
                      zorunda kalan kimse "5 gundur bekliyor" demez. */}
                  <td>{a.status === 'pending' ? ago(a.submittedAt) : <span className="a-dim">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Page>
  );
}
