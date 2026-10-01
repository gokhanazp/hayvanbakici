import Link from 'next/link';
import { servicesForPhase } from '@havre/core';
import {
  getMessages, interpolate, LOCALES, segmentFor, serviceSlug, type Locale,
} from '@havre/i18n';
import { Sym } from '@/components/Sym';
import { SocialLinks } from '@/components/SocialLinks';
import { cityName, citySlug, type CityRecord } from '@/lib/data';

/**
 * SITE ALT BILGISI — Stitch tasarimindaki dort sutun.
 *
 * YAPISI: marka + soz + rozetler (4 sutun), Hizmetler (2), Guven ve
 * guvenlik (3), Havre (3); altta telif satiri ve hukuki baglantilar.
 *
 * BULTEN SUTUNU YOK. Tasarimda dorduncu sutun "Monthly Paw Newsletter"
 * kayit kutusuydu. Kanada'da CASL acik riza, riza kaydi ve her postada
 * abonelikten cikma zorunlu kiliyor; hicbiri hazir degilken bir e-posta
 * kutusu koymak tutulmayan bir soz olurdu. Yeri Havre baglantilarina
 * verildi, dort sutunlu ritim bozulmadi.
 *
 * Bu blok dekoratif degil, uc isi birden yapiyor:
 *
 * 1) IC BAGLANTI. Programatik SEO'da sehir sayfalarina giden en tutarli
 *    baglanti kaynagi alt bilgidir. AMA yalnizca ARZ ESIGINI GECEN ve
 *    ACIK olan sehirler listelenir.
 *
 * 2) YASAL GORUNURLUK. Law 25: gizlilik sorumlusunun adi SITEDE
 *    yayimlanmali. "Havre Protection" sigorta DEGIL ve her sayfada
 *    boyle isaretlenmeli. Adli sicil ifadesi "vulnerable sector check"
 *    IDDIASI icermiyor.
 *
 * 3) DIL. Bill 96: Fransizca surum her yerde bir tik uzakta olmali.
 */
export function Footer({
  locale,
  cities,
}: {
  locale: Locale;
  /** Yalnizca arz esigini gecmis ve ACIK sehirler — cagiran taraf filtreler. */
  cities: CityRecord[];
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const services = servicesForPhase('v1');
  const firstCity = cities[0];

  return (
    <footer className="ft">
      <div className="st-wrap">
        <div className="ft-grid">
          {/* ---------------- Marka ---------------- */}
          <div className="ft-brand">
            <span className="ft-brand-row">
              <span className="hd-mark" aria-hidden="true">
                <Sym name="house" size={22} />
              </span>
              <span className="hd-word">
                <span className="hd-word-a">{m.brand.name}</span>
                <span className="hd-word-b">{m.header.brandLine}</span>
              </span>
            </span>

            <p className="ft-promise">{m.footer.promise}</p>

            <div className="ft-badges">
              {/*
                Rozetler tasarimdaki "Coast-to-Coast Care" ve "Canadian
                Owned"in yerinde. Ikisi de bizde dogru degildi: tek
                sehirdeyiz. Yerlerinde kodun gercekten yaptigi iki sey
                duruyor.
              */}
              <span className="ft-badge ft-badge-key">
                <Sym name="verified" size={14} />
                {m.footer.badgeChecked}
              </span>
              <span className="ft-badge">
                <Sym name="globe" size={14} />
                {m.footer.badgeCanada}
              </span>
            </div>

            <SocialLinks size={18} />
          </div>

          {/* ---------------- Hizmetler ---------------- */}
          <div className="ft-col">
            <h2 className="ft-head">{m.footer.servicesHeading}</h2>
            <ul className="ft-list">
              {services.map((s) => (
                <li key={s}>
                  {firstCity ? (
                    <Link href={`/${seg}/${citySlug(firstCity, locale)}/${serviceSlug(s, locale)}/`}>
                      {m.service[s]}
                    </Link>
                  ) : (
                    <Link href={`/${seg}/search/`}>{m.service[s]}</Link>
                  )}
                </li>
              ))}
            </ul>

            {cities.length > 0 && (
              <>
                <h2 className="ft-head" style={{ marginTop: 'var(--space-4)' }}>
                  {m.footer.citiesHeading}
                </h2>
                <ul className="ft-list">
                  {cities.map((c) => (
                    <li key={c.id}>
                      <Link href={`/${seg}/${citySlug(c, locale)}/${serviceSlug('boarding', locale)}/`}>
                        {cityName(c, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* ---------------- Guven ve guvenlik ---------------- */}
          <div className="ft-col ft-col-wide">
            <h2 className="ft-head">{m.footer.trustHeading}</h2>
            <ul className="ft-trust">
              <li>
                <Sym name="shield" size={18} />
                <span>{m.footer.trustGuarantee}</span>
              </li>
              <li>
                <Sym name="verified" size={18} />
                <span>{m.footer.trustChecks}</span>
              </li>
              <li>
                <Sym name="calendar" size={18} />
                <span>{m.footer.trustExpiry}</span>
              </li>
              <li>
                <Sym name="lock" size={18} />
                <span>{m.footer.trustData}</span>
              </li>
            </ul>
          </div>

          {/* ---------------- Havre ---------------- */}
          <div className="ft-col ft-col-wide">
            <h2 className="ft-head">{m.footer.companyHeading}</h2>
            <ul className="ft-list">
              <li><Link href={`/${seg}/how-it-works/`}>{m.nav.howItWorks}</Link></li>
              <li><Link href={`/${seg}/protection/`}>{m.nav.protection}</Link></li>
              <li><Link href={`/${seg}/pricing/`}>{m.nav.pricing}</Link></li>
              <li><Link href={`/${seg}/become-a-sitter/`}>{m.nav.becomeSitter}</Link></li>
              <li><Link href={`/${seg}/help/`}>{m.footer.help}</Link></li>
              <li><Link href={`/${seg}/contact/`}>{m.footer.contact}</Link></li>
            </ul>
          </div>
        </div>

        <div className="ft-bottom">
          <div className="ft-notes">
            <p>{interpolate(m.footer.rights, { year: new Date().getFullYear() })}</p>
            {/* Law 25: gizlilik sorumlusu SITEDE yayimlanmali. */}
            <p>{m.footer.privacyOfficer}: {m.footer.privacyOfficerValue}</p>
            <p>{m.verification.disclaimer}</p>
            {/* Sigorta DEGIL — her sayfada gorunur olmali. */}
            <p>{m.footer.notInsurance}</p>
          </div>

          <div className="ft-legal">
            <Link href={`/${seg}/legal/terms/`}>{m.footer.terms}</Link>
            <Link href={`/${seg}/legal/privacy/`}>{m.footer.privacy}</Link>
            <Link href={`/${seg}/legal/cookies/`}>{m.footer.cookies}</Link>
            <Link href={`/${seg}/legal/accessibility/`}>{m.footer.accessibility}</Link>
            <Link href={`/${seg}/legal/sitter-agreement/`}>{m.footer.sitterAgreement}</Link>
            <span className="ft-legal-mark" role="group" aria-label={m.footer.languageLabel}>
              <Sym name="globe" size={16} />
              {m.header.currency}
              {LOCALES.map((l) => (
                <Link
                  key={l}
                  href={`/${segmentFor(l)}`}
                  hrefLang={l}
                  aria-current={l === locale ? 'true' : undefined}
                  style={l === locale ? { fontWeight: 700 } : undefined}
                >
                  {l === 'fr-CA' ? 'Français' : 'English'}
                </Link>
              ))}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
