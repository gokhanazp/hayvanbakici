import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  completedSteps, DEFAULT_COMMISSION, ONBOARDING_STEPS, type OnboardingStep,
} from '@havre/core';
import {
  getMessages, interpolate, localeFromSegment, type Locale, type Messages,
} from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { getAccountSummary, isAdmin, listOwnerPets, type OwnerPet } from '@/lib/data';
import { PetCard } from '@/components/PetCard';
import { Avatar } from '@/components/Avatar';
import { EmptyState, PawArt } from '@/components/EmptyState';

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

  const [me, admin, pets] = await Promise.all([
    getAccountSummary(session.user.id),
    isAdmin(session.user.id),
    listOwnerPets(session.user.id),
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
      {/*
        DUZEN.

        Once uc kart dar bir sutunda alt alta duruyordu: ekranin sag
        yarisi bostu, en ustteki kart hicbir ise yaramiyordu ("ne
        oldugunuz") ve en alttaki cogu zaman "bekleyen bir sey yok"
        diyen bos bir kutuydu. Simdi:

          1. BEKLEYEN ISLER, varsa, en ustte ve SATIR halinde. Yoksa
             hic cizilmiyor — "bekleyen bir sey yok" diyen bir kutu,
             yer kaplayan bir sessizlik.
          2. HAYVANLARIM: sayfanin asil isi. Bugune kadar hic yoktu.
          3. Rol ve bakicilik kartlari YAN YANA, altta: ikisi de
             "durum" bilgisi, gunluk is degil.
      */}
      <div className="account-home">
        {/* Askı SESSIZ olmamali: kisitli bir hesapla dolasip neden
            calismadigini anlamamak, kisitlamanin kendisinden kotu. */}
        {me.suspended && (
          <div className="notice notice-warning">
            <p>{m.account.suspendedNotice}</p>
          </div>
        )}

        <Glance locale={locale} seg={seg} me={me} />

        <PetsSection locale={locale} seg={seg} pets={pets} />

        <div className="account-side-by-side">
          <IdentityCard
            locale={locale} seg={seg} me={me} name={name} approvedSitter={approvedSitter}
          />

          {me.sitter ? (
            <SitterStatusCard locale={locale} seg={seg} sitter={me.sitter} />
          ) : (
            <SitterInvite locale={locale} seg={seg} />
          )}
        </div>
      </div>
    </AccountShell>
  );
}

/* --------------------------------------------------------------- kimlik */

/**
 * KIM OLDUGUNUZ — kimlik karti.
 *
 * Eskiden burada baslik ve iki paragraf vardi: dogru ama kuru, ve
 * kisinin kendi hesabina bakarken gormek istedigi ilk sey (fotografim,
 * adim, hangi e-postayla girdim) hicbir yerde degildi. E-posta sayfa
 * basligindaki ince gri satirda kayboluyordu.
 *
 * Kartin alt serisi BIR ISE YARIYOR: profil ve bildirim ayarlarina
 * dogrudan gidiyor. Bilgi veren ama hicbir yere goturmeyen bir kart,
 * kullanicinin ikinci kez okumayacagi bir karttir.
 */
function IdentityCard({
  locale, seg, me, name, approvedSitter,
}: {
  locale: Locale;
  seg: string;
  me: NonNullable<Awaited<ReturnType<typeof getAccountSummary>>>;
  name: string;
  approvedSitter: boolean;
}) {
  const m = getMessages(locale);
  const initials = `${(name.slice(0, 1) || me.email.slice(0, 1)).toUpperCase()}${
    me.lastNameInitial ?? ''}`;

  return (
    <section className="card identity-card">
      <div className="identity-head">
        <Avatar src={me.avatarUrl} initials={initials} size={64} />
        <div style={{ minWidth: 0 }}>
          <p className="identity-name">
            {name || m.account.title}
            {me.lastNameInitial && ` ${me.lastNameInitial}.`}
          </p>
          {/* E-posta TASMASIN: uzun adresler karti yana kaydiriyordu. */}
          <p className="dim text-body-sm identity-email">{me.email}</p>
        </div>
      </div>

      <p className="identity-role">
        {/* Gonderilmemis basvuru kisiyi bakici yapmaz — rozetle ayni kural */}
        {approvedSitter ? m.account.roleBoth : m.account.roleOwner}
      </p>
      <p className="muted text-body-sm">
        {approvedSitter ? m.account.roleBothLead : m.account.roleOwnerLead}
      </p>

      {/*
        GERCEK BIR AYARIN DURUMU. Kart yalnizca "kimsiniz" deseydi bir kez
        okunup bir daha bakilmazdi; bildirim tercihi kullanicinin gercekten
        merak ettigi ve degistirdigi bir sey.
      */}
      <p className="identity-fact">
        {m.profile.emailPrefLabel}
        <strong>{me.notifyMessages ? m.profile.on : m.profile.off}</strong>
      </p>

      <div className="identity-links">
        <Link href={`/${seg}/account/profile/`} className="btn btn-secondary btn-sm">
          {m.profile.tab}
        </Link>
        <Link href={`/${seg}/account/pets/`} className="btn btn-ghost btn-sm">
          {m.pets.tab}
        </Link>
      </div>
    </section>
  );
}

/**
 * BAKICILIGA DAVET — sayfadaki TEK koyu blok.
 *
 * Ayni beyaz kartlardan biri olarak dururken goz onu bir bilgi karti
 * sanip atliyordu. Koyu panel, sayfada bir tane: "burasi farkli" demenin
 * en ucuz yolu.
 *
 * Rakam GERCEK ve tek kaynaktan geliyor (commission.ts): %18. Rakami
 * metne elle yazmak, oran degistiginde ekranda eski sayinin kalmasi
 * demekti — ve bu, ucret seffafligi iddiasiyla celisirdi. "Rakiplerden
 * az" gibi karsilastirmali bir iddia YOK: baskasinin oranini olcmedik.
 */
function SitterInvite({ locale, seg }: { locale: Locale; seg: string }) {
  const m = getMessages(locale);
  return (
    <section className="panel invite-card">
      <h2 className="text-h4">{m.account.becomeSitterHeading}</h2>

      <p className="invite-rate">
        <span className="invite-pct tabular">{DEFAULT_COMMISSION.sitterPct.platform}%</span>
        <span>{m.account.inviteRate}</span>
      </p>

      <p className="muted text-body-sm">{m.account.becomeSitterLead}</p>

      <ul className="invite-points">
        <li>{m.account.invitePoint1}</li>
        <li>{m.account.invitePoint2}</li>
        <li>{m.account.invitePoint3}</li>
      </ul>

      <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary">
        {m.nav.becomeSitter}
      </Link>
    </section>
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
    photoCount: sitter.steps.photoCount,
  });
  const nextIncomplete: OnboardingStep =
    ONBOARDING_STEPS.find((s) => s !== 'review' && !done[s]) ?? 'review';
  const stepLabel = m.onboarding[`step.${nextIncomplete}` as keyof Messages['onboarding']] as string;

  const lead = status === 'draft'
    ? interpolate(key('sitter.draftLead'), { step: stepLabel })
    : key(`sitter.${status}Lead`);

  const citySlug = locale === 'fr-CA' ? sitter.citySlugFr : sitter.citySlugEn;

  /*
    TASLAKTA ILERLEME GORUNUYOR.

    "Basvurunuz yarim" demek, kullaniciya ne kadar yol kaldigini
    soylemiyor; yedi adimin besini bitirmis biri, birini bitirmis biriyle
    ayni cumleyi okuyordu ve ikisi de birakiyordu. Cubuk ADIM SAYAR,
    yuzde uydurmaz: "5 / 7" olculen bir sey.
  */
  const total = ONBOARDING_STEPS.filter((x) => x !== 'review').length;
  const doneCount = ONBOARDING_STEPS.filter((x) => x !== 'review' && done[x]).length;

  return (
    <section className="card card-pad status-card">
      <div className="status-head">
        <h2 className="text-h4">{m.account.sitterHeading}</h2>
        <span className={`status-pill status-${status}`}>
          <span aria-hidden="true" className="status-dot" />
          {key(`sitter.${status}`)}
        </span>
      </div>

      {status === 'draft' && (
        <div className="status-progress">
          <div
            className="status-bar" role="progressbar"
            aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={total}
            aria-label={m.account.sitterHeading}
          >
            <span style={{ width: `${Math.round((doneCount / total) * 100)}%` }} />
          </div>
          <p className="dim text-body-sm tabular">
            {interpolate(m.account.stepsDone, { done: String(doneCount), total: String(total) })}
          </p>
        </div>
      )}

      <p className="muted text-body-sm" style={{ marginTop: 'var(--space-3)' }}>{lead}</p>

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

  /*
    HICBIR SEY BEKLEMIYORSA BOLUM HIC CIZILMIYOR.

    Eskiden burada "Bekleyen bir sey yok" yazan bir kart duruyordu:
    bilgi tasimayan, ama ekranin en degerli yerini kaplayan bir
    kutu. Bos bir bolumu gizlemek, bos oldugunu ilan etmekten iyi.
  */
  if (rows.length === 0) return null;

  return (
    <section aria-label={m.account.atAGlance}>
      <ul className="glance-row-list">
        {rows.map((r) => (
          <li key={r.href}>
            <Link href={r.href} className="glance-tile">
              <span className="glance-n tabular">{r.n}</span>
              <span className="glance-label">{r.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------- hayvanlarim */

/**
 * HAYVANLARIM — hesap sayfasinin asil isi.
 *
 * Bugune kadar kullanicinin hayvanlari hicbir ekranda gorunmuyordu:
 * yalnizca rezervasyon formunun icinde yaratilabiliyor, sonra kayboluyordu.
 *
 * Kartlar BURADA SALT OKUNUR. Duzenleme kendi sayfasinda; hesap ana
 * sayfasini bir forma cevirmek, "burada bir sey doldurmam mi gerekiyor"
 * hissi veriyordu.
 */
function PetsSection({
  locale, seg, pets,
}: {
  locale: Locale;
  seg: string;
  pets: OwnerPet[];
}) {
  const m = getMessages(locale);

  return (
    <section>
      <div className="section-row">
        <h2 className="text-h3">
          {m.pets.title}
          {pets.length > 0 && (
            <span className="section-count">
              {pets.length === 1
                ? m.pets.countOne
                : interpolate(m.pets.count, { count: String(pets.length) })}
            </span>
          )}
        </h2>
        {pets.length > 0 && (
          <Link href={`/${seg}/account/pets/`} className="btn btn-secondary btn-sm">
            {m.pets.manage}
          </Link>
        )}
      </div>

      {pets.length === 0 ? (
        <EmptyState
          tone="card"
          icon={PawArt}
          title={m.pets.empty}
          body={m.pets.emptyHint}
          action={
            <Link href={`/${seg}/account/pets/`} className="btn btn-primary">
              {m.pets.add}
            </Link>
          }
        />
      ) : (
        <div className="pet-grid">
          {pets.map((pet) => <PetCard key={pet.id} pet={pet} locale={locale} />)}
          {/* Izgaranin sonundaki bosluğu bir ISLE dolduruyor. */}
          <Link href={`/${seg}/account/pets/`} className="pet-add">
            <span className="pet-add-plus" aria-hidden="true">+</span>
            <span>{m.pets.add}</span>
          </Link>
        </div>
      )}
    </section>
  );
}
