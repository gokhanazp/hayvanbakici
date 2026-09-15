import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment } from '@havre/i18n';
import { ChatArt } from '@/components/EmptyState';

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
        {/* Bos durumlarla AYNI cizim: ayni soruyu soran iki ekran, ayni
            gorsel dili konussun. */}
        <span aria-hidden="true" style={{ lineHeight: 0 }}>{ChatArt}</span>
        <p>{m.messages.pickOne}</p>
      </div>
    </section>
  );
}
