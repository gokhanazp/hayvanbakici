import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { requireAdmin } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { getAdminOverview } from '@/lib/data';
import { numberFmt } from '@/lib/format';

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  await requireAdmin();

  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  const o = await getAdminOverview();

  const needsHuman = o.pendingApplications + o.manualReviews;

  return (
    <AdminShell
      locale={locale}
      title={t('Overview', 'Aperçu')}
      lead={t(
        'What needs a person today, and where the marketplace stands.',
        'Ce qui demande une personne aujourd’hui, et l’état de la place de marché.',
      )}
      active="overview"
    >
      {/*
        EN USTTE INSAN BEKLEYEN IS. Panelin ilk isi "her seyi gostermek"
        degil, bugun kimin bekledigini soylemek: bir basvuruyu unutmak,
        reddetmekten daha kotu.
      */}
      <div className="card card-pad" style={{
        background: needsHuman > 0 ? 'var(--color-tile-apricot)' : 'var(--color-accent-subtle)',
        borderColor: 'transparent', maxWidth: '42rem',
      }}>
        <h2 className="text-h3">
          {needsHuman > 0
            ? t(`${needsHuman} waiting for a person`, `${needsHuman} en attente d’une personne`)
            : t('Nothing waiting', 'Rien en attente')}
        </h2>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
          {t(
            'Applications are never refused automatically. Each one is read here.',
            'Aucune candidature n’est refusée automatiquement. Chacune est lue ici.',
          )}
        </p>
        {needsHuman > 0 && (
          <Link href={`/${segmentFor(locale)}/admin/applications/`} className="btn btn-primary"
                style={{ marginTop: 'var(--space-5)' }}>
            {t('Open the queue', 'Ouvrir la file')}
          </Link>
        )}
      </div>

      <div className="grid grid-4" style={{ marginTop: 'var(--space-8)' }}>
        <Stat label={t('Pending applications', 'Candidatures en attente')} value={o.pendingApplications} locale={locale} />
        <Stat label={t('Flagged for review', 'Signalées pour examen')} value={o.manualReviews} locale={locale} />
        <Stat label={t('Active sitters', 'Gardiens actifs')} value={o.activeSitters} locale={locale} />
        <Stat label={t('Owners', 'Propriétaires')} value={o.owners} locale={locale} />
        <Stat label={t('Cities with supply', 'Villes avec offre')} value={o.citiesWithSupply} locale={locale} />
        <Stat label={t('Published reviews', 'Avis publiés')} value={o.reviewsPublished} locale={locale} />
      </div>

      <h2 className="text-h3" style={{ margin: 'var(--space-10) 0 var(--space-4)' }}>
        {t('Bookings by status', 'Réservations par statut')}
      </h2>
      {o.bookingsByStatus.length === 0 ? (
        <p className="muted">{t('No bookings yet.', 'Aucune réservation.')}</p>
      ) : (
        <div className="faq" style={{ maxWidth: '34rem' }}>
          {o.bookingsByStatus.map((b) => (
            <div key={b.status} className="faq-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-4) var(--space-5)' }}>
                <span>{(m.booking[`status.${b.status}` as keyof typeof m.booking] as string) ?? b.status}</span>
                <strong className="tabular">{numberFmt(b.count, locale)}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function Stat({ label, value, locale }: { label: string; value: number; locale: 'en-CA' | 'fr-CA' }) {
  return (
    <div className="card card-pad">
      <p className="text-numeral">{numberFmt(value, locale)}</p>
      <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>{label}</p>
    </div>
  );
}
