import Link from 'next/link';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import type { FeaturedReview } from '@/lib/data';
import { Avatar } from './Avatar';
import { SectionDoodles } from '@/components/Doodles';
import { ServiceIcon } from '@/components/ServiceIcon';
import { dateFmt } from '@/lib/format';

/**
 * Tur isareti — koypek / kedi. Hayvan fotografi yoksa bunu goruyorsunuz;
 * bas harfli bir daire "bir hayvan" demiyor, bu diyor.
 */
function SpeciesGlyph({ species }: { species: string }) {
  const p = { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'currentColor',
    'aria-hidden': true, focusable: 'false' } as const;
  if (species === 'cat') {
    return (
      <svg {...p}>
        <path d="M5 4.6 8.3 8a8.6 8.6 0 0 1 7.4 0L19 4.6c.5-.5 1.3-.1 1.3.6v6.2a8.3 8.3 0 1 1-16.6 0V5.2c0-.7.8-1.1 1.3-.6Zm3.9 9.1a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Zm6.2 0a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2Z" />
      </svg>
    );
  }
  /*
    KOPEK: SARKIK KULAKLAR. Ilk cizimde kulaklar basin USTUNDE sivriydi
    ve 20 pikselde kediden ayirt edilemiyordu — "Moose · kopek" yazan
    kartta kedi yuzu duruyordu. Kulaklar yanlara indi.
    fill-rule evenodd: gozler ve burun ayri yol degil, DELIK — boylece
    zemin rengi ne olursa olsun dogru gorunuyorlar.
  */
  return (
    <svg {...p} fillRule="evenodd">
      <path d="M4.3 6.6a2.1 2.1 0 0 1 2.1 2.1v3.9a2.1 2.1 0 1 1-4.2 0V8.7a2.1 2.1 0 0 1 2.1-2.1Zm15.4 0a2.1 2.1 0 0 1 2.1 2.1v3.9a2.1 2.1 0 1 1-4.2 0V8.7a2.1 2.1 0 0 1 2.1-2.1ZM12 6.5a5.9 5.9 0 1 1 0 11.8 5.9 5.9 0 0 1 0-11.8Zm-2.3 4.8a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1Zm4.6 0a1.05 1.05 0 1 0 0 2.1 1.05 1.05 0 0 0 0-2.1ZM12 14.6c-1 0-1.8.5-1.8 1.1s.8 1.1 1.8 1.1 1.8-.5 1.8-1.1-.8-1.1-1.8-1.1Z" />
    </svg>
  );
}

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
            const cityName = locale === 'fr-CA' ? r.cityNameFr : r.cityNameEn;
            return (
              <figure key={r.id} className="testimonial">
                {/*
                  USTTE YORUMUN KONUSU OLAN BAKICI.

                  Once kartin altinda yalnizca yorumu YAZAN kisi vardi ve
                  bakiciya giden baglanti "Nadia hakkinda" diye kucuk bir
                  yaziydi. Oysa okuyanin sordugu soru "kimi kiralayacagim";
                  kartin capasi bakicinin YUZU olmali. Kart artik onunla
                  basliyor ve tiklanan sey de o.
                */}
                <Link
                  href={`/${seg}/${citySlug}/sitter/${r.sitterSlug}/`}
                  className="testimonial-sitter"
                >
                  <Avatar
                    src={r.sitterAvatarUrl}
                    initials={`${r.sitterFirstName.slice(0, 1)}${r.sitterInitial}`}
                    size={44}
                  />
                  <span className="testimonial-sitter-text">
                    <span className="testimonial-sitter-name">
                      {r.sitterFirstName} {r.sitterInitial}.
                    </span>
                    <span className="testimonial-sitter-meta">
                      {r.serviceType && (
                        <>
                          <ServiceIcon service={r.serviceType} size={14} />
                          {m.service[r.serviceType]}
                          <span aria-hidden="true"> · </span>
                        </>
                      )}
                      {cityName}
                    </span>
                  </span>
                </Link>

                <span className="stars" aria-label={`${r.rating} / 5`}>
                  {'★'.repeat(r.rating)}
                </span>
                <blockquote className="testimonial-quote">“{r.body}”</blockquote>

                <figcaption className="testimonial-foot">
                  {/*
                    HANGI HAYVAN ICIN. Rezervasyona hayvan baglanmamissa
                    bu satir HIC cizilmiyor — bos bir "hayvan" rozeti
                    uydurma olurdu.
                  */}
                  {r.petName && (
                    <span className="testimonial-pet">
                      {r.petPhotoUrl ? (
                        <img src={r.petPhotoUrl} alt="" width={36} height={36} />
                      ) : (
                        <span className="testimonial-pet-glyph">
                          <SpeciesGlyph species={r.petSpecies ?? 'dog'} />
                        </span>
                      )}
                      <span>{interpolate(m.testimonials.forPet, { pet: r.petName })}</span>
                    </span>
                  )}

                  <span className="testimonial-by">
                    {/*
                      "Dogrulanmis rezervasyon" YALNIZCA gercekten bir
                      rezervasyon kaydina bagliysa yaziliyor. Rozet bir
                      iddia; dayanagi yoksa yazilmaz.
                    */}
                    {r.serviceType && (
                      <span className="testimonial-verified">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"
                          strokeLinejoin="round" aria-hidden="true">
                          <path d="m4 12.5 5 5L20 6.5" />
                        </svg>
                        {m.testimonials.verifiedBooking}
                      </span>
                    )}
                    <span className="dim">
                      {interpolate(m.testimonials.writtenBy, {
                        name: `${r.authorFirstName} ${r.authorInitial}.`,
                      })}
                      {' · '}
                      {dateFmt(r.publishedAt, locale)}
                    </span>
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
