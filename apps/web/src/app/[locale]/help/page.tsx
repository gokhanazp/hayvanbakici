import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';

import { ContentPage } from '@/components/ContentPage';
import { Faq } from '@/components/Faq';
import { getCommission } from '@/lib/data';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Centre d’aide' : 'Help centre',
    description: fr ? 'Réponses pour les propriétaires et les gardiens.' : 'Answers for owners and sitters.',
  };
}

export const revalidate = 300;

export default async function HelpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  const { config: c } = await getCommission();

  const owners = [
    [t('How do I know a sitter is who they say they are?', 'Comment savoir qu’un gardien est bien celui qu’il prétend être?'),
     t('Every sitter passes identity verification and an enhanced criminal record check before their profile goes live, and the badge on their profile says which checks they passed. A person reviews every result.',
       'Chaque gardien passe une vérification d’identité et une vérification approfondie des antécédents avant la mise en ligne de son profil, et le badge sur son profil indique les vérifications réussies. Une personne examine chaque résultat.')],
    [t('When am I charged?', 'Quand suis-je facturé?'),
     t('Nothing is charged until a sitter accepts your booking. The full breakdown — the sitter’s rate, our service fee, taxes — is shown before you confirm.',
       'Rien n’est facturé avant qu’un gardien accepte votre réservation. Le détail complet — tarif du gardien, nos frais de service, taxes — est affiché avant la confirmation.')],
    [t('What is the service fee?', 'Quels sont les frais de service?'),
     t(`${c.ownerPct}% of the sitter’s rate, capped per booking. It is shown as its own line, never folded into the nightly rate.`,
       `${c.ownerPct} % du tarif du gardien, plafonnés par réservation. Ils apparaissent sur leur propre ligne, jamais intégrés au tarif par nuit.`)],
    [t('Can I meet the sitter first?', 'Puis-je rencontrer le gardien d’abord?'),
     t('Yes, and we encourage it. Messaging before a booking is free and there is no obligation to book afterwards.',
       'Oui, et nous l’encourageons. Écrire avant une réservation est gratuit et ne vous oblige à rien.')],
    [t('What if I need to cancel?', 'Et si je dois annuler?'),
     t('Each sitter publishes one of three cancellation policies on their profile — flexible, moderate or strict — and it applies from the moment the booking is confirmed. Cancelling before a sitter accepts costs nothing.',
       'Chaque gardien publie sur son profil l’une des trois politiques d’annulation — flexible, modérée ou stricte — qui s’applique dès la confirmation. Annuler avant l’acceptation du gardien ne coûte rien.')],
    [t('Do you look after cats too?', 'Vous occupez-vous aussi des chats?'),
     t('Many sitters do. Each profile lists the species and sizes that sitter accepts, and you can filter search results by it.',
       'De nombreux gardiens le font. Chaque profil indique les espèces et les tailles acceptées, et vous pouvez filtrer les résultats selon ce critère.')],
  ];

  const sitters = [
    [t('What does Havre take?', 'Que prend Havre?'),
     t(`${c.sitterPct.sitter_referral}% on clients you bring yourself, ${c.sitterPct.repeat}% on repeat bookings, ${c.sitterPct.platform}% on a client who found you through Havre. There is no listing fee and no subscription.`,
       `${c.sitterPct.sitter_referral} % sur les clients que vous amenez, ${c.sitterPct.repeat} % sur les réservations répétées, ${c.sitterPct.platform} % sur un client qui vous a trouvé via Havre. Aucuns frais d’inscription ni abonnement.`)],
    [t('Can I set my own prices?', 'Puis-je fixer mes propres tarifs?'),
     t('Yes. You set the rate for each service you offer, the sizes and species you accept, and your own cancellation policy.',
       'Oui. Vous fixez le tarif de chaque service, les tailles et espèces acceptées, ainsi que votre politique d’annulation.')],
    [t('Why do you need my Social Insurance Number?', 'Pourquoi avez-vous besoin de mon numéro d’assurance sociale?'),
     t('The Canada Revenue Agency requires platforms to report earnings for every seller (Part XX reporting). It is encrypted, access-restricted and never shown on your profile.',
       'L’Agence du revenu du Canada oblige les plateformes à déclarer les revenus de chaque vendeur (déclaration Partie XX). Il est chiffré, à accès restreint et jamais affiché sur votre profil.')],
    [t('Can I say no to a booking?', 'Puis-je refuser une réservation?'),
     t('Yes. Your acceptance rate is one of the published ranking inputs, so declining often affects where you appear in search — but no booking is ever forced on you.',
       'Oui. Votre taux d’acceptation fait partie des critères de classement publiés : refuser souvent influence votre position dans la recherche — mais aucune réservation ne vous est imposée.')],
    [t('How is my position in search decided?', 'Comment ma position dans la recherche est-elle déterminée?'),
     t('Rating, response time, acceptance rate, cancellation rate, profile completeness, verification level and distance from the search point. Placement cannot be bought.',
       'Évaluation, délai de réponse, taux d’acceptation, taux d’annulation, exhaustivité du profil, niveau de vérification et distance du point recherché. Le placement ne s’achète pas.')],
    [t('Can I be removed from Havre?', 'Puis-je être retiré de Havre?'),
     t('Only with a written reason and two weeks’ notice, except where someone’s safety requires acting immediately.',
       'Uniquement avec un motif écrit et un préavis de deux semaines, sauf lorsque la sécurité d’une personne exige d’agir immédiatement.')],
  ];

  return (
    <ContentPage
      locale={locale}
      title={t('Help centre', 'Centre d’aide')}
      lead={t('The questions we are asked most, answered without a support ticket.',
              'Les questions les plus fréquentes, sans avoir à ouvrir un billet.')}
      aside={
        <div className="card card-pad">
          <h2 className="text-h4">{t('Still stuck?', 'Toujours bloqué?')}</h2>
          <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
            {t('Write to us and a person will answer.', 'Écrivez-nous et une personne vous répondra.')}
          </p>
          <Link href={`/${seg}/contact/`} className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-4)' }}>
            {m.footer.contact}
          </Link>
        </div>
      }
    >
      <h2>{t('For pet owners', 'Pour les propriétaires')}</h2>
      <Faq locale={locale} group="owners" items={owners.map(([q, a]) => ({ q: q!, a: a! }))} />

      <h2>{t('For sitters', 'Pour les gardiens')}</h2>
      <Faq locale={locale} group="sitters" items={sitters.map(([q, a]) => ({ q: q!, a: a! }))} />

      <h2>{t('Privacy and your data', 'Vie privée et vos données')}</h2>
      <p>
        {t('What we collect, where it is stored and how to get a copy or have it deleted is set out in the ',
           'Ce que nous recueillons, où c’est conservé et comment en obtenir une copie ou en demander la suppression est expliqué dans la ')}
        <Link href={`/${seg}/legal/privacy/`}>{m.footer.privacy.toLowerCase()}</Link>.
      </p>
    </ContentPage>
  );
}
