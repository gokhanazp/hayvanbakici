import Link from 'next/link';
import { notFound } from 'next/navigation';
import { localeFromSegment } from '@havre/i18n';
import { requireAdmin, auditView } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { listAudit } from '@/lib/data';
import { stampFmt } from '@/lib/format';

export const dynamic = 'force-dynamic';

/**
 * DENETIM KAYDI.
 *
 * Panelin en onemli sayfasi bu — cunku diger sayfalarda yapilan her sey
 * buraya dusuyor. Law 25 ve PIPEDA "gerektigi kadar erisim" bekliyor;
 * bunun tek kaniti kimin neye ne zaman baktigidir.
 *
 * Bu sayfayi acmak da bir kayit uretiyor. Denetim kaydini okuyanin
 * kayitsiz kalmasi, kaydin amacini bosa cikarirdi.
 *
 * Kayitlar SILINEMEZ ve buradan duzenlenemez; yalnizca okunur.
 */

/** Teknik eylem adlarini insan diline ceviriyoruz. */
function actionLabel(action: string, fr: boolean): string {
  const map: Record<string, [string, string]> = {
    'sitter.approve': ['Approved a sitter', 'A approuvé un gardien'],
    'sitter.reject': ['Refused a sitter', 'A refusé un gardien'],
    'admin.view': ['Opened a list or record', 'A ouvert une liste ou une fiche'],
    'booking.request': ['Booking requested', 'Réservation demandée'],
    'booking.respond': ['Answered a request', 'A répondu à une demande'],
    'booking.cancel': ['Cancelled a booking', 'A annulé une réservation'],
  };
  const hit = map[action];
  return hit ? (fr ? hit[1] : hit[0]) : action;
}

export default async function AdminAuditPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ only?: string | string[] }>;
}) {
  const [{ locale: seg }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const session = await requireAdmin();

  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  const decisionsOnly = (Array.isArray(sp.only) ? sp.only[0] : sp.only) === 'decisions';
  const rows = await listAudit(200, decisionsOnly ? 'decisions' : 'all');
  // Kaydi okumak da kayda geciyor
  await auditView(session.user.id, 'audit_log');

  return (
    <AdminShell
      locale={locale}
      title={t('Audit log', 'Journal')}
      lead={t(
        'Who did what, and when. Every decision and every sensitive view is written here — including opening this page. Entries cannot be edited or deleted.',
        'Qui a fait quoi, et quand. Chaque décision et chaque consultation sensible est inscrite ici — y compris l’ouverture de cette page. Les entrées ne peuvent être ni modifiées ni supprimées.',
      )}
      active="audit"
    >
      <div className="row" style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="?" className={`chip${decisionsOnly ? '' : ' chip-active'}`}>
          {t('Everything', 'Tout')}
        </Link>
        <Link href="?only=decisions" className={`chip${decisionsOnly ? ' chip-active' : ''}`}>
          {t('Decisions only', 'Décisions seulement')}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="muted">{t('Nothing recorded yet.', 'Rien d’enregistré pour l’instant.')}</p>
      ) : (
        <>
          <div className="table-scroll" tabIndex={0}>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">{t('When', 'Quand')}</th>
                  <th scope="col">{t('Who', 'Qui')}</th>
                  <th scope="col">{t('What', 'Quoi')}</th>
                  <th scope="col">{t('On', 'Sur')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="tabular dim">
                      <time dateTime={r.at}>{stampFmt(r.at, locale)}</time>
                    </td>
                    <td>{r.actorName ?? t('System', 'Système')}</td>
                    <td style={{ whiteSpace: 'normal', maxWidth: '28rem' }}>
                      {actionLabel(r.action, fr)}
                      {r.reason && (
                        <span className="text-body-sm dim" style={{ display: 'block' }}>
                          {t('Reason given:', 'Motif donné :')} {r.reason}
                        </span>
                      )}
                    </td>
                    <td className="dim">
                      {r.entity}
                      {r.entityId ? <span className="tabular"> · {shortId(r.entityId)}</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-body-sm dim" style={{ marginTop: 'var(--space-4)' }}>
            {t(
              'The 200 most recent entries. Identifiers are shortened on screen; the full record stays in the database.',
              'Les 200 entrées les plus récentes. Les identifiants sont abrégés à l’écran; l’enregistrement complet reste en base.',
            )}
          </p>
        </>
      )}
    </AdminShell>
  );
}

/** UUID'nin tamamini ekrana basmak satiri okunmaz yapiyor; ilk blok yeterli. */
function shortId(id: string): string {
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}
