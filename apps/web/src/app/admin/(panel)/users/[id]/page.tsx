import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin, auditView, money, day, stamp, isUuid } from '@/lib/admin';
import { getAdminUser, listNotes } from '@/lib/data';
import { Page, Card, Badge, Empty } from '@/components/admin/ui';
import { ReasonAction } from '@/components/admin/ReasonAction';
import { suspensionAction, roleAction, addNoteAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

export default async function UserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  /* Bozuk bicimli kimlik 500 degil 404 — bkz. lib/admin.ts */
  if (!isUuid(id)) notFound();

  const user = await getAdminUser(id);
  if (!user) notFound();
  const notes = await listNotes('user', id);
  // Tek bir kisinin dosyasini acmak: en hassas okuma, kayda geciyor
  await auditView(session.user.id, 'user', id);

  return (
    <Page
      title={user.name || user.email}
      lead={user.name ? user.email : undefined}
    >
      <p style={{ marginBottom: 14 }}>
        <Link href="/admin/users/" className="a-dim">← All users</Link>
      </p>

      {user.suspended && (
        <p className="a-alert" role="status" style={{ marginBottom: 14 }}>
          <strong>Account suspended.</strong> {user.suspensionReason}
        </p>
      )}

      <div className="a-split">
        <div className="a-grid">
          <Card title="Account">
            <dl className="a-def">
              <div><dt>Role</dt><dd><Badge value={user.role} /></dd></div>
              <div><dt>Email verified</dt><dd>{user.emailVerified ? 'Yes' : 'No'}</dd></div>
              <div><dt>Phone on file</dt><dd>{user.phoneKnown ? 'Yes' : 'No'}</dd></div>
              <div><dt>Language</dt><dd>{user.locale}</dd></div>
              <div><dt>Joined</dt><dd className="a-num">{day(user.createdAt)}</dd></div>
              <div><dt>Last seen</dt><dd className="a-num">{user.lastActiveAt ? day(user.lastActiveAt) : '—'}</dd></div>
              <div><dt>Where</dt><dd>{[user.neighbourhood, user.cityName, user.province].filter(Boolean).join(', ') || '—'}</dd></div>
              <div><dt>Reports against</dt><dd className="a-num">{user.reportsAgainst}</dd></div>
            </dl>
            {/*
              Bu kutuda GORUNMEYENLER ekranda yaziyor. Bir yoneticinin
              "bakabilir miyim" diye sormasi gereken seyi, sistemin
              bastan soylemesi daha durust.
            */}
            <p className="a-hint" style={{ marginTop: 12 }}>
              Not shown: password, sessions, SIN, exact address, message contents.
              Opening this page is written to the audit log.
            </p>
          </Card>

          {user.sitterStatus && (
            <Card title="Sitter">
              <dl className="a-def">
                <div><dt>Status</dt><dd><Badge value={user.sitterStatus} /></dd></div>
                <div><dt>Rating</dt><dd className="a-num">
                  {user.reviewCount > 0 ? `${user.averageRating} (${user.reviewCount})` : 'no reviews'}
                </dd></div>
                <div><dt>Slug</dt><dd className="a-num a-dim">{user.sitterSlug ?? '—'}</dd></div>
              </dl>
              {user.bio && <p className="a-sec" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{user.bio}</p>}
              {user.services.length > 0 && (
                <ul style={{ marginTop: 12, display: 'grid', gap: 4 }}>
                  {user.services.map((s) => (
                    <li key={s.serviceType} className="a-row" style={{ justifyContent: 'space-between' }}>
                      <span className="a-sec">{s.serviceType.replace(/_/g, ' ')}</span>
                      <span className="a-num">{money(s.priceCents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          <Card title="Recent bookings" hint="Newest 20, as owner or as sitter">
            {user.recentBookings.length === 0 ? <Empty>No bookings.</Empty> : (
              <div className="a-tablewrap" tabIndex={0} style={{ maxHeight: '40vh' }}>
                <table className="a-table">
                  <thead>
                    <tr>
                      <th scope="col">Starts</th>
                      <th scope="col">As</th>
                      <th scope="col">With</th>
                      <th scope="col">Service</th>
                      <th scope="col">Status</th>
                      <th scope="col" className="a-right">Owner pays</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.recentBookings.map((b) => (
                      <tr key={b.id}>
                        <td className="a-num">
                          <Link href={`/admin/bookings/${b.id}/`}>{day(b.startAt)}</Link>
                        </td>
                        <td className="a-sec">{b.role}</td>
                        <td>{b.counterpart}</td>
                        <td className="a-sec">{b.serviceType.replace(/_/g, ' ')}</td>
                        <td><Badge value={b.status} /></td>
                        <td className="a-right a-num">{money(b.ownerTotalCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="a-grid">
          <Card
            title={user.suspended ? 'Lift the suspension' : 'Suspend this account'}
            hint={user.suspended
              ? 'The account can sign in and book again. A sitter profile goes back to what it was.'
              : 'They can still sign in, but cannot book, and a sitter profile disappears from the site.'}
          >
            <ReasonAction
              action={suspensionAction}
              hidden={{ userId: user.id }}
              label="Reason (required)"
              hint="Kept on the record and disclosed to the person on request."
              buttons={user.suspended
                ? [{ value: 'restore', label: 'Lift suspension', tone: 'primary', done: 'Suspension lifted.' }]
                : [{ value: 'suspend', label: 'Suspend account', tone: 'danger', done: 'Account suspended.' }]}
              doneNote="Reload to see the updated record."
            />
          </Card>

          <Card
            title="Role"
            hint="Admins see this panel and every decision in it. Grant it sparingly."
          >
            <ReasonAction
              action={roleAction}
              hidden={{ userId: user.id }}
              label="Why (required)"
              buttons={[
                ...(user.role !== 'admin'
                  ? [{ value: 'admin', label: 'Make admin', tone: 'danger' as const, done: 'Now an admin.' }]
                  : [{ value: 'owner', label: 'Remove admin', tone: 'danger' as const, done: 'Admin removed.' }]),
              ]}
            />
            <p className="a-hint" style={{ marginTop: 8 }}>
              You cannot change your own role, and the last admin cannot be removed.
            </p>
          </Card>

          <Card title="Internal notes" hint="The person never sees these. Notes cannot be edited or deleted.">
            <form action={addNoteAction}>
              <input type="hidden" name="entityType" value="user" />
              <input type="hidden" name="entityId" value={user.id} />
              <label className="a-field">
                <span>Note</span>
                <textarea className="a-textarea" name="body" rows={2}
                          placeholder="Called about the document, will re-upload." />
              </label>
              <button type="submit" className="a-btn a-btn-ghost">Add note</button>
            </form>

            {notes.length > 0 && (
              <ul style={{ marginTop: 14, display: 'grid', gap: 10 }}>
                {notes.map((n) => (
                  <li key={n.id}>
                    <p className="a-sec" style={{ whiteSpace: 'pre-wrap' }}>{n.body}</p>
                    <p className="a-hint">{n.authorName ?? 'unknown'} · {stamp(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
