import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment } from '@havre/i18n';

export const dynamic = 'force-dynamic';

/**
 * SAG PANELIN BOS HALI.
 *
 * Konusma listesi DUZENDE (layout.tsx) duruyor; bu sayfa yalnizca
 * "bir konusma secin" ekrani. Dar ekranda hic gorunmuyor: orada zaten
 * listenin kendisi tam ekran, yaninda bir de bos kutu gostermek
 * anlamsiz olurdu.
 */
export default async function MessagesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);

  return (
    <section className="inbox-thread is-placeholder">
      <div className="inbox-placeholder">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 13.5a2 2 0 0 1-2 2H8l-4 3.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2Z" />
          <path d="M8.5 9.5h7M8.5 12h4" />
        </svg>
        <p>{m.messages.pickOne}</p>
      </div>
    </section>
  );
}
