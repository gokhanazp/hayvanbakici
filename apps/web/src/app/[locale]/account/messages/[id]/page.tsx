import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { Avatar } from '@/components/Avatar';
import { MessageComposer } from '@/components/MessageComposer';
import { ReportMessageButton } from '@/components/ReportMessageButton';
import { MessagePoller } from '@/components/MessagePoller';
import { getThread, markRead } from '@/lib/data';
import { sendMessageAction, reportMessageAction } from '../actions';

export const dynamic = 'force-dynamic';

/** Mesaj saati — gun icinde saat, eski gunlerde tarih + saat. */
function stampFor(iso: string, locale: 'en-CA' | 'fr-CA'): string {
  const d = new Date(iso);
  const sameDay = new Date().toDateString() === d.toDateString();
  return new Intl.DateTimeFormat(locale, sameDay
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
  ).format(d);
}

/**
 * SAG PANEL: acik yazisma.
 *
 * Konusma listesi ve hesap cercevesi DUZENDE; burada yalnizca yazismanin
 * kendisi var. Dar ekranda bu panel tam ekran kaplar ve ustunde listeye
 * donen bir bag bulunur.
 */
export default async function ThreadPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: seg, id } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/messages/${id}/`);

  const thread = await getThread(id, session.user.id);
  // getThread kimlik kontrolunu WHERE icinde yapiyor: baskasinin
  // konusmasi "yok" gorunur, "yasak" degil — varligini da soylemiyoruz.
  if (!thread) notFound();

  /*
    ACINCA OKUNDU. Ayri bir "okundu isaretle" dugmesi yok: kullanicidan
    okudugunu beyan etmesini istemek, okunmamis sayisini anlamsiz yapar.
    Yazma islemi sayfa cizimi sirasinda ve bilerek AWAIT ediliyor.
  */
  await markRead(id, session.user.id);

  const m = getMessages(locale);
  const name = `${thread.counterpartFirstName} ${thread.counterpartInitial}.`;
  const profileHref = thread.viewerRole === 'owner' && thread.sitterSlug && thread.citySlugEn
    ? `/${segmentFor(locale)}/${thread.citySlugEn}/sitter/${thread.sitterSlug}/`
    : null;

  const last = thread.messages[thread.messages.length - 1];

  return (
    <section className="inbox-thread">
      {/* Yazismanin kendi basligi: kiminle konustugunuz her zaman ekranda */}
      <header className="thread-head">
        <Link href={`/${segmentFor(locale)}/account/messages/`} className="thread-back"
              aria-label={m.messages.title}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <Avatar
          src={thread.counterpartAvatarUrl} size={36}
          initials={`${thread.counterpartFirstName.slice(0, 1)}${thread.counterpartInitial}`}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontWeight: 600 }}>{name}</p>
          {thread.counterpartSuspended && (
            <p className="text-body-sm dim">{m.messages.counterpartSuspended}</p>
          )}
        </div>
        <div className="row" style={{ gap: 'var(--space-1)' }}>
          {profileHref && (
            <Link href={profileHref} className="btn btn-ghost text-body-sm">
              {m.messages.viewProfile}
            </Link>
          )}
          {thread.bookingId && (
            <Link href={`/${segmentFor(locale)}/account/bookings/${thread.bookingId}/`}
                  className="btn btn-ghost text-body-sm">
              {m.messages.openBooking}
            </Link>
          )}
        </div>
      </header>

      <div className="thread-scroll">
        {thread.messages.some((msg) => msg.redacted) && (
          <div className="notice notice-warning">
            <p>{m.messages.redactedNotice}</p>
          </div>
        )}

        {thread.messages.length === 0 ? (
          <p className="muted">{m.messages.noMessagesYet}</p>
        ) : (
          <ol className="thread-list">
            {thread.messages.map((msg) => (
              <li key={msg.id} className={`bubble-row${msg.mine ? ' is-mine' : ''}`}>
                {!msg.mine && (
                  <Avatar
                    src={thread.counterpartAvatarUrl} size={32}
                    initials={`${thread.counterpartFirstName.slice(0, 1)}${thread.counterpartInitial}`}
                  />
                )}
                <div className="bubble">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{msg.body}</p>
                  <p className="bubble-meta">
                    <time dateTime={msg.createdAt} className="tabular">
                      {stampFor(msg.createdAt, locale)}
                    </time>
                    {msg.redacted && <span className="dim"> · {m.messages.redactedShort}</span>}
                  </p>
                  {!msg.mine && (
                    <ReportMessageButton
                      locale={locale} messageId={msg.id} action={reportMessageAction}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="thread-composer">
        {thread.counterpartSuspended && (
          <p className="alert alert-error" role="status">{m.messages.counterpartSuspended}</p>
        )}
        <MessageComposer locale={locale} conversationId={thread.id} action={sendMessageAction} />
      </div>

      {/* Karsi taraf yazinca sayfayi kendiliginden tazeler */}
      <MessagePoller conversationId={thread.id} lastAt={last?.createdAt ?? null} />
    </section>
  );
}
