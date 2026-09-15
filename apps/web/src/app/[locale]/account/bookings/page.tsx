import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { BookingCard } from '@/components/BookingCard';
import { EmptyState, CalendarArt } from '@/components/EmptyState';
import { listOwnerBookings, getSitterStatus, isAdmin } from '@/lib/data';

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
    getSitterStatus(session.user.id),
    isAdmin(session.user.id),
  ]);

  /* Bitis tarihi gecmisse gecmis. Sinir GUN bazinda: bugun biten bir
     rezervasyon hala "yaklasan" — sahip onu bugun arar. */
    const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.endAt.slice(0, 10) >= today);
  const past = bookings.filter((b) => b.endAt.slice(0, 10) < today);

  return (
    <AccountShell locale={locale} title={m.account.myBookings} active="bookings" isSitter={sitter !== null} sitterStatus={sitter} isAdmin={admin}>
      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarArt}
          title={m.account.noBookings}
          body={m.account.noBookingsHint}
          action={
            <Link href={`/${segmentFor(locale)}/search/`} className="btn btn-primary">
              {m.account.findSitter}
            </Link>
          }
        />
      ) : (
        /*
          YAKLASAN VE GECMIS AYRI.

          Liste baslangic tarihine gore tersten siralaniyordu, yani
          Kasim'daki bir rezervasyon ile Agustos'ta BITMIS bir tanesi
          arada hicbir isaret olmadan alt alta duruyordu. "Bu hala
          gecerli mi?" sorusunu her satirda yeniden sormak gerekiyordu.
          Ayrim TARIHTEN cikiyor, durumdan degil: iptal edilmis ama
          gelecekte olan bir rezervasyon da yaklasanlarda kaliyor,
          cunku kullanicinin onu aradigi yer orasi.
        */
        <div className="booking-groups">
          {([
            ['upcoming', upcoming] as const,
            ['past', past] as const,
          ]).filter(([, list]) => list.length > 0).map(([key, list]) => (
            <section key={key}>
              <h2 className="text-h4 booking-group-head">
                {key === 'upcoming' ? m.booking.upcoming : m.booking.past}
                <span className="section-count">{list.length}</span>
              </h2>
              <div className="booking-list">
                {list.map((b) => (
                  <BookingCard key={b.id} booking={b} locale={locale} viewerRole="owner" />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
