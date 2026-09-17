import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, segmentFor } from '@havre/i18n';
import type { ServiceType } from '@havre/core';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { ReviewCard } from '@/components/ReviewInbox';
import { getReviewInbox, getSitterStatus, isAdmin, unreadCount } from '@/lib/data';
import { dayFmt } from '@/lib/format';
import { replyToReviewAction } from './actions';

export const dynamic = 'force-dynamic';

/**
 * YORUMLAR SAYFASI.
 *
 * Yanit verme yolu VARDI ama BULUNAMIYORDU: dugme yalnizca ilgili
 * rezervasyonun detay sayfasinda, yorum panelinin icindeydi. Yani once
 * yorumun HANGI rezervasyondan geldigini bilip o sayfayi acmak
 * gerekiyordu, ve hicbir ekran "hakkinizda yeni bir yorum var"
 * demiyordu. Bir hak, kullanilabilir oldugu kadar hak.
 *
 * SAYFA IKI ROL ICIN DE AYNI. Yorum iki yonlu: bakici hakkinda sahip,
 * sahip hakkinda bakici yaziyor. Ayri iki ekran yapmak ayni kodu iki
 * kez yazmak ve ikisinin zamanla birbirinden sapmasi demekti.
 */
export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/reviews/`);

  const m = getMessages(locale);
  const segment = segmentFor(locale);
  const [inbox, sitterStatus, admin, unread] = await Promise.all([
    getReviewInbox(session.user.id), getSitterStatus(session.user.id),
    isAdmin(session.user.id), unreadCount(session.user.id),
  ]);

  const bookingHref = (id: string) => `/${segment}/account/bookings/${id}/`;
  const nameOf = (first: string | null, initial: string | null) =>
    first ? `${first} ${initial ?? ''}.` : '—';

  return (
    <AccountShell
      locale={locale}
      title={m.review.pageTitle}
      lead={m.review.pageLead}
      active="reviews"
      isSitter={sitterStatus !== null}
      sitterStatus={sitterStatus}
      isAdmin={admin}
      unread={unread}
    >
      <div className="review-inbox">
        {/*
          YAZILACAKLAR EN USTTE ve suresi yaziyor: bu bolumun tek sebebi
          pencerenin KAPANIYOR olmasi. Okunacak bir sey degil, yapilacak
          bir sey.
        */}
        <section>
          <h2 className="text-h4 queue-head">
            {m.review.todoHeading}
            {inbox.todo.length > 0 && (
              <span className="queue-count tabular">{inbox.todo.length}</span>
            )}
          </h2>
          {inbox.todo.length === 0 ? (
            <p className="muted text-body-sm">{m.review.todoNone}</p>
          ) : (
            <ul className="gap-list">
              {inbox.todo.map((t) => (
                <li key={t.bookingId}>
                  <span>
                    {interpolate(m.review.todoLine, {
                      name: nameOf(t.counterpartFirstName, t.counterpartInitial),
                      service: m.service[t.serviceType as ServiceType],
                    })}
                    <span className="dim text-body-sm" style={{ display: 'block' }}>
                      {interpolate(m.review.todoCloses, {
                        date: dayFmt(t.windowClosesAt, locale),
                      })}
                    </span>
                  </span>
                  <Link href={bookingHref(t.bookingId)} className="btn btn-secondary btn-sm">
                    {m.review.todoCta}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* --- Hakkimda yazilanlar: yanit BURADA veriliyor --- */}
        <section>
          <h2 className="text-h4 queue-head">
            {m.review.aboutHeading}
            {inbox.about.length > 0 && (
              <span className="queue-count tabular">{inbox.about.length}</span>
            )}
          </h2>
          {inbox.awaitingResponse > 0 && (
            <div className="notice" style={{ marginBottom: 'var(--space-4)' }}>
              <p>
                {inbox.awaitingResponse === 1
                  ? m.review.awaitingOne
                  : interpolate(m.review.awaitingMany, { count: inbox.awaitingResponse })}
              </p>
            </div>
          )}
          {inbox.about.length === 0 ? (
            <p className="muted text-body-sm">{m.review.aboutNone}</p>
          ) : (
            <div className="grid" style={{ gap: 'var(--space-3)' }}>
              {inbox.about.map((r) => (
                <ReviewCard
                  key={r.reviewId}
                  locale={locale}
                  review={r}
                  publishedLabel={interpolate(m.review.published, {
                    date: dayFmt(r.publishedAt, locale),
                  })}
                  respondedLabel={
                    r.responseAt
                      ? interpolate(m.review.repliedOn, { date: dayFmt(r.responseAt, locale) })
                      : null
                  }
                  bookingHref={bookingHref(r.bookingId)}
                  action={replyToReviewAction}
                />
              ))}
            </div>
          )}
        </section>

        {/* --- Benim yazdiklarim: yayinlanmamis olanlar DA burada --- */}
        <section>
          <h2 className="text-h4 queue-head">
            {m.review.mineHeading}
            {inbox.mine.length > 0 && (
              <span className="queue-count tabular">{inbox.mine.length}</span>
            )}
          </h2>
          {inbox.mine.length === 0 ? (
            <p className="muted text-body-sm">{m.review.mineNone}</p>
          ) : (
            <div className="grid" style={{ gap: 'var(--space-3)' }}>
              {inbox.mine.map((r) => (
                <article key={r.reviewId} className="card card-pad">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <span>
                      <span style={{ fontWeight: 600, display: 'block' }}>
                        {nameOf(r.subjectFirstName, r.subjectInitial)}
                      </span>
                      <span className="dim text-body-sm">
                        {interpolate(m.review.forService, {
                          service: m.service[r.serviceType as ServiceType],
                        })}
                      </span>
                    </span>
                    <span className="tabular text-body-sm" aria-hidden="true">
                      {'★'.repeat(r.rating)}
                      <span className="dim">{'☆'.repeat(5 - r.rating)}</span>
                    </span>
                  </div>
                  {r.body && (
                    <p style={{ marginTop: 'var(--space-3)', whiteSpace: 'pre-wrap' }}>{r.body}</p>
                  )}
                  {/*
                    YAYINLANMAMISSA SEBEBI YAZIYOR. Kendi yorumunu sitede
                    goremeyen kisi yazilmadigini saniyor.
                  */}
                  <p className="dim text-body-sm" style={{ marginTop: 'var(--space-3)' }}>
                    {r.published
                      ? interpolate(m.review.published, {
                          date: dayFmt(r.publishAt as string, locale),
                        })
                      : interpolate(m.review.waiting, {
                          date: r.publishAt ? dayFmt(r.publishAt, locale) : '—',
                          name: r.subjectFirstName ?? '—',
                        })}
                    {' · '}
                    <Link href={bookingHref(r.bookingId)}>{m.review.openBooking}</Link>
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </AccountShell>
  );
}
