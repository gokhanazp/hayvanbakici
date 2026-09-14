import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMessages, localeFromSegment, type Locale } from '@havre/i18n';
import { requireAdmin, auditView } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { listAllBookings } from '@/lib/data';
import { money, dayNumFmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * Filtre degerleri BEYAZ LISTEDEN geciyor.
 * listAllBookings gelen metni booking_status'a cast ediyor; adres cubugundan
 * gelen uydurma bir deger veritabani hatasi olurdu. Listede olmayan filtre
 * yok sayilir — kullaniciya hata degil, tum liste gosterilir.
 */
const FILTERS = [
  'requested', 'confirmed', 'in_progress', 'completed', 'payout_released',
  'declined', 'cancelled', 'expired',
] as const;

export default async function AdminBookingsPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const [{ locale: seg }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const session = await requireAdmin();

  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  const m = getMessages(locale);

  const raw = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const status = FILTERS.find((f) => f === raw);

  const rows = await listAllBookings(status);
  // Rezervasyon listesi iki tarafin adini ve tutari iceriyor: kayda geciyor
  await auditView(session.user.id, 'bookings', status);

  const label = (s: string) =>
    (m.booking[`status.${s}` as keyof typeof m.booking] as string) ?? s;

  return (
    <AdminShell
      locale={locale}
      title={t('Bookings', 'Réservations')}
      lead={t(
        'Every booking on the platform, newest first. Names and amounts only — messages and addresses are not shown here.',
        'Toutes les réservations, les plus récentes d’abord. Noms et montants seulement — les messages et adresses ne sont pas affichés ici.',
      )}
      active="bookings"
    >
      <div className="row" style={{ marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
        <Link href="?" className={`chip${status ? '' : ' chip-active'}`}>
          {t('All', 'Toutes')}
        </Link>
        {FILTERS.map((f) => (
          <Link key={f} href={`?status=${f}`} className={`chip${status === f ? ' chip-active' : ''}`}>
            {label(f)}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="muted">
          {status
            ? t('No bookings with this status.', 'Aucune réservation avec ce statut.')
            : t('No bookings yet.', 'Aucune réservation pour l’instant.')}
        </p>
      ) : (
        <>
          <div className="table-scroll" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t('Requested', 'Demandée')}</th>
                  <th scope="col">{t('Service', 'Service')}</th>
                  <th scope="col">{t('Owner', 'Propriétaire')}</th>
                  <th scope="col">{t('Sitter', 'Gardien')}</th>
                  <th scope="col">{t('Starts', 'Début')}</th>
                  <th scope="col">{t('Status', 'Statut')}</th>
                  <th scope="col" style={{ textAlign: 'right' }}>{t('Owner pays', 'Le propriétaire paie')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="tabular dim">{dayNumFmt(b.createdAt, locale)}</td>
                    <td>{m.service[b.serviceType as keyof typeof m.service] ?? b.serviceType}</td>
                    <td>{b.ownerName}</td>
                    <td>{b.sitterName}</td>
                    <td className="tabular">{dayNumFmt(b.startAt, locale)}</td>
                    <td><StatusText status={b.status} locale={locale} /></td>
                    <td className="tabular" style={{ textAlign: 'right', fontWeight: 600 }}>
                      {money(b.ownerTotalCents, locale)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-body-sm dim" style={{ marginTop: 'var(--space-4)' }}>
            {t(
              'Showing the 100 most recent. Amounts are what the owner was quoted — Havre is not taking payments yet.',
              'Les 100 plus récentes. Les montants sont ceux annoncés au propriétaire — Havre n’encaisse pas encore de paiements.',
            )}
          </p>
        </>
      )}
    </AdminShell>
  );
}

/** Rozet degil duz metin: satirlar dar, renk burada bilgi tasimiyor. */
function StatusText({ status, locale }: { status: string; locale: Locale }) {
  const m = getMessages(locale);
  const label = (m.booking[`status.${status}` as keyof typeof m.booking] as string) ?? status;
  return <span>{label}</span>;
}
