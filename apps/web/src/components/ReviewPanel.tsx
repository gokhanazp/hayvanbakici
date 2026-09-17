'use client';

import { useActionState, useState } from 'react';
import { getMessages, interpolate, segmentFor, type Locale, type Messages } from '@havre/i18n';
import { MAX_REVIEW, MAX_REVIEW_RESPONSE } from '@havre/core';
import type { ReviewContext } from '@/lib/data';
import type { ReviewFormState } from '@/app/[locale]/account/bookings/[id]/actions';

/**
 * YORUM PANELI — rezervasyon sayfasindaki tek yorum alani.
 *
 * Buraya kadar yorumlar yalnizca OKUNUYORDU: bakici profilinde
 * gorunuyorlardi ama siteyi bastan sona gezip yorum yazacak tek bir
 * ekran yoktu. Tohum verideki yorumlar gercek gibi duruyor, kullanici
 * ise kendi yorumunu hicbir yere yazamiyordu.
 *
 * KURALLAR EKRANDA YAZILI. Kimin, ne zamana kadar, kac kez
 * yazabilecegi ve karsi tarafin yorumunun ne zaman acilacagi form
 * gorulur gorulmez okunuyor. Sirri olan bir degerlendirme sistemi adil
 * sayilmaz; ozellikle "ikiniz de yazana kadar kapali" kurali ancak
 * ONCEDEN bilindiginde ise yarar.
 *
 * TARIH BICIMI DISARIDAN GELIYOR (`fmt`): tarih bicimlendirme sunucu
 * tarafinda yapiliyor ve buraya hazir metin olarak iniyor, yoksa
 * sunucu ile tarayici ayni tarihi farkli yazip hydration hatasi verir.
 */
type Action = (prev: ReviewFormState, form: FormData) => Promise<ReviewFormState>;

function errorText(m: Messages, code: string | undefined): string | undefined {
  if (!code) return undefined;
  return (m.review[`error.${code}` as keyof Messages['review']] as string) ?? code;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="tabular text-body-sm" aria-hidden="true">
      {'★'.repeat(rating)}
      <span className="dim">{'☆'.repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewPanel({
  locale, ctx, dates, minePublished, name, writeAction, respondAction,
}: {
  locale: Locale;
  ctx: ReviewContext;
  /** Sunucuda bicimlendirilmis tarihler — hydration farki olmasin diye. */
  dates: { closes: string; minePublishes: string | null; theirsPublished: string | null };
  /** Kendi yorumum yayinda mi — karsilastirma da sunucuda yapiliyor. */
  minePublished: boolean;
  /** Karsi tarafin adi. */
  name: string;
  writeAction: Action;
  respondAction: Action;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  /*
    Rezervasyon daha bitmediyse burada HICBIR SEY cizilmiyor. Devam eden
    bir konaklamanin altinda "yorum yazamazsiniz" yazmak, olmayan bir
    engeli varmis gibi gosterirdi.
  */
  if (!ctx.canWrite && ctx.blockedBecause === 'not_completed' && !ctx.mine && !ctx.theirs) {
    return null;
  }

  const hidden = (
    <>
      <input type="hidden" name="id" value={ctx.bookingId} />
      <input type="hidden" name="locale" value={seg} />
    </>
  );

  return (
    <section className="card card-pad review-panel">
      <h2 className="text-h4">{m.review.heading}</h2>

      {/* --- Karsi tarafin yorumu: yalnizca YAYINDAYSA --- */}
      {ctx.theirs && dates.theirsPublished && (
        <article className="review-block">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <p style={{ fontWeight: 600 }}>{interpolate(m.review.theirs, { name })}</p>
            <Stars rating={ctx.theirs.rating} />
          </div>
          {ctx.theirs.body && (
            <p style={{ marginTop: 'var(--space-3)', whiteSpace: 'pre-wrap' }}>{ctx.theirs.body}</p>
          )}
          <p className="dim text-body-sm" style={{ marginTop: 'var(--space-3)' }}>
            {interpolate(m.review.published, { date: dates.theirsPublished })}
          </p>

          {ctx.theirs.responseBody ? (
            <div className="sitter-review-reply">
              <p className="text-body-sm" style={{ fontWeight: 600 }}>{m.review.respondHeading}</p>
              <p className="text-body-sm" style={{ marginTop: 'var(--space-1)', whiteSpace: 'pre-wrap' }}>
                {ctx.theirs.responseBody}
              </p>
            </div>
          ) : (
            <RespondForm
              m={m} hidden={hidden} reviewId={ctx.theirs.id} action={respondAction}
            />
          )}
        </article>
      )}

      {/* --- Karsi taraf yazdi ama HENUZ ACILMADI --- */}
      {ctx.counterpartWrote && !ctx.theirs && (
        <div className="notice" style={{ marginTop: 'var(--space-4)' }}>
          <p>{interpolate(m.review.theirsPending, { name, date: dates.closes })}</p>
        </div>
      )}

      {/* --- Kendi yorumum --- */}
      {ctx.mine && (
        <div className="review-block">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <p style={{ fontWeight: 600 }}>{m.review.mine}</p>
            <Stars rating={ctx.mine.rating} />
          </div>
          {ctx.mine.body && (
            <p style={{ marginTop: 'var(--space-3)', whiteSpace: 'pre-wrap' }}>{ctx.mine.body}</p>
          )}
          {/*
            YAZDIKTAN SONRA NE OLDUGU. Once burada yalnizca "1 Eki'de
            yayinlanir" yaziyordu ve GEREKCESI yoktu: insan kendi
            yorumunu sitede goremeyince yazilmadigini saniyor. Sebep
            (karsilikli korleme) ve erken acilma yolu burada.
          */}
          {dates.minePublishes && (
            <p className="dim text-body-sm" style={{ marginTop: 'var(--space-3)' }}>
              {minePublished
                ? interpolate(m.review.published, { date: dates.minePublishes })
                : interpolate(m.review.waiting, { date: dates.minePublishes, name })}
            </p>
          )}
          {!minePublished && ctx.counterpartWrote && (
            <p className="dim text-body-sm" style={{ marginTop: 'var(--space-2)' }}>
              {interpolate(m.review.waitingCounterpart, { name })}
            </p>
          )}
        </div>
      )}

      {/* --- Yazma formu --- */}
      {ctx.canWrite && (
        <WriteForm
          m={m} hidden={hidden} name={name} direction={ctx.direction}
          closes={dates.closes} action={writeAction}
        />
      )}

      {/* --- Yazilamiyorsa SEBEBI --- */}
      {!ctx.canWrite && !ctx.mine && ctx.blockedBecause === 'window_closed' && (
        <p className="dim text-body-sm" style={{ marginTop: 'var(--space-4)' }}>
          {interpolate(m.review.windowClosed, { date: dates.closes })}
        </p>
      )}
      {!ctx.canWrite && !ctx.mine && ctx.blockedBecause === 'not_completed' && (
        <p className="dim text-body-sm" style={{ marginTop: 'var(--space-4)' }}>
          {m.review.notCompleted}
        </p>
      )}
    </section>
  );
}

/**
 * YAZMA FORMU.
 *
 * Puan bir RADYO GRUBU: her yildizin kendi etiketi var ("3 yildiz —
 * fena degildi"), yani ekran okuyucu da fareyle gezinmeyen de ne
 * sectigini duyuyor. Yildiz sayisini tiklanan kutucuktan cikaran
 * suslu bir bilesen yerine formun kendi alani — JS calismasa bile
 * gonderiliyor.
 */
function WriteForm({
  m, hidden, name, direction, closes, action,
}: {
  m: Messages;
  hidden: React.ReactNode;
  name: string;
  direction: string;
  closes: string;
  action: Action;
}) {
  const [state, formAction, busy] = useActionState<ReviewFormState, FormData>(action, {});
  const [rating, setRating] = useState(0);

  if (state.done) return null;

  const prompt = direction === 'owner_to_sitter' ? m.review.promptSitter : m.review.promptOwner;

  return (
    <form action={formAction} className="review-form">
      <h3 className="text-h4">{m.review.writeHeading}</h3>
      <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
        {interpolate(prompt, { name })}
      </p>
      {hidden}

      {state.error && (
        <p className="alert alert-error" role="alert" style={{ marginTop: 'var(--space-4)' }}>
          {errorText(m, state.error)}
        </p>
      )}

      <fieldset className="review-stars">
        <legend className="field-label">{m.review.rating}</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="review-star" data-on={n <= rating ? '' : undefined}>
            <input
              type="radio" name="rating" value={n} required
              checked={rating === n}
              onChange={() => setRating(n)}
            />
            <span aria-hidden="true">★</span>
            <span className="sr-only">
              {m.review[`star.${n}` as keyof Messages['review']] as string}
            </span>
          </label>
        ))}
      </fieldset>

      <label className="field" style={{ marginTop: 'var(--space-5)' }}>
        <span className="field-label">{m.review.body}</span>
        <textarea name="body" rows={5} maxLength={MAX_REVIEW} />
        <span className="field-hint">{interpolate(m.review.bodyHint, { max: MAX_REVIEW })}</span>
      </label>

      {/* Kurallar GONDERMEDEN once okunuyor. */}
      <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>
        {interpolate(m.review.rules, { date: closes })}
      </p>
      <p className="field-hint">{interpolate(m.review.blind, { date: closes })}</p>

      <button
        type="submit" className="btn btn-primary" disabled={busy}
        style={{ marginTop: 'var(--space-5)' }}
      >
        {busy ? m.review.submitting : m.review.submit}
      </button>
    </form>
  );
}

/** Yanit formu — yalnizca hakkinda yazilan kisiye, yalnizca bir kez. */
function RespondForm({
  m, hidden, reviewId, action,
}: {
  m: Messages; hidden: React.ReactNode; reviewId: string; action: Action;
}) {
  const [state, formAction, busy] = useActionState<ReviewFormState, FormData>(action, {});
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
      {hidden}
      <input type="hidden" name="reviewId" value={reviewId} />
      {state.error && (
        <p className="alert alert-error" role="alert">{errorText(m, state.error)}</p>
      )}
      <label className="field">
        <span className="field-label">{m.review.respondBody}</span>
        <textarea name="body" rows={4} maxLength={MAX_REVIEW_RESPONSE} required />
        <span className="field-hint">{m.review.respondHint}</span>
      </label>
      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? m.review.submitting : m.review.respondSubmit}
      </button>
    </form>
  );
}
