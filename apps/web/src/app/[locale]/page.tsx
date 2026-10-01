import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getMessages, interpolate, localeFromSegment, segmentFor, serviceSlug,
} from '@havre/i18n';
import { servicesForPhase, SERVICES } from '@havre/core';
import { Sym, type SymName } from '@/components/Sym';
import { Photo } from '@/components/Photo';
import { DateRangeField } from '@/components/ui/DateRangeField';
import { SERVICE_SYM } from '@/components/ServiceIcon';
import { StSearch } from '@/components/StSearch';
import { Avatar } from '@/components/Avatar';
import {
  cityName, citySlug, getDefaultCity, getFeaturedReviews, getLandingData,
} from '@/lib/data';
import { money, numberFmt } from '@/lib/format';

/**
 * ANASAYFA — Stitch tasariminin birebir karsiligi.
 *
 * Kaynak: stitch_evcil_hayvan_bak_c_platformu/home_discovery_pawpal_canada.
 * Bolum sirasi, kutu olculeri, kose yaricaplari, golgeler ve tipografi
 * kademeleri oradan alindi. Iki yerde ayrilma var, ikisi de kasitli:
 *
 *  1. IKONLAR satir ici SVG (components/Sym.tsx). Tasarim Material
 *     Symbols kullaniyor; o, Google Fonts'tan gelen bir ikon FONTU.
 *     Yazi tiplerini self-host etme kararimizi (Law 25: Google'a sinir
 *     otesi istek yok) bir ikon fontu icin bozmak anlamsizdi.
 *  2. METINLER bizim. Tasarimin yazdiklari bu urunun yapmadigi
 *     seylerdi: uydurma puan ve bakici sayilari, "RCMP taramasi",
 *     iki milyon dolarlik veteriner teminati, 7/24 veteriner hatti,
 *     GPS takibi, dort sehir, "ayda 3.200 dolar kazan" ve isimli
 *     sahte yorumlar. Her kutuya kodun gercekten yaptigi sey yazildi;
 *     sayilar veritabanindan geliyor.
 *
 * ARAMA KUTUSU JAVASCRIPT'SIZ: hizmet sekmeleri radio + CSS
 * (:has(input:checked)). Tasarimdaki JS'li sekme ayni gorunuyor ama
 * JS yuklenene kadar calismiyordu. Form duz bir GET -- adres
 * paylasilabilir, geri tusu calisir.
 */
export const revalidate = 3600;

/** Hizmet kutucuklarinin tasarimdaki ton sirasi */
const SERVICE_TONE = ['sage', 'coral', 'gold', 'sage'] as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);
  const s = segmentFor(locale);
  const services = servicesForPhase('v1');
  const city = await getDefaultCity();

  const [landings, reviews] = await Promise.all([
    Promise.all(services.map((sv) => getLandingData(city, sv, locale))),
    getFeaturedReviews(3),
  ]);
  const boarding = landings[0]!;
  const byService = new Map(services.map((sv, i) => [sv, landings[i]!]));

  const cityLabel = cityName(city, locale);
  const slug = citySlug(city, locale);
  const [titleBefore, titleAfter] = m.home.heroTitle.split('{accent}');
  const sitterCount = numberFmt(boarding.sitterCount, locale);

  return (
    <>
      {/* ===================== KAHRAMAN ===================== */}
      <section className="st-hero">
        {/*
          Lekeler KENDI kutusunda kirpiliyor, bolumun kendisinde degil.
          Bolumde `overflow: hidden` varken takvim paneli hero'nun alt
          kenarinda kesiliyordu — acilan panel asagi tasiyor ve kirpilan
          sey o oluyordu. Kirpma lekelere ozel bir katmana alindi.
        */}
        <div className="st-blobs" aria-hidden="true">
          <div className="st-blob st-blob-a"></div>
          <div className="st-blob st-blob-b"></div>
        </div>

        <div className="st-wrap st-hero-inner">
          <div className="st-hero-grid">
            <div className="st-hero-copy">
              <span className="st-eyebrow-pill">
                <Sym name="location" size={16} />
                {m.home.heroBadge}
              </span>

              <h1 className="st-h1">
                {titleBefore}
                <span className="st-h1-accent">{m.home.heroAccent}</span>
                {titleAfter}
              </h1>

              <p className="st-hero-lead">{m.home.heroSubtitle}</p>

              <div className="st-hero-pills">
                {/*
                  PUAN ROZETI YALNIZCA GERCEK YORUM VARSA. Tasarimda
                  sabit "4.96 / 5.0 — 45.000+ tail-wags" yaziyordu.
                */}
                {boarding.reviewCount > 0 && (
                  <span className="st-stat-pill">
                    <span className="st-stars" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Sym key={i} name="star" size={17} filled />
                      ))}
                    </span>
                    <strong className="tabular">{boarding.avgRating.toFixed(2)}</strong>
                    <span className="st-stat-sub">
                      {interpolate(m.home.reviewsFrom, {
                        count: numberFmt(boarding.reviewCount, locale),
                      })}
                    </span>
                  </span>
                )}
                <span className="st-stat-pill st-stat-pill-sage">
                  <Sym name="verified" size={17} />
                  {m.home.heroPillChecks}
                </span>
              </div>
            </div>

            {/* ---- Fotograf + uzerine binen iki kart ---- */}
            <div className="st-hero-art">
              <div className="st-hero-photo">
                <Photo id="sitter-banner" locale={locale} alt={m.home.heroPhotoAlt} priority />
              </div>

              <div className="st-badge-float">
                <span className="st-badge-tile" aria-hidden="true">
                  <Sym name="pets" size={26} />
                </span>
                <span>
                  <strong className="st-badge-value">
                    {interpolate(m.home.heroSitterCount, { city: cityLabel, count: sitterCount })}
                  </strong>
                  <span className="st-badge-sub">{m.home.heroBadgeSub}</span>
                </span>
              </div>

              {boarding.medianPriceCents > 0 && (
                <span className="st-badge-chip">
                  <Sym name="verified" size={16} />
                  {interpolate(m.home.heroMedian, {
                    price: money(boarding.medianPriceCents, locale),
                    unit: m.unit[SERVICES.boarding.unit],
                  })}
                </span>
              )}
            </div>
          </div>

          {/* ---- Arama kutusu ---- */}
          {/* Ayni kutu sehir+hizmet sayfasinda da var: StSearch'e tasindi. */}
          <StSearch locale={locale} cityLabel={cityLabel} />
        </div>
      </section>

      {/* ===================== HIZMETLER ===================== */}
      <section className="st-section">
        <div className="st-wrap">
          <div className="st-head">
            <div>
              <span className="st-eyebrow">{m.home.servicesEyebrow}</span>
              <h2 className="st-h2">{m.home.servicesHeading}</h2>
            </div>
            <p className="st-head-note">{m.home.servicesLead}</p>
          </div>

          <div className="st-grid-4">
            {services.map((sv, i) => {
              const d = byService.get(sv);
              const from = d && d.p25PriceCents > 0 ? d.p25PriceCents : 0;
              return (
                <Link
                  key={sv}
                  href={`/${s}/${slug}/${serviceSlug(sv, locale)}/`}
                  className={`st-svc st-tone-${SERVICE_TONE[i % SERVICE_TONE.length]}`}
                >
                  <span className="st-svc-tile" aria-hidden="true">
                    <Sym name={SERVICE_SYM[sv]} size={30} />
                  </span>
                  <h3 className="st-svc-name">{m.service[sv]}</h3>
                  <p className="st-svc-body">{m.serviceDescription[sv]}</p>
                  <span className="st-svc-foot">
                    {from > 0 ? (
                      <>
                        <span className="st-svc-from">{m.home.serviceFromLabel}</span>
                        <span className="st-svc-price tabular">
                          {money(from, locale)}
                          <span className="st-svc-unit"> / {m.unit[SERVICES[sv].unit]}</span>
                        </span>
                      </>
                    ) : (
                      <span className="st-svc-from">{m.home.serviceNoPrice}</span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== BAKICILAR ===================== */}
      {boarding.sitters.length > 0 && (
        <section className="st-section st-section-tint">
          <div className="st-wrap">
            <div className="st-head">
              <div>
                <span className="st-eyebrow st-eyebrow-live">
                  <span className="st-dot" aria-hidden="true"></span>
                  {m.home.sittersEyebrow}
                </span>
                <h2 className="st-h2">{interpolate(m.home.sittersHeading, { city: cityLabel })}</h2>
              </div>
              <Link href={`/${s}/${slug}/${serviceSlug('boarding', locale)}/`} className="st-pill-link">
                {interpolate(m.home.sittersAllCount, { count: sitterCount })}
              </Link>
            </div>

            <div className="st-grid-3">
              {boarding.sitters.slice(0, 3).map((sit) => (
                <article key={sit.id} className="st-sitter">
                  <div className="st-sitter-photo">
                    <Avatar initials={sit.photoInitials} src={sit.avatarUrl} size={120} />
                    {sit.reviewCount > 0 && (
                      <span className="st-ov st-ov-rating">
                        <Sym name="star" size={16} filled />
                        <strong className="tabular">{sit.rating.toFixed(1)}</strong>
                        <span>
                          {interpolate(m.home.reviewsFrom, {
                            count: numberFmt(sit.reviewCount, locale),
                          })}
                        </span>
                      </span>
                    )}
                    <span className="st-ov st-ov-place">
                      <Sym name="location" size={14} />
                      {sit.neighbourhood}
                    </span>
                  </div>

                  <div className="st-sitter-top">
                    <div>
                      <h3 className="st-sitter-name">{sit.firstName} {sit.lastNameInitial}.</h3>
                      <p className="st-sitter-sub">
                        {interpolate(m.home.sitterReplies, {
                          hours: String(Math.max(1, Math.round(sit.responseMinutes / 60))),
                        })}
                      </p>
                    </div>
                    <div className="st-sitter-pricebox">
                      <span className="st-sitter-price tabular">{money(sit.priceCents, locale)}</span>
                      <span className="st-sitter-unit">/ {m.unit[SERVICES.boarding.unit]}</span>
                    </div>
                  </div>

                  <div className="st-traits">
                    <span className="st-trait st-trait-key">
                      <Sym name="verified" size={14} />
                      {m.home.traitChecked}
                    </span>
                    {sit.yardFenced && <span className="st-trait">{m.searchPage.yard}</span>}
                    {sit.acceptsCats && <span className="st-trait">{m.searchPage.cats}</span>}
                  </div>

                  <div className="st-sitter-foot">
                    <span className="st-sitter-verified">
                      <Sym name="shield" size={16} />
                      {m.home.traitIdentity}
                    </span>
                    <Link href={`/${s}/${slug}/sitter/${sit.slug}/`} className="st-ghost-btn">
                      {m.home.sitterViewProfile}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== UC ADIM ===================== */}
      <section className="st-section">
        <div className="st-wrap">
          <div className="st-head-centre">
            <span className="st-eyebrow">{m.home.stepsEyebrow}</span>
            <h2 className="st-h2">{m.home.stepsHeading}</h2>
            <p className="st-head-note">{m.home.stepsLead}</p>
          </div>

          <ol className="st-steps">
            {([
              [m.home.step1Title, m.home.step1Body, m.home.step1Tag, 'verified', 'sage'],
              [m.home.step2Title, m.home.step2Body, m.home.step2Tag, 'people', 'coral'],
              [m.home.step3Title, m.home.step3Body, m.home.step3Tag, 'chat', 'gold'],
            ] as const).map(([title, body, tag, icon, tone], i) => (
              <li key={title} className={`st-step st-tone-${tone}`}>
                <span className="st-step-num" aria-hidden="true">{i + 1}</span>
                <h3 className="st-step-title">{title}</h3>
                <p className="st-step-body">{body}</p>
                <span className="st-step-tag">
                  <Sym name={icon as SymName} size={18} />
                  {tag}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===================== GUVEN PANELI ===================== */}
      <section className="st-section st-section-container">
        <div className="st-wrap">
          <div className="st-shield">
            <div className="st-shield-blob" aria-hidden="true"></div>
            <div className="st-shield-grid">
              <div className="st-shield-copy">
                <span className="st-shield-eyebrow">
                  <Sym name="shield" size={18} />
                  {m.home.shieldEyebrow}
                </span>
                <h2 className="st-shield-title">{m.home.shieldHeading}</h2>
                <p className="st-shield-lead">{m.home.shieldLead}</p>
              </div>

              <div className="st-pillars">
                {([
                  ['health', m.home.shield1Title, m.home.shield1Body],
                  ['verified', m.home.shield2Title, m.home.shield2Body],
                  ['lock', m.home.shield3Title, m.home.shield3Body],
                  ['globe', m.home.shield4Title, m.home.shield4Body],
                ] as const).map(([icon, title, body]) => (
                  <div key={title} className="st-pillar">
                    <Sym name={icon as SymName} size={28} className="st-pillar-icon" />
                    <h3 className="st-pillar-title">{title}</h3>
                    <p className="st-pillar-body">{body}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="st-shield-note">{m.home.shieldNotInsurance}</p>
          </div>
        </div>
      </section>

      {/* ===================== YORUMLAR ===================== */}
      {reviews.length > 0 && (
        <section className="st-section">
          <div className="st-wrap">
            <div className="st-head">
              <div>
                <span className="st-eyebrow">{m.home.reviewsEyebrow}</span>
                <h2 className="st-h2">{m.home.reviewsHeading}</h2>
              </div>
              <span className="st-chip">
                <Sym name="verified" size={18} />
                {m.home.reviewsLead}
              </span>
            </div>

            <div className="st-grid-3">
              {reviews.map((r) => (
                <figure key={r.id} className="st-review">
                  <span className="st-stars" aria-label={`${r.rating} / 5`}>
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Sym key={i} name="star" size={18} filled={i < Math.round(r.rating)} />
                    ))}
                  </span>
                  <blockquote className="st-review-body">{r.body}</blockquote>
                  <figcaption className="st-review-by">
                    <Avatar
                      initials={`${r.authorFirstName.charAt(0)}${r.authorInitial}`}
                      src={r.authorAvatarUrl}
                      size={40}
                    />
                    <span>
                      <span className="st-review-name">{r.authorFirstName} {r.authorInitial}.</span>
                      <span className="st-review-meta">
                        {interpolate(m.home.reviewFor, { sitter: r.sitterFirstName })}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===================== BAKICI DAVETI ===================== */}
      <section className="st-section st-section-last">
        <div className="st-wrap">
          <div className="st-cta">
            <div className="st-cta-copy">
              <span className="st-cta-eyebrow">{m.home.sitterCtaEyebrow}</span>
              <h2 className="st-cta-title">{m.home.sitterCtaHeading}</h2>
              <p className="st-cta-body">{m.home.sitterCtaBody}</p>
            </div>
            <Link href={`/${s}/become-a-sitter/`} className="st-cta-btn">
              <span>{m.nav.becomeSitter}</span>
              <Sym name="arrow-right" size={22} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
