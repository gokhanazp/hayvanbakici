'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { Avatar } from '@/components/Avatar';
import { chatStamp } from '@/lib/format';

export interface ConversationRow {
  id: string;
  counterpartFirstName: string;
  counterpartInitial: string;
  counterpartAvatarUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  lastFromMe: boolean;
  unread: number;
}

/**
 * SOL PANEL: konusma listesi.
 *
 * ISTEMCI BILESENI cunku tek isi hangi konusmanin ACIK oldugunu bilmek
 * ve dar ekranda kendini gizlemek. Veriyi sunucudan hazir aliyor —
 * burada hicbir sorgu yok.
 *
 * Secili satiri adresten okuyoruz (`usePathname`), kendi durumumuzda
 * tutmuyoruz: tek dogru kaynak adres olsun, geri tusu ve yenileme
 * listeyle yazismayi asla farkli sey gostermesin.
 */
export function ConversationList({
  locale, rows, isSitter,
}: {
  locale: Locale;
  rows: ConversationRow[];
  isSitter: boolean;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const path = usePathname();

  const base = `/${seg}/account/messages`;
  const activeId = path.startsWith(`${base}/`)
    ? path.slice(base.length + 1).replace(/\/$/, '')
    : null;

  return (
    <aside className="inbox-list" data-open={activeId ? 'thread' : 'list'}>
      {rows.length === 0 ? (
        <div className="inbox-empty-list">
          <p style={{ fontWeight: 600 }}>{m.messages.empty}</p>
          <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
            {isSitter ? m.messages.emptySitter : m.messages.emptyOwner}
          </p>
          {!isSitter && (
            <Link href={`/${seg}/search/`} className="btn btn-primary"
                  style={{ marginTop: 'var(--space-4)' }}>
              {m.account.findSitter}
            </Link>
          )}
        </div>
      ) : (
        <ul className="inbox-rows">
          {rows.map((c) => {
            const isActive = c.id === activeId;
            /* Acik konusmanin okunmamisi YOKTUR: okuyorsunuz. Sunucu da
               boyle isaretliyor; burada beklemeden gosteriyoruz. */
            const unread = isActive ? 0 : c.unread;
            return (
              <li key={c.id}>
                <Link
                  href={`${base}/${c.id}/`}
                  className={`inbox-row${isActive ? ' is-active' : ''}${unread > 0 ? ' is-unread' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Avatar
                    src={c.counterpartAvatarUrl} size={40}
                    initials={`${c.counterpartFirstName.slice(0, 1)}${c.counterpartInitial}`}
                  />
                  <span className="inbox-row-body">
                    <span className="inbox-row-top">
                      <span className="inbox-name">
                        {c.counterpartFirstName} {c.counterpartInitial}.
                      </span>
                      {c.lastMessageAt && (
                        <span className="text-body-sm dim tabular">
                          {chatStamp(c.lastMessageAt, locale)}
                        </span>
                      )}
                    </span>
                    <span className="inbox-preview line-clamp-1">
                      {c.lastMessage
                        ? <>{c.lastFromMe && <span className="dim">{m.messages.you}: </span>}{c.lastMessage}</>
                        : <span className="dim">{m.messages.noMessagesYet}</span>}
                    </span>
                  </span>
                  {unread > 0 && (
                    <span className="inbox-count" aria-label={
                      unread === 1
                        ? m.messages.unreadOne
                        : interpolate(m.messages.unreadMany, { count: unread })
                    }>
                      {unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
