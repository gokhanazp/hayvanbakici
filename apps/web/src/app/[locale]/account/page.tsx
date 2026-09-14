import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { completedSteps, ONBOARDING_STEPS, type OnboardingStep } from '@havre/core';
import {
  getMessages, interpolate, localeFromSegment, type Locale, type Messages,
} from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { getAccountSummary, isAdmin } from '@/lib/data';

export const dynamic = 'force-dynamic';

/**
 * HESAP ANA SAYFASI — "ben neyim" sorusunun cevabi.
 *
 * Bu sayfa bir BOSLUGU kapatiyor: Havre'de herkes sahip, isteyen ustune
 * bakiciligi ekliyor. Model dogru ama ekranda hicbir yerde yazmiyordu;
 * kullanici bakici mi, basvurusu yarida mi kaldi, onay mi bekliyor —
 * anlamak icin veritabanina bakmak gerekiyordu. (Bizzat yasandi.)
 *
 * Sayfa SOZ VERMIYOR, DURUM BILDIRIYOR: taslak basvuruda "yayindasiniz"
 * demiyor, onay beklerken sure taahhut etmiyor.
 */
export default async function AccountOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/`);

  const [me, admin] = await Promise.all([
    getAccountSummary(session.user.id),
    isAdmin(session.user.id),
  ]);
  if (!me) notFound();

  const m = getMessages(locale);
  const name = me.firstName ?? session.user.name?.split(' ')[0] ?? '';
  const approvedSitter = me.sitter !== null && me.sitter.status !== 'draft';

  return (
    <AccountShell
      locale={locale}
      title={m.account.title}
      lead={interpolate(m.account.signedInAs, { email: me.email })}
      active="overview"
      isSitter={me.sitter !== null}
      sitterStatus={me.sitter?.status ?? null}
      isAdmin={admin}
      unread={me.counts.unreadMessages}
    >
      <div className="stack" style={{ display: 'grid', gap: 'var(--space-8)', maxWidth: '44rem' }}>
        {/* Askı SESSIZ olmamali: kisitli bir hesapla dolasip neden
            calismadigini anlamamak, kisitlamanin kendisinden kotu. */}
        {me.suspended && (
          <div className="notice notice-warning">
            <p>{m.account.suspendedNotice}</p>
          </div>
        )}

        <section className="card card-pad">
          <h2 className="text-h4">{m.account.youAre}</h2>
          <p style={{ marginTop: 'var(--space-3)', fontWeight: 600 }}>
            {/* Gonderilmemis basvuru kisiyi bakici yapmaz — rozetle ayni kural */}
            {approvedSitter ? m.account.roleBoth : m.account.roleOwner}
            {name && <span className="muted" style={{ fontWeight: 400 }}> — {name}</span>}
          </p>
          <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
            {approvedSitter ? m.account.roleBothLead : m.account.roleOwnerLead}
          </p>
        </section>

        {me.sitter ? (
          <SitterStatusCard locale={locale} seg={seg} sitter={me.sitter} />
        ) : (
          <section className="card card-pad">
            <h2 className="text-h4">{m.account.becomeSitterHeading}</h2>
            <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
              {m.account.becomeSitterLead}
            </p>
            <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary"
                  style={{ marginTop: 'var(--space-5)' }}>
              {m.nav.becomeSitter}
            </Link>
          </section>
        )}

        <Glance locale={locale} seg={seg} me={me} />
      </div>
    </AccountShell>
  );
}

/* ----------------------------------------------------------- bakicilik */

function SitterStatusCard({
  locale, seg, sitter,
}: {
  locale: Locale;
  seg: string;
  sitter: NonNullable<Awaited<ReturnType<typeof getAccountSummary>>>['sitter'];
}) {
  const m = getMessages(locale);
  if (!sitter) return null;

  const key = (k: string) => m.account[k as keyof Messages['account']] as string;
  const status = sitter.status;

  /*
    Taslakta SIRADAKI ADIMI soyluyoruz. "Basvurunuz yarim" demek yeterli
    degil: kullanici nereye donecegini bilmiyorsa yarim kalmaya devam eder.
  */
  const done = completedSteps({
    hasAbout: sitter.steps.hasAbout,
    hasLocation: sitter.steps.hasLocation,
    serviceCount: sitter.steps.serviceCount,
    hasHome: sitter.steps.hasHome,
    screeningStarted: sitter.steps.screeningStarted,
  });
  const nextIncomplete: OnboardingStep =
    ONBOARDING_STEPS.find((s) => s !== 'review' && !done[s]) ?? 'review';
  const stepLabel = m.onboarding[`step.${nextIncomplete}` as keyof Messages['onboarding']] as string;

  const lead = status === 'draft'
    ? interpolate(key('sitter.draftLead'), { step: stepLabel })
    : key(`sitter.${status}Lead`);

  const citySlug = locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn;

  return (
    <section className="card card-pad">
      <h2 className="text-h4">{m.account.sitterHeading}</h2>
      <p style={{ marginTop: 'var(--space-3)', fontWeight: 600 }}>{key(`sitter.${status}`)}</p>
      <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{lead}</p>

      <div className="row" style={{ marginTop: 'var(--space-5)' }}>
        {status === 'draft' && (
          <Link href={`/${seg}/become-a-sitter/${nextIncomplete}/`} className="btn btn-primary">
            {m.account['sitter.draftCta']}
          </Link>
        )}
        {status === 'active' && sitter.slug && citySlug && (
          <Link href={`/${seg}/${citySlug}/sitter/${sitter.slug}/`} className="btn btn-secondary">
            {m.account['sitter.activeCta']}
          </Link>
        )}
        {(status === 'active' || status === 'pending') && (
          <Link href={`/${seg}/account/sitter/`} className="btn btn-ghost">
            {m.account.requests}
          </Link>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- sayilar */

function Glance({
  locale, seg, me,
}: {
  locale: Locale;
  seg: string;
  me: NonNullable<Awaited<ReturnType<typeof getAccountSummary>>>;
}) {
  const m = getMessages(locale);

  /*
    SIFIR OLANI GOSTERMIYORUZ. "0 bekleyen talep" bir bilgi degil, bos bir
    satir; ekranin tamami sifirsa tek cumleyle soyluyoruz.
  */
  const rows = [
    me.counts.pendingRequests > 0 && {
      href: `/${seg}/account/sitter/`,
      label: m.account.quickRequests, n: me.counts.pendingRequests,
    },
    me.counts.unreadMessages > 0 && {
      href: `/${seg}/account/messages/`,
      label: m.account.quickUnread, n: me.counts.unreadMessages,
    },
    me.counts.upcomingBookings > 0 && {
      href: `/${seg}/account/bookings/`,
      label: m.account.quickBookings, n: me.counts.upcomingBookings,
    },
  ].filter(Boolean) as Array<{ href: string; label: string; n: number }>;

  return (
    <section className="card card-pad">
      <h2 className="text-h4">{m.account.atAGlance}</h2>
      {rows.length === 0 ? (
        <p className="muted" style={{ marginTop: 'var(--space-3)' }}>{m.account.nothingWaiting}</p>
      ) : (
        <ul className="glance-list">
          {rows.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="glance-row">
                <span className="tabular" style={{ fontWeight: 600 }}>{r.n}</span>
                <span>{r.label}</span>
                <span aria-hidden="true" className="dim">→</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
