import Link from 'next/link';
import { servicesForPhase, type ServiceType } from '@havre/core';
import { getMessages, LOCALES, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { Wordmark } from '@/components/Wordmark';
import { HeaderAccount } from '@/components/auth/HeaderAccount';
import { SitterCta } from '@/components/auth/SitterCta';
import { NavDismiss } from '@/components/NavDismiss';
import { SocialLinks } from '@/components/SocialLinks';
import { ServiceIcon, SERVICE_TILE } from '@/components/ServiceIcon';

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
              {/*
                IKON ANA SAYFADAKI KARTIN AYNISI (components/ServiceIcon) ve
                kutucuk tonu da ayni sirada. Menuden karta gecen kullanici
                ayni hizmeti ayni renkte ve ayni sekille goruyor; once menude
                yalnizca yazi vardi ve iki ekran birbirini tanimiyordu.
              */}
              {SERVICES.map((s, i) => (
                <Link key={s} href={serviceHref(s)} className="nav-panel-item">
                  <span
                    className="nav-panel-icon"
                    style={{
                      background: `var(--color-${SERVICE_TILE[i % SERVICE_TILE.length]})`,
                      color: `var(--color-${SERVICE_TILE[i % SERVICE_TILE.length]}-ink)`,
                    }}
                    aria-hidden="true"
                  >
                    <ServiceIcon service={s} size={20} />
                  </span>
                  <span className="nav-panel-text">
                    <span className="nav-panel-title">{m.service[s]}</span>
                    <span className="nav-panel-sub">{m.serviceDescription[s]}</span>
                  </span>
                </Link>
              ))}
            </div>
          </details>

          <Link href={`/${seg}/how-it-works/`} className="nav-link">{m.nav.howItWorks}</Link>
          <Link href={`/${seg}/protection/`} className="nav-link">{m.nav.protection}</Link>
          {/* Ucret seffafligi ana menude — rakiplere karsi en guclu hamle */}
          <Link href={`/${seg}/pricing/`} className="nav-link nav-link-strong">{m.nav.pricing}</Link>
          {/*
            BAKICI OLMA YOLU ANA GEZINMEDE.

            Bu bir pazar yeri: arz olmadan talebin anlami yok. Bakici
            olma yolu bugune kadar yalnizca alt bilgide ve giris yapmis
            kullanicinin hesap sayfasinda duruyordu — yani siteyi ilk
            kez acan biri, kazanc tarafini hic gormeden cikiyordu.
          */}
          <Link href={`/${seg}/become-a-sitter/`} className="nav-link">{m.nav.becomeSitter}</Link>
        </nav>

        <div className="site-header-actions">
          {/* Dil secimi ust seride tasindi — burasi yalnizca hesap ve eylem */}
          {/* Hesap alani dar ekranda cekmeceye tasiniyor (CSS) */}
          <span className="header-account">
            <HeaderAccount locale={locale} />
          </span>
          {/* Dugme oturuma gore konusuyor — bakiciya "Bakici ol" demiyor */}
          <SitterCta locale={locale} className="btn btn-ink header-cta" />

          {/*
            MOBIL CEKMECE — TAM BOYLU SAYFA KENARI.

            Once basligin altina sarkan 20rem'lik bir kutuydu: dar bir
            listede yirmi satir, hepsi ayni agirlikta, hicbiri
            tiklanacak kadar buyuk degil. Simdi ekranin sag kenarindan
            acilan tam boylu bir yuzey; hizmetler ana sayfadaki
            kartlarin kucuk hali, altta sabit bir eylem alani.

            HALA JAVASCRIPT YOK: acma/kapama <details>'in isi. Disariya
            dokunus ve Escape NavDismiss'te (baslikta zaten vardi).
          */}
          <details className="nav-drawer">
            <summary className="nav-drawer-toggle" aria-label={m.menu.open}>
              {/* Iki ikon ust uste: acikken carpi, kapaliyken cizgiler.
                  Ayni dugme, ayni yer — kapatma dugmesi aramak gerekmiyor. */}
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
              {/*
                HIZMETLER KUTUCUKLU KART — duz liste degil.

                Dort hizmet sitenin sattigi seyin tamami; cekmecede
                digerleriyle ayni agirlikta bir satir olarak durmalari,
                menuyu bir baglanti yiginina ceviriyordu. Kutucuk tonu
                ve ikon ana sayfadaki kartlarla AYNI sirada — menuden
                karta gecen kisi ayni sekli ayni renkte goruyor.
              */}
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
              <Link href={`/${seg}/how-it-works/`} className="nav-drawer-item">{m.nav.howItWorks}</Link>
              <Link href={`/${seg}/protection/`} className="nav-drawer-item">{m.nav.protection}</Link>
              <Link href={`/${seg}/pricing/`} className="nav-drawer-item">{m.nav.pricing}</Link>
              <Link href={`/${seg}/become-a-sitter/`} className="nav-drawer-item">{m.nav.becomeSitter}</Link>
              <Link href={`/${seg}/help/`} className="nav-drawer-item">{m.footer.help}</Link>

              {/*
                HESAP ISLEMLERI CEKMECEDE.

                390px'de cubukta duran "Cikis" iki satira boluniyor ve
                baslik ekrandan tasiyordu. Sabit bir "Giris yap" satiri
                degil: ayni bilesen oturumu okuyor, giris yapmis
                kullaniciya adi ve cikis gorunuyor.
              */}
              <p className="nav-drawer-heading">{m.account.title}</p>
              <HeaderAccount locale={locale} variant="drawer" />

              {/*
                ALTTA SABIT EYLEM ALANI.

                "Bakici ol" listenin en altinda, yirmi baglantinin
                arkasinda kaliyordu. Yuzeyin dibine yapisiyor: liste ne
                kadar uzarsa uzasin gorunur kaliyor. Dil secimi de
                burada — ust serit sayfa kaydirilinca gidiyor ve
                telefonda dil degistirmenin baska yolu yoktu.
              */}
              <div className="nav-drawer-foot">
                <SitterCta locale={locale} className="btn btn-primary btn-block" />
                <DrawerLang locale={locale} />
              </div>
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

/**
 * CEKMECEDEKI DIL SECIMI.
 *
 * Ust seritteki secici sayfa kaydirilinca gidiyor ve telefonda dil
 * degistirmenin baska yolu kalmiyordu — alt bilgiye inmek gerekiyordu.
 * Burada hap bicimli: koyu serit uzerinde calismayan bicim beyaz
 * yuzeyde dogru olan bicim.
 */
function DrawerLang({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <div className="drawer-lang" role="group" aria-label={m.footer.languageLabel}>
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <Link
            key={l}
            href={`/${segmentFor(l)}`}
            hrefLang={l}
            className={active ? 'drawer-lang-on' : undefined}
            aria-current={active ? 'true' : undefined}
          >
            {l === 'fr-CA' ? 'Français' : 'English'}
          </Link>
        );
      })}
    </div>
  );
}
