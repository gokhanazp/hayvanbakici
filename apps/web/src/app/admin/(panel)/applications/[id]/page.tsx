import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin, auditView, money, day, stamp, isUuid } from '@/lib/admin';
import { getApplication } from '@/lib/data';
import { Page, Card, Badge, Empty } from '@/components/admin/ui';
import { ReasonAction } from '@/components/admin/ReasonAction';
import { decideApplicationAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Waiting for a decision',
  active: 'Approved — sitter is live',
  deactivated: 'Refused or removed',
  paused: 'Paused',
  draft: 'Draft — not submitted',
};

export default async function ApplicationDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;
  /* Bozuk bicimli kimlik 500 degil 404 — bkz. lib/admin.ts */
  if (!isUuid(id)) notFound();

  const app = await getApplication(id);
  if (!app) notFound();
  await auditView(session.user.id, 'sitter', id);

  return (
    <Page title={`${app.firstName} ${app.lastNameInitial}.`} lead={app.email}>
      <p style={{ marginBottom: 14 }}>
        <Link href="/admin/applications/" className="a-dim">← All applications</Link>
        {' · '}
        <Link href={`/admin/users/${app.userId}/`} className="a-dim">Full account</Link>
      </p>

      <div className="a-split">
        <div className="a-grid">
          <Card title="Application">
            <dl className="a-def">
              <div><dt>Status</dt><dd>{STATUS_LABEL[app.status] ?? app.status}</dd></div>
              <div><dt>Submitted</dt><dd className="a-num">{day(app.submittedAt)}</dd></div>
              <div><dt>Where</dt><dd>{[app.neighbourhood, app.cityName, app.province].filter(Boolean).join(', ') || '—'}</dd></div>
              <div><dt>Born</dt><dd className="a-num">{app.dateOfBirthYear ?? '—'}</dd></div>
            </dl>
            {app.bio && <p className="a-sec" style={{ marginTop: 14, whiteSpace: 'pre-wrap' }}>{app.bio}</p>}
          </Card>

          <Card title="Checks">
            {app.verifications.length === 0 ? <Empty>No checks recorded yet.</Empty> : (
              <ul style={{ display: 'grid', gap: 6 }}>
                {app.verifications.map((v) => (
                  <li key={v.type} className="a-row" style={{ justifyContent: 'space-between' }}>
                    <span className="a-sec">{v.type}</span>
                    <Badge value={v.status} />
                  </li>
                ))}
              </ul>
            )}
            {/*
              Rapor icerigi burada YOK ve olmayacak: yalnizca karar
              saklaniyor. "Neden isaretlendi" sorusunun cevabi saglayicinin
              portalinda; o veriyi biz tutmuyoruz.
            */}
            <p className="a-hint" style={{ marginTop: 12 }}>
              We store the outcome only — never the contents of a background check report.
            </p>
          </Card>

          {app.services.length > 0 && (
            <Card title="Services offered">
              <ul style={{ display: 'grid', gap: 6 }}>
                {app.services.map((s) => (
                  <li key={s.serviceType} className="a-row" style={{ justifyContent: 'space-between' }}>
                    <span className="a-sec">{s.serviceType.replace(/_/g, ' ')}</span>
                    <span className="a-num">{money(s.priceCents)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {app.decisions.length > 0 && (
            <Card title="Automated decision record" hint="Law 25 s.12.1 — what was decided and whether a person reviewed it">
              <ul className="a-timeline">
                {app.decisions.map((d) => (
                  <li key={d.at}>
                    <time>{stamp(d.at)}</time>
                    <span>
                      {d.type}: <Badge value={d.outcome} />
                      {d.humanOutcome && <> · reviewed by a person: <Badge value={d.humanOutcome} /></>}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {app.consents.length > 0 && (
            <Card title="Consent record" hint="What was agreed to, and when">
              <ul className="a-timeline">
                {app.consents.map((c) => (
                  <li key={`${c.purpose}-${c.at}`}>
                    <time>{stamp(c.at)}</time>
                    <span>{c.purpose} · {c.granted ? 'granted' : 'refused'}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="a-grid">
          <Card title="Decision" hint="A person decides. Nothing here is automatic.">
            <ReasonAction
              action={decideApplicationAction}
              hidden={{ userId: app.userId }}
              label="Reason (required to refuse)"
              hint="Kept with the decision and disclosed to the applicant on request."
              buttons={[
                { value: 'approve', label: 'Approve', requireReason: false, done: 'Approved. The sitter is now live.' },
                { value: 'reject', label: 'Refuse', tone: 'danger', done: 'Refused, with the reason on record.' },
              ]}
              done={app.status !== 'pending' ? 'Already decided.' : undefined}
              {...(app.deactivationReason ? { doneNote: `Reason: ${app.deactivationReason}` } : {})}
            />
          </Card>

          <Card title="Not shown here">
            <ul style={{ display: 'grid', gap: 4 }} className="a-sec">
              <li>Exact address {app.hasExactAddress ? '· on file' : '· not given yet'}</li>
              <li>SIN {app.hasSin ? '· on file, encrypted' : '· not collected yet'}</li>
              <li>Background check report contents · never stored</li>
            </ul>
            <p className="a-hint" style={{ marginTop: 10 }}>
              Opening this page is written to the audit log.
            </p>
          </Card>
        </div>
      </div>
    </Page>
  );
}
