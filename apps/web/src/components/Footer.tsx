import Link from 'next/link';
import { servicesForPhase } from '@havre/core';
import {
  getMessages, interpolate, LOCALES, segmentFor, serviceSlug, type Locale,
} from '@havre/i18n';
import { Wordmark } from '@/components/Wordmark';
import { cityName, citySlug, type CityRecord } from '@/lib/data';

/**
 * SITE ALT BILGISI.
 *
 * Bu blok dekoratif degil, uc isi birden yapiyor:
 *
 * 1) IC BAGLANTI. Programatik SEO'da sehir sayfalarina giden en tutarli
 *    baglanti kaynagi alt bilgidir. AMA yalnizca ARZ ESIGINI GECEN sehirler
 *    listelenir — bos bir sehre baglanti vermek Google'a "bu sayfa degerli"
 *    demektir ve tum sitenin guvenini zedeler.
 *
 * 2) YASAL GORUNURLUK. Law 25: gizlilik sorumlusunun adi ve iletisimi SITEDE
 *    yayimlanmali. "Havre Protection" sigorta DEGIL ve her sayfada boyle
 *    isaretlenmeli. Adli sicil ifadesi "vulnerable sector check" IDDIASI
 *    icermiyor — o kontrolu yalnizca polis, kisinin kendi basvurusuyla yapar.
 *
 * 3) DIL. Bill 96: Fransizca surum her yerde bir tik uzakta olmali.
 */
export function Footer({
  locale,
  cities,
}: {
  locale: Locale;
  /** Yalnizca arz esigini gecmis sehirler — cagiran taraf filtreler. */
  cities: CityRecord[];
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const services = servicesForPhase('v1');
  const firstCity = cities[0];

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark size={28} />
            <p className="text-body-sm muted" style={{ marginTop: 'var(--space-4)', maxWidth: '22rem' }}>
              {m.footer.promise}
            </p>
            <div className="locale-switch locale-switch-footer" role="group" aria-label={m.footer.languageLabel}>
              {LOCALES.map((l) => (
                <Link
                  key={l}
                  href={`/${segmentFor(l)}`}
                  hrefLang={l}
                  className={l === locale ? 'locale-switch-on' : undefined}
                  aria-current={l === locale ? 'true' : undefined}
                >
                  {l === 'fr-CA' ? 'Français' : 'English'}
                </Link>
              ))}
            </div>
          </div>

          <FooterColumn heading={m.footer.servicesHeading}>
            {firstCity
              ? services.map((s) => (
                  <Link key={s} href={`/${seg}/${citySlug(firstCity, locale)}/${serviceSlug(s, locale)}/`}>
                    {m.service[s]}
                  </Link>
                ))
              : null}
          </FooterColumn>

          <FooterColumn heading={m.footer.citiesHeading}>
            {cities.map((c) => (
              <Link key={c.id} href={`/${seg}/${citySlug(c, locale)}/${serviceSlug('boarding', locale)}/`}>
                {cityName(c, locale)}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn heading={m.footer.companyHeading}>
            <Link href={`/${seg}/how-it-works/`}>{m.nav.howItWorks}</Link>
            <Link href={`/${seg}/protection/`}>{m.nav.protection}</Link>
            <Link href={`/${seg}/pricing/`}>{m.nav.pricing}</Link>
            <Link href={`/${seg}/become-a-sitter/`}>{m.nav.becomeSitter}</Link>
            <Link href={`/${seg}/blog/`}>{m.footer.blog}</Link>
            <Link href={`/${seg}/help/`}>{m.footer.help}</Link>
            <Link href={`/${seg}/contact/`}>{m.footer.contact}</Link>
          </FooterColumn>

          <FooterColumn heading={m.footer.legalHeading}>
            <Link href={`/${seg}/legal/terms/`}>{m.footer.terms}</Link>
            <Link href={`/${seg}/legal/privacy/`}>{m.footer.privacy}</Link>
            <Link href={`/${seg}/legal/cookies/`}>{m.footer.cookies}</Link>
            <Link href={`/${seg}/legal/accessibility/`}>{m.footer.accessibility}</Link>
            <Link href={`/${seg}/legal/sitter-agreement/`}>{m.footer.sitterAgreement}</Link>
          </FooterColumn>
        </div>

        <div className="footer-bottom">
          <p>{interpolate(m.footer.rights, { year: new Date().getFullYear() })}</p>
          {/* Law 25: gizlilik sorumlusu SITEDE yayimlanmali. */}
          <p className="dim">
            {m.footer.privacyOfficer}: {m.footer.privacyOfficerValue}
          </p>
          <p className="dim">{m.verification.disclaimer}</p>
          {/* Sigorta DEGIL — her sayfada gorunur olmali. */}
          <p className="dim">{m.footer.notInsurance}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <nav className="footer-col" aria-label={heading}>
      <h2 className="footer-heading">{heading}</h2>
      {children}
    </nav>
  );
}
