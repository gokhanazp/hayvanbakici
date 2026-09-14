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
  active: 'overview' | 'bookings' | 'messages' | 'sitter' | 'calendar';
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

  const tabs = [
    { key: 'overview' as const, href: `/${seg}/account/`, label: m.account.overview },
    { key: 'bookings' as const, href: `/${seg}/account/bookings/`, label: m.account.myBookings },
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
    /*
      TASLAK BASVURUDA bakici sekmeleri YOK. Kayit var diye "Talepler" ve
      "Takvim" gostermek, henuz gonderilmemis bir basvuruyu bitmis gibi
      gosteriyordu — kullanicinin "ben bakici miyim?" sorusunun
      kaynaklarindan biri buydu. Basvuru gonderildikten sonra geliyorlar.
    */
    ...(isSitter && sitterStatus !== 'draft'
      ? [
          { key: 'sitter' as const, href: `/${seg}/account/sitter/`, label: m.account.requests },
          { key: 'calendar' as const, href: `/${seg}/account/sitter/calendar/`, label: m.account.calendar },
        ]
      : []),
    ...(isAdmin
      ? [{ key: 'admin' as const, href: '/admin/', label: locale === 'fr-CA' ? 'Interne' : 'Internal' }]
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
          <nav className="account-tabs" aria-label={m.account.title}>
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
          </nav>
        </div>
      </section>

      <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
        {actions && <div className="row" style={{ marginBottom: 'var(--space-6)' }}>{actions}</div>}
        {children}
      </div>
    </>
  );
}

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
    TASLAK BASVURU BAKICI YAPMAZ. "Sahip + Bakici · gonderilmedi" demek
    kendi icinde celisik; taslakta kisi hala yalnizca sahip, yaninda
    basvurusunun durumu yaziyor.
  */
  const label = status ? (m.account[`sitter.${status}` as keyof typeof m.account] as string) : null;
  const role = status === 'draft' ? m.account.roleOwner : m.account.roleBoth;
  return (
    <span className="badge">
      {role}
      {label && <span className="dim"> · {label}</span>}
    </span>
  );
}
