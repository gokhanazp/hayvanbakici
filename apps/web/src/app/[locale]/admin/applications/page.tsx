import Link from 'next/link';
import { notFound } from 'next/navigation';
import { localeFromSegment, segmentFor } from '@havre/i18n';
import { requireAdmin, auditView } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { listApplications } from '@/lib/data';
import { dateFmt } from '@/lib/format';

export default async function ApplicationsPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ all?: string | string[] }>;
}) {
  const [{ locale: seg }, sp] = await Promise.all([params, searchParams]);
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const session = await requireAdmin();

  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  const showAll = (Array.isArray(sp.all) ? sp.all[0] : sp.all) === '1';

  const rows = await listApplications(showAll ? 'all' : 'pending');
  // Basvuru listesi kisisel veri: kimin acildigini kaydediyoruz
  await auditView(session.user.id, 'sitter_applications');

  return (
    <AdminShell
      locale={locale}
      title={t('Applications', 'Candidatures')}
      lead={t(
        'Oldest first — a forgotten application is worse than a refused one. Refusing requires a written reason.',
        'Les plus anciennes d’abord — une candidature oubliée est pire qu’un refus. Un refus exige un motif écrit.',
      )}
      active="applications"
    >
      <div className="row" style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="?" className={`chip${showAll ? '' : ' chip-active'}`}>
          {t('Waiting', 'En attente')}
        </Link>
        <Link href="?all=1" className={`chip${showAll ? ' chip-active' : ''}`}>
          {t('All', 'Toutes')}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="muted">{t('Nothing waiting.', 'Rien en attente.')}</p>
      ) : (
        <div className="booking-list">
          {rows.map((a) => (
            <Link
              key={a.userId}
              href={`/${segmentFor(locale)}/admin/applications/${a.userId}/`}
              className="card card-hover booking-card"
            >
              <span className="avatar avatar-initials" style={{ width: 44, height: 44, fontSize: 16 }}>
                {`${a.firstName.slice(0, 1)}${a.lastNameInitial}`.toUpperCase()}
              </span>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontWeight: 600 }}>{a.firstName} {a.lastNameInitial}.</p>
                <p className="text-body-sm muted">{a.email}</p>
                <p className="text-body-sm dim">
                  {a.cityName ?? t('No city yet', 'Ville non renseignée')} ·{' '}
                  {t('applied', 'candidature')} {dateFmt(a.submittedAt, locale)}
                </p>
              </div>
              <div className="booking-card-end">
                <span className="badge" style={{
                  background: a.status === 'pending' ? 'var(--color-tile-apricot)' : 'var(--color-surface-sunken)',
                  color: a.status === 'pending' ? 'var(--color-tile-apricot-ink)' : 'var(--color-ink-secondary)',
                }}>
                  {a.status}
                </span>
                <p className="text-body-sm dim">
                  {a.verifications.length === 0
                    ? t('no checks yet', 'aucune vérification')
                    : a.verifications.map((v) => `${v.type}: ${v.status}`).join(' · ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
