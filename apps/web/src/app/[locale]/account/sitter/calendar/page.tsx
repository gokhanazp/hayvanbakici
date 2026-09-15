import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { CalendarEditor } from '@/components/CalendarEditor';
import { getCalendar, getSitterStatus, isAdmin } from '@/lib/data';
import { saveCalendarAction } from './actions';

export const dynamic = 'force-dynamic';

/** Ay numarasi (0-11) -> o ayin ilk ve son gunu, UTC. */
function monthRange(year: number, month: number) {
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 0));
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10), first: from };
}

export default async function CalendarPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ m?: string | string[] }>;
}) {
  const [{ locale: seg }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/sitter/calendar/`);
  const sitterStatus = await getSitterStatus(session.user.id);
  if (!sitterStatus) redirect(`/${seg}/become-a-sitter/`);

  const m = getMessages(locale);

  /*
    Ay gezinmesi adreste (?m=0,1,2...): geri tusu calisir, bagi
    paylasilabilir ve JS'siz gezinilir. Gecmis aylar YOK — gecmis bir gunu
    acmanin ya da kapatmanin anlami yok.
  */
  const offsetRaw = Number(Array.isArray(sp.m) ? sp.m[0] : sp.m);
  const offset = Number.isInteger(offsetRaw) && offsetRaw >= 0 && offsetRaw <= 11 ? offsetRaw : 0;
  const now = new Date();
  const { from, to, first } = monthRange(now.getUTCFullYear(), now.getUTCMonth() + offset);

  const days = await getCalendar(session.user.id, from, to);
  const fmtMonth = (d: Date) =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  const monthLabel = fmtMonth(first);

  /*
    AY DUGMELERI AY ADINI SOYLUYOR.

    Tek basina duran bir "→" nereye gittigini soylemiyordu; ekran
    okuyucuda da yalnizca "ok" diye okunuyordu.
  */
  const shortMonth = (delta: number) =>
    new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset + delta, 1)));

  /* Bugun SUNUCUDAN: istemcide hesaplanirsa saat dilimine gore kayar. */
  const today = new Date().toISOString().slice(0, 10);

  return (
    <AccountShell
      locale={locale}
      title={m.calendar.title}
      lead={m.calendar.lead}
      active="calendar"
      isSitter
      sitterStatus={sitterStatus}
      isAdmin={await isAdmin(session.user.id)}
      actions={
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          {offset > 0 && (
            <Link href={`?m=${offset - 1}`} className="btn btn-secondary btn-sm">
              ← {shortMonth(-1)}
            </Link>
          )}
          {offset < 11 && (
            <Link href={`?m=${offset + 1}`} className="btn btn-secondary btn-sm">
              {shortMonth(1)} →
            </Link>
          )}
        </div>
      }
    >
      <div className="card card-pad" style={{ maxWidth: '44rem' }}>
        <CalendarEditor
          locale={locale}
          days={days}
          action={saveCalendarAction}
          monthLabel={monthLabel}
          today={today}
        />
      </div>
    </AccountShell>
  );
}
