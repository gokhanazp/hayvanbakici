import { sql } from 'drizzle-orm';
import {
  MAX_REVIEW, MAX_REVIEW_RESPONSE, canWriteReview, reviewPublishAt,
  type ReviewBlock, type ReviewDirection,
} from '@havre/core';
import { withDbErrors, type Database } from '../client.js';

/**
 * YORUM YAZMA.
 *
 * Yorumlar okunuyordu ama yazilamiyordu. Kurallarin kendisi
 * `@havre/core/reviews.ts` icinde ve TEST EDILIYOR; burasi yalnizca
 * onlari veritabanina uyguluyor.
 *
 * YAYIN ANI BIR ARKA PLAN ISI DEGIL. `published_at` "yayinda mi" degil
 * "ne zaman yayinlanir" demek ve gelecek bir tarih olabiliyor; okuyan
 * butun sorgular `published_at <= now()` diyor. Boylece karsilikli
 * korlemenin acilma ani veriye gomulu: calismayan bir zamanlayici
 * yuzunden yorumlar sonsuza kadar gizli kalamaz.
 */
export type ReviewError = ReviewBlock | 'not_found' | 'empty' | 'too_long' | 'bad_rating';
export type ReviewResult<T> = { ok: true; value: T } | { ok: false; error: ReviewError };

export interface ReviewContext {
  bookingId: string;
  status: string;
  endAt: string;
  /** Goruntuleyen hangi taraf — yorum yonu bundan tureniyor. */
  direction: ReviewDirection;
  counterpartId: string;
  counterpartName: string | null;
  serviceType: string;
  /** Goruntuleyenin kendi yorumu (varsa). */
  mine: { rating: number; body: string | null; publishAt: string | null } | null;
  /** Karsi tarafin yorumu — YALNIZCA yayinlandiysa doluyor. */
  theirs: {
    id: string; rating: number; body: string | null; publishedAt: string;
    responseBody: string | null;
  } | null;
  /** Karsi taraf yazdi mi (icerigini gostermeden) — ekranda "bekliyor" demek icin. */
  counterpartWrote: boolean;
  windowClosesAt: string;
  canWrite: boolean;
  blockedBecause: ReviewBlock | null;
}

/**
 * Bir rezervasyonun yorum durumu — iki taraf icin de ayni fonksiyon.
 * Goruntuleyen taraflardan biri degilse null donuyor (cagiran 404 verir).
 */
export async function getReviewContext(
  db: Database, bookingId: string, viewerId: string,
): Promise<ReviewContext | null> {
  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      SELECT b.id::text, b.status::text, b.end_at, b.service_type::text,
             b.owner_id::text, b.sitter_id::text,
             COALESCE(op.first_name, ou.email) AS owner_name,
             COALESCE(sp.first_name, su.email) AS sitter_name
      FROM bookings b
      LEFT JOIN users ou ON ou.id = b.owner_id
      LEFT JOIN profiles op ON op.user_id = b.owner_id
      LEFT JOIN users su ON su.id = b.sitter_id
      LEFT JOIN profiles sp ON sp.user_id = b.sitter_id
      WHERE b.id = ${bookingId} AND (b.owner_id = ${viewerId} OR b.sitter_id = ${viewerId})
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;
    const b = rows[0];
    if (!b) return null;

    const isOwner = String(b.owner_id) === viewerId;
    const direction: ReviewDirection = isOwner ? 'owner_to_sitter' : 'sitter_to_owner';
    const other: ReviewDirection = isOwner ? 'sitter_to_owner' : 'owner_to_sitter';

    const mineRows = await db.execute(sql`
      SELECT rating, body, published_at FROM reviews
      WHERE booking_id = ${bookingId} AND direction = ${direction} LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;
    const m = mineRows[0];

    /* Karsi tarafin yorumu: YAZILDI MI ayri, GORUNUR MU ayri. Ekranda
       "yazdi ama ikiniz de yazana kadar kapali" demek icin ikisi de
       gerekiyor; icerik yalnizca gorunurse geliyor. */
    const theirRows = await db.execute(sql`
      SELECT id::text, rating, body, published_at, response_body,
             (published_at IS NOT NULL AND published_at <= now()) AS visible
      FROM reviews
      WHERE booking_id = ${bookingId} AND direction = ${other} AND hidden_at IS NULL
      LIMIT 1
    `) as unknown as Array<Record<string, unknown>>;
    const t = theirRows[0];

    const endAt = new Date(b.end_at as Date);
    const gate = canWriteReview({
      status: String(b.status), endAt, alreadyWritten: Boolean(m),
    });

    const closes = reviewPublishAt({ counterpartWrote: false, endAt });

    return {
      bookingId: String(b.id),
      status: String(b.status),
      endAt: endAt.toISOString(),
      direction,
      counterpartId: String(isOwner ? b.sitter_id : b.owner_id),
      counterpartName: (isOwner ? b.sitter_name : b.owner_name) as string | null,
      serviceType: String(b.service_type),
      mine: m
        ? {
            rating: Number(m.rating),
            body: (m.body as string | null) ?? null,
            publishAt: m.published_at ? new Date(m.published_at as Date).toISOString() : null,
          }
        : null,
      theirs: t && t.visible
        ? {
            id: String(t.id),
            rating: Number(t.rating),
            body: (t.body as string | null) ?? null,
            publishedAt: new Date(t.published_at as Date).toISOString(),
            responseBody: (t.response_body as string | null) ?? null,
          }
        : null,
      counterpartWrote: Boolean(t),
      windowClosesAt: closes.toISOString(),
      canWrite: gate.ok,
      blockedBecause: gate.ok ? null : gate.reason,
    };
  });
}

/**
 * Yorumu yazar.
 *
 * KARSI TARAF DA YAZDIYSA IKISI BIRDEN ACILIYOR — tek bir UPDATE ile,
 * ayni islemde. Once birini acip sonra digerini acmak, arada bir hata
 * olursa korlemeyi TEK TARAFLI kirar: biri gorunur, digeri gizli kalir.
 */
export async function submitReview(
  db: Database,
  input: { bookingId: string; authorId: string; rating: number; body: string },
): Promise<ReviewResult<{ publishAt: string }>> {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { ok: false, error: 'bad_rating' };
  }
  const body = input.body.trim();
  if (body.length > MAX_REVIEW) return { ok: false, error: 'too_long' };

  return withDbErrors(async () => {
    const ctx = await getReviewContext(db, input.bookingId, input.authorId);
    if (!ctx) return { ok: false, error: 'not_a_party' as const };
    if (!ctx.canWrite) return { ok: false, error: ctx.blockedBecause ?? 'not_completed' };

    const publishAt = reviewPublishAt({
      counterpartWrote: ctx.counterpartWrote,
      endAt: new Date(ctx.endAt),
    });
    /*
      METIN OLARAK BAGLANIYOR, Date NESNESI OLARAK DEGIL.

      Ilk halinde `${publishAt}` yaziyordu ve surucu Date'i kabul
      etmedi: "The string argument must be of type string... Received an
      instance of Date" — 500. Tarayicida yakalandi, birim testinde
      degil (testler saf kural fonksiyonlarini olcuyor, surucuyu degil).
      ISO metni timestamptz'a sorunsuz donuyor.
    */
    const publishAtIso = publishAt.toISOString();

    await db.execute(sql`
      INSERT INTO reviews (booking_id, author_id, subject_id, direction, rating, body, published_at)
      VALUES (${input.bookingId}, ${input.authorId}, ${ctx.counterpartId},
              ${ctx.direction}, ${input.rating}, ${body || null}, ${publishAtIso})
      ON CONFLICT (booking_id, direction) DO NOTHING
    `);

    /* Karsi taraf beklemedeyse onun da yayin anini SIMDIYE cekiyoruz:
       ikisi ayni anda aciliyor. */
    if (ctx.counterpartWrote) {
      await db.execute(sql`
        UPDATE reviews SET published_at = ${publishAtIso}
        WHERE booking_id = ${input.bookingId} AND published_at > ${publishAtIso}
      `);
    }

    /*
      PUAN OZETI IKI TARAF ICIN DE YENILENIYOR.

      Once yalnizca karsi taraf yenileniyordu ve bu, karsilikli korleme
      acildiginda YANLIS SAYI birakiyordu: sahibi yaziyor (bakicinin
      yorumu hala gelecekte, sayac artmiyor), sonra bakici yaziyor ve
      IKI yorum birden aciliyor — ama o cagri yalnizca SAHIBIN ozetini
      yeniliyordu. Bakicinin profilinde "5 yorum" yaziyor, altinda 6
      yorum listeleniyordu. Tarayicida yakalandi.
    */
    await recomputeSubjectRating(db, ctx.counterpartId);
    if (ctx.counterpartWrote) await recomputeSubjectRating(db, input.authorId);
    return { ok: true, value: { publishAt: publishAtIso } };
  });
}

/**
 * Yoruma yanit — yalnizca hakkinda yazilan kisi, yalnizca bir kez.
 *
 * Yanit yorumu DEGISTIRMIYOR, yanina ekleniyor. Kotu bir yorum alan
 * bakicinin tek hakki budur; yorumu sildirmek ya da duzelttirmek degil.
 */
export async function respondToReview(
  db: Database, input: { reviewId: string; subjectId: string; body: string },
): Promise<ReviewResult<true>> {
  const body = input.body.trim();
  if (body.length === 0) return { ok: false, error: 'empty' };
  if (body.length > MAX_REVIEW_RESPONSE) return { ok: false, error: 'too_long' };

  return withDbErrors(async () => {
    const rows = await db.execute(sql`
      UPDATE reviews SET response_body = ${body}, response_at = now()
      WHERE id = ${input.reviewId}
        AND subject_id = ${input.subjectId}
        AND response_body IS NULL
        AND published_at IS NOT NULL AND published_at <= now()
      RETURNING id
    `) as unknown as Array<{ id: string }>;
    if (rows.length === 0) return { ok: false, error: 'not_found' as const };
    return { ok: true, value: true as const };
  });
}

/** Puan ozeti — YAYINDAKI ve gizlenmemis yorumlardan. */
async function recomputeSubjectRating(db: Database, subjectId: string): Promise<void> {
  await db.execute(sql`
    UPDATE sitters st SET
      review_count = COALESCE(agg.n, 0),
      average_rating = COALESCE(agg.avg, 0)
    FROM (
      SELECT count(*)::int AS n, avg(rating)::real AS avg
      FROM reviews
      WHERE subject_id = ${subjectId}
        AND published_at <= now()
        AND hidden_at IS NULL
    ) agg
    WHERE st.user_id = ${subjectId}
  `);
}
