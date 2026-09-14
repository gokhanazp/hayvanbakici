import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin, auditView, money, day, stamp } from '@/lib/admin';
import { getBookingAdmin, listNotes } from '@/lib/data';
import { Page, Card, Badge, Empty, ShortId } from '@/components/admin/ui';
import { ReasonAction } from '@/components/admin/ReasonAction';
import { bookingAction, addNoteAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

/** Hangi durumdan hangi mudahaleler MUMKUN — durum makinesinin ozeti. */
function options(status: string) {
  switch (status) {
    case 'requested':
      return [
        { value: 'confirmed', label: 'Confirm for the sitter', done: 'Confirmed.' },
        { value: 'declined', label: 'Decline for the sitter', tone: 'ghost' as const, done: 'Declined.' },
        { value: 'cancelled', label: 'Cancel', tone: 'danger' as const, done: 'Cancelled.' },
      ];
    case 'confirmed':
    case 'in_progress':
      return [
        { value: 'completed', label: 'Mark completed', done: 'Marked completed.' },
        { value: 'cancelled', label: 'Cancel', tone: 'danger' as const, done: 'Cancelled.' },
      ];
    default:
      return [];
  }
}

export default async function AdminBookingDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdmin();
  const { id } = await params;

  const b = await getBookingAdmin(id);
  if (!b) notFound();
  const notes = await listNotes('booking', id);
  await auditView(session.user.id, 'booking', id);

  const acts = options(b.status);

  return (
    <Page
      title={`${b.serviceType.replace(/_/g, ' ')} · ${day(b.startAt)}`}
      lead={`${b.ownerName} → ${b.sitterName}`}
    >
      <p style={{ marginBottom: 14 }}>
        <Link href="/admin/bookings/" className="a-dim">← All bookings</Link>
        {' · '}<ShortId id={b.id} />
      </p>

      <div className="a-split">
        <div className="a-grid">
          <Card title="Booking">
            <dl className="a-def">
              <div><dt>Status</dt><dd><Badge value={b.status} /></dd></div>
              <div><dt>Dates</dt><dd className="a-num">{day(b.startAt)} → {day(b.endAt)}</dd></div>
              <div><dt>Units</dt><dd className="a-num">{b.units}</dd></div>
              <div><dt>Pets</dt><dd className="a-num">{b.petCount}</dd></div>
              <div><dt>Requested</dt><dd className="a-num">{day(b.createdAt)}</dd></div>
              <div><dt>Answer due</dt><dd className="a-num">{b.expiresAt ? stamp(b.expiresAt) : '—'}</dd></div>
              <div><dt>Province</dt><dd>{b.province}</dd></div>
              <div><dt>Cancellation</dt><dd>{b.cancellationPolicy}</dd></div>
            </dl>
            <p className="a-hint" style={{ marginTop: 12 }}>
              The owner’s special instructions and any messages are not shown here.
            </p>
          </Card>

          <Card title="People">
            <div className="a-grid a-grid-2">
              <div>
                <p className="a-dim" style={{ fontSize: 11 }}>OWNER</p>
                <p><Link href={`/admin/users/${b.ownerId}/`} style={{ fontWeight: 600 }}>{b.ownerName}</Link></p>
                <p className="a-dim">{b.ownerEmail}</p>
              </div>
              <div>
                <p className="a-dim" style={{ fontSize: 11 }}>SITTER</p>
                <p><Link href={`/admin/users/${b.sitterId}/`} style={{ fontWeight: 600 }}>{b.sitterName}</Link></p>
                <p className="a-dim">{b.sitterEmail}</p>
              </div>
            </div>
          </Card>

          {/*
            FIYAT DOKUMU KALEM KALEM. Competition Act'in drip pricing
            yasagi musteriye gosterilen ekran icin gecerli; ama destek
            ekibi de "toplam neden bu" sorusuna bakmadan cevap verememeli.
          */}
          <Card title="What was quoted" hint="Frozen at request time — later price changes do not move it">
            <table className="a-table" style={{ border: 0 }}>
              <tbody>
                <tr>
                  <td>Base · {money(b.unitPriceCents)} × {b.units}</td>
                  <td className="a-right a-num">{money(b.baseCents)}</td>
                </tr>
                {b.extraPetCents > 0 && (
                  <tr><td>Extra pets</td><td className="a-right a-num">{money(b.extraPetCents)}</td></tr>
                )}
                {b.holidayCents > 0 && (
                  <tr><td>Holiday surcharge</td><td className="a-right a-num">{money(b.holidayCents)}</td></tr>
                )}
                <tr><td>Subtotal</td><td className="a-right a-num">{money(b.subtotalCents)}</td></tr>
                <tr><td>Service fee</td><td className="a-right a-num">{money(b.ownerFeeCents)}</td></tr>
                <tr><td>Tax</td><td className="a-right a-num">{money(b.ownerTaxCents)}</td></tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Owner pays</td>
                  <td className="a-right a-num" style={{ fontWeight: 700 }}>{money(b.ownerTotalCents)}</td>
                </tr>
                <tr>
                  <td className="a-dim">
                    Sitter commission · {b.sitterCommissionPct}% ({b.attribution.replace(/_/g, ' ')})
                  </td>
                  <td className="a-right a-num a-dim">−{money(b.sitterCommissionCents)}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Sitter receives</td>
                  <td className="a-right a-num" style={{ fontWeight: 600 }}>{money(b.sitterPayoutCents)}</td>
                </tr>
              </tbody>
            </table>
          </Card>

          <Card title="Timeline" hint="Every status change, with who made it">
            {b.timeline.length === 0 ? <Empty>Nothing recorded.</Empty> : (
              <ul className="a-timeline">
                {b.timeline.map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    <time>{stamp(e.at)}</time>
                    <span>
                      {e.from ? `${e.from.replace(/_/g, ' ')} → ` : ''}
                      <strong>{e.to.replace(/_/g, ' ')}</strong>
                      {e.actorName && <span className="a-dim"> · {e.actorName}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="a-grid">
          <Card
            title="Support override"
            hint="Acting for one of the two people. The change is written to the timeline under your name, not as “system”."
          >
            {acts.length === 0 ? (
              <p className="a-sec">
                Nothing can be changed from this status. The booking state machine applies to
                admins too — a paid booking cannot be pushed back to a request.
              </p>
            ) : (
              <ReasonAction
                action={bookingAction}
                hidden={{ bookingId: b.id }}
                label="Why (required)"
                hint="Both people can be told this. Write what actually happened."
                buttons={acts}
              />
            )}
          </Card>

          <Card title="Internal notes" hint="Never shown to the owner or the sitter.">
            <form action={addNoteAction}>
              <input type="hidden" name="entityType" value="booking" />
              <input type="hidden" name="entityId" value={b.id} />
              <label className="a-field">
                <span>Note</span>
                <textarea className="a-textarea" name="body" rows={2}
                          placeholder="Owner called, sitter’s flight was delayed." />
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
