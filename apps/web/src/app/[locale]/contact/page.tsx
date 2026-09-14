import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage } from '@/components/ContentPage';

/**
 * ILETISIM.
 *
 * DIKKAT — burada UYDURMA e-posta/telefon YOK.
 * Henuz acilmamis bir adresi sayfaya yazmak, yazan kisinin cevap
 * beklemesine ve cevap alamamasina yol acar. Alt bilgideki
 * "[TO BE APPOINTED]" ile ayni acik yer tutucu kullaniliyor; kanallar
 * acildiginda tek dosyada degisir.
 */
const CHANNELS = {
  support: '[TO BE CONFIRMED]',
  privacy: '[TO BE CONFIRMED]',
  press: '[TO BE CONFIRMED]',
} as const;

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Nous joindre' : 'Contact us',
    description: fr ? 'Comment nous joindre, et qui répond.' : 'How to reach us, and who answers.',
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  return (
    <ContentPage
      locale={locale}
      title={t('Contact us', 'Nous joindre')}
      lead={t(
        'Havre is being built in Toronto and is not taking bookings yet. These are the channels, and what each one is for.',
        'Havre est en construction à Toronto et n’accepte pas encore de réservations. Voici les canaux et à quoi sert chacun.',
      )}
      aside={
        <div className="card card-pad">
          <h2 className="text-h4">{t('Most answers are here', 'La plupart des réponses sont ici')}</h2>
          <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
            {t('Fees, verification, cancellations and privacy each have their own page.',
               'Frais, vérification, annulations et vie privée ont chacun leur page.')}
          </p>
          <Link href={`/${seg}/help/`} className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }}>
            {m.footer.help}
          </Link>
        </div>
      }
    >
      <dl>
        <div>
          <dt>{t('Support', 'Soutien')}</dt>
          <dd>
            {CHANNELS.support}
            <br />
            {t('Bookings, payments, an account you cannot get into, a stay that is going wrong.',
               'Réservations, paiements, un compte inaccessible, un séjour qui se passe mal.')}
          </dd>
        </div>
        <div>
          <dt>{t('Privacy requests', 'Demandes relatives à la vie privée')}</dt>
          <dd>
            {CHANNELS.privacy}
            <br />
            {t('A copy of your data, a correction, deletion, or a complaint about how we handled it. Under Québec law you can also ask for the reasoning behind a decision made about you with automated processing.',
               'Une copie de vos données, une correction, une suppression, ou une plainte sur notre traitement. En vertu de la loi québécoise, vous pouvez aussi demander les motifs d’une décision vous concernant prise par traitement automatisé.')}
          </dd>
        </div>
        <div>
          <dt>{t('Press', 'Presse')}</dt>
          <dd>{CHANNELS.press}</dd>
        </div>
      </dl>

      <h2>{t('Reporting a safety problem', 'Signaler un problème de sécurité')}</h2>
      <p>
        {t(
          'If a pet or a person is at risk, contact your local emergency services first. Then tell us, so the incident is recorded and reviewed — every report is read by a person.',
          'Si un animal ou une personne est en danger, contactez d’abord les services d’urgence locaux. Dites-le-nous ensuite, afin que l’incident soit consigné et examiné — chaque signalement est lu par une personne.',
        )}
      </p>

      <h2>{t('Reporting an accessibility barrier', 'Signaler un obstacle à l’accessibilité')}</h2>
      <p>
        {t('If something on this site is hard or impossible to use, tell us and we will fix it and say when. See our ',
           'Si quelque chose sur ce site est difficile ou impossible à utiliser, dites-le-nous : nous le corrigerons et vous dirons quand. Voir notre ')}
        <Link href={`/${seg}/legal/accessibility/`}>{m.footer.accessibility.toLowerCase()}</Link>.
      </p>

      <h2>{t('Service in French', 'Service en français')}</h2>
      <p>
        {t('Every page, notice and message on Havre exists in French and in English, and you can write to us in either.',
           'Chaque page, avis et message sur Havre existe en français et en anglais, et vous pouvez nous écrire dans l’une ou l’autre langue.')}
      </p>
    </ContentPage>
  );
}
