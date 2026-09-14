import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage } from '@/components/ContentPage';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Comment fonctionne Havre' : 'How Havre works',
    description: fr
      ? 'De la recherche au retour à la maison : ce qui se passe à chaque étape, et ce que chaque partie voit.'
      : 'From search to coming home: what happens at each step, and what each side sees.',
  };
}

export default async function HowItWorksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  const steps = [
    {
      h: t('1. Search your own neighbourhood', '1. Cherchez dans votre quartier'),
      p: t(
        'Enter a postal code and dates. Results are ranked by rating, response time, acceptance rate, cancellation rate, profile completeness, verification level and distance — never by payment. Each sitter’s position on the map is an approximate point in their neighbourhood, not their address.',
        'Entrez un code postal et des dates. Les résultats sont classés selon l’évaluation, le délai de réponse, le taux d’acceptation, le taux d’annulation, l’exhaustivité du profil, le niveau de vérification et la distance — jamais selon un paiement. La position d’un gardien sur la carte est un point approximatif dans son quartier, pas son adresse.',
      ),
    },
    {
      h: t('2. Read the profile, including the price', '2. Lisez le profil, prix compris'),
      p: t(
        'Every profile shows the nightly or visit rate, the cancellation policy, what sizes and species the sitter accepts, their home, and every review they have received — including the ones they replied to.',
        'Chaque profil indique le tarif par nuit ou par visite, la politique d’annulation, les tailles et espèces acceptées, le domicile du gardien et tous les avis reçus — y compris ceux auxquels il a répondu.',
      ),
    },
    {
      h: t('3. Ask first, book when you are ready', '3. Posez vos questions, réservez ensuite'),
      p: t(
        'Message a sitter before booking at no cost. When you do book, the full breakdown — the sitter’s rate, our service fee, taxes — is on screen before you confirm. Nothing is added afterwards.',
        'Écrivez à un gardien avant de réserver, sans frais. Au moment de réserver, le détail complet — tarif du gardien, nos frais de service, taxes — s’affiche avant la confirmation. Rien n’est ajouté ensuite.',
      ),
    },
    {
      h: t('4. Meet before the stay', '4. Rencontrez avant le séjour'),
      p: t(
        'A meet-and-greet before the first booking is normal and encouraged. The sitter’s exact address is shared with you only once a booking is confirmed; until then it is stored encrypted.',
        'Une rencontre préalable avant la première réservation est normale et encouragée. L’adresse exacte du gardien ne vous est communiquée qu’une fois la réservation confirmée; avant cela, elle est conservée chiffrée.',
      ),
    },
    {
      h: t('5. Updates while you are away', '5. Des nouvelles pendant votre absence'),
      p: t(
        'Photos and messages stay inside Havre, so the whole booking is in one place. Vaccination records are recorded before the first stay, for your pet and for every other pet in that home.',
        'Les photos et les messages restent dans Havre : toute la réservation est au même endroit. Les carnets de vaccination sont enregistrés avant le premier séjour, pour votre animal et pour tous les autres animaux présents.',
      ),
    },
    {
      h: t('6. Reviews both ways, revealed together', '6. Des avis des deux côtés, dévoilés ensemble'),
      p: t(
        'Only an owner who completed a booking can review, and neither side sees the other’s review until the window closes. A sitter can reply once, publicly.',
        'Seul un propriétaire ayant terminé une réservation peut laisser un avis, et aucune des deux parties ne voit l’avis de l’autre avant la fermeture de la période. Le gardien peut répondre une fois, publiquement.',
      ),
    },
  ];

  return (
    <ContentPage
      locale={locale}
      title={t('How Havre works', 'Comment fonctionne Havre')}
      lead={t(
        'Six steps, and what each side can see at every one of them.',
        'Six étapes, et ce que chaque partie voit à chacune d’elles.',
      )}
      photo="home-a"
      aside={
        <div className="card card-pad">
          <h2 className="text-h4">{t('Looking after pets yourself?', 'Vous gardez des animaux?')}</h2>
          <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
            {t('The sitter side works differently — and the fees are published too.',
               'Le côté gardien fonctionne différemment — et les frais y sont aussi publiés.')}
          </p>
          <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-4)' }}>
            {m.nav.becomeSitter}
          </Link>
        </div>
      }
    >
      {steps.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          <p>{s.p}</p>
        </section>
      ))}

      <h2>{t('What “verified” means', 'Ce que « vérifié » signifie')}</h2>
      <p>{m.verification.disclaimer}</p>
      <ul>
        <li>{m.verification.identity}</li>
        <li>{m.verification.criminal}</li>
        <li>{m.verification.licence}</li>
        <li>{m.verification.certification}</li>
      </ul>
      <p>
        {t(
          'A person reviews every background check result. No automated system decides on its own whether someone can work on Havre, and anyone refused can ask for the reasoning and challenge it.',
          'Une personne examine chaque résultat de vérification. Aucun système automatisé ne décide seul si quelqu’un peut travailler sur Havre, et toute personne refusée peut demander les motifs et les contester.',
        )}
      </p>
    </ContentPage>
  );
}
