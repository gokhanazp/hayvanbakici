import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, segmentFor } from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { Avatar } from '@/components/Avatar';
import { listConversations, isSitter, isAdmin, unreadCount } from '@/lib/data';
import { dateFmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/messages/`);

  const m = getMessages(locale);
  const [rows, sitter, admin, unread] = await Promise.all([
    listConversations(session.user.id),
    isSitter(session.user.id),
    isAdmin(session.user.id),
    unreadCount(session.user.id),
  ]);

  return (
    <AccountShell
      locale={locale}
      title={m.messages.title}
      active="messages"
      isSitter={sitter}
      isAdmin={admin}
      unread={unread}
    >
      {rows.length === 0 ? (
        <div className="card card-pad" style={{ maxWidth: '36rem' }}>
          <h2 className="text-h4">{m.messages.empty}</h2>
          <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
            {/*
              Bos ekran ROLE gore konusuyor: sahibe "soru sor" demek ise
              yarar, bakiciya ayni cumleyi kurmak anlamsiz — bakici
              kimseye ilk mesaji atmiyor.
            */}
            {sitter ? m.messages.emptySitter : m.messages.emptyOwner}
          </p>
          {!sitter && (
            <Link href={`/${segmentFor(locale)}/search/`} className="btn btn-primary"
                  style={{ marginTop: 'var(--space-5)' }}>
              {m.account.findSitter}
            </Link>
          )}
        </div>
      ) : (
        <div className="booking-list">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/${segmentFor(locale)}/account/messages/${c.id}/`}
              className={`card card-hover booking-card${c.unread > 0 ? ' is-unread' : ''}`}
            >
              <Avatar
                src={c.counterpartAvatarUrl} size={44}
                initials={`${c.counterpartFirstName.slice(0, 1)}${c.counterpartInitial}`}
              />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600 }}>
                  {c.counterpartFirstName} {c.counterpartInitial}.
                </p>
                <p className="text-body-sm muted line-clamp-1">
                  {c.lastMessage
                    ? <>{c.lastFromMe && <span className="dim">{m.messages.you}: </span>}{c.lastMessage}</>
                    : <span className="dim">{m.messages.noMessagesYet}</span>}
                </p>
              </div>
              <div className="booking-card-end">
                {c.unread > 0 && (
                  <span className="badge" style={{
                    background: 'var(--color-primary)', color: 'var(--color-primary-on)',
                  }}>
                    {c.unread === 1
                      ? m.messages.unreadOne
                      : interpolate(m.messages.unreadMany, { count: c.unread })}
                  </span>
                )}
                {c.lastMessageAt && (
                  <p className="text-body-sm dim tabular">{dateFmt(c.lastMessageAt, locale)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </AccountShell>
  );
}
