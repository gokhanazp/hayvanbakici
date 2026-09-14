import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { Avatar } from '@/components/Avatar';
import { MessageComposer } from '@/components/MessageComposer';
import { ReportMessageButton } from '@/components/ReportMessageButton';
import { getThread, markRead, isSitter, isAdmin, unreadCount } from '@/lib/data';
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
    Yazma islemi sayfa cizimi sirasinda yapiliyor ve bilerek AWAIT
    ediliyor — aksi halde ayni istekte okunan sayaci eski degeri gosterirdi.
  */
  await markRead(id, session.user.id);

  const m = getMessages(locale);
  const [sitter, admin, unread] = await Promise.all([
    isSitter(session.user.id),
    isAdmin(session.user.id),
    unreadCount(session.user.id),
  ]);

  const name = `${thread.counterpartFirstName} ${thread.counterpartInitial}.`;
  const profileHref = thread.viewerRole === 'owner' && thread.sitterSlug && thread.citySlugEn
    ? `/${segmentFor(locale)}/${thread.citySlugEn}/sitter/${thread.sitterSlug}/`
    : null;

  return (
    <AccountShell
      locale={locale}
      title={name}
      active="messages"
      isSitter={sitter}
      isAdmin={admin}
      unread={unread}
      actions={
        <>
          <Link href={`/${segmentFor(locale)}/account/messages/`} className="btn btn-ghost">
            ← {m.messages.title}
          </Link>
          {profileHref && (
            <Link href={profileHref} className="btn btn-ghost">{m.messages.viewProfile}</Link>
          )}
          {thread.bookingId && (
            <Link href={`/${segmentFor(locale)}/account/bookings/${thread.bookingId}/`}
                  className="btn btn-ghost">
              {m.messages.openBooking}
            </Link>
          )}
        </>
      }
    >
      <div className="thread">
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
                    {/* Maskeleme SESSIZ olmamali: iki taraf da bir seyin
                        gizlendigini gormeli, yoksa karsi taraf cevapsiz
                        kaldigini saniyor. Balonda KISA isaret var; uzun
                        aciklama yazisma basinda BIR KEZ veriliyor —
                        her mesajin altinda tekrarlanan paragraf, uyari
                        olmaktan cikip gurultu oluyordu. */}
                    {msg.redacted && <span className="dim"> · {m.messages.redactedShort}</span>}
                  </p>
                  {/*
                    Bildirme YALNIZCA karsi tarafin mesajinda. Kendi
                    mesajini bildirmek anlamsiz; sunucu da reddediyor.
                    Panelde ham metni acmanin tek anahtari bu dugme.
                  */}
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

        <div className="thread-composer">
          {thread.counterpartSuspended && (
            <p className="alert alert-error" role="status">{m.messages.counterpartSuspended}</p>
          )}
          <MessageComposer locale={locale} conversationId={thread.id} action={sendMessageAction} />
        </div>
      </div>
    </AccountShell>
  );
}
