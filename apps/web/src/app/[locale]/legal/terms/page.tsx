import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage, DraftNotice } from '@/components/ContentPage';

/**
 * KULLANIM KOSULLARI — TASLAK.
 *
 * Burada TAM bir sozlesme metni UYDURULMUYOR. Uydurulmus bir sozlesme
 * iki yonden zararli: kullaniciya yanlis bir guvence verir ve sirketi
 * dayanaksiz bir metne baglar. Sayfa, bugun gecerli olan ILKELERI
 * yaziyor ve tam metnin hukukcu onayindan sonra geleceğini soyluyor.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Conditions d’utilisation' : 'Terms of service',
    description: fr ? 'Les règles de Havre, en langage clair.' : 'The rules of Havre, in plain language.',
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  return (
    <ContentPage
      locale={locale}
      title={t('Terms of service', 'Conditions d’utilisation')}
      lead={t('The principles the full agreement will be built on, written so you can actually read them.',
              'Les principes sur lesquels reposera l’entente complète, rédigés pour être réellement lisibles.')}
      updated="2026-09-13"
    >
      <DraftNotice locale={locale} />

      <h2>{t('What Havre is', 'Ce qu’est Havre')}</h2>
      <p>
        {t(
          'Havre is a marketplace. Owners and sitters contract with each other; we introduce them, hold the payment, publish the fees and the reviews, and set the rules everyone agrees to follow. A sitter is not our employee.',
          'Havre est une place de marché. Les propriétaires et les gardiens contractent entre eux; nous les mettons en relation, retenons le paiement, publions les frais et les avis, et fixons les règles que chacun accepte de suivre. Un gardien n’est pas notre employé.',
        )}
      </p>

      <h2>{t('Who can use it', 'Qui peut l’utiliser')}</h2>
      <ul>
        <li>{t('You must be 18 or older and able to enter a contract.',
               'Vous devez avoir 18 ans ou plus et être en mesure de conclure un contrat.')}</li>
        <li>{t('One account per person, with accurate information.',
               'Un compte par personne, avec des renseignements exacts.')}</li>
        <li>{t('Sitters must complete verification before a profile goes live.',
               'Les gardiens doivent compléter la vérification avant la mise en ligne d’un profil.')}</li>
      </ul>

      <h2>{t('Money', 'Argent')}</h2>
      <p>
        {t('Our commission and the owner service fee are published in full on our ',
           'Notre commission et les frais de service du propriétaire sont publiés intégralement sur notre page ')}
        <Link href={`/${seg}/pricing/`}>{m.nav.pricing.toLowerCase()}</Link>
        {t(' page, and the price you are shown before confirming is the price you pay. If we ever change a rate, it applies to bookings made after the change, never to ones already confirmed.',
           ', et le prix affiché avant la confirmation est celui que vous payez. Si nous modifions un taux, il s’applique aux réservations faites après le changement, jamais à celles déjà confirmées.')}
      </p>

      <h2>{t('Reviews', 'Avis')}</h2>
      <p>
        {t(
          'Only a completed booking earns a review. We do not remove a review because its subject asked us to. We do remove one that identifies someone’s address, contains a threat, or is not about the booking.',
          'Seule une réservation terminée donne droit à un avis. Nous ne supprimons pas un avis parce que la personne visée le demande. Nous supprimons ceux qui révèlent une adresse, contiennent une menace ou ne concernent pas la réservation.',
        )}
      </p>

      <h2>{t('Ending things', 'Fin de la relation')}</h2>
      <p>
        {t(
          'You can close your account at any time. If we end a sitter’s access, they get a written reason and two weeks’ notice, except where someone’s safety requires acting immediately — and they can challenge the decision with a person.',
          'Vous pouvez fermer votre compte à tout moment. Si nous mettons fin à l’accès d’un gardien, celui-ci reçoit un motif écrit et un préavis de deux semaines, sauf lorsque la sécurité d’une personne exige d’agir immédiatement — et il peut contester la décision auprès d’une personne.',
        )}
      </p>

      <h2>{t('Language and law', 'Langue et droit')}</h2>
      <p>
        {t(
          'These terms exist in French and in English, and the French version governs for users in Québec. Consumer protection rights under provincial law apply on top of anything written here and cannot be signed away.',
          'Ces conditions existent en français et en anglais, et la version française prévaut pour les utilisateurs du Québec. Les droits en matière de protection du consommateur prévus par le droit provincial s’ajoutent à tout ce qui est écrit ici et ne peuvent y être renoncés.',
        )}
      </p>

      <h2>{t('Sitters', 'Gardiens')}</h2>
      <p>
        {t('Sitters also agree to the ', 'Les gardiens acceptent également l’')}
        <Link href={`/${seg}/legal/sitter-agreement/`}>{m.footer.sitterAgreement.toLowerCase()}</Link>.
      </p>
    </ContentPage>
  );
}
