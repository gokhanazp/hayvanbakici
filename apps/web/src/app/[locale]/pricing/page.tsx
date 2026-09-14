import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { DEFAULT_COMMISSION, calculateCommission, compareToRover, dollars } from '@havre/core';
import { ContentPage } from '@/components/ContentPage';
import { money } from '@/lib/format';

/**
 * UCRET SAYFASI.
 *
 * Tum rakamlar DEFAULT_COMMISSION ve calculateCommission'dan geliyor.
 * Bir oran degistiginde bu sayfa kendiliginden degisir; elle yazilmis
 * bir yuzde, degisiklikten sonra sessizce yalana donerdi.
 *
 * COMPETITION ACT (yol haritasi §8.6): "gizli ucret yok" iddiasinin
 * dayanagi bu sayfadir — sayfada listelenmeyen hicbir kalem tahsil
 * edilmiyor ve rakip karsilastirmasi ISPATLANABILIR bir orana dayaniyor.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Nos frais' : 'Our fees',
    description: fr
      ? 'Les trois taux de commission, les frais de service du propriétaire et ce que nous ne facturons pas.'
      : 'The three commission rates, the owner service fee, and what we do not charge for.',
  };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  const c = DEFAULT_COMMISSION;

  const sample = dollars(500);
  const ours = calculateCommission({ subtotalCents: sample, attribution: 'platform' });
  const vs = compareToRover(sample, ours, 'standard');

  return (
    <ContentPage
      locale={locale}
      title={t('Our fees', 'Nos frais')}
      lead={t(
        'Three commission rates for sitters, one service fee for owners, and nothing else. This page is the whole of it.',
        'Trois taux de commission pour les gardiens, un frais de service pour les propriétaires, et rien d’autre. Cette page, c’est tout.',
      )}
      photo="care-a"
      aside={
        <>
          <div className="card card-pad">
            <h2 className="text-h4">{t('For sitters', 'Pour les gardiens')}</h2>
            <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
              {t('Bring your own clients and we take nothing on their bookings.',
                 'Amenez vos propres clients et nous ne prenons rien sur leurs réservations.')}
            </p>
            <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-4)' }}>
              {m.nav.becomeSitter}
            </Link>
          </div>
          <div className="card card-pad">
            <h2 className="text-h4">{t('Questions about a charge?', 'Une question sur un montant?')}</h2>
            <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
              {t('Every booking shows a line-by-line breakdown before you confirm.',
                 'Chaque réservation affiche un détail ligne par ligne avant la confirmation.')}
            </p>
            <Link href={`/${seg}/contact/`} className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }}>
              {m.footer.contact}
            </Link>
          </div>
        </>
      }
    >
      <h2>{t('What the sitter pays', 'Ce que paie le gardien')}</h2>
      <p>
        {t(
          'The rate depends on where the booking came from — not on how long the sitter has been here, and not on how many clients they have.',
          'Le taux dépend de l’origine de la réservation — pas de l’ancienneté du gardien ni du nombre de ses clients.',
        )}
      </p>

      <table>
        <thead>
          <tr>
            <th>{t('Where the booking came from', 'Origine de la réservation')}</th>
            <th>{t('Our commission', 'Notre commission')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t('A client the sitter brought themselves', 'Un client amené par le gardien')}</td>
            <td className="tabular">{c.sitterPct.sitter_referral}%</td>
          </tr>
          <tr>
            <td>{t('A repeat booking with the same owner', 'Une réservation répétée avec le même propriétaire')}</td>
            <td className="tabular">{c.sitterPct.repeat}%</td>
          </tr>
          <tr>
            <td>{t('A client who found the sitter through Havre', 'Un client qui a trouvé le gardien via Havre')}</td>
            <td className="tabular">{c.sitterPct.platform}%</td>
          </tr>
        </tbody>
      </table>

      <p>
        {t(
          'The 0% is permanent, not an introductory offer. If a sitter invites a client with their own referral code, that client stays at 0% for every booking they ever make with that sitter.',
          'Le 0 % est permanent, ce n’est pas une offre de lancement. Si un gardien invite un client avec son propre code de parrainage, ce client reste à 0 % pour toutes ses réservations futures avec ce gardien.',
        )}
      </p>

      <h2>{t('What the owner pays', 'Ce que paie le propriétaire')}</h2>
      <p>
        {t(
          `A service fee of ${c.ownerPct}% of the sitter’s rate, capped at ${money(c.ownerFeeCapCents, locale)} per booking. It covers payment processing, the background checks behind the badges on every profile, and support if something goes wrong during a stay.`,
          `Des frais de service de ${c.ownerPct} % du tarif du gardien, plafonnés à ${money(c.ownerFeeCapCents, locale)} par réservation. Ils couvrent le traitement des paiements, les vérifications d’antécédents derrière les badges de chaque profil, et le soutien en cas de problème pendant un séjour.`,
        )}
      </p>
      <p>
        {t(
          'Applicable taxes (GST/HST, and QST in Québec) are added and shown as their own line. The total you see before confirming is the total you are charged.',
          'Les taxes applicables (TPS/TVH, et TVQ au Québec) s’ajoutent et apparaissent sur leur propre ligne. Le total affiché avant la confirmation est le total facturé.',
        )}
      </p>

      <h2>{t('A worked example', 'Un exemple chiffré')}</h2>
      <p>
        {t(
          `On a ${money(sample, locale)} booking from an owner who found the sitter through Havre:`,
          `Sur une réservation de ${money(sample, locale)} d’un propriétaire ayant trouvé le gardien via Havre :`,
        )}
      </p>
      <table>
        <tbody>
          <tr>
            <td>{t('Sitter’s rate', 'Tarif du gardien')}</td>
            <td className="tabular">{money(sample, locale)}</td>
          </tr>
          <tr>
            <td>{t(`Our commission (${ours.sitterPct}%)`, `Notre commission (${ours.sitterPct} %)`)}</td>
            <td className="tabular">−{money(ours.sitterCommissionCents, locale)}</td>
          </tr>
          <tr>
            <td><strong>{t('The sitter receives', 'Le gardien reçoit')}</strong></td>
            <td className="tabular"><strong>{money(sample - ours.sitterCommissionCents, locale)}</strong></td>
          </tr>
          <tr>
            <td>{t(`Owner service fee (${ours.ownerPct}%${ours.ownerFeeCapped ? ', capped' : ''})`,
                   `Frais de service du propriétaire (${ours.ownerPct} %${ours.ownerFeeCapped ? ', plafonnés' : ''})`)}</td>
            <td className="tabular">+{money(ours.ownerFeeCents, locale)}</td>
          </tr>
          <tr>
            <td><strong>{t('The owner pays, before tax', 'Le propriétaire paie, avant taxes')}</strong></td>
            <td className="tabular"><strong>{money(sample + ours.ownerFeeCents, locale)}</strong></td>
          </tr>
        </tbody>
      </table>
      <p className="text-body-sm dim">
        {t(
          `The same booking on the largest competitor at its 20% standard rate leaves the sitter ${money(vs.sitterSavesCents, locale)} less and costs the owner ${money(vs.ownerSavesCents, locale)} more.`,
          `La même réservation chez le plus grand concurrent, à son taux standard de 20 %, laisse au gardien ${money(vs.sitterSavesCents, locale)} de moins et coûte ${money(vs.ownerSavesCents, locale)} de plus au propriétaire.`,
        )}
      </p>

      <h2>{t('What we do not charge for', 'Ce que nous ne facturons pas')}</h2>
      <ul>
        <li>{t('Creating a profile or keeping it listed', 'La création d’un profil ou son maintien en ligne')}</li>
        <li>{t('Messaging an owner or a sitter', 'L’envoi de messages à un propriétaire ou à un gardien')}</li>
        <li>{t('Subscriptions, boosts, or paid placement in search results',
               'Les abonnements, les mises en avant ou le placement payant dans les résultats')}</li>
        <li>{t('Cancelling before a sitter accepts', 'L’annulation avant l’acceptation du gardien')}</li>
      </ul>
      <p>
        {t(
          'Search ranking cannot be bought. The inputs are published on every sitter profile: rating, response time, acceptance rate, cancellation rate, profile completeness, verification level and distance.',
          'Le classement dans la recherche ne s’achète pas. Les critères sont publiés sur chaque profil : évaluation, délai de réponse, taux d’acceptation, taux d’annulation, exhaustivité du profil, niveau de vérification et distance.',
        )}
      </p>

      <h2>{t('Cancellations', 'Annulations')}</h2>
      <p>
        {t(
          'Each sitter chooses one of three published cancellation policies — flexible, moderate or strict — and it is shown on their profile next to the service, before you book.',
          'Chaque gardien choisit l’une des trois politiques d’annulation publiées — flexible, modérée ou stricte — et elle figure sur son profil à côté du service, avant la réservation.',
        )}
      </p>
    </ContentPage>
  );
}
