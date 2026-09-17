/**
 * YORUM KURALLARI.
 *
 * Yorumlar okunuyordu ama YAZILAMIYORDU: kurallar konusulmustu, kodda
 * karsiligi yoktu. Rakip dokumaninda "karsilikli korleme" bizim
 * farkimiz olarak yaziliydi — bir kural ancak kodda varsa fark olur.
 *
 * DORT KURAL:
 *
 * 1. YALNIZCA TAMAMLANMIS BIR REZERVASYON. Yorum, olmus bir isin
 *    kaydidir; rezervasyon yapmadan yorum yazilamaz. Bu, satin alinmis
 *    yorumlarin onundeki tek gercek engel.
 *
 * 2. KARSILIKLI KORLEME. Iki taraf da yazana kadar hicbiri digerininkini
 *    gormuyor. Sebebi basit: yazdigini goren taraf ya misilleme yapar ya
 *    da yumusatir. Ikisi de yorumu degersizlestirir.
 *
 * 3. PENCERE KAPANINCA YAZILAN YAYINLANIR. Karsi taraf hic yazmazsa,
 *    yazanin yorumu sonsuza kadar bekleyemez. On dort gun sonunda ne
 *    varsa yayinlanir.
 *
 * 4. YAYINLANDIKTAN SONRA DEGISTIRILEMEZ. Ne yazar ne yonetici — panelde
 *    yalnizca GIZLEME var (Competition Act §8.6). Yazarin da duzeltme
 *    hakki olsaydi, kotu yorum alan bakicinin yazari ikna etmesi bir
 *    pazarlik konusu olurdu.
 */
export const REVIEW_WINDOW_DAYS = 14;

/** Bir yorumun en fazla kac karakter olabilecegi. */
export const MAX_REVIEW = 2000;
/** Yanit da bir yorum kadar uzun olabilir; daha kisa olmasi icin sebep yok. */
export const MAX_REVIEW_RESPONSE = 2000;

export type ReviewDirection = 'owner_to_sitter' | 'sitter_to_owner';

export type ReviewBlock =
  | 'not_completed'
  | 'window_closed'
  | 'already_written'
  | 'not_a_party';

/** Pencerenin kapanis ani — rezervasyonun BITISINDEN itibaren. */
export function reviewWindowCloses(bookingEndAt: Date): Date {
  const d = new Date(bookingEndAt);
  d.setUTCDate(d.getUTCDate() + REVIEW_WINDOW_DAYS);
  return d;
}

/**
 * Bu rezervasyona yorum yazilabilir mi?
 *
 * `payout_released` da kabul ediliyor: tamamlanmis bir isin odemesi
 * yapildiginda durum ilerliyor, ama yasanan deneyim degismiyor.
 */
export function canWriteReview(input: {
  status: string;
  endAt: Date;
  alreadyWritten: boolean;
  now?: Date | undefined;
}): { ok: true } | { ok: false; reason: ReviewBlock } {
  if (input.status !== 'completed' && input.status !== 'payout_released') {
    return { ok: false, reason: 'not_completed' };
  }
  if (input.alreadyWritten) return { ok: false, reason: 'already_written' };
  const now = input.now ?? new Date();
  if (now > reviewWindowCloses(input.endAt)) {
    return { ok: false, reason: 'window_closed' };
  }
  return { ok: true };
}

/**
 * BU YORUM NE ZAMAN YAYINLANIR?
 *
 * Karsi taraf da yazdiysa: SIMDI (ikisi birden acilir).
 * Yazmadiysa: pencerenin kapanisinda. Gelecek bir tarih donuyor ve
 * `reviews.published_at` alanina oyle yaziliyor — yani o alan "yayinda
 * mi" degil "ne zaman yayinlanir" demek. Okuyan sorgular bu yuzden
 * `published_at IS NOT NULL` degil `published_at <= now()` diyor.
 *
 * Bu secim bir ARKA PLAN ISINDEN kurtariyor: yayin anini bir zamanlayici
 * belirlemiyor, veri kendi kendini aciyor. Zamanlayici unutulursa ya da
 * calismazsa yorumlar sonsuza kadar gizli kalirdi.
 */
export function reviewPublishAt(input: {
  counterpartWrote: boolean;
  endAt: Date;
  now?: Date | undefined;
}): Date {
  const now = input.now ?? new Date();
  return input.counterpartWrote ? now : reviewWindowCloses(input.endAt);
}

/** Karsi tarafin yorumu okunabilir mi — korleme burada uygulaniyor. */
export function isReviewVisible(publishAt: Date | null, now?: Date): boolean {
  if (!publishAt) return false;
  return publishAt <= (now ?? new Date());
}
