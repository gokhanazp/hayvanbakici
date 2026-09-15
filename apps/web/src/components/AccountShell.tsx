import type { ReactNode } from 'react';
import Link from 'next/link';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';

/**
 * HESAP EKRANLARININ ORTAK CERCEVESI — baslik bandi + yan gezinme.
 *
 * Bakici sekmeleri yalnizca gercekten bakici olan kullaniciya cizilir:
 * herkese "Bakici paneli" gostermek, tiklayinca bos sayfa demek olurdu.
 */
export function AccountShell({
  locale, title, lead, active, isSitter, sitterStatus, isAdmin, unread = 0, children, actions,
}: {
  locale: Locale;
  title: string;
  lead?: string | undefined;
  active: 'overview' | 'profile' | 'pets' | 'bookings' | 'favourites' | 'messages' | 'sitter' | 'calendar';
  isSitter: boolean;
  /**
   * Bakici kaydinin durumu — ROZET icin. `isSitter` yalnizca "kayit var mi"
   * diyor; kullanicinin asil sordugu soru "yayinda miyim, onay mi
   * bekliyorum" ve bunu bugune kadar hicbir ekran soylemiyordu.
   */
  sitterStatus?: 'draft' | 'pending' | 'active' | 'deactivated' | null | undefined;
  /** Yonetici sekmesi: panelin adresi hicbir yerde duyurulmuyor,
      yoneticinin kendi hesabindan girebilmesi icin tek kapi bu. */
  isAdmin?: boolean | undefined;
  /** Okunmamis mesaji olan konusma sayisi — sekmede rozet olarak gorunur */
  unread?: number | undefined;
  children: ReactNode;
  actions?: ReactNode | undefined;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  /*
    SEKMELER IKI GRUPTA.

    Onayli bir bakicida yedi sekme tek sirada duruyordu ve sahip isleri
    ile bakici isleri birbirine karisiyordu: "Rezervasyonlarim" (kendi
    hayvanim icin aldiklarim) ile "Pano" (bana gelen talepler) yan yana,
    ayirt edilemez halde. Ayni sira korunuyor — dikey menuye gecmek
    hesap sayfalarinin duzenini bastan kurmak demekti — ama gruplar
    gorsel olarak ve EKRAN OKUYUCUDA ayriliyor: her grubun kendi
    baslikli <nav>'i var.
  */
  const ownerTabs = [
    { key: 'overview' as const, href: `/${seg}/account/`, label: m.account.overview },
    { key: 'profile' as const, href: `/${seg}/account/profile/`, label: m.profile.tab },
    /* Hayvanlar profilden HEMEN SONRA: ikisi de "ben kimim" bilgisi,
       rezervasyon ise ondan sonra gelen bir is. */
    { key: 'pets' as const, href: `/${seg}/account/pets/`, label: m.pets.tab },
    { key: 'bookings' as const, href: `/${seg}/account/bookings/`, label: m.account.myBookings },
    /*
      FAVORILER /account ALTINDA DEGIL (giris yapmamis ziyaretci de
      goruyor) ama hesabin bir parcasi gibi davraniyor: sekme burada,
      sayfa hesap cercevesini ciziyor.
    */
    { key: 'favourites' as const, href: `/${seg}/favourites/`, label: m.favourites.tab },
    {
      key: 'messages' as const,
      href: `/${seg}/account/messages/`,
      /*
        Rozet sekmenin ETIKETINDE. Ayri bir nokta/badge elemani denenebilirdi
        ama sekme zaten dar; sayiyi metne katmak hem ekran okuyucuda hem
        gozle tek seferde okunuyor.
      */
      label: unread > 0 ? `${m.messages.tab} (${unread})` : m.messages.tab,
    },
  ];

  /*
    TASLAK BASVURUDA bakici sekmeleri YOK. Kayit var diye "Pano" ve
    "Takvim" gostermek, henuz gonderilmemis bir basvuruyu bitmis gibi
    gosteriyordu — kullanicinin "ben bakici miyim?" sorusunun
    kaynaklarindan biri buydu.
  */
  const sitterTabs = isSitter && sitterStatus !== 'draft'
    ? [
        /* Sekme adi artik "Talepler" degil: sayfa panoya dondu ve
           talep listesi onun bir bolumu. */
        { key: 'sitter' as const, href: `/${seg}/account/sitter/`, label: m.account.dashTitle },
        { key: 'calendar' as const, href: `/${seg}/account/sitter/calendar/`, label: m.account.calendar },
      ]
    : [];

  const adminTabs = [
    /*
      YONETICI PANELI — yalnizca admin hesaplarda.

      Etiket eskiden "Internal" idi; ne oldugunu kimseye soylemiyordu,
      panelin sahibine bile. Gizlemenin bir degeri de yok: panelin kendi
      giris ekrani ve yetki kontrolu var, yetkisiz kisi 404 goruyor
      (bkz. app/admin). Bir baglantinin adi, yetkilendirme degildir.
    */
    ...(isAdmin
      ? [{ key: 'admin' as const, href: '/admin/', label: m.account.adminPanel }]
      : []),
  ];

  return (
    <>
      <section className="band band-blush band-round-b">
        <div className="container" style={{ paddingBlock: 'var(--space-8) var(--space-8)' }}>
          <div className="row" style={{ gap: 'var(--space-3)', alignItems: 'baseline' }}>
            <h1 className="text-h1">{title}</h1>
            <RoleBadge locale={locale} isSitter={isSitter} status={sitterStatus ?? null} />
          </div>
          {lead && (
            <p className="text-body-lg muted" style={{ marginTop: 'var(--space-3)', maxWidth: '40rem' }}>
              {lead}
            </p>
          )}
          <div className="account-navs">
            <TabGroup
              label={m.account.groupOwner} tabs={ownerTabs} active={active}
              showLabel={sitterTabs.length > 0}
            />
            {sitterTabs.length > 0 && (
              <TabGroup label={m.account.groupSitter} tabs={sitterTabs} active={active} showLabel />
            )}
            {adminTabs.length > 0 && (
              <TabGroup label={m.account.adminPanel} tabs={adminTabs} active={active} showLabel={false} />
            )}
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
        {actions && <div className="row" style={{ marginBottom: 'var(--space-6)' }}>{actions}</div>}
        {children}
      </div>
    </>
  );
}

/** Bakici durumu -> rozet rengi (rezervasyon rozetiyle ayni token ciftleri). */
const ROLE_TONE: Record<string, { bg: string; fg: string; dot?: string }> = {
  active: {
    bg: 'var(--color-accent-subtle)', fg: 'var(--color-accent-hover)',
    dot: 'var(--color-success)',
  },
  pending: {
    bg: 'var(--color-tile-apricot)', fg: 'var(--color-tile-apricot-ink)',
    dot: 'var(--color-warning)',
  },
  draft: { bg: 'var(--color-surface-sunken)', fg: 'var(--color-ink-secondary)' },
  deactivated: { bg: 'var(--color-surface-sunken)', fg: 'var(--color-ink-secondary)' },
};

/**
 * ROL ROZETI.
 *
 * Havre'de tek hesap iki sapka tasiyor ve bu, ekranda soylenmedigi
 * surece kullanicinin kafasini karistiriyor: "ben bakici miyim, sahip
 * miyim?" Rozet her hesap ekraninin basinda cevabi veriyor.
 *
 * Bakici kaydi olmayan icin de ciziliyor ("Sahip") — yalnizca bakiciya
 * rozet vermek, sahibi rozetsiz birakip ayni belirsizligi surdururdu.
 */
/**
 * BIR SEKME GRUBU.
 *
 * Grubun basligi yalnizca BIRDEN FAZLA grup varken ciziliyor: sahip
 * hesabinda tek sira var ve ustune "Hesabiniz" yazmak bos gurultu.
 * Ekran okuyucu icin baslik HER ZAMAN var (aria-label) — gorsel baslik
 * gizlendiginde de gruplarin nerede ayrildigi duyuluyor.
 */
function TabGroup({
  label, tabs, active, showLabel,
}: {
  label: string;
  tabs: ReadonlyArray<{ key: string; href: string; label: string }>;
  active: string;
  showLabel: boolean;
}) {
  return (
    <nav className="account-tab-group" aria-label={label}>
      {showLabel && <span className="account-group-label" aria-hidden="true">{label}</span>}
      <div className="account-tabs">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={`account-tab${t.key === active ? ' is-active' : ''}`}
            aria-current={t.key === active ? 'page' : undefined}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function RoleBadge({
  locale, isSitter, status,
}: {
  locale: Locale;
  isSitter: boolean;
  status: 'draft' | 'pending' | 'active' | 'deactivated' | null;
}) {
  const m = getMessages(locale);
  if (!isSitter) return <span className="badge">{m.account.roleOwner}</span>;

  /*
    RENK TEK TASIYICI DEGIL (WCAG 1.4.1): durum ayrica YAZIYOR. Renk ve
    nokta yalnizca tek bakista anlasilsin diye. Renk ciftleri rezervasyon
    rozetiyle AYNI — ikisi de olculmus token ciftleri, yenisini uydurmak
    kontrast testini atlatmak olurdu.
  */

  /*
    TASLAK BASVURU BAKICI YAPMAZ. "Sahip + Bakici · gonderilmedi" demek
    kendi icinde celisik; taslakta kisi hala yalnizca sahip, yaninda
    basvurusunun durumu yaziyor.
  */
  const label = status ? (m.account[`sitter.${status}` as keyof typeof m.account] as string) : null;
  const role = status === 'draft' ? m.account.roleOwner : m.account.roleBoth;
  const tone = status ? ROLE_TONE[status] : undefined;

  return (
    <span className="badge" style={tone ? { background: tone.bg, color: tone.fg } : undefined}>
      {tone?.dot && (
        <span aria-hidden="true" className="badge-dot" style={{ background: tone.dot }} />
      )}
      {role}
      {label && <span style={{ opacity: 0.75 }}> · {label}</span>}
    </span>
  );
}
