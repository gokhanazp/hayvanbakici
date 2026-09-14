import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage } from '@/components/ContentPage';

/**
 * TANIMLAMA BILGILERI.
 *
 * Bugun sitede UCUNCU TARAF izleyici YOK ve bu sayfa onu soyluyor.
 * Analitik eklendiginde bu sayfa ve riza akisi ONCE guncellenmeli —
 * "sonra yazariz" diyen bir cerez sayfasi, olmayan bir seyi anlatmaktan
 * daha kotu: yanlis bir seyi anlatir.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Choix relatifs aux témoins' : 'Cookie choices',
    description: fr ? 'Ce que nous déposons, et ce que nous ne déposons pas.' : 'What we set, and what we do not.',
  };
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  return (
    <ContentPage
      locale={locale}
      title={t('Cookie choices', 'Choix relatifs aux témoins')}
      lead={t('There is no banner on this site because there is nothing to consent to yet. Here is why.',
              'Il n’y a pas de bandeau sur ce site parce qu’il n’y a encore rien à consentir. Voici pourquoi.')}
      updated="2026-09-13"
    >
      <h2>{t('What we set today', 'Ce que nous déposons aujourd’hui')}</h2>
      <table>
        <thead>
          <tr>
            <th>{t('Purpose', 'Finalité')}</th>
            <th>{t('Needed?', 'Nécessaire?')}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{t('Keeping you signed in', 'Vous garder connecté')}</td>
            <td>{t('Strictly necessary', 'Strictement nécessaire')}</td>
          </tr>
          <tr>
            <td>{t('Protecting sign-in and forms against abuse', 'Protéger la connexion et les formulaires contre les abus')}</td>
            <td>{t('Strictly necessary', 'Strictement nécessaire')}</td>
          </tr>
          <tr>
            <td>{t('Remembering your language', 'Mémoriser votre langue')}</td>
            <td>{t('Strictly necessary', 'Strictement nécessaire')}</td>
          </tr>
        </tbody>
      </table>
      <p>
        {t(
          'Strictly necessary cookies are the ones without which the thing you asked for cannot happen — you cannot stay signed in without a session cookie. Under Canadian privacy law these do not require a consent banner, and a banner that asks for consent it will ignore is worse than none.',
          'Les témoins strictement nécessaires sont ceux sans lesquels ce que vous demandez ne peut pas fonctionner — impossible de rester connecté sans témoin de session. En vertu du droit canadien, ceux-ci n’exigent pas de bandeau de consentement, et un bandeau qui demande un consentement qu’il ignorera vaut moins que pas de bandeau du tout.',
        )}
      </p>

      <h2>{t('What we do not set', 'Ce que nous ne déposons pas')}</h2>
      <ul>
        <li>{t('Advertising or cross-site tracking cookies.', 'Témoins publicitaires ou de suivi intersites.')}</li>
        <li>{t('Third-party analytics that profile you.', 'Analytique tierce qui vous profile.')}</li>
        <li>{t('Social network embeds that report your visit back.', 'Widgets de réseaux sociaux qui signalent votre visite.')}</li>
      </ul>
      <p>
        {t(
          'Fonts and images come from our own servers, not a content delivery network, so loading a page does not tell anyone else that you were here.',
          'Les polices et les images proviennent de nos propres serveurs, et non d’un réseau de diffusion : le chargement d’une page n’apprend donc à personne d’autre que vous étiez ici.',
        )}
      </p>

      <h2>{t('If that changes', 'Si cela change')}</h2>
      <p>
        {t(
          'If we ever add measurement or advertising technology, this page changes first, a consent request appears before anything is set, and refusing costs you nothing on this site. Your choice is recorded with its date and wording, and you can change it at any time.',
          'Si nous ajoutons un jour une technologie de mesure ou de publicité, cette page change en premier, une demande de consentement apparaît avant tout dépôt, et refuser ne vous coûte rien sur ce site. Votre choix est consigné avec sa date et son libellé, et vous pouvez le modifier à tout moment.',
        )}
      </p>
      <p>
        {t('More on what we hold about you is in the ', 'Pour en savoir plus sur ce que nous détenons, voir la ')}
        <Link href={`/${seg}/legal/privacy/`}>{m.footer.privacy.toLowerCase()}</Link>.
      </p>
    </ContentPage>
  );
}
