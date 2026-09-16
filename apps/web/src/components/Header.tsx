import Link from 'next/link';
import { servicesForPhase, type ServiceType } from '@havre/core';
import { getMessages, LOCALES, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { Wordmark } from '@/components/Wordmark';
import { HeaderAccount } from '@/components/auth/HeaderAccount';
import { SitterCta } from '@/components/auth/SitterCta';
import { NavDismiss } from '@/components/NavDismiss';
import { SocialLinks } from '@/components/SocialLinks';

/**
 * SITE BASLIGI.
 *
 * NEDEN JAVASCRIPT YOK: hem hizmet menusu hem mobil cekmece <details>/<summary>
 * uzerine kurulu. Boylece baslik SUNUCU BILESENI olarak kaliyor — istemciye
 * tek satir JS gitmiyor, klavye ve ekran okuyucu davranisi tarayicidan
 * geliyor, ve JS yuklenmeden once de calisiyor. Tek istemci parcasi
 * HeaderAccount (oturum durumu), o da bilincli olarak ayri.
 *
 * TEK ISTISNA — NavDismiss: <details> disariya tiklandiginda kapanmaz ve
 * menu acik kalirdi. O bilesen yalnizca kapatmayi ekliyor; acma/kapama
 * hala tarayicinin isi ve JS yuklenmeden once de calisiyor.
 *
 * IKI KATLI: ust serit + ana cubuk.
 *
 * NEDEN: tek sirada yedi ayri is vardi — marka, hizmet menusu, dort
 * baglanti, dil, giris, ana dugme. Hepsi ayni yukseklikte yarisinca
 * cubuk dar ve kalabalik okunuyordu. Ikincil olanlar (dil, sosyal
 * hesaplar, sitenin iki sozu) UST SERIDE tasindi; ana cubukta yalnizca
 * gezinme ve eylem kaldi.
 *
 * SERIT KAYARAK GIDER, CUBUK KALIR: baslik `top: -serit yuksekligi` ile
 * yapistiriliyor, dolayisiyla serit yalnizca sayfanin tepesinde
 * goruluyor; asagi kaydirinca ekranda eskisi kadar yer kapliyor.
 *
 * DIL SECIMI: IP tabanli otomatik yonlendirme YOK (yol haritasi §7.2).
 * Googlebot cogunlukla ABD IP'sinden gelir; otomatik yonlendirme fr-CA
 * sayfalarinin hic taranmamasina yol acar.
 */

const SERVICES = servicesForPhase('v1');

/** Menudeki hizmetler ornek sehre baglanir — hizmet hub sayfalari henuz yok. */
export function Header({ locale, citySlug }: { locale: Locale; citySlug: string }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  const serviceHref = (s: ServiceType) => `/${seg}/${citySlug}/${serviceSlug(s, locale)}/`;

  return (
    <header className="site-header">
      <NavDismiss />

      {/*
        UST SERIT. Sol taraftaki cumle ana sayfanin alt basligiyla ayni
        seyi soyluyor — yeni bir iddia degil. Sagda sosyal hesaplar
        (yoksa hic cizilmiyor) ve dil secimi.
      */}
      <div className="site-strip">
        <div className="container site-strip-inner">
          <p className="site-strip-note">
            <span className="site-strip-long">{m.header.stripNote}</span>
            <span className="site-strip-short">{m.header.stripNoteShort}</span>
          </p>
          <div className="site-strip-end">
            <SocialLinks size={15} className="social-links-strip" />
            <LocaleSwitch locale={locale} />
          </div>
        </div>
      </div>

      <div className="container site-header-inner">
        <Link href={`/${seg}`} aria-label={m.brand.name}>
          <Wordmark />
        </Link>

        <nav className="site-nav" aria-label={m.menu.forOwners}>
          <details className="nav-menu">
            <summary className="nav-link">
              {m.menu.services}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </summary>
            <div className="nav-panel">
              {SERVICES.map((s) => (
                <Link key={s} href={serviceHref(s)} className="nav-panel-item">
                  <span className="nav-panel-title">{m.service[s]}</span>
                  <span className="nav-panel-sub">{m.serviceDescription[s]}</span>
                </Link>
              ))}
            </div>
          </details>

          <Link href={`/${seg}/how-it-works/`} className="nav-link">{m.nav.howItWorks}</Link>
          <Link href={`/${seg}/protection/`} className="nav-link">{m.nav.protection}</Link>
          {/* Ucret seffafligi ana menude — rakiplere karsi en guclu hamle */}
          <Link href={`/${seg}/pricing/`} className="nav-link nav-link-strong">{m.nav.pricing}</Link>
        </nav>

        <div className="site-header-actions">
          {/* Dil secimi ust seride tasindi — burasi yalnizca hesap ve eylem */}
          {/* Hesap alani dar ekranda cekmeceye tasiniyor (CSS) */}
          <span className="header-account">
            <HeaderAccount locale={locale} />
          </span>
          {/* Dugme oturuma gore konusuyor — bakiciya "Bakici ol" demiyor */}
          <SitterCta locale={locale} className="btn btn-ink header-cta" />

          {/* Mobil cekmece */}
          <details className="nav-drawer">
            <summary className="nav-drawer-toggle" aria-label={m.menu.open}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <div className="nav-drawer-panel">
              <p className="nav-drawer-heading">{m.menu.services}</p>
              {SERVICES.map((s) => (
                <Link key={s} href={serviceHref(s)} className="nav-drawer-item">{m.service[s]}</Link>
              ))}

              <p className="nav-drawer-heading">{m.menu.forOwners}</p>
              <Link href={`/${seg}/how-it-works/`} className="nav-drawer-item">{m.nav.howItWorks}</Link>
              <Link href={`/${seg}/protection/`} className="nav-drawer-item">{m.nav.protection}</Link>
              <Link href={`/${seg}/pricing/`} className="nav-drawer-item">{m.nav.pricing}</Link>

              <p className="nav-drawer-heading">{m.menu.forSitters}</p>
              <SitterCta locale={locale} className="nav-drawer-item" />

              {/*
                HESAP ISLEMLERI CEKMECEDE.

                390px'de cubukta duran "Cikis" iki satira boluniyor ve
                baslik ekrandan tasiyordu. Sabit bir "Giris yap" satiri
                degil: ayni bilesen oturumu okuyor, giris yapmis
                kullaniciya adi ve cikis gorunuyor.
              */}
              <p className="nav-drawer-heading">{m.account.title}</p>
              <HeaderAccount locale={locale} variant="drawer" />
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

/**
 * DIL SECIMI — koyu serit uzerinde.
 *
 * Alt bilgideki hap bicimli secici burada calismiyordu: koyu zeminde
 * acik bir hap, yanindaki sosyal ikonlarla yarisan ikinci bir nesne
 * olarak okunuyor. Serit uzerinde duz metin: secili olan beyaz ve
 * kalin, digeri soluk. Renk tek tasiyici degil — aria-current da var.
 */
function LocaleSwitch({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <div className="strip-lang" role="group" aria-label={m.footer.languageLabel}>
      {LOCALES.map((l, i) => {
        const active = l === locale;
        return (
          <span key={l} className="strip-lang-item">
            {i > 0 && <span className="strip-lang-sep" aria-hidden="true">/</span>}
            <Link
              href={`/${segmentFor(l)}`}
              hrefLang={l}
              className={active ? 'strip-lang-on' : undefined}
              aria-current={active ? 'true' : undefined}
            >
              {segmentFor(l).toUpperCase()}
            </Link>
          </span>
        );
      })}
    </div>
  );
}
