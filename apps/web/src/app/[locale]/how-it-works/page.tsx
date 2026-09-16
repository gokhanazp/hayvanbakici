import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage } from '@/components/ContentPage';
import { VerificationBadge } from '@/components/VerificationBadge';

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
      h: t('Search your own neighbourhood', 'Cherchez dans votre quartier'),
      p: t(
        'Enter a postal code and dates. Results are ranked by rating, response time, acceptance rate, cancellation rate, profile completeness, verification level and distance — never by payment. Each sitter’s position on the map is an approximate point in their neighbourhood, not their address.',
        'Entrez un code postal et des dates. Les résultats sont classés selon l’évaluation, le délai de réponse, le taux d’acceptation, le taux d’annulation, l’exhaustivité du profil, le niveau de vérification et la distance — jamais selon un paiement. La position d’un gardien sur la carte est un point approximatif dans son quartier, pas son adresse.',
      ),
    },
    {
      h: t('Read the profile, including the price', 'Lisez le profil, prix compris'),
      p: t(
        'Every profile shows the nightly or visit rate, the cancellation policy, what sizes and species the sitter accepts, their home, and every review they have received — including the ones they replied to.',
        'Chaque profil indique le tarif par nuit ou par visite, la politique d’annulation, les tailles et espèces acceptées, le domicile du gardien et tous les avis reçus — y compris ceux auxquels il a répondu.',
      ),
    },
    {
      h: t('Ask first, book when you are ready', 'Posez vos questions, réservez ensuite'),
      p: t(
        'Message a sitter before booking at no cost. When you do book, the full breakdown — the sitter’s rate, our service fee, taxes — is on screen before you confirm. Nothing is added afterwards.',
        'Écrivez à un gardien avant de réserver, sans frais. Au moment de réserver, le détail complet — tarif du gardien, nos frais de service, taxes — s’affiche avant la confirmation. Rien n’est ajouté ensuite.',
      ),
    },
    {
      h: t('Meet before the stay', 'Rencontrez avant le séjour'),
      p: t(
        'A meet-and-greet before the first booking is normal and encouraged. The sitter’s exact address is shared with you only once a booking is confirmed; until then it is stored encrypted.',
        'Une rencontre préalable avant la première réservation est normale et encouragée. L’adresse exacte du gardien ne vous est communiquée qu’une fois la réservation confirmée; avant cela, elle est conservée chiffrée.',
      ),
    },
    {
      h: t('Staying in touch', 'Rester en contact'),
      p: t(
        'Messages stay inside Havre, so the whole booking is in one place — you can write to a sitter before you book and while you are away. Photo updates and vaccination records are coming with the Toronto launch.',
        'Les messages restent dans Havre : toute la réservation est au même endroit — vous pouvez écrire à un gardien avant de réserver et pendant votre absence. Les photos et les carnets de vaccination arriveront avec le lancement à Toronto.',
      ),
    },
    {
      h: t('Reviews both ways, revealed together', 'Des avis des deux côtés, dévoilés ensemble'),
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
      wide
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
      {/*
        ALTI ADIM IKI SUTUNLU IZGARADA.

        Once alt alta alti baslik + alti paragrafti: hepsi ayni
        agirlikta, sirasi ancak basliktaki "1." ile belli oluyordu ve
        1280 pikselde sayfa ekranlarca uzuyordu. Numara artik metnin
        icinde degil, kendi yuvarlaginda — sira bir bakista okunuyor.
      */}
      <section>
        <h2 className="text-h2">{t('From search to coming home', 'De la recherche au retour')}</h2>
        <div className="info-grid">
          {steps.map((s, i) => (
            <article key={s.h} className="card card-pad info-step">
              <span className="info-step-num" aria-hidden="true">{i + 1}</span>
              <h3 className="text-h4">{s.h}</h3>
              <p className="text-body-sm">{s.p}</p>
            </article>
          ))}
        </div>
      </section>

      {/*
        ROZETLER: madde isareti degil ROZETIN KENDISI.

        Dort satirlik duz bir listeydi; oysa kullanici bu rozetleri
        arama sonucunda ve profilde GORUYOR. Ayni bicimi burada da
        gostermek, sayfayi bir sozluk haline getiriyor.
      */}
      <section className="card card-pad">
        <h2 className="text-h2">{t('What “verified” means', 'Ce que « vérifié » signifie')}</h2>
        <p className="text-body-sm muted">{m.verification.disclaimer}</p>
        {/* Rozetler YAN YANA: dort ayri satir, dordu bir arada bir
            merdiven olduklarini gizliyordu. */}
        <ul className="badge-row">
          {([1, 2, 3, 4] as const).map((level) => (
            <li key={level}>
              <VerificationBadge level={level} locale={locale} />
            </li>
          ))}
        </ul>
        <p className="text-body-sm">
          {t(
            'A person reviews every background check result. No automated system decides on its own whether someone can work on Havre, and anyone refused can ask for the reasoning and challenge it.',
            'Une personne examine chaque résultat de vérification. Aucun système automatisé ne décide seul si quelqu’un peut travailler sur Havre, et toute personne refusée peut demander les motifs et les contester.',
          )}
        </p>
        {/* Her rozetin NE KAPSADIGI koruma sayfasinda — burada
            tekrar etmek iki yerde iki ayri metin uretirdi. */}
        <p className="text-body-sm">
          <Link href={`/${seg}/protection/#badges`} className="link-underline">
            {t('What each badge covers', 'Ce que couvre chaque badge')}
          </Link>
        </p>
      </section>
    </ContentPage>
  );
}
