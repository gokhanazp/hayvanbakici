import type { Locale } from '@havre/i18n';

/**
 * SSS LISTESI — tek bir bilesen, uc sayfada ayni gorunum.
 *
 * Onceden her sayfa kendi <details> kartlarini yaziyordu ve uc ayri
 * gorunum vardi: sehir sayfasinda havada duran hap seklinde kutular,
 * yardim sayfasinda baska bir sey. Tek liste, tek cerceve, aralarinda
 * ayirici cizgi — bolum "bir alan" gibi okunuyor.
 *
 * <details> bilincli: JS olmadan calisiyor, klavye ve ekran okuyucu
 * davranisi tarayicidan geliyor, ve acik olan bir soru tarayicinin sayfa
 * ici aramasinda (Ctrl+F) bulunabiliyor.
 */
export interface FaqItem {
  q: string;
  a: string;
}

/**
 * `group`: <details name> ayni gruptaki sorulari BIRBIRINI KAPATACAK
 * sekilde baglar (akordeon). Bir sayfada iki ayri liste varsa (yardim
 * sayfasi: sahipler / bakicilar) gruplar AYRI olmali — aksi halde
 * sahipler listesinde bir soru acinca bakicilar listesindeki kapaniyor.
 */
export function Faq({
  items, locale, group = 'faq',
}: {
  items: FaqItem[];
  locale: Locale;
  group?: string | undefined;
}) {
  if (items.length === 0) return null;
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q} className="faq-item" name={`${group}-${locale}`}>
          <summary>
            <span>{f.q}</span>
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="m4 6 4 4 4-4" />
            </svg>
          </summary>
          <div className="faq-answer">{f.a}</div>
        </details>
      ))}
    </div>
  );
}
