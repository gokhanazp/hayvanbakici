import Link from 'next/link';
import { requireAdmin, auditView, one, stamp, ago } from '@/lib/admin';
import { listReports } from '@/lib/data';
import { Page, Card, Badge, Empty, ShortId } from '@/components/admin/ui';
import { ReasonAction } from '@/components/admin/ReasonAction';
import { MessageReveal } from '@/components/admin/MessageReveal';
import { AdminForm } from '@/components/admin/AdminForm';
import { reportAction, newReportAction, revealMessageAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

/** Sikayet edilen sey nereye baglanir. */
function subjectLink(type: string, id: string): string | null {
  if (type === 'user') return `/admin/users/${id}/`;
  if (type === 'booking') return `/admin/bookings/${id}/`;
  if (type === 'review') return '/admin/reviews/';
  return null;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ all?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const showAll = one((await searchParams).all) === '1';

  const rows = await listReports(showAll ? 'all' : 'open');
  await auditView(session.user.id, 'reports');

  return (
    <Page
      title="Reports"
      lead="Complaints about a person, a review, a message or a booking. Oldest first — a complaint left open is worse than one that was looked at and dismissed."
    >
      <div className="a-chips">
        <Link href="?" className={`a-chip${showAll ? '' : ' is-on'}`}>Open</Link>
        <Link href="?all=1" className={`a-chip${showAll ? ' is-on' : ''}`}>Everything</Link>
      </div>

      <div className="a-split">
        <div className="a-grid">
          {rows.length === 0 ? (
            <Empty>
              {showAll ? 'No reports have been filed.' : 'Nothing open.'}
            </Empty>
          ) : rows.map((r) => {
            const href = subjectLink(r.subjectType, r.subjectId);
            const closed = r.status === 'actioned' || r.status === 'dismissed';
            return (
              <Card key={r.id}>
                <div className="a-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="a-row" style={{ gap: 6 }}>
                    <Badge value={r.status} />
                    <span className="a-sec">about a {r.subjectType}</span>
                    {href ? <Link href={href}>open it ↗</Link> : <ShortId id={r.subjectId} />}
                  </span>
                  <span className="a-dim">{ago(r.createdAt)}</span>
                </div>

                <p style={{ fontWeight: 600 }}>{r.reason}</p>
                {r.details && (
                  <p className="a-sec" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{r.details}</p>
                )}
                <p className="a-hint" style={{ marginTop: 6 }}>
                  Filed by {r.reporterName ?? 'unknown'} · {stamp(r.createdAt)}
                  {r.subjectUserName && <> · about {r.subjectUserName}</>}
                </p>

                {/*
                  Sikayet bir MESAJ hakkindaysa, mesaji buradan acabiliyoruz.
                  Kapatilmis sikayette de duruyor: karari sonradan sorgulayan
                  kisinin ayni metne bakabilmesi gerekiyor.
                */}
                {r.subjectType === 'message' && (
                  <MessageReveal reportId={r.id} messageId={r.subjectId}
                                 action={revealMessageAction} />
                )}

                {closed ? (
                  <p className="a-note" style={{ marginTop: 10 }}>
                    {r.status === 'actioned' ? 'Actioned' : 'Dismissed'} by {r.handledByName ?? 'unknown'}
                    {r.handledAt && <> · {stamp(r.handledAt)}</>}
                    {r.resolution && <> — {r.resolution}</>}
                  </p>
                ) : (
                  <div style={{ marginTop: 12 }}>
                    <ReasonAction
                      action={reportAction}
                      hidden={{ reportId: r.id }}
                      collapse
                      collapseLabel="Handle this report"
                      label="What was done (required to close)"
                      hint="“Dismissed” is also an outcome — say why, so the next person reading this knows it was actually looked at."
                      buttons={[
                        { value: 'actioned', label: 'Close — action taken', done: 'Closed.' },
                        { value: 'dismissed', label: 'Close — no action', tone: 'ghost', done: 'Dismissed, with the reason on record.' },
                        { value: 'reviewing', label: 'Mark as looking into it', tone: 'ghost', requireReason: false, done: 'Marked as in review.' },
                      ]}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/*
          Bugun sikayet YALNIZCA buradan aciliyor: kullanici tarafindaki
          "bildir" dugmesi mesajlasma ile gelecek. Telefonla gelen bir
          sikayeti kayda gecirmenin baska yolu olmamali — not defterinde
          kalan sikayet, sikayet degildir.
        */}
        <Card title="File a report" hint="For a complaint that arrived by phone or email.">
          <AdminForm action={newReportAction} submitLabel="File report" busyLabel="Filing…">
            <label className="a-field">
              <span>About</span>
              <select name="subjectType" className="a-select" defaultValue="user">
                <option value="user">A person</option>
                <option value="booking">A booking</option>
                <option value="review">A review</option>
                <option value="message">A message</option>
              </select>
            </label>
            <label className="a-field">
              <span>Their id (copy it from the record)</span>
              <input className="a-input" name="subjectId" placeholder="00000000-0000-…" />
            </label>
            <label className="a-field">
              <span>Reason</span>
              <input className="a-input" name="reason" placeholder="Asked to pay outside Havre" />
            </label>
            <label className="a-field">
              <span>Details</span>
              <textarea className="a-textarea" name="details" rows={3}
                        placeholder="What the caller said, in their words." />
            </label>
          </AdminForm>
        </Card>
      </div>
    </Page>
  );
}
