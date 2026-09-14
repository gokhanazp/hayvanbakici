import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { requireAdmin, auditView } from '@/lib/admin';
import { AdminShell } from '@/components/AdminShell';
import { AdminDecision } from '@/components/AdminDecision';
import { getApplication } from '@/lib/data';
import { money, dateFmt } from '@/lib/format';
import { decideAction } from './actions';

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: seg, id } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const session = await requireAdmin();

  const app = await getApplication(id);
  if (!app) notFound();

  // Tek bir kisinin kaydini acmak: kim, ne zaman, kimi acti
  await auditView(session.user.id, 'sitter', id);

  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  return (
    <AdminShell
      locale={locale}
      title={`${app.firstName} ${app.lastNameInitial}.`}
      lead={app.email}
      active="applications"
    >
      <p style={{ marginBottom: 'var(--space-6)' }}>
        <Link href={`/${segmentFor(locale)}/admin/applications/`} className="text-body-sm muted">
          ← {t('All applications', 'Toutes les candidatures')}
        </Link>
      </p>

      <div className="content-grid">
        <div className="stack" style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <section className="card card-pad">
            <h2 className="text-h4">{t('Application', 'Candidature')}</h2>
            <dl className="rate-compare" style={{ marginTop: 'var(--space-4)' }}>
              <div>
                <dt className="dim text-body-sm">{t('Status', 'Statut')}</dt>
                <dd style={{ fontWeight: 600 }}>{statusLabel(app.status, fr)}</dd>
              </div>
              <div>
                <dt className="dim text-body-sm">{t('Submitted', 'Déposée')}</dt>
                <dd className="tabular">{dateFmt(app.submittedAt, locale)}</dd>
              </div>
              <div>
                <dt className="dim text-body-sm">{t('Where', 'Où')}</dt>
                <dd>{[app.neighbourhood, app.cityName, app.province].filter(Boolean).join(', ') || '—'}</dd>
              </div>
              <div>
                <dt className="dim text-body-sm">{t('Born', 'Naissance')}</dt>
                <dd className="tabular">{app.dateOfBirthYear ?? '—'}</dd>
              </div>
            </dl>

            {app.bio && (
              <p className="muted" style={{ marginTop: 'var(--space-5)', whiteSpace: 'pre-wrap' }}>{app.bio}</p>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="text-h4">{t('Checks', 'Vérifications')}</h2>
            {app.verifications.length === 0 ? (
              <p className="muted" style={{ marginTop: 'var(--space-3)' }}>
                {t('No checks recorded yet.', 'Aucune vérification enregistrée.')}
              </p>
            ) : (
              <ul className="sitter-facts" style={{ marginTop: 'var(--space-4)' }}>
                {app.verifications.map((v) => (
                  <li key={v.type} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{m.verification[v.type as 'identity'] ?? v.type}</span>
                    <strong>{v.status}</strong>
                  </li>
                ))}
              </ul>
            )}
            {/*
              Rapor icerigi burada YOK ve olmayacak: yalnizca karar
              saklaniyor. Yonetici "neden isaretlendi" diye saglayicinin
              portalina bakar, biz o veriyi tutmayiz.
            */}
            <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>
              {t(
                'We store the outcome only — never the contents of a background check report.',
                'Nous ne conservons que le résultat — jamais le contenu du rapport de vérification.',
              )}
            </p>
          </section>

          <section className="card card-pad">
            <h2 className="text-h4">{t('Services offered', 'Services offerts')}</h2>
            {app.services.length === 0 ? (
              <p className="muted" style={{ marginTop: 'var(--space-3)' }}>—</p>
            ) : (
              <ul className="sitter-facts" style={{ marginTop: 'var(--space-4)' }}>
                {app.services.map((s) => (
                  <li key={s.serviceType} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{m.service[s.serviceType as 'boarding']}</span>
                    <strong className="tabular">{money(s.priceCents, locale)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {app.consents.length > 0 && (
            <section className="card card-pad">
              <h2 className="text-h4">{t('Consent records', 'Consentements')}</h2>
              <ul className="booking-timeline" style={{ marginTop: 'var(--space-4)' }}>
                {app.consents.map((c, i) => (
                  <li key={`${c.purpose}-${i}`}>
                    <time dateTime={c.at}>{dateFmt(c.at, locale)}</time>
                    <span>{c.purpose} — {c.granted ? t('granted', 'accordé') : t('refused', 'refusé')}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {app.decisions.length > 0 && (
            <section className="card card-pad">
              <h2 className="text-h4">{t('Automated decisions', 'Décisions automatisées')}</h2>
              <ul className="booking-timeline" style={{ marginTop: 'var(--space-4)' }}>
                {app.decisions.map((d, i) => (
                  <li key={`${d.type}-${i}`}>
                    <time dateTime={d.at}>{dateFmt(d.at, locale)}</time>
                    <span>
                      {d.type}: {d.outcome}
                      {d.humanOutcome ? ` → ${t('human', 'humain')}: ${d.humanOutcome}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="content-aside">
          <div className="card card-pad">
            <h2 className="text-h4">{t('Decision', 'Décision')}</h2>
            <p className="text-body-sm muted" style={{ margin: 'var(--space-2) 0 var(--space-5)' }}>
              {t(
                'A person decides. Nothing here is automatic.',
                'Une personne décide. Rien ici n’est automatique.',
              )}
            </p>
            <AdminDecision
              locale={locale}
              userId={app.userId}
              action={decideAction}
              decided={app.status !== 'pending'}
            />
            {app.deactivationReason && (
              <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>
                {t('Recorded reason:', 'Motif consigné :')} {app.deactivationReason}
              </p>
            )}
          </div>

          {/* Sinirlarin ekranda da yazmasi bilincli: panel her seyi gostermez */}
          <div className="notice">
            <p>
              {t('Not shown here: exact address, SIN, report contents.',
                 'Non affiché ici : adresse exacte, NAS, contenu du rapport.')}
              {' '}
              {app.hasExactAddress ? t('Address on file.', 'Adresse au dossier.') : t('No address yet.', 'Pas d’adresse.')}
              {' '}
              {app.hasSin ? t('SIN on file.', 'NAS au dossier.') : t('No SIN yet.', 'Pas de NAS.')}
            </p>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

/** Veritabani durumu -> insan dili. Ekranda 'deactivated' yazmak, karari
    veren kisiye degil, semaya hizmet ederdi. */
function statusLabel(status: string, fr: boolean): string {
  const map: Record<string, [string, string]> = {
    pending: ['Waiting for a decision', 'En attente d’une décision'],
    active: ['Approved — sitter is live', 'Approuvé — le gardien est en ligne'],
    deactivated: ['Refused or removed', 'Refusé ou retiré'],
    paused: ['Paused', 'En pause'],
    draft: ['Draft — not submitted', 'Brouillon — non soumise'],
  };
  const hit = map[status];
  return hit ? (fr ? hit[1] : hit[0]) : status;
}
