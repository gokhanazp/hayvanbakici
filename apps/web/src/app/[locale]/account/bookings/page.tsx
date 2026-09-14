import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { BookingCard } from '@/components/BookingCard';
import { listOwnerBookings, isSitter, isAdmin } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function OwnerBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/bookings/`);

  const m = getMessages(locale);
  const [bookings, sitter, admin] = await Promise.all([
    listOwnerBookings(session.user.id),
    isSitter(session.user.id),
    isAdmin(session.user.id),
  ]);

  return (
    <AccountShell locale={locale} title={m.account.myBookings} active="bookings" isSitter={sitter} isAdmin={admin}>
      {bookings.length === 0 ? (
        <div className="card card-pad" style={{ maxWidth: '36rem' }}>
          <h2 className="text-h4">{m.account.noBookings}</h2>
          <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{m.account.noBookingsHint}</p>
          <Link href={`/${segmentFor(locale)}/search/`} className="btn btn-primary"
                style={{ marginTop: 'var(--space-5)' }}>
            {m.account.findSitter}
          </Link>
        </div>
      ) : (
        <div className="booking-list">
          {bookings.map((b) => (
            <BookingCard key={b.id} booking={b} locale={locale} viewerRole="owner" />
          ))}
        </div>
      )}
    </AccountShell>
  );
}
