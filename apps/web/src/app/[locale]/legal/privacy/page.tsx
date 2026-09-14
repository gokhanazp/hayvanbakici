import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage, DraftNotice } from '@/components/ContentPage';

/**
 * GIZLILIK BILDIRIMI.
 *
 * Bu metnin govdesi UYDURMA DEGIL: hangi verinin toplandigi, nerede
 * durdugu ve nasil sifrelendigi semadan ve kod kararlarindan yaziliyor
 * (profiles.exact_address_enc, sitters.sin_encrypted, approx_location,
 * automated_decisions, consent_records). Yani sayfa, urunun gercekten
 * yaptigi seyi anlatiyor.
 *
 * Hukukcu onayindan gecmedigi icin taslak uyarisi var — yururlukte
 * olmayan bir metni yururluktemis gibi gostermek, Law 25 ve PIPEDA
 * acisindan bildirimi hic yapmamaktan daha kotu.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Politique de confidentialité' : 'Privacy policy',
    description: fr
      ? 'Ce que nous recueillons, où c’est conservé, combien de temps, et vos droits.'
      : 'What we collect, where it is stored, for how long, and your rights.',
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  return (
    <ContentPage
      locale={locale}
      title={t('Privacy policy', 'Politique de confidentialité')}
      lead={t('What we collect, why, where it lives, and what you can ask us to do with it.',
              'Ce que nous recueillons, pourquoi, où cela se trouve, et ce que vous pouvez nous demander d’en faire.')}
      updated="2026-09-13"
    >
      <DraftNotice locale={locale} />

      <h2>{t('Who is responsible', 'Qui est responsable')}</h2>
      <p>
        {t('Havre is operated by Voidu B.V. Our Privacy Officer, required under Québec’s Law 25, is ',
           'Havre est exploité par Voidu B.V. Notre responsable de la protection des renseignements personnels, exigé par la Loi 25 du Québec, est ')}
        <strong>[TO BE APPOINTED]</strong>
        {t('. Privacy requests go through our ', '. Les demandes passent par notre page ')}
        <Link href={`/${seg}/contact/`}>{m.footer.contact.toLowerCase()}</Link>
        {t(' page.', '.')}
      </p>

      <h2>{t('What we collect', 'Ce que nous recueillons')}</h2>
      <dl>
        <div>
          <dt>{t('Everyone with an account', 'Toute personne ayant un compte')}</dt>
          <dd>{t('Email address, language preference, and the sessions you sign in with.',
                 'Adresse courriel, préférence linguistique et les sessions ouvertes.')}</dd>
        </div>
        <div>
          <dt>{t('Your public profile', 'Votre profil public')}</dt>
          <dd>{t('First name, last initial, your introduction, your neighbourhood and — if you upload one — your photo. Your full surname is stored encrypted and is not shown.',
                 'Prénom, initiale du nom, votre présentation, votre quartier et, si vous en téléversez une, votre photo. Votre nom complet est conservé chiffré et n’est pas affiché.')}</dd>
        </div>
        <div>
          <dt>{t('Location', 'Localisation')}</dt>
          <dd>{t('Your postal code and street address. The address is encrypted. What appears on the map is a deliberately offset point in your neighbourhood, not your home.',
                 'Votre code postal et votre adresse. L’adresse est chiffrée. Ce qui apparaît sur la carte est un point volontairement décalé dans votre quartier, pas votre domicile.')}</dd>
        </div>
        <div>
          <dt>{t('Sitters only', 'Gardiens seulement')}</dt>
          <dd>{t('Date of birth and Social Insurance Number, both encrypted — the first for the background check, the second because the Canada Revenue Agency requires platforms to report seller earnings. Also the outcome of your background check: passed, under review, or refused. We do not store the contents of the report.',
                 'Date de naissance et numéro d’assurance sociale, tous deux chiffrés — la première pour la vérification des antécédents, le second parce que l’Agence du revenu du Canada oblige les plateformes à déclarer les revenus des vendeurs. Également le résultat de votre vérification : réussie, en examen ou refusée. Nous ne conservons pas le contenu du rapport.')}</dd>
        </div>
        <div>
          <dt>{t('Bookings and messages', 'Réservations et messages')}</dt>
          <dd>{t('Dates, prices, the messages and photos exchanged about a booking, and reviews.',
                 'Dates, prix, messages et photos échangés au sujet d’une réservation, et avis.')}</dd>
        </div>
      </dl>

      <h2>{t('Where it is stored', 'Où les données sont conservées')}</h2>
      <p>
        {t(
          'Personal information is stored in Canada. Fonts and other assets are served from our own servers rather than a third-party network, so loading a page does not send a request about you across a border. Where a processor outside Canada is unavoidable, we say so here before we start using it.',
          'Les renseignements personnels sont conservés au Canada. Les polices et autres ressources sont servies depuis nos propres serveurs plutôt que par un réseau tiers : le chargement d’une page n’envoie donc aucune requête vous concernant à l’étranger. Lorsqu’un sous-traitant hors du Canada est inévitable, nous l’indiquons ici avant de commencer à l’utiliser.',
        )}
      </p>

      <h2>{t('Decisions made about you', 'Décisions vous concernant')}</h2>
      <p>
        {t(
          'No automated system decides on its own whether you can work on Havre. A background check that comes back clear is recorded automatically; anything else goes to a person. Where a decision about you does involve automated processing, we record it, we tell you, and — as Québec’s Law 25 requires — you can ask for the personal information used, the reasons behind the decision, and have it reviewed by a person.',
          'Aucun système automatisé ne décide seul si vous pouvez travailler sur Havre. Une vérification revenue sans réserve est enregistrée automatiquement; tout autre résultat est confié à une personne. Lorsqu’une décision vous concernant implique un traitement automatisé, nous la consignons, nous vous en informons et — comme l’exige la Loi 25 — vous pouvez demander les renseignements utilisés, les motifs de la décision et sa révision par une personne.',
        )}
      </p>

      <h2>{t('Consent', 'Consentement')}</h2>
      <p>
        {t(
          'Consent is asked for separately for each purpose, in plain language, and every consent you give is recorded with its date and its wording so we can both see what you actually agreed to. You can withdraw a consent at any time; where that makes a service impossible we tell you before you withdraw it, not after.',
          'Le consentement est demandé séparément pour chaque finalité, en langage clair, et chaque consentement est consigné avec sa date et son libellé, afin que nous puissions tous deux voir ce à quoi vous avez consenti. Vous pouvez retirer un consentement à tout moment; lorsque cela rend un service impossible, nous vous le disons avant le retrait, pas après.',
        )}
      </p>

      <h2>{t('Your rights', 'Vos droits')}</h2>
      <ul>
        <li>{t('Ask for a copy of what we hold about you.', 'Demander une copie de ce que nous détenons sur vous.')}</li>
        <li>{t('Correct anything inaccurate.', 'Faire corriger toute inexactitude.')}</li>
        <li>{t('Ask for deletion, subject to records we are legally required to keep — tax reporting, for example.',
               'Demander la suppression, sous réserve des registres que la loi nous oblige à conserver — les déclarations fiscales, par exemple.')}</li>
        <li>{t('Ask for your data in a portable format.', 'Demander vos données dans un format portable.')}</li>
        <li>{t('Complain to us, and to the Office of the Privacy Commissioner of Canada or the Commission d’accès à l’information du Québec.',
               'Porter plainte auprès de nous, et auprès du Commissariat à la protection de la vie privée du Canada ou de la Commission d’accès à l’information du Québec.')}</li>
      </ul>

      <h2>{t('Email and messages', 'Courriels et messages')}</h2>
      <p>
        {t(
          'We send you email about your own bookings and account because you need it. Anything promotional is sent only if you opted in, carries our identity and an unsubscribe link that works, as Canada’s anti-spam law requires.',
          'Nous vous envoyons des courriels concernant vos réservations et votre compte parce que vous en avez besoin. Toute communication promotionnelle n’est envoyée qu’avec votre consentement, porte notre identité et un lien de désabonnement fonctionnel, comme l’exige la loi canadienne anti-pourriel.',
        )}
      </p>

      <h2>{t('Cookies', 'Témoins')}</h2>
      <p>
        {t('See the ', 'Voir la page ')}
        <Link href={`/${seg}/legal/cookies/`}>{m.footer.cookies.toLowerCase()}</Link>
        {t(' page.', '.')}
      </p>
    </ContentPage>
  );
}
