import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { BookingCard } from '@/components/BookingCard';
import { listSitterBookings, getSitterStatus, isAdmin } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function SitterRequestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/sitter/`);

  const [sitter, admin] = await Promise.all([getSitterStatus(session.user.id), isAdmin(session.user.id)]);
  // Bakici olmayan biri bu adrese gelirse basvuru sayfasina gonderilir:
  // bos bir "gelen talep yok" ekrani, ne yapmasi gerektigini soylemiyor.
  if (!sitter) redirect(`/${seg}/become-a-sitter/`);

  const m = getMessages(locale);
  const bookings = await listSitterBookings(session.user.id);

  return (
    <AccountShell locale={locale} title={m.account.requests} active="sitter" isSitter sitterStatus={sitter} isAdmin={admin}>
      {bookings.length === 0 ? (
        <div className="card card-pad" style={{ maxWidth: '36rem' }}>
          <h2 className="text-h4">{m.account.noRequests}</h2>
          <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{m.account.noRequestsHint}</p>
          <Link href={`/${segmentFor(locale)}/account/sitter/calendar/`} className="btn btn-secondary"
                style={{ marginTop: 'var(--space-5)' }}>
            {m.account.calendar}
          </Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} locale={locale} viewerRole="sitter" />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
