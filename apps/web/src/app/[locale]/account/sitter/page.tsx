import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  getMessages, interpolate, localeFromSegment, segmentFor,
  type Locale, type Messages,
} from '@havre/i18n';
import {
  REQUEST_EXPIRY_HOURS, completedSteps, profileCompleteness, type OnboardingStep,
} from '@havre/core';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { BookingCard } from '@/components/BookingCard';
import {
  listSitterBookings, getSitterDashboard, isAdmin, countReviewsAwaitingReply,
  type SitterDashboard, type BookingSummary,
} from '@/lib/data';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * BAKICI PANOSU.
 *
 * Onaylandiktan sonra bakicinin gordugu tek sey bos bir talep listesiydi:
 * "Aucune demande" ve altinda takvim dugmesi. Profilinin yayinda oldugunu
 * soyleyen bir satir, ne kadar para konustugu, neyin eksik oldugu ve
 * siradaki adim yoktu. Yapacak bir sey bulamayan bakici geri gelmiyor.
 *
 * BURADA OLMAYAN IKI SEY, bilerek:
 *  - Goruntulenme sayisi: profil goruntulenmesini HIC olcmuyoruz.
 *    Uydurma bir sayi gostermektense hic gostermemek dogru.
 *  - "Fotograf ekleyin, %40 daha fazla talep alin": elimizde boyle bir
 *    olcum yok. Eksigi soyluyoruz, uydurma bir getiri vaat etmiyoruz.
 */

/** Profil gucu halkasi — yuzde, bir cizimle. */
function StrengthRing({ pct }: { pct: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden="true" className="strength-ring">
      <circle cx="34" cy="34" r={r} fill="none" stroke="var(--color-border)" strokeWidth="6" />
      <circle
        cx="34" cy="34" r={r} fill="none"
        stroke="var(--color-primary)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${(c * pct) / 100} ${c}`}
        transform="rotate(-90 34 34)"
      />
    </svg>
  );
}

function StatusCard({
  locale, seg, dash,
}: {
  locale: Locale; seg: string; dash: SitterDashboard;
}) {
  const m = getMessages(locale);
  const key = (k: string) => m.account[k as keyof Messages['account']] as string;
  const citySlug = locale === 'fr-CA' ? dash.citySlugFr : dash.citySlugEn;

  const view: Record<SitterDashboard['status'], { title: string; lead: string }> = {
    active: { title: key('dashLive'), lead: key('dashLiveLead') },
    pending: { title: key('dashPending'), lead: key('dashPendingLead') },
    draft: { title: key('dashDraft'), lead: key('dashDraftLead') },
    deactivated: { title: key('dashOff'), lead: key('dashOffLead') },
  };
  const v = view[dash.status];

  return (
    <section className="card card-pad">
      <h2 className="text-h4">{v.title}</h2>
      <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{v.lead}</p>

      {dash.status === 'active' && dash.slug && citySlug && (
        <Link
          href={`/${seg}/${citySlug}/sitter/${dash.slug}/`}
          className="btn btn-secondary"
          style={{ marginTop: 'var(--space-4)' }}
        >
          {key('dashViewProfile')}
        </Link>
      )}
      {dash.status === 'draft' && (
        <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary"
          style={{ marginTop: 'var(--space-4)' }}>
          {key('dashDraftCta')}
        </Link>
      )}
    </section>
  );
}

function MoneyCard({ locale, dash }: { locale: Locale; dash: SitterDashboard }) {
  const m = getMessages(locale);
  const key = (k: string) => m.account[k as keyof Messages['account']] as string;
  const e = dash.earnings;
  const nothing = e.awaitingAnswerCount + e.upcomingCount + e.doneCount === 0;

  const rows: Array<[string, number, number]> = [
    [key('moneyWaiting'), e.awaitingAnswerCents, e.awaitingAnswerCount],
    [key('moneyUpcoming'), e.upcomingCents, e.upcomingCount],
    [key('moneyDone'), e.doneCents, e.doneCount],
  ];

  return (
    <section className="card card-pad">
      <h2 className="text-h4">{key('moneyHeading')}</h2>
      {nothing ? (
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{key('moneyEmpty')}</p>
      ) : (
        <dl className="money-grid">
          {rows.map(([label, cents, count]) => (
            <div key={label}>
              <dt className="text-body-sm dim">{label}</dt>
              <dd className="text-h3">{money(cents, locale)}</dd>
              {/* Cıplak bir sayi ne oldugunu soylemiyordu */}
              <dd className="text-body-sm dim">
                {interpolate(count === 1 ? key('moneyCountOne') : key('moneyCountMany'), { count })}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {/*
        "KAZANDINIZ" DEMIYORUZ. Havre henuz odeme almiyor; bu rakamlar
        rezervasyonda donmus tutarlar. Yanlis kelime, bakicinin banka
        hesabina bakip bizi aramasiyla sonuclanir.
      */}
      <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>{key('moneyNote')}</p>
    </section>
  );
}

function StrengthCard({
  locale, seg, dash,
}: {
  locale: Locale; seg: string; dash: SitterDashboard;
}) {
  const m = getMessages(locale);
  const key = (k: string) => m.account[k as keyof Messages['account']] as string;

  const pct = Math.round(profileCompleteness(dash.steps) * 100);
  const done = completedSteps(dash.steps);

  /* Eksikler onboarding adim sirasinda — bakicinin bildigi sira bu. */
  const gaps = (['about', 'location', 'services', 'home', 'photos', 'screening'] as OnboardingStep[])
    .filter((step) => !done[step]);

  return (
    <section className="card card-pad">
      <div className="row" style={{ gap: 'var(--space-4)', alignItems: 'center' }}>
        <StrengthRing pct={pct} />
        <div>
          <h2 className="text-h4" style={{ margin: 0 }}>{key('strengthHeading')}</h2>
          <p className="tabular" style={{ margin: 'var(--space-1) 0 0', fontWeight: 600 }}>
            {interpolate(key('strengthValue'), { pct })}
          </p>
        </div>
      </div>

      {gaps.length === 0 ? (
        <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{key('strengthFull')}</p>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 'var(--space-4)' }}>{key('strengthLead')}</p>
          <ul className="gap-list">
            {gaps.map((step) => (
              <li key={step}>
                <span>{key(`gap.${step}`)}</span>
                <Link href={`/${seg}/become-a-sitter/${step}/`} className="btn btn-ghost btn-sm">
                  {key('gap.fix')}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function NextStepsCard({
  locale, seg, dash, awaitingReplies,
}: {
  locale: Locale; seg: string; dash: SitterDashboard;
  /** Hakkinda yazilmis ve henuz yanitlanmamis yorum sayisi. */
  awaitingReplies: number;
}) {
  const m = getMessages(locale);
  const key = (k: string) => m.account[k as keyof Messages['account']] as string;

  /*
    Her madde GERCEK bir kosula bagli. Kosulu olmayan genel tavsiye
    ("daha iyi fotograf cekin") panoyu gurultuye cevirir ve bir sure
    sonra kimse okumaz.
  */
  const items: Array<{ id: string; text: string; cta: string; href: string }> = [];

  if (dash.earnings.awaitingAnswerCount > 0) {
    items.push({
      id: 'requests',
      /* Rakam bizim sistemimizden: "hizli cevap daha cok rezervasyon
         getirir" diyebilecek bir olcumumuz YOK, sure ise kesin. */
      text: interpolate(key('next.requests'), { hours: REQUEST_EXPIRY_HOURS }),
      cta: key('next.requestsCta'),
      /* Talep listesi bu sayfanin ALTINDA: ayni sayfaya baglanti vermek
         yerine o bolume kaydiriyoruz. */
      href: '#requests',
    });
  }
  if (dash.openDays === 0) {
    items.push({
      id: 'calendar', text: key('next.calendar'), cta: key('next.calendarCta'),
      href: `/${seg}/account/sitter/calendar/`,
    });
  }
  /*
    YANIT BEKLEYEN YORUM.

    Yanit verme yolu vardi ama yalnizca ilgili rezervasyonun detay
    sayfasindaydi ve hicbir ekran "hakkinizda yeni bir yorum var"
    demiyordu. Panonun isi tam olarak bunu soylemek.
  */
  if (awaitingReplies > 0) {
    items.push({
      id: 'reviews',
      text: awaitingReplies === 1
        ? m.review.awaitingOne
        : interpolate(m.review.awaitingMany, { count: awaitingReplies }),
      cta: m.review.nav,
      href: `/${seg}/account/reviews/`,
    });
  }
  if (dash.servicesWithoutExtraPet > 0) {
    items.push({
      id: 'extraPet', text: key('next.extraPet'), cta: key('next.extraPetCta'),
      href: `/${seg}/become-a-sitter/services/`,
    });
  }

  return (
    <section className="card card-pad">
      <h2 className="text-h4">{key('nextHeading')}</h2>
      {items.length === 0 ? (
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{key('nextNone')}</p>
      ) : (
        <ul className="gap-list">
          {items.map((it) => (
            <li key={it.id}>
              <span>{it.text}</span>
              <Link href={it.href} className="btn btn-secondary btn-sm">{it.cta}</Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Ileri dogru yurumekte olan rezervasyon durumlari. */
const LIVE = new Set(['confirmed', 'paid', 'in_progress']);

const PAST_PREVIEW = 5;

/** Tek bir kuyruk bolumu: baslik + sayi + kartlar ya da bos satiri. */
function Queue({
  title, empty, count, locale, children,
}: {
  title: string; empty: string; count: number; locale: Locale;
  children: readonly BookingSummary[];
}) {
  return (
    <div>
      <h2 className="text-h4 queue-head">
        {title}
        {/* Sayi baslikta: bolumu acmadan kac tane oldugu goruluyor. */}
        {count > 0 && <span className="queue-count tabular">{count}</span>}
      </h2>
      {count === 0 ? (
        <p className="muted text-body-sm">{empty}</p>
      ) : (
        <div className="booking-list">
          {children.map((b) => (
            <BookingCard key={b.id} booking={b} locale={locale} viewerRole="sitter" />
          ))}
        </div>
      )}
    </div>
  );
}

export default async function SitterDashboardPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ past?: string | string[] }>;
}) {
  const [{ locale: seg }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/sitter/`);

  const [dash, admin, awaitingReplies] = await Promise.all([
    getSitterDashboard(session.user.id), isAdmin(session.user.id),
    countReviewsAwaitingReply(session.user.id),
  ]);
  // Bakici olmayan biri bu adrese gelirse basvuru sayfasina gonderilir:
  // bos bir "gelen talep yok" ekrani, ne yapmasi gerektigini soylemiyor.
  if (!dash) redirect(`/${seg}/become-a-sitter/`);

  const m = getMessages(locale);
  const bookings = await listSitterBookings(session.user.id);
  const segment = segmentFor(locale);
  const showAllPast = (Array.isArray(sp.past) ? sp.past[0] : sp.past) === 'all';

  /*
    GECMIS "eski tarih" demek DEGIL, "artik bir sey beklemiyor" demek:
    iptal edilmis gelecek bir rezervasyon da buraya ait. Tarihe gore
    ayirsaydik, iptal edilmis bir konaklama "Yaklasan" bolumunde
    durmaya devam ederdi.
  */
  const now = Date.now();
  const queues = {
    answer: bookings.filter((b) => b.status === 'requested'),
    upcoming: bookings.filter((b) => LIVE.has(b.status) && Date.parse(b.endAt) >= now),
    past: bookings.filter(
      (b) => b.status !== 'requested' && !(LIVE.has(b.status) && Date.parse(b.endAt) >= now),
    ),
  };

  return (
    <AccountShell
      locale={locale}
      title={m.account.dashTitle}
      lead={m.account.dashLead}
      active="sitter"
      isSitter
      sitterStatus={dash.status}
      isAdmin={admin}
    >
      <div className="sitter-dash">
        <StatusCard locale={locale} seg={segment} dash={dash} />
        <MoneyCard locale={locale} dash={dash} />
        <StrengthCard locale={locale} seg={segment} dash={dash} />
        <NextStepsCard locale={locale} seg={segment} dash={dash} awaitingReplies={awaitingReplies} />
      </div>

      {/*
        LISTE UC PARCAYA AYRILDI.

        Tek bir "Talepler" basligi altinda bakicinin BUTUN gecmisi
        dokuluyordu: cevap bekleyen uc talep, aylar once odenmis yirmi
        rezervasyonun arasinda kayboluyordu. Baslik "talepler" diyordu,
        liste arsiv gosteriyordu.

        CEVAP BEKLEYENLER ASLA KISALTILMIYOR — onlarin suresi doluyor
        (36 saat). Kisaltilan tek bolum gecmis, ve "hepsini goster"
        ADRESTE (?past=all): geri tusu calisiyor, bag paylasilabiliyor
        ve JS olmadan da aciliyor.
      */}
      <section id="requests" style={{ marginTop: 'var(--space-8)', scrollMarginTop: 'var(--space-8)' }}>
        {bookings.length === 0 ? (
          <>
            <h2 className="text-h3" style={{ marginBottom: 'var(--space-5)' }}>{m.account.requests}</h2>
            <div className="card card-pad" style={{ maxWidth: '36rem' }}>
              <h3 className="text-h4">{m.account.noRequests}</h3>
              <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{m.account.noRequestsHint}</p>
              <Link href={`/${segment}/account/sitter/calendar/`} className="btn btn-secondary"
                style={{ marginTop: 'var(--space-5)' }}>
                {m.account.calendar}
              </Link>
            </div>
          </>
        ) : (
          <div className="booking-queues">
            <Queue
              title={m.account.queueAnswer} empty={m.account.queueAnswerNone}
              count={queues.answer.length} locale={locale}
            >
              {queues.answer}
            </Queue>
            <Queue
              title={m.account.queueUpcoming} empty={m.account.queueUpcomingNone}
              count={queues.upcoming.length} locale={locale}
            >
              {queues.upcoming}
            </Queue>
            <Queue
              title={m.account.queuePast} empty={m.account.queuePastNone}
              count={queues.past.length} locale={locale}
            >
              {showAllPast ? queues.past : queues.past.slice(0, PAST_PREVIEW)}
            </Queue>
            {queues.past.length > PAST_PREVIEW && (
              <p style={{ marginTop: 'var(--space-4)' }}>
                <Link
                  href={showAllPast ? '?#requests' : '?past=all#requests'}
                  className="btn btn-secondary btn-sm"
                >
                  {showAllPast
                    ? m.account.queueShowLess
                    : interpolate(m.account.queueShowAll, { count: queues.past.length })}
                </Link>
              </p>
            )}
          </div>
        )}
      </section>
    </AccountShell>
  );
}
