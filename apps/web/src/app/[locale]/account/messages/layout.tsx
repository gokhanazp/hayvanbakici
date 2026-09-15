import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { getMessages, localeFromSegment } from '@havre/i18n';
import { PATH_HEADER } from '@/middleware';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { ConversationList } from '@/components/ConversationList';
import { EmptyState, ChatArt } from '@/components/EmptyState';
import Link from 'next/link';
import { listConversations, getSitterStatus, isAdmin, unreadCount, markRead } from '@/lib/data';

export const dynamic = 'force-dynamic';

/**
 * GELEN KUTUSU — IKI PANEL.
 *
 * Konusma listesi burada, DUZEN icinde duruyor; sag panel (bos ekran ya
 * da acik yazisma) alt sayfalardan geliyor. Boylece bir konusmadan
 * digerine gecerken liste yeniden cizilmiyor ve kaydirma yeri kalmiyor.
 *
 * ADRES HALA HER KONUSMA ICIN AYRI (`/account/messages/<id>`): geri
 * tusu calisiyor, bag paylasilabiliyor, sekmede acilabiliyor. Sohbet
 * gorunumu ugruna tek adrese hapsetmek bunlarin hepsini kaybettirirdi.
 *
 * DAR EKRAN: iki panel yan yana sigmaz. Liste ile yazisma SIRAYLA
 * gosteriliyor (CSS; hangisinin gorunecegini adres belirliyor).
 */
export default async function MessagesLayout({
  params, children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/messages/`);

  /*
    OKUNDU ISARETI LISTEDEN ONCE.
    Acik yazismayi okundu isaretlemek sayfanin isi; ama duzen (liste ve
    sekmedeki sayac) sayfadan ONCE ciziliyor. Isaret orada kalirsa,
    okudugunuz konusma satirinda ve sekmede "1 okunmamis" yazmaya devam
    ediyordu (bizzat gorundu). Acik konusmanin kimligi adresten, adres de
    middleware'in koydugu basliktan geliyor.
  */
  const path = (await headers()).get(PATH_HEADER) ?? '';
  const open = /\/account\/messages\/([0-9a-f-]{36})(?:\/|$)/i.exec(path)?.[1];
  if (open) await markRead(open, session.user.id);

  const m = getMessages(locale);
  const [rows, sitterStatus, admin, unread] = await Promise.all([
    listConversations(session.user.id),
    getSitterStatus(session.user.id),
    isAdmin(session.user.id),
    unreadCount(session.user.id),
  ]);

  return (
    <AccountShell
      locale={locale}
      title={m.messages.title}
      active="messages"
      isSitter={sitterStatus !== null}
      sitterStatus={sitterStatus}
      isAdmin={admin}
      unread={unread}
    >
      {/*
        HIC KONUSMA YOKSA IKI PANEL DE CIZILMIYOR.

        Eskiden bos bir liste ve yanina "bir konusma secin" diyen bos bir
        okuma paneli ciziliyordu: ekranda yan yana iki dev bos kutu, ve
        secilecek hicbir sey yok. Secenek olmadiginda secim ekrani
        gostermek, kullaniciya yapamayacagi bir isi anlatmaktir.
      */}
      {rows.length === 0 ? (
        <EmptyState
          icon={ChatArt}
          title={m.messages.empty}
          body={sitterStatus !== null ? m.messages.emptySitter : m.messages.emptyOwner}
          {...(sitterStatus === null
            ? {
                action: (
                  <Link href={`/${seg}/search/`} className="btn btn-primary">
                    {m.account.findSitter}
                  </Link>
                ),
              }
            : {})}
        />
      ) : (
        <div className="inbox">
          <ConversationList locale={locale} rows={rows} isSitter={sitterStatus !== null} />
          {children}
        </div>
      )}
    </AccountShell>
  );
}
