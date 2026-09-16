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
import {
  getAccountSummary, isAdmin, listOwnerPets, listOwnerBookings, listConversations,
  type OwnerPet, type BookingSummary, type ConversationSummary,
} from '@/lib/data';
import { ActivityList, ActivityRow, ActivityIcon } from '@/components/ActivityList';
import { StatusBadge } from '@/components/BookingCard';
import { dateRangeFmt, relativeDay, dayFmt, chatStamp } from '@/lib/format';
import { SERVICES } from '@havre/core';
import { unitLabel } from '@havre/i18n';
import { petAge } from '@/components/PetCard';
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

  /*
    BEKLEYEN ISLERIN KENDISI CEKILIYOR, sayisi degil.

    Ozet ekrani "2 rezervasyon" deyip kullaniciyi baska sayfaya
    yolluyordu; kiminle, ne zaman ve ondan ne beklendigi orada
    kaliyordu. Iki sorgu daha, ama ozetin isini gercekten yapmasi icin.
  */
  const [me, admin, pets, bookings, conversations] = await Promise.all([
    getAccountSummary(session.user.id),
    isAdmin(session.user.id),
    listOwnerPets(session.user.id),
    listOwnerBookings(session.user.id),
    listConversations(session.user.id),
  ]);
  if (!me) notFound();

  const today = new Date().toISOString().slice(0, 10);
  /* Yaklasanlar, EN YAKIN once: ozet "siradaki ne" sorusuna cevap veriyor. */
  const upcoming = bookings
    .filter((b) => b.endAt.slice(0, 10) >= today
      && (b.status === 'requested' || b.status === 'confirmed'))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, 3);
  const unread = conversations.filter((c) => c.unread > 0).slice(0, 3);

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

        <Activity
          locale={locale} seg={seg} me={me}
          upcoming={upcoming} unread={unread}
        />

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

/**
 * BEKLEYENLER — sayfanin en ustu.
 *
 * Bu bolum bir SAYAC degil, bir is listesi. Her satir gercek bir seye
 * gidiyor ve o seyin ne oldugunu SOYLUYOR: hangi bakici, hangi
 * tarihler, ne bekleniyor.
 *
 * SIRA ONEME GORE: once cevap bekleyen talepler (kullanicinin
 * yapabilecegi bir sey yok ama beklemesi gerektigini bilmeli), sonra
 * okunmamis mesajlar (asil ONUN yapmasi gereken sey), sonra onaylanmis
 * yaklasan rezervasyonlar (bilgi).
 *
 * HICBIR SEY YOKSA BOLUM CIZILMIYOR. "Bekleyen bir sey yok" diyen bir
 * kutu, ekranin en degerli yerini kaplayan bir sessizlikti.
 */
function Activity({
  locale, seg, me, upcoming, unread,
}: {
  locale: Locale;
  seg: string;
  me: NonNullable<Awaited<ReturnType<typeof getAccountSummary>>>;
  upcoming: BookingSummary[];
  unread: ConversationSummary[];
}) {
  const m = getMessages(locale);

  const waiting = upcoming.filter((b) => b.status === 'requested');
  const confirmed = upcoming.filter((b) => b.status === 'confirmed');
  const sitterRequests = me.counts.pendingRequests;

  if (waiting.length + confirmed.length + unread.length + sitterRequests === 0) return null;

  return (
    <section aria-label={m.account.atAGlance}>
      <h2 className="text-h3 section-row">{m.account.atAGlance}</h2>

      <ActivityList>
        {/*
          BAKICI TARAFI EN USTTE: karsi tarafta bekleyen biri var ve
          sure isliyor. Sahip tarafindaki hicbir sey bundan acil degil.
        */}
        {sitterRequests > 0 && (
          <ActivityRow
            href={`/${seg}/account/sitter/`}
            tone="wait"
            icon={
              <ActivityIcon>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 7v5l3 2" /><circle cx="12" cy="12" r="8" />
                </svg>
              </ActivityIcon>
            }
            title={interpolate(
              sitterRequests === 1 ? m.account.requestWaitingOne : m.account.requestWaiting,
              { count: String(sitterRequests) },
            )}
            meta={m.account.requestWaitingMeta}
          />
        )}

        {unread.map((c) => (
          <ActivityRow
            key={c.id}
            href={`/${seg}/account/messages/${c.id}/`}
            avatar={c.counterpartAvatarUrl}
            initials={`${c.counterpartFirstName.slice(0, 1)}${c.counterpartInitial}`}
            title={`${c.counterpartFirstName} ${c.counterpartInitial}.`}
            /*
              Mesajin ILK SATIRI gosteriliyor — gelen kutusunda da boyle.
              Kendi gelen kutusu; gizlilik acisindan yeni bir sey
              acilmiyor.
            */
            {...(c.lastMessage ? { meta: c.lastMessage } : {})}
            {...(c.lastMessageAt ? { when: chatStamp(c.lastMessageAt, locale) } : {})}
            badge={
              /*
                Rozet yalnizca bir SAYI cizer; ekran okuyucuya ne oldugunu
                soyleyen metin aria-label'da — gelen kutusundaki satirin
                aynisi.
              */
              <span
                className="activity-count tabular"
                aria-label={c.unread === 1
                  ? m.messages.unreadOne
                  : interpolate(m.messages.unreadMany, { count: String(c.unread) })}
              >
                {c.unread}
              </span>
            }
          />
        ))}

        {[...waiting, ...confirmed].map((b) => {
          const unit = SERVICES[b.serviceType].unit;
          const near = relativeDay(b.startAt, locale);
          const expires = b.status === 'requested' && b.expiresAt
            ? interpolate(m.account.respondBy, { date: dayFmt(b.expiresAt, locale) })
            : null;
          return (
            <ActivityRow
              key={b.id}
              href={`/${seg}/account/bookings/${b.id}/`}
              tone={b.status === 'requested' ? 'wait' : 'plain'}
              avatar={b.counterpartAvatarUrl}
              initials={`${b.counterpartFirstName.slice(0, 1)}${b.counterpartInitial}`}
              title={interpolate(m.booking.withSitter, {
                name: `${b.counterpartFirstName} ${b.counterpartInitial}.`,
              })}
              meta={[
                dateRangeFmt(b.startAt, b.endAt, locale),
                `${b.units} ${unitLabel(locale, unit, b.units)}`,
                near,
              ].filter(Boolean).join(' · ')}
              {...(expires ? { note: expires } : {})}
              badge={<StatusBadge status={b.status} locale={locale} />}
            />
          );
        })}
      </ActivityList>
    </section>
  );
}

/* ------------------------------------------------------- hayvanlarim */

/** Kucuk kartin tek satirlik tarifi: "Kopek · 4 yasinda · 18,5 kg". */
function petSummary(pet: OwnerPet, locale: Locale): string {
  const m = getMessages(locale);
  const species = (m.species[pet.species as keyof Messages['species']] as string | undefined)
    ?? pet.species;
  /* Yalnizca BILINEN seyler — bos alan icin "—" yazmiyoruz. */
  return [species, petAge(pet.birthDate, locale), pet.weightKg ? `${pet.weightKg} kg` : null]
    .filter(Boolean).join(' · ');
}

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
        /*
          OZETTE KUCUK KARTLAR.

          Fotografli buyuk kart hayvanlar sayfasinda dogru — orasi
          hayvanin kendi ekrani. Ozette ayni kart, iki hayvani olan
          kullanicida ekranin yarisini kapliyordu ve altindaki her seyi
          katlamanin asagisina itiyordu. Burada soru "hayvanim kayitli
          mi ve dogru mu" — ona kucuk bir satir cevap veriyor; detay bir
          tik otede.
        */
        <ul className="pet-strip">
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link href={`/${seg}/account/pets/`} className="pet-chip">
                <Avatar
                  src={pet.photoUrl}
                  initials={(pet.name.slice(0, 1) || '?').toUpperCase()}
                  size={40}
                />
                <span className="pet-chip-body">
                  <span className="pet-chip-name">{pet.name}</span>
                  <span className="pet-chip-meta">{petSummary(pet, locale)}</span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href={`/${seg}/account/pets/`} className="pet-chip pet-chip-add">
              <span className="pet-add-plus" aria-hidden="true">+</span>
              <span className="pet-chip-name">{m.pets.add}</span>
            </Link>
          </li>
        </ul>
      )}
    </section>
  );
}
