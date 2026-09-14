import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage } from '@/components/ContentPage';

/**
 * ERISILEBILIRLIK BILDIRIMI.
 *
 * Ontario'da AODA, WCAG 2.2 AA'yi YASAL zorunluluk yapiyor. Bu sayfadaki
 * iddialarin dayanagi kodda: kontrast testi (packages/tokens/contrast.test.ts),
 * gorunur odak gostergesi, icerige atlama baglantisi, ozel acilir menulerde
 * ARIA combobox/listbox deseni ve klavye destegi.
 *
 * BILINEN EKSIKLER de yaziliyor. "Tamamen erisilebilir" demek hem yanlis
 * hem de bildirimin amacini bozar: kullanicinin bilmesi gereken sey,
 * neyin BUGUN calismadigi.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Accessibilité' : 'Accessibility',
    description: fr
      ? 'Notre engagement WCAG 2.2 AA, ce qui fonctionne, ce qui ne fonctionne pas encore.'
      : 'Our WCAG 2.2 AA commitment, what works, and what does not work yet.',
  };
}

export default async function AccessibilityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  return (
    <ContentPage
      locale={locale}
      title={t('Accessibility', 'Accessibilité')}
      lead={t(
        'We build to WCAG 2.2 level AA, as Ontario’s accessibility legislation requires. This page says what that means in practice — including what is not finished.',
        'Nous développons selon le niveau AA des WCAG 2.2, comme l’exige la législation ontarienne sur l’accessibilité. Cette page explique ce que cela signifie concrètement — y compris ce qui n’est pas terminé.',
      )}
      updated="2026-09-13"
    >
      <h2>{t('What we do', 'Ce que nous faisons')}</h2>
      <ul>
        <li>{t('Every text and background colour pair in our design system is measured against the 4.5:1 minimum by an automated test that runs on every change. A palette that fails does not ship.',
               'Chaque paire couleur de texte / fond de notre système de design est mesurée par rapport au minimum de 4,5:1 par un test automatisé exécuté à chaque modification. Une palette qui échoue n’est pas livrée.')}</li>
        <li>{t('The whole site works with a keyboard, and the focused element is always visibly outlined.',
               'Tout le site fonctionne au clavier, et l’élément actif est toujours entouré de façon visible.')}</li>
        <li>{t('A skip link takes you straight to the main content.',
               'Un lien d’évitement vous mène directement au contenu principal.')}</li>
        <li>{t('Our menus, dropdowns and date pickers are built to the published ARIA patterns, with arrow keys, Home and End, type-ahead and Escape.',
               'Nos menus, listes déroulantes et sélecteurs de dates suivent les modèles ARIA publiés, avec les flèches, Origine et Fin, la saisie semi-automatique et Échap.')}</li>
        <li>{t('Colour is never the only way information is given — badges carry an icon and a word as well.',
               'La couleur n’est jamais le seul vecteur d’information — les badges portent aussi une icône et un mot.')}</li>
        <li>{t('Touch targets are at least 44 by 44 pixels.',
               'Les cibles tactiles mesurent au moins 44 sur 44 pixels.')}</li>
        <li>{t('Animation is reduced automatically if your device asks for that.',
               'Les animations sont réduites automatiquement si votre appareil le demande.')}</li>
        <li>{t('Every page exists in French and in English.',
               'Chaque page existe en français et en anglais.')}</li>
      </ul>

      <h2>{t('What is not finished', 'Ce qui n’est pas terminé')}</h2>
      <ul>
        <li>{t('The dark theme is not designed or reviewed yet, so it does not turn on automatically with your system setting.',
               'Le thème sombre n’est ni conçu ni révisé, il ne s’active donc pas automatiquement avec le réglage de votre système.')}</li>
        <li>{t('The site has not yet had a formal audit by a third party or testing with assistive technology users. Both are planned before we take bookings.',
               'Le site n’a pas encore fait l’objet d’un audit formel par un tiers ni de tests avec des utilisateurs de technologies d’assistance. Les deux sont prévus avant l’ouverture des réservations.')}</li>
        <li>{t('Photos uploaded by sitters depend on the description they write. Where one is missing, we mark the image as decorative rather than read a filename aloud.',
               'Les photos téléversées par les gardiens dépendent de la description qu’ils rédigent. Lorsqu’elle manque, nous marquons l’image comme décorative plutôt que de faire lire un nom de fichier.')}</li>
      </ul>

      <h2>{t('Tell us about a barrier', 'Signalez-nous un obstacle')}</h2>
      <p>
        {t('If something here is hard or impossible for you to use, please tell us through our ',
           'Si quelque chose ici vous est difficile ou impossible à utiliser, dites-le-nous via notre page ')}
        <Link href={`/${seg}/contact/`}>{m.footer.contact.toLowerCase()}</Link>
        {t(' page. Tell us the page and what happened; we will reply with what we will do and when. Accessibility feedback is not a support ticket that gets closed — it goes on the list with everything else we have committed to.',
           '. Indiquez-nous la page et ce qui s’est passé; nous répondrons en précisant ce que nous ferons et quand. Un signalement d’accessibilité n’est pas un billet qu’on referme — il rejoint la liste de nos engagements.')}
      </p>
      <p>
        {t('We can also provide information from this site in another format on request.',
           'Nous pouvons aussi fournir sur demande les informations de ce site dans un autre format.')}
      </p>
    </ContentPage>
  );
}
