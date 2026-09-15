import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, unitLabel, interpolate, localeFromSegment, segmentFor, type Messages } from '@havre/i18n';
import { SERVICES } from '@havre/core';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { StatusBadge } from '@/components/BookingCard';
import { RespondButtons, CancelButton, MessageCounterpartButton } from '@/components/BookingActions';
import { Avatar } from '@/components/Avatar';
import { petLabel } from '@/components/PetLine';
import { getBooking, getSitterStatus, isAdmin, unreadCount } from '@/lib/data';
import { money, dateFmt } from '@/lib/format';
import { respondAction, cancelAction, openBookingConversationAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: seg, id } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/bookings/${id}/`);

  const booking = await getBooking(id, session.user.id, locale);
  // Taraf olmayan icin sorgu null doner — 404. "Yetkiniz yok" demek bile
  // rezervasyonun VAR OLDUGUNU sizdirir.
  if (!booking) notFound();

  const m = getMessages(locale);
  const [sitterStatus, adminPanel, unread] = await Promise.all([
    getSitterStatus(session.user.id), isAdmin(session.user.id), unreadCount(session.user.id),
  ]);
  const unit = SERVICES[booking.serviceType].unit;
  const name = `${booking.counterpartFirstName} ${booking.counterpartInitial}.`;
  const isOwner = booking.viewerRole === 'owner';
  const canRespond = !isOwner && booking.status === 'requested';
  const canCancel = ['requested', 'confirmed'].includes(booking.status);

  return (
    <AccountShell
      locale={locale}
      title={interpolate(isOwner ? m.booking.withSitter : m.booking.forOwner, { name })}
      active={isOwner ? 'bookings' : 'sitter'}
      isSitter={sitterStatus !== null}
      sitterStatus={sitterStatus}
      isAdmin={adminPanel}
      unread={unread}
      actions={
        <Link href={`/${seg}/account/${isOwner ? 'bookings' : 'sitter'}/`} className="text-body-sm muted">
          ← {m.booking.backToList}
        </Link>
      }
    >
      <div className="booking-detail">
        <div className="stack" style={{ display: 'grid', gap: 'var(--space-8)' }}>
          {/* --- Ozet --- */}
          <section className="card card-pad">
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="row" style={{ gap: 'var(--space-4)' }}>
                <Avatar src={booking.counterpartAvatarUrl} size={52}
                  initials={`${booking.counterpartFirstName.slice(0, 1)}${booking.counterpartInitial}`} />
                <div>
                  <p style={{ fontWeight: 600 }}>{name}</p>
                  <p className="text-body-sm muted">{m.service[booking.serviceType]}</p>
                </div>
              </div>
              <StatusBadge status={booking.status} locale={locale} />
            </div>

            <dl className="rate-compare" style={{ marginTop: 'var(--space-6)' }}>
              <div>
                <dt className="dim text-body-sm">{m.booking.dates}</dt>
                <dd className="tabular" style={{ fontWeight: 600 }}>
                  {dateFmt(booking.startAt, locale)} – {dateFmt(booking.endAt, locale)}
                </dd>
              </div>
              <div>
                <dt className="dim text-body-sm">{m.search.service}</dt>
                <dd className="tabular" style={{ fontWeight: 600 }}>
                  {booking.units} {unitLabel(locale, unit, booking.units)}
                </dd>
              </div>
              <div>
                <dt className="dim text-body-sm">{m.booking.policy}</dt>
                <dd style={{ fontWeight: 600 }}>
                  {m.onboarding[`cancellation.${booking.cancellationPolicy}` as keyof Messages['onboarding']] as string}
                </dd>
              </div>
            </dl>

            {booking.pets.length > 0 && (
              <p className="text-body-sm muted" style={{ marginTop: 'var(--space-5)' }}>
                {m.booking.pets}{' '}
                {booking.pets.map((p) => petLabel(p, locale)).join(', ')}
              </p>
            )}
          </section>

          {booking.specialInstructions && (
            <section className="card card-pad">
              <h2 className="text-h4">{m.booking.instructionsHeading}</h2>
              <p className="muted" style={{ marginTop: 'var(--space-3)', whiteSpace: 'pre-wrap' }}>
                {booking.specialInstructions}
              </p>
            </section>
          )}

          {/* --- Gecmis: anlasmazlikta sirayi gosteren tek kayit --- */}
          {booking.timeline.length > 0 && (
            <section>
              <h2 className="text-h4" style={{ marginBottom: 'var(--space-4)' }}>{m.booking.timeline}</h2>
              <ul className="booking-timeline">
                {booking.timeline.map((e, i) => (
                  <li key={`${e.at}-${i}`}>
                    <time dateTime={e.at}>{dateFmt(e.at, locale)}</time>
                    <span>{(m.booking[`status.${e.to}` as keyof typeof m.booking] as string) ?? e.to}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* --- Yan sutun: para ve eylemler --- */}
        <aside className="stack" style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <div className="card card-pad">
            <h2 className="text-h4">{isOwner ? m.account.youPay : m.account.youEarn}</h2>
            <table style={{ width: '100%', marginTop: 'var(--space-4)', fontSize: '0.875rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: 'var(--space-1) 0' }}>
                    {money(booking.unitPriceCents, locale)} × {booking.units} {unitLabel(locale, unit, booking.units)}
                  </td>
                  <td className="tabular" style={{ textAlign: 'right' }}>{money(booking.baseCents, locale)}</td>
                </tr>
                {booking.extraPetCents > 0 && (
                  <tr>
                    <td style={{ padding: 'var(--space-1) 0' }}>{m.quote.extraPets}</td>
                    <td className="tabular" style={{ textAlign: 'right' }}>{money(booking.extraPetCents, locale)}</td>
                  </tr>
                )}
                {isOwner ? (
                  <>
                    <tr>
                      <td style={{ padding: 'var(--space-1) 0' }}>{m.quote.serviceFee}</td>
                      <td className="tabular" style={{ textAlign: 'right' }}>{money(booking.ownerFeeCents, locale)}</td>
                    </tr>
                    <tr>
                      <td className="dim" style={{ padding: 'var(--space-1) 0' }}>{m.quote.tax}</td>
                      <td className="tabular dim" style={{ textAlign: 'right' }}>{money(booking.ownerTaxCents, locale)}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td style={{ padding: 'var(--space-1) 0' }}>
                      {m.quote.sitterCommission} ({booking.sitterCommissionPct}%)
                    </td>
                    <td className="tabular" style={{ textAlign: 'right' }}>
                      −{money(booking.sitterCommissionCents, locale)}
                    </td>
                  </tr>
                )}
                <tr style={{ borderTop: '1px solid var(--color-border)' }}>
                  <th scope="row" style={{ padding: 'var(--space-3) 0', textAlign: 'left' }}>{m.quote.total}</th>
                  <td className="tabular text-h4" style={{ textAlign: 'right' }}>
                    {money(isOwner ? booking.ownerTotalCents : booking.sitterPayoutCents, locale)}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>{m.booking.priceNote}</p>
          </div>

          {/* Odeme henuz yok — sayfa bunu SOYLUYOR, sessizce gecmiyor. */}
          <div className="notice notice-warning">
            <p>{m.booking.noPayment}</p>
          </div>

          {canRespond && (
            <div className="card card-pad">
              {booking.expiresAt && (
                <p className="text-body-sm dim" style={{ marginBottom: 'var(--space-4)' }}>
                  {interpolate(m.account.respondBy, { date: dateFmt(booking.expiresAt, locale) })}
                </p>
              )}
              <RespondButtons locale={locale} bookingId={booking.id} action={respondAction} />
            </div>
          )}

          {/*
            KONUSMA: rezervasyon ile mesajlasma ayri yerlerde durmasin.
            Iptal edilmis rezervasyonda da duruyor — insanlar iptalden
            SONRA konusmak zorunda kaliyor ("anahtari nerede birakayim").
          */}
          <MessageCounterpartButton
            locale={locale}
            bookingId={booking.id}
            label={interpolate(m.messages.messageName, { name: booking.counterpartFirstName })}
            action={openBookingConversationAction}
          />

          {canCancel && <CancelButton locale={locale} bookingId={booking.id} action={cancelAction} />}
        </aside>
      </div>
    </AccountShell>
  );
}
