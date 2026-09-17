import Link from 'next/link';
import { requireAdmin, auditView, one, day } from '@/lib/admin';
import { countReviews, listReviews, type ReviewFilter } from '@/lib/data';
import { Page, Card, Badge, Empty } from '@/components/admin/ui';
import { ReasonAction } from '@/components/admin/ReasonAction';
import { reviewAction } from '@/app/admin/actions';

export const dynamic = 'force-dynamic';

const FILTERS: Array<{ key: ReviewFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'reported', label: 'Reported' },
  { key: 'low', label: '1–2 stars' },
  { key: 'hidden', label: 'Hidden' },
  { key: 'published', label: 'Published' },
];

/** Bir sayfada kac kart. */
const PER_PAGE = 30;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[]; q?: string | string[]; page?: string | string[] }>;
}) {
  const session = await requireAdmin();
  const sp = await searchParams;
  const asked = one(sp.filter);
  const filter = FILTERS.find((f) => f.key === asked)?.key ?? 'reported';
  const q = (one(sp.q) ?? '').trim().slice(0, 80);

  /*
    ARAMA VE SAYFALAMA — DUZELTILEN EKSIK.
    1136 yorumun 60'i goruluyordu ve kesildigi EKRANDA YAZMIYORDU.
    Bir yorumu bulmanin baska yolu da yoktu.
  */
  const total = await countReviews(filter, q || undefined);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Number.parseInt(one(sp.page) ?? '1', 10) || 1));

  const rows = await listReviews(filter, PER_PAGE, q || undefined, (page - 1) * PER_PAGE);
  await auditView(session.user.id, 'reviews', filter);

  const at = (n: number, f: ReviewFilter = filter) => {
    const p = new URLSearchParams({ filter: f });
    if (q) p.set('q', q);
    if (n > 1) p.set('page', String(n));
    return `?${p.toString()}`;
  };

  return (
    <Page
      title="Reviews"
      lead="Moderation here means hiding, never editing. A review’s words are the reviewer’s — we can take one down with a reason, and that reason stays on the record."
    >
      <form method="get" className="a-row" style={{ marginBottom: 12 }}>
        <input type="hidden" name="filter" value={filter} />
        <input
          className="a-input" name="q" defaultValue={q}
          placeholder="Review text, name or email…"
          style={{ maxWidth: 300 }} aria-label="Search reviews"
        />
        <button type="submit" className="a-btn a-btn-ghost">Search</button>
        {q && <Link href={`?filter=${filter}`} className="a-chip">Clear “{q}”</Link>}
      </form>

      <div className="a-chips">
        {FILTERS.map((f) => (
          <Link key={f.key} href={at(1, f.key)} className={`a-chip${f.key === filter ? ' is-on' : ''}`}>
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>
          {q ? `Nothing matches “${q}”.` : filter === 'reported' ? (
            <>
              Nothing reported. The queue worth reading when nobody has complained is{' '}
              <Link href="?filter=low">the 1–2 star reviews</Link>.
            </>
          ) : 'Nothing in this view.'}
        </Empty>
      ) : (
        <div className="a-grid a-grid-cards">
          {rows.map((r) => (
            <Card key={r.id}>
              <div className="a-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <span>
                  <strong className="a-num">{'★'.repeat(r.rating)}</strong>
                  <span className="a-dim">{'★'.repeat(5 - r.rating)}</span>
                  <span className="a-dim"> · {r.rating}/5</span>
                </span>
                <span className="a-row" style={{ gap: 6 }}>
                  {r.reportCount > 0 && <Badge value="open" label={`${r.reportCount} reported`} />}
                  <Badge value={r.hiddenAt ? 'hidden' : r.publishedAt ? 'published' : 'pending'} />
                </span>
              </div>

              <p className="a-sec" style={{ whiteSpace: 'pre-wrap' }}>
                {r.body ?? <span className="a-dim">No text — rating only.</span>}
              </p>

              <p className="a-hint" style={{ marginTop: 8 }}>
                {r.authorName ?? 'unknown'} → {r.subjectName ?? 'unknown'} ·{' '}
                {r.direction.replace(/_/g, ' ')} · {day(r.createdAt)}
                {' · '}
                <Link href={`/admin/bookings/${r.bookingId}/`}>booking</Link>
              </p>

              {r.hiddenAt && (
                <p className="a-note" style={{ marginTop: 10 }}>
                  Hidden {day(r.hiddenAt)} — {r.hiddenReason}
                </p>
              )}

              <div style={{ marginTop: 12 }}>
                <ReasonAction
                  action={reviewAction}
                  hidden={{ reviewId: r.id }}
                  collapse
                  collapseLabel={r.hiddenAt ? 'Put back' : 'Hide this review'}
                  label={r.hiddenAt ? 'Why put it back (optional)' : 'Why hide it (required)'}
                  minLength={r.hiddenAt ? 0 : 10}
                  placeholder={r.hiddenAt
                    ? 'Optional.'
                    : 'e.g. contains another person’s phone number'}
                  buttons={r.hiddenAt
                    ? [{ value: 'restore', label: 'Put back', tone: 'ghost', requireReason: false, done: 'Back on the profile.' }]
                    : [{ value: 'hide', label: 'Hide', tone: 'danger', done: 'Hidden. The rating no longer counts.' }]}
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      {rows.length > 0 && (
        <div className="a-pager">
          <span className="a-hint">
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, total)} of {total}
          </span>
          <span className="a-pager-links">
            {page > 1 && <Link href={at(page - 1)} className="a-chip">Newer</Link>}
            {page < pages && <Link href={at(page + 1)} className="a-chip">Older</Link>}
          </span>
        </div>
      )}
    </Page>
  );
}
