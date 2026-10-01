import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, segmentFor, serviceSlug } from '@havre/i18n';
import { servicesForPhase, SERVICES, type ServiceType } from '@havre/core';
import { SearchBar } from '@/components/SearchBar';
import { ServiceIcon, SERVICE_TILE } from '@/components/ServiceIcon';
import { Photo } from '@/components/Photo';
import { Avatar } from '@/components/Avatar';
import { ShieldIcon } from '@/components/VerificationBadge';
import {
  cityName, citySlug, getDefaultCity, getFeaturedReviews, getLandingData,
} from '@/lib/data';
import { money, numberFmt } from '@/lib/format';

/**
 * ANASAYFA — "Warm Paw" yerlesimi.
 *
 * Tasarim Stitch'te uretildi (stitch_evcil_hayvan_bak_c_platformu/
 * home_discovery_pawpal_canada). YERLESIM oradan birebir alindi;
 * METINLER bizim, cunku tasarimin metinleri bu urunun yapmadigi
 * seyleri soyluyordu:
 *
 *   "4.96 / 5.0 — 45.000+ tail-wags"   -> uydurma sayi
 *   "12.840 Active Sitters"            -> uydurma sayi
 *   "100% RCMP Screened"               -> RCMP federal polis; taramayi
 *                                         bir saglayici yapiyor
 *   "$2,000,000 CAD Vet Coverage"      -> sigortamiz yok
 *   "24/7 Canadian Vet Line"           -> yok
 *   "Daily GPS & Live Photo Updates"   -> yok
 *   "Toronto, Vancouver, Calgary..."   -> yalnizca Toronto acik
 *   Isimli musteri yorumlari           -> uydurma
 *
 * Her kutunun yerine kodun GERCEKTEN yaptigi sey yazildi; sayilar
 * veritabanindan geliyor. Bos kalan yerler yer tutucu, uydurma degil.
 *
 * ISR: bakici sayisi ve medyan fiyat degisiyor, saatte bir tazeleniyor.
 */
export const revalidate = 3600;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);
  const services = servicesForPhase('v1');
  const city = await getDefaultCity();

  /*
    DORT HIZMETIN DE KENDI FIYAT ARALIGI VAR.

    Hizmet kartlarinda "su fiyattan baslar" yaziyor ve bu dort ayri
    sorgu demek. Sayfa ISR ile saatte bir uretildigi icin bedeli
    saatte dort sorgu; karsiliginda kartlar TEK bir ortalamayi dort
    kez tekrarlamiyor.
  */
  const [landings, reviews] = await Promise.all([
    Promise.all(services.map((s) => getLandingData(city, s, locale))),
    getFeaturedReviews(3),
  ]);
  const boarding = landings[0]!;
  const byService = new Map(services.map((s, i) => [s, landings[i]!]));

  const cityLabel = cityName(city, locale);
  const slug = citySlug(city, locale);

  /*
    BASLIKTAKI VURGULU KELIME. Tasarimda bir kelimenin altinda dalgali
    bir cizgi var. Kelime ayri bir anahtar cunku Fransizcada cumledeki
    yeri degisiyor; baslik {accent} yer tutucusunu nereye koyarsa
    vurgu oraya dusuyor.
  */
  const [titleBefore, titleAfter] = m.home.heroTitle.split('{accent}');

  return (
    <>
      {/* ================= KAHRAMAN ================= */}
      <section className="hp-hero">
        <div className="hp-hero-glow hp-hero-glow-a" aria-hidden="true"></div>
        <div className="hp-hero-glow hp-hero-glow-b" aria-hidden="true"></div>

        <div className="container hp-hero-inner">
          <div className="hp-hero-grid">
            <div className="hp-hero-copy">
              <span className="hp-eyebrow">
                <ShieldIcon size={14} />
                {m.home.heroBadge}
              </span>

              <h1 className="hp-hero-title">
                {titleBefore}
                <span className="hp-underline">{m.home.heroAccent}</span>
                {titleAfter}
              </h1>

              <p className="hp-hero-lead">{m.home.heroSubtitle}</p>

              <div className="hp-hero-pills">
                <span className="hp-pill">
                  <strong className="tabular">{numberFmt(boarding.sitterCount, locale)}</strong>
                  {interpolate(m.home.statSittersIn, { city: cityLabel }).replace(
                    String(numberFmt(boarding.sitterCount, locale)), '',
                  ).trim()}
                </span>
                <span className="hp-pill hp-pill-sage">
                  <ShieldIcon size={14} />
                  {m.home.heroPillChecks}
                </span>
              </div>
            </div>

            {/*
              FOTOGRAF + USTUNE BINEN KART.

              Tasarimda buraya bir bakici fotografi ve uzerine iki yuzen
              rozet geliyor. Rozetlerden biri uydurma bir sayiydi
              ("12.840 Active Sitters"); yerine bu sehrin GERCEK bakici
              sayisi ve medyan fiyati kondu.
            */}
            <div className="hp-hero-art">
              <div className="hp-hero-photo">
                <Photo id="sitter-banner" locale={locale} alt={m.home.heroPhotoAlt} priority />
              </div>

              <div className="hp-float hp-float-stats">
                <div className="hp-float-icon" aria-hidden="true">
                  <ServiceIcon service="boarding" size={22} />
                </div>
                <div>
                  <p className="hp-float-value tabular">
                    {numberFmt(boarding.sitterCount, locale)}
                  </p>
                  <p className="hp-float-label">
                    {interpolate(m.home.statSittersIn, { city: cityLabel }).replace(
                      String(numberFmt(boarding.sitterCount, locale)), '',
                    ).trim()}
                  </p>
                </div>
              </div>

              {boarding.medianPriceCents > 0 && (
                <div className="hp-float hp-float-price">
                  <span className="hp-float-value tabular">
                    {money(boarding.medianPriceCents, locale)}
                  </span>
                  <span className="hp-float-label">{m.home.statPrice}</span>
                </div>
              )}
            </div>
          </div>

          {/* ---- Yuzen arama kutusu ---- */}
          <div className="hp-search">
            <SearchBar locale={locale} />
            <ul className="hp-ribbon">
              <li>
                <CheckMark />
                {m.home.ribbonFees}
              </li>
              <li>
                <CheckMark />
                {m.home.ribbonExpiry}
              </li>
              <li>
                <CheckMark />
                {m.home.ribbonCanada}
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ================= HIZMETLER ================= */}
      <section className="container hp-section">
        <h2 className="hp-h2">{m.home.servicesHeading}</h2>
        <p className="hp-lead">{m.home.servicesLead}</p>

        <div className="hp-services">
          {services.map((s, i) => {
            const tile = SERVICE_TILE[i % SERVICE_TILE.length]!;
            const d = byService.get(s);
            const from = d && d.p25PriceCents > 0 ? d.p25PriceCents : 0;
            return (
              <Link
                key={s}
                href={`/${segmentFor(locale)}/${slug}/${serviceSlug(s, locale)}/`}
                className="hp-service"
              >
                <span
                  className="hp-service-tile"
                  style={{
                    background: `var(--color-${tile})`,
                    color: `var(--color-${tile}-ink)`,
                  }}
                  aria-hidden="true"
                >
                  <ServiceIcon service={s} size={24} />
                </span>
                <span className="hp-service-name">{m.service[s]}</span>
                <span className="hp-service-body">{m.serviceDescription[s]}</span>
                <span className="hp-service-price">
                  {from > 0
                    ? interpolate(m.home.serviceFrom, { price: money(from, locale) })
                    : m.home.serviceNoPrice}
                  {from > 0 && (
                    <span className="hp-service-unit"> / {m.unit[SERVICES[s].unit]}</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ================= BAKICILAR ================= */}
      {boarding.sitters.length > 0 && (
        <section className="container hp-section">
          <div className="hp-section-head">
            <div>
              <h2 className="hp-h2">
                {interpolate(m.home.sittersHeading, { city: cityLabel })}
              </h2>
              <p className="hp-lead">{m.home.sittersLead}</p>
            </div>
            <Link
              href={`/${segmentFor(locale)}/${slug}/${serviceSlug('boarding', locale)}/`}
              className="btn btn-secondary"
            >
              {m.home.sittersAll}
            </Link>
          </div>

          <div className="hp-sitters">
            {boarding.sitters.slice(0, 3).map((s) => (
              <article key={s.id} className="hp-sitter">
                <div className="hp-sitter-photo">
                  <Avatar initials={s.photoInitials} src={s.avatarUrl} size={96} />
                </div>
                <div className="hp-sitter-body">
                  <div className="hp-sitter-row">
                    <h3 className="hp-sitter-name">
                      {s.firstName} {s.lastNameInitial}.
                    </h3>
                    <span className="hp-sitter-price tabular">
                      {money(s.priceCents, locale)}
                      <span className="hp-sitter-unit">
                        {' '}/ {m.unit[SERVICES.boarding.unit]}
                      </span>
                    </span>
                  </div>
                  <p className="hp-sitter-hood">{s.neighbourhood}</p>

                  <div className="hp-sitter-tags">
                    {s.acceptsCats && <span className="hp-tag">{m.onboarding['services.cats']}</span>}
                    {s.yardFenced && <span className="hp-tag">{m.searchPage.yard}</span>}
                    {/*
                      YORUM SAYISI SIFIRSA YILDIZ YOK. Tasarimda her kartta
                      "5.0 (42)" yaziyordu; yorumu olmayan bir bakiciyi
                      besyildizli gostermek, kazanilmamis bir itibar.
                    */}
                    {s.reviewCount > 0 && (
                      <span className="hp-tag hp-tag-rating tabular">
                        ★ {s.rating.toFixed(1)} ({numberFmt(s.reviewCount, locale)})
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/${segmentFor(locale)}/${slug}/sitter/${s.slug}/`}
                    className="hp-sitter-link"
                  >
                    {m.home.sitterViewProfile}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ================= UC ADIM ================= */}
      <section className="hp-band">
        <div className="container hp-section">
          <h2 className="hp-h2">{m.home.stepsHeading}</h2>
          <p className="hp-lead">{m.home.stepsLead}</p>

          <ol className="hp-steps">
            {([
              [m.home.step1Title, m.home.step1Body],
              [m.home.step2Title, m.home.step2Body],
              [m.home.step3Title, m.home.step3Body],
            ] as const).map(([title, body], i) => (
              <li key={title} className="hp-step">
                <span className="hp-step-num" aria-hidden="true">{i + 1}</span>
                <h3 className="hp-step-title">{title}</h3>
                <p className="hp-step-body">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= GUVEN PANELI ================= */}
      <section className="container hp-section">
        <div className="hp-shield">
          <div className="hp-shield-head">
            <h2 className="hp-shield-title">{m.home.shieldHeading}</h2>
            <p className="hp-shield-lead">{m.home.shieldLead}</p>
          </div>

          <div className="hp-pillars">
            {([
              [m.home.shield1Title, m.home.shield1Body],
              [m.home.shield2Title, m.home.shield2Body],
              [m.home.shield3Title, m.home.shield3Body],
              [m.home.shield4Title, m.home.shield4Body],
            ] as const).map(([title, body]) => (
              <div key={title} className="hp-pillar">
                <h3 className="hp-pillar-title">{title}</h3>
                <p className="hp-pillar-body">{body}</p>
              </div>
            ))}
          </div>

          {/*
            SIGORTA DEGIL. Tasarim buraya "$2,000,000 CAD Vet Coverage"
            yaziyordu. Boyle bir policemiz yok ve koruma sayfamiz zaten
            bunun bir SIRKET GARANTISI oldugunu soyluyor; ayni cumle
            burada da duruyor, kucuk puntoda saklanmiyor.
          */}
          <p className="hp-shield-note">{m.home.shieldNotInsurance}</p>
        </div>
      </section>

      {/* ================= YORUMLAR ================= */}
      {reviews.length > 0 && (
        <section className="container hp-section">
          <h2 className="hp-h2">{m.home.reviewsHeading}</h2>
          <p className="hp-lead">{m.home.reviewsLead}</p>

          <div className="hp-reviews">
            {reviews.map((r) => (
              <figure key={r.id} className="hp-review">
                <div className="hp-review-stars" aria-label={`${r.rating} / 5`}>
                  {'★'.repeat(Math.round(r.rating))}
                </div>
                <blockquote className="hp-review-body">{r.body}</blockquote>
                <figcaption className="hp-review-by">
                  <Avatar
                    initials={`${r.authorFirstName.charAt(0)}${r.authorInitial}`}
                    src={r.authorAvatarUrl}
                    size={36}
                  />
                  <span>
                    <span className="hp-review-name">
                      {r.authorFirstName} {r.authorInitial}.
                    </span>
                    <span className="hp-review-meta">{r.sitterFirstName}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* ================= BAKICI DAVETI ================= */}
      <section className="container hp-section">
        <div className="hp-cta">
          <div>
            <h2 className="hp-cta-title">{m.home.sitterCtaHeading}</h2>
            <p className="hp-cta-body">{m.home.sitterCtaBody}</p>
          </div>
          <Link href={`/${segmentFor(locale)}/become-a-sitter/`} className="hp-cta-btn">
            {m.nav.becomeSitter}
          </Link>
        </div>
      </section>
    </>
  );
}

/** Serit ve liste isaretleri — ayni cizim uc yerde kullaniliyor */
function CheckMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
