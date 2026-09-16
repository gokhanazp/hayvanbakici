import Link from 'next/link';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';
import type { FeaturedReview } from '@/lib/data';
import { Avatar } from './Avatar';
import { SectionDoodles } from '@/components/Doodles';

/**
 * REFERANSLAR — uydurma alinti yok.
 *
 * Bu bolumun metinleri elle yazilmaz: sitede birakilmis, YAYIMLANMIS,
 * bes yildizli yorumlardan gelir (listFeaturedReviews). Boylece ana
 * sayfadaki ovgu ile bakici profilindeki yorum ayni kayittir ve
 * kullanici tiklayip kaynagina gidebilir.
 *
 * Yorum yoksa bolum HIC CIKMAZ — bos bir "musterilerimiz ne diyor"
 * baslgi, olmayan bir toplulugu varmis gibi gosterirdi.
 */
export function Testimonials({
  locale, reviews,
}: {
  locale: Locale;
  reviews: FeaturedReview[];
}) {
  if (reviews.length === 0) return null;
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  return (
    <section className="band band-surface band-round-t band-round-b has-doodles">
      <SectionDoodles set="testimonials" />
      <div className="container section">
        <div className="section-head">
          <span className="badge" style={{
            background: 'var(--color-accent-subtle)', color: 'var(--color-accent-hover)',
          }}>
            {m.testimonials.eyebrow}
          </span>
          <h2 className="text-h1">{m.testimonials.title}</h2>
          <p className="text-body-lg muted" style={{ textWrap: 'pretty' }}>
            {m.testimonials.subtitle}
          </p>
        </div>

        <div className="grid grid-3">
          {reviews.map((r) => {
            const citySlug = locale === 'fr-CA' ? r.citySlugFr : r.citySlugEn;
            return (
              <figure key={r.id} className="testimonial">
                <span className="stars" aria-label={`${r.rating} / 5`}>
                  {'★'.repeat(r.rating)}
                </span>
                <blockquote className="testimonial-quote">“{r.body}”</blockquote>
                <figcaption className="testimonial-foot">
                  <Avatar src={r.authorAvatarUrl} initials={`${r.authorFirstName.slice(0, 1)}${r.authorInitial}`} size={40} />
                  <span>
                    <span style={{ display: 'block', fontWeight: 600 }}>
                      {r.authorFirstName} {r.authorInitial}.
                    </span>
                    <Link
                      href={`/${seg}/${citySlug}/sitter/${r.sitterSlug}/`}
                      className="text-body-sm dim"
                      style={{ textDecoration: 'underline', textUnderlineOffset: '2px' }}
                    >
                      {m.testimonials.about.replace('{sitter}', r.sitterFirstName)}
                    </Link>
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>

        {/* Seffaflik: yorumlarin nereden geldigi ve kimin yazabildigi */}
        <p className="text-body-sm dim" style={{ marginTop: 'var(--space-6)' }}>
          {m.testimonials.note}
        </p>
      </div>
    </section>
  );
}
