import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { ContentPage, DraftNotice } from '@/components/ContentPage';
import { LockIcon } from '@/components/InfoIcons';
import { VerificationBadge } from '@/components/VerificationBadge';

/**
 * KORUMA SAYFASI.
 *
 * DIKKAT — BU SAYFA SIGORTA VAAT ETMEZ.
 * "Koruma" bir sirket taahhudu; sigorta urunu degil ve bakicinin kendi
 * sorumluluk sigortasinin yerine gecmez. Kanada'da sigorta satisi
 * ruhsata tabidir ve yanlis ifade hem duzenleyici hem dava riski.
 *
 * Ayrica: programin limitleri ve istisnalari HENUZ hukukcu onayindan
 * gecmedi. Rakam uydurmak yerine sayfa, bugun GERCEKTEN var olan
 * korumalari anlatiyor ve taahhut metninin taslak oldugunu soyluyor.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Protection Havre' : 'Havre Protection',
    description: fr
      ? 'Ce qui protège un séjour : vérifications, adresse chiffrée, avis honnêtes et registre des incidents.'
      : 'What protects a stay: verification, encrypted addresses, honest reviews and an incident register.',
  };
}

export default async function ProtectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);

  return (
    <ContentPage
      locale={locale}
      title={t('Havre Protection', 'Protection Havre')}
      lead={t(
        'Most of what keeps a stay safe happens before it starts. Here is exactly what we do, and what we do not claim to do.',
        'L’essentiel de ce qui rend un séjour sûr se passe avant qu’il ne commence. Voici précisément ce que nous faisons, et ce que nous ne prétendons pas faire.',
      )}
      photo="care-b"
      wide
      aside={
        <div className="card card-pad">
          <h2 className="text-h4">{t('Something went wrong?', 'Un problème est survenu?')}</h2>
          <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
            {t('Tell us as soon as you can. Incidents are recorded and reviewed by a person.',
               'Dites-le-nous dès que possible. Les incidents sont consignés et examinés par une personne.')}
          </p>
          <Link href={`/${seg}/contact/`} className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }}>
            {m.footer.contact}
          </Link>
        </div>
      }
    >
      <DraftNotice locale={locale} />

      <section className="card card-pad">
        <h2 className="text-h2">
          {t('Before a sitter appears in search', 'Avant qu’un gardien apparaisse dans la recherche')}
        </h2>
        <p className="text-body-sm muted">{m.verification.disclaimer}</p>
        <p>
          {t(
            'Every applicant passes identity verification and an enhanced criminal record check run by an accredited provider. A person reads every result — a flagged check goes to human review, never to an automatic refusal.',
            'Chaque candidat passe une vérification d’identité et une vérification approfondie des antécédents judiciaires effectuée par un fournisseur accrédité. Une personne lit chaque résultat — une vérification signalée est examinée par un humain, jamais refusée automatiquement.',
          )}
        </p>
      </section>

      {/*
        ROZETLERIN TAM ACIKLAMASI.

        Arama kartlarindan ve bakici profilinden buraya baglanti var.
        Her satir ne DOGRULANDIGINI soyluyor ve ne dogrulanmadigini
        saklamiyor: bir rozet vermedigimiz bir sozu ima ederse guven
        degil risk uretir. "Licence" satirinda sigortayi DOGRULAMADIGIMIZ
        acikca yaziyor — bu, sitede en kolay yanlis anlasilan sey.

        Once iki sutunlu bir tanim listesiydi: solda rozet, sagda uzun
        bir paragraf ve aralarinda genis bos bir serit. Artik her rozet
        kendi kutusunda, aciklama rozetin ALTINDA.
      */}
      <section className="card card-pad">
        <h2 className="text-h2" id="badges">{m.verification.heading}</h2>
        <div className="badge-explain">
          {([
            [1, 'explain.identity'],
            [2, 'explain.criminal'],
            [3, 'explain.licence'],
            [4, 'explain.certification'],
          ] as const).map(([level, key]) => (
            <div key={level}>
              <span><VerificationBadge level={level} locale={locale} /></span>
              <p className="text-body-sm">{m.verification[key]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="text-h2">{t('What stays private', 'Ce qui reste privé')}</h2>
        <ul className="info-list info-list-no">
          {[
            t('Profiles show a first name and a last initial only.',
              'Les profils n’affichent qu’un prénom et l’initiale du nom.'),
            t('Maps and search results show an approximate point in a neighbourhood, offset from the real address.',
              'Les cartes et les résultats affichent un point approximatif dans un quartier, décalé de l’adresse réelle.'),
            t('The exact address is encrypted and released only after a booking is confirmed.',
              'L’adresse exacte est chiffrée et n’est communiquée qu’après la confirmation d’une réservation.'),
            t('Dates of birth and Social Insurance Numbers are encrypted, access-restricted, and never shown on a profile.',
              'Les dates de naissance et les numéros d’assurance sociale sont chiffrés, à accès restreint, et jamais affichés sur un profil.'),
          ].map((line) => (
            <li key={line}><LockIcon />{line}</li>
          ))}
        </ul>
      </section>

      <div className="info-grid">
        <section className="card card-pad">
          <h2 className="text-h3">{t('Reviews you can rely on', 'Des avis fiables')}</h2>
          <p className="text-body-sm">
            {t(
              'Only an owner who completed a booking can leave a review, and neither side sees the other’s until the review window closes. We do not delete a review because a sitter asks us to; a sitter may reply to it once, publicly.',
              'Seul un propriétaire ayant terminé une réservation peut laisser un avis, et aucune partie ne voit celui de l’autre avant la fermeture de la période. Nous ne supprimons pas un avis parce qu’un gardien le demande; le gardien peut y répondre une fois, publiquement.',
            )}
          </p>
        </section>

        <section className="card card-pad">
          <h2 className="text-h3">{t('If something goes wrong', 'En cas de problème')}</h2>
          <p className="text-body-sm">
            {t(
              'Incidents are recorded in a register with what happened, when it was reported and what was done. The register is what lets us see a pattern across bookings instead of treating each report as the first.',
              'Les incidents sont consignés dans un registre indiquant ce qui s’est passé, quand cela a été signalé et ce qui a été fait. Ce registre nous permet de repérer un schéma sur plusieurs réservations au lieu de traiter chaque signalement comme le premier.',
            )}
          </p>
          <p className="text-body-sm">
            {t(
              'A sitter is never removed without a written reason. Where we end a working relationship, the sitter gets that reason in writing and two weeks’ notice, except where someone’s safety requires acting immediately.',
              'Un gardien n’est jamais retiré sans motif écrit. Lorsque nous mettons fin à une relation de travail, le gardien reçoit ce motif par écrit et un préavis de deux semaines, sauf lorsque la sécurité d’une personne exige d’agir immédiatement.',
            )}
          </p>
        </section>
      </div>

      {/*
        "BU NE DEGILDIR" KOYU PANELDE.

        Sayfanin en onemli paragrafi bu ve alti bolumun sonuncusu
        olarak, digerleriyle ayni gri metinle duruyordu. Koyu panel
        sayfada bir tane: bir sigorta urunu OLMADIGIMIZ cumlesi
        atlanacak bir satir olmamali.
      */}
      <section className="info-panel">
        <h2 className="text-h2">{t('What this is not', 'Ce que ceci n’est pas')}</h2>
        <p>
          {t(
            'Havre Protection is a commitment from our company. It is not an insurance product, it is not underwritten by an insurer, and it does not replace a sitter’s own liability insurance or an owner’s pet insurance. Anyone telling you otherwise — including us, in any marketing you may see — would be wrong.',
            'La Protection Havre est un engagement de notre entreprise. Ce n’est pas un produit d’assurance, elle n’est pas souscrite auprès d’un assureur et elle ne remplace ni l’assurance responsabilité du gardien ni l’assurance de l’animal du propriétaire. Quiconque vous dirait le contraire — y compris nous, dans une publicité — aurait tort.',
          )}
        </p>
        <p>
          {t(
            'The limits and exclusions of the programme are being finalised with counsel and will be published here in full, before the first booking is taken. We would rather show you this sentence than a number we cannot stand behind.',
            'Les limites et exclusions du programme sont en cours de finalisation avec un conseiller juridique et seront publiées ici intégralement, avant la première réservation. Nous préférons vous montrer cette phrase plutôt qu’un chiffre que nous ne pourrions pas assumer.',
          )}
        </p>
      </section>
    </ContentPage>
  );
}
