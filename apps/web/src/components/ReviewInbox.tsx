'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { getMessages, interpolate, type Locale, type Messages } from '@havre/i18n';
import { MAX_REVIEW_RESPONSE, type ServiceType } from '@havre/core';
import type { ReviewAbout } from '@/lib/data';
import type { ReplyState } from '@/app/[locale]/account/reviews/actions';
import { Avatar } from '@/components/Avatar';

/**
 * HAKKINDA YAZILAN YORUM + YANIT.
 *
 * Yanit verme yolu VARDI ama BULUNAMIYORDU: dugme yalnizca ilgili
 * rezervasyonun detay sayfasinda, yorum panelinin icinde ciziliyordu.
 * Yani yanit vermek icin once yorumun HANGI rezervasyondan geldigini
 * bilip o sayfayi acmak gerekiyordu ve hicbir ekran "hakkinizda yeni
 * bir yorum var" demiyordu. (Kullanici bunu bildirdi: "yorumlara cevap
 * verebiliyorduk ama ben bulamadim".)
 *
 * TARIH BICIMLENDIRME SUNUCUDA yapiliyor ve buraya hazir metin olarak
 * geliyor: istemcide bicimlendirilseydi sunucu ile tarayici ayni tarihi
 * farkli yazip hydration hatasi verirdi.
 */
export function ReviewCard({
  locale, review, publishedLabel, respondedLabel, bookingHref, action,
}: {
  locale: Locale;
  review: ReviewAbout;
  publishedLabel: string;
  respondedLabel: string | null;
  bookingHref: string;
  action: (prev: ReplyState, form: FormData) => Promise<ReplyState>;
}) {
  const m = getMessages(locale);
  const name = review.authorFirstName
    ? `${review.authorFirstName} ${review.authorInitial ?? ''}.`
    : '—';

  return (
    <article className="card card-pad review-inbox-card">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="row" style={{ gap: 'var(--space-3)' }}>
          <Avatar
            src={review.authorAvatarUrl} size={36}
            initials={`${(review.authorFirstName ?? '?').slice(0, 1)}${review.authorInitial ?? ''}`}
          />
          <span>
            <span style={{ fontWeight: 600, display: 'block' }}>{name}</span>
            <span className="dim text-body-sm">
              {interpolate(m.review.forService, {
                service: m.service[review.serviceType as ServiceType],
              })}
            </span>
          </span>
        </span>
        <span className="tabular text-body-sm" aria-hidden="true">
          {'★'.repeat(review.rating)}
          <span className="dim">{'☆'.repeat(5 - review.rating)}</span>
        </span>
      </div>

      {review.body && (
        <p style={{ marginTop: 'var(--space-3)', whiteSpace: 'pre-wrap' }}>{review.body}</p>
      )}
      <p className="dim text-body-sm" style={{ marginTop: 'var(--space-3)' }}>
        {publishedLabel}
        {' · '}
        <Link href={bookingHref}>{m.review.openBooking}</Link>
      </p>

      {review.responseBody ? (
        <div className="sitter-review-reply">
          <p className="text-body-sm" style={{ fontWeight: 600 }}>{m.review.respondHeading}</p>
          <p className="text-body-sm" style={{ marginTop: 'var(--space-1)', whiteSpace: 'pre-wrap' }}>
            {review.responseBody}
          </p>
          {respondedLabel && (
            <p className="dim text-body-sm" style={{ marginTop: 'var(--space-2)' }}>
              {respondedLabel}
            </p>
          )}
        </div>
      ) : (
        <ReplyForm locale={locale} reviewId={review.reviewId} action={action} />
      )}
    </article>
  );
}

/** Yanit formu — yalnizca hakkinda yazilan kisiye, yalnizca bir kez. */
function ReplyForm({
  locale, reviewId, action,
}: {
  locale: Locale; reviewId: string;
  action: (prev: ReplyState, form: FormData) => Promise<ReplyState>;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<ReplyState, FormData>(action, {});
  const [open, setOpen] = useState(false);

  if (state.done) return null;

  if (!open) {
    return (
      <button
        type="button" className="btn btn-secondary btn-sm"
        style={{ marginTop: 'var(--space-4)' }} onClick={() => setOpen(true)}
      >
        {m.review.respondSubmit}
      </button>
    );
  }

  return (
    <form action={formAction} style={{ marginTop: 'var(--space-4)' }}>
      <input type="hidden" name="reviewId" value={reviewId} />
      <input type="hidden" name="locale" value={locale === 'fr-CA' ? 'fr' : 'en'} />
      {state.error && (
        <p className="alert alert-error" role="alert">
          {(m.review[`error.${state.error}` as keyof Messages['review']] as string) ?? state.error}
        </p>
      )}
      <label className="field">
        <span className="field-label">{m.review.respondBody}</span>
        <textarea name="body" rows={4} maxLength={MAX_REVIEW_RESPONSE} required />
        {/* Tek sefer oldugu GONDERMEDEN once yaziyor. */}
        <span className="field-hint">{m.review.respondHint}</span>
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? m.review.submitting : m.review.respondSubmit}
      </button>
    </form>
  );
}
