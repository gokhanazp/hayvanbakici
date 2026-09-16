import { getMessages, interpolate, type Locale } from '@havre/i18n';
import { numberFmt } from '@/lib/format';

/**
 * PUAN DAGILIMI — 5'ten 1'e.
 *
 * NEDEN: ortalama tek basina "kac kisi kac verdi" sorusunu
 * cevaplamiyor. 4.6 ortalama, "herkes 4 ya da 5 verdi" de olabilir,
 * "on kisi 5, bir kisi 1 verdi" de. Ikisi ayni bakici degil ve sahip
 * bunu gormek istiyor.
 *
 * SAYILAR YAZIYOR, YALNIZCA CUBUK DEGIL. Cubuk goreli uzunluk veriyor;
 * "2 yorum" ile "200 yorum" arasindaki fark ancak sayiyla anlasilir.
 * Ekran okuyucu icin de her satirin metin karsiligi var.
 */
export function RatingBreakdown({
  counts, total, locale,
}: {
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  total: number;
  locale: Locale;
}) {
  const m = getMessages(locale);
  if (total <= 0) return null;
  const rows = [5, 4, 3, 2, 1] as const;

  return (
    <dl className="rating-breakdown" aria-label={m.sitter.ratingBreakdown}>
      {rows.map((star) => {
        const n = counts[star] ?? 0;
        const pct = total > 0 ? Math.round((n / total) * 100) : 0;
        return (
          <div key={star} className="rating-row">
            <dt className="rating-star tabular">
              {star}
              <span aria-hidden="true">★</span>
              <span className="sr-only">
                {interpolate(m.sitter.ratingRow, {
                  stars: String(star), count: numberFmt(n, locale),
                })}
              </span>
            </dt>
            <dd className="rating-bar">
              <span style={{ width: `${pct}%` }} aria-hidden="true" />
            </dd>
            <dd className="rating-count tabular dim">{numberFmt(n, locale)}</dd>
          </div>
        );
      })}
    </dl>
  );
}
