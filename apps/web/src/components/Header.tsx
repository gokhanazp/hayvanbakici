import Link from 'next/link';
import { servicesForPhase, type ServiceType } from '@havre/core';
import { getMessages, LOCALES, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { HeaderAccount } from '@/components/auth/HeaderAccount';
import { SitterCta } from '@/components/auth/SitterCta';
import { NavDismiss } from '@/components/NavDismiss';
import { SocialLinks } from '@/components/SocialLinks';
import { Sym } from '@/components/Sym';
import { ServiceIcon, SERVICE_TILE } from '@/components/ServiceIcon';

/**
 * SITE BASLIGI — Stitch tasarimindaki bar.
 *
 * YAPISI: sol tarafta marka ve "CAD ($) · EN" cipi, ortada HAP GRUP
 * halinde gezinme (grubun kendi acik zemini var, aktif oge beyaz bir
 * hapla uzerinde duruyor), sagda mercan "Bakici ol" dugmesi, uc ikon
 * dugmesi ve hesap cipi. Bar yari saydam ve arkasini bulaniklastiriyor.
 *
 * UST SERIT KALKTI. Onceden basligin uzerinde koyu bir serit vardi
 * (site sozu + sosyal hesaplar + dil). Tasarimda boyle bir serit yok:
 * dil basligin icinde bir cip, sosyal hesaplar alt bilgide. Serit
 * ayrica her sayfada 40 piksel calip ilk ekrani kisaltiyordu.
 *
 * HALA JAVASCRIPT YOK: hizmet menusu ve mobil cekmece <details>
 * uzerine kurulu, aktif gezinme ogesi sunucuda isaretleniyor. Tek
 * istemci parcasi HeaderAccount (oturum) ve SitterCta (duruma gore
 * konusan dugme) — ikisi de bilincli olarak ayri.
 */
const SERVICES = servicesForPhase('v1');

export function Header({ locale, citySlug: city }: { locale: Locale; citySlug: string }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const serviceHref = (s: ServiceType) => `/${seg}/${city}/${serviceSlug(s, locale)}/`;

  return (
    <header className="hd">
      <NavDismiss />

      {/*
        UST SERIT.

        Baslik cok kalabaliklasmisti: marka, para/dil cipi, hap grup
        gezinme, birincil dugme, uc yuvarlak ikon ve hesap cipi tek
        satirdaydi. Fransizca'da bu satir 1440 pikselde tasiyordu bile.

        Ikincil olan her sey (dil, iletisim, sosyal hesaplar) bu ince
        seride cikti. Asil baslikta yalnizca gezinmek ve hesap kaldi.

        Telefonda GIZLI: 390 pikselde ikinci bir serit, ekranin ustunden
        iceriği iter ve buradaki hicbir sey o ekranda ilk is degil.
        Dil secimi ayrica alt bilgide de var.
      */}
      <div className="tb">
        <div className="st-wrap tb-in">
          <div className="tb-left">
            <Link href={`/${seg}/contact/`} className="tb-link">
              <Sym name="chat" size={15} />
              {m.footer.contact}
            </Link>
            <Link href={`/${seg}/help/`} className="tb-link">
              <Sym name="help" size={15} />
              {m.footer.help}
            </Link>
          </div>

          <div className="tb-right">
            <SocialLinks size={15} className="tb-social" />

            {/*
              PARA BIRIMI VE DIL. Tasarimda "CAD ($) · EN". Para birimi
              SABIT: tek para birimiyle calisiyoruz ve bir secici koymak
              olmayan bir secenek vaat ederdi. Dil kismi gercek baglanti.
            */}
            <div className="hd-chip" role="group" aria-label={m.footer.languageLabel}>
              <Sym name="globe" size={15} />
              <span>{m.header.currency}</span>
              <span className="hd-chip-sep" aria-hidden="true">·</span>
              {LOCALES.map((l, i) => (
                <span key={l} className="hd-chip-lang">
                  {i > 0 && <span className="hd-chip-sep" aria-hidden="true">/</span>}
                  <Link
                    href={`/${segmentFor(l)}`}
                    hrefLang={l}
                    className={l === locale ? 'is-on' : undefined}
                    aria-current={l === locale ? 'true' : undefined}
                  >
                    {segmentFor(l).toUpperCase()}
                  </Link>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="st-wrap hd-bar">
        {/* ---------------- Sol: marka + para/dil cipi ---------------- */}
        <div className="hd-left">
          <Link href={`/${seg}`} className="hd-brand" aria-label={m.brand.name}>
            <span className="hd-mark" aria-hidden="true">
              <Sym name="house" size={22} />
            </span>
            {/*
              Tasarimda marka iki satir: ustte ad, altinda ulke
              ("PawPal" / "Canada"). Bizde ad tek kelime, ikinci satir
              Kanada vurgusunu tasiyor -- ayni silueti veriyor ve
              soyledigi sey dogru.
            */}
            <span className="hd-word">
              <span className="hd-word-a">{m.brand.name}</span>
              <span className="hd-word-b">{m.header.brandLine}</span>
            </span>
          </Link>

        </div>

        {/* ---------------- Orta: hap grup gezinme ---------------- */}
        <nav className="hd-nav" aria-label={m.menu.forOwners}>
          <details className="hd-menu">
            <summary className="hd-link">
              {m.menu.services}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </summary>
            <div className="hd-panel">
              {SERVICES.map((s, i) => (
                <Link key={s} href={serviceHref(s)} className="hd-panel-item">
                  <span
                    className="hd-panel-icon"
                    style={{
                      background: `var(--color-${SERVICE_TILE[i % SERVICE_TILE.length]})`,
                      color: `var(--color-${SERVICE_TILE[i % SERVICE_TILE.length]}-ink)`,
                    }}
                    aria-hidden="true"
                  >
                    <ServiceIcon service={s} size={20} />
                  </span>
                  <span className="hd-panel-text">
                    <span className="hd-panel-title">{m.service[s]}</span>
                    <span className="hd-panel-sub">{m.serviceDescription[s]}</span>
                  </span>
                </Link>
              ))}
            </div>
          </details>

          <Link href={`/${seg}/search/`} className="hd-link">{m.header.findSitters}</Link>
          <Link href={`/${seg}/how-it-works/`} className="hd-link">{m.nav.howItWorks}</Link>
          {/* Ucret seffafligi menude kaliyor — rakiplere karsi en guclu hamle */}
          <Link href={`/${seg}/pricing/`} className="hd-link">{m.nav.pricing}</Link>
        </nav>

        {/* ---------------- Sag: eylem, ikonlar, hesap ---------------- */}
        <div className="hd-right">
          <SitterCta locale={locale} className="hd-cta" />

          <div className="hd-icons">
            <Link href={`/${seg}/help/`} className="hd-icon" title={m.footer.help} aria-label={m.footer.help}>
              <Sym name="help" size={22} />
            </Link>
            <Link
              href={`/${seg}/favourites/`}
              className="hd-icon"
              title={m.favourites.tab}
              aria-label={m.favourites.tab}
            >
              <Sym name="heart" size={22} />
            </Link>
            <Link
              href={`/${seg}/account/messages/`}
              className="hd-icon"
              title={m.messages.tab}
              aria-label={m.messages.tab}
            >
              <Sym name="chat" size={22} />
            </Link>
          </div>

          <span className="hd-account">
            <HeaderAccount locale={locale} />
          </span>

          {/* ---------------- Mobil cekmece ---------------- */}
          <details className="nav-drawer">
            <summary className="nav-drawer-toggle" aria-label={m.menu.open}>
              <svg className="nav-drawer-bars" width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
              <svg className="nav-drawer-close" width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </summary>

            <div className="nav-drawer-panel">
              <p className="nav-drawer-heading">{m.menu.services}</p>
              <div className="nav-drawer-services">
                {SERVICES.map((s, i) => (
                  <Link key={s} href={serviceHref(s)} className="nav-drawer-card">
                    <span
                      className="nav-drawer-tile"
                      style={{
                        background: `var(--color-${SERVICE_TILE[i % SERVICE_TILE.length]})`,
                        color: `var(--color-${SERVICE_TILE[i % SERVICE_TILE.length]}-ink)`,
                      }}
                      aria-hidden="true"
                    >
                      <ServiceIcon service={s} size={22} />
                    </span>
                    <span className="nav-drawer-card-title">{m.service[s]}</span>
                  </Link>
                ))}
              </div>

              <p className="nav-drawer-heading">{m.menu.forOwners}</p>
              <Link href={`/${seg}/search/`} className="nav-drawer-item">{m.header.findSitters}</Link>
              <Link href={`/${seg}/how-it-works/`} className="nav-drawer-item">{m.nav.howItWorks}</Link>
              <Link href={`/${seg}/protection/`} className="nav-drawer-item">{m.nav.protection}</Link>
              <Link href={`/${seg}/pricing/`} className="nav-drawer-item">{m.nav.pricing}</Link>
              <Link href={`/${seg}/become-a-sitter/`} className="nav-drawer-item">{m.nav.becomeSitter}</Link>
              <Link href={`/${seg}/help/`} className="nav-drawer-item">{m.footer.help}</Link>

              <p className="nav-drawer-heading">{m.account.title}</p>
              <HeaderAccount locale={locale} variant="drawer" />

              <div className="nav-drawer-foot">
                <SitterCta locale={locale} className="hd-cta hd-cta-block" />
                <div className="drawer-lang" role="group" aria-label={m.footer.languageLabel}>
                  {LOCALES.map((l) => (
                    <Link
                      key={l}
                      href={`/${segmentFor(l)}`}
                      hrefLang={l}
                      className={l === locale ? 'drawer-lang-on' : undefined}
                      aria-current={l === locale ? 'true' : undefined}
                    >
                      {l === 'fr-CA' ? 'Français' : 'English'}
                    </Link>
                  ))}
                </div>
                <SocialLinks size={18} />
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
