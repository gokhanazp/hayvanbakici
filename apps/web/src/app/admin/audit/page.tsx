import Link from 'next/link';
import { requireAdmin, auditView, one, stamp } from '@/lib/admin';
import { listAudit } from '@/lib/data';
import { Page, Empty, ShortId } from '@/components/admin/ui';

export const dynamic = 'force-dynamic';

/**
 * DENETIM KAYDI.
 *
 * Panelin en onemli sayfasi: diger ekranlarda yapilan her sey buraya
 * dusuyor. Law 25 ve PIPEDA "gerektigi kadar erisim" bekliyor; bunun tek
 * kaniti kimin neye ne zaman baktigidir.
 *
 * Bu sayfayi acmak da bir kayit uretiyor. Denetim kaydini okuyanin
 * kayitsiz kalmasi, kaydin amacini bosa cikarirdi.
 *
 * Kayitlar SILINEMEZ ve buradan duzenlenemez; yalnizca okunur.
 */
const LABEL: Record<string, string> = {
  'sitter.approve': 'Approved a sitter',
  'sitter.reject': 'Refused a sitter',
  'user.suspend': 'Suspended an account',
  'user.restore': 'Lifted a suspension',
  'user.role': 'Changed a role',
  'review.hide': 'Hid a review',
  'review.restore': 'Put a review back',
  'report.resolve': 'Closed a report',
  'booking.override': 'Changed a booking',
  'admin.view': 'Opened a list or record',
};

const HREF: Record<string, (id: string) => string> = {
  user: (id) => `/admin/users/${id}/`,
  sitter: (id) => `/admin/applications/${id}/`,
  booking: (id) => `/admin/bookings/${id}/`,
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ only?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const decisionsOnly = one((await searchParams).only) === 'decisions';

  const rows = await listAudit(250, decisionsOnly ? 'decisions' : 'all');
  await auditView(session.user.id, 'audit_log');

  return (
    <Page
      title="Audit log"
      lead="Who did what, and when. Every decision and every sensitive view lands here — including opening this page. Entries cannot be edited or deleted."
    >
      <div className="a-chips">
        <Link href="?" className={`a-chip${decisionsOnly ? '' : ' is-on'}`}>Everything</Link>
        <Link href="?only=decisions" className={`a-chip${decisionsOnly ? ' is-on' : ''}`}>
          Decisions only
        </Link>
      </div>

      {rows.length === 0 ? (
        <Empty>Nothing recorded yet.</Empty>
      ) : (
        <>
          <div className="a-tablewrap" tabIndex={0}>
            <table className="a-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Who</th>
                  <th scope="col">What</th>
                  <th scope="col">On</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const link = r.entityId ? HREF[r.entity]?.(r.entityId) : undefined;
                  return (
                    <tr key={r.id}>
                      <td className="a-num a-dim">
                        <time dateTime={r.at}>{stamp(r.at)}</time>
                      </td>
                      <td>{r.actorName ?? <span className="a-dim">system</span>}</td>
                      <td className="wrap">
                        {LABEL[r.action] ?? r.action}
                        {r.reason && (
                          <span className="a-dim" style={{ display: 'block' }}>
                            Reason given: {r.reason}
                          </span>
                        )}
                      </td>
                      <td className="a-sec">
                        {r.entity}
                        {r.entityId && (
                          <> · {link
                            ? <Link href={link}><ShortId id={r.entityId} /></Link>
                            : <ShortId id={r.entityId} />}</>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="a-hint" style={{ marginTop: 10 }}>
            The 250 most recent entries. Identifiers are shortened on screen; the full record stays
            in the database.
          </p>
        </>
      )}
    </Page>
  );
}
