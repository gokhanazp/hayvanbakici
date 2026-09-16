import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';

import { ContentPage, DraftNotice } from '@/components/ContentPage';
import { getCommissionSettings } from '@/lib/data';

/**
 * BAKICI SOZLESMESI — TASLAK.
 *
 * Ana taahhutler urunun kodunda zaten var: komisyon oranlari
 * (DEFAULT_COMMISSION), yazili gerekce + iki hafta bildirim kurali,
 * insan incelemesi olmadan otomatik ret yok. Metin bunlari yaziyor;
 * geri kalani hukukcu onayini bekliyor.
 */
export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Entente du gardien' : 'Sitter agreement',
    description: fr
      ? 'Ce que nous vous devons, et ce que vous nous devez.'
      : 'What we owe you, and what you owe us.',
  };
}

export const revalidate = 300;

export default async function SitterAgreementPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  /*
    SOZLESMEDE TABAN ORANLAR YAZIYOR — kampanyali oran DEGIL.

    Kampanya gecici bir INDIRIM ve her an bitebilir; sozlesme metnine
    yazilsaydi, kampanya bittiginde sozlesme kendiliginden degismis
    gorunurdu. Bakicinin imzaladigi sey taban oran; kampanya onun
    lehine gecici bir sapma ve asagidaki satirda oyle anlatiliyor.
  */
  const c = await getCommissionSettings();

  return (
    <ContentPage
      locale={locale}
      title={t('Sitter agreement', 'Entente du gardien')}
      lead={t('What we commit to, in the same plain language we expect from you.',
              'Nos engagements, dans le même langage clair que celui que nous attendons de vous.')}
      updated="2026-09-13"
    >
      <DraftNotice locale={locale} />

      <h2>{t('You are independent', 'Vous êtes indépendant')}</h2>
      <p>
        {t(
          'You set your own prices, choose your own cancellation policy, decide which bookings to accept, and may work on any other platform at the same time. You are not our employee and we do not direct how you do the work.',
          'Vous fixez vos tarifs, choisissez votre politique d’annulation, décidez des réservations à accepter et pouvez travailler simultanément sur toute autre plateforme. Vous n’êtes pas notre employé et nous ne dirigeons pas la façon dont vous travaillez.',
        )}
      </p>

      <h2>{t('What we take', 'Ce que nous prenons')}</h2>
      <ul>
        <li>{t(`${c.sitterPct.sitter_referral}% on a client you brought yourself — permanently, including their repeat bookings.`,
               `${c.sitterPct.sitter_referral} % sur un client que vous avez amené — de façon permanente, y compris ses réservations répétées.`)}</li>
        <li>{t(`${c.sitterPct.repeat}% on a repeat booking with an owner who first found you here.`,
               `${c.sitterPct.repeat} % sur une réservation répétée avec un propriétaire qui vous a d’abord trouvé ici.`)}</li>
        <li>{t(`${c.sitterPct.platform}% on a client we introduced to you.`,
               `${c.sitterPct.platform} % sur un client que nous vous avons présenté.`)}</li>
      </ul>
      <p>
        {t('A rate change applies only to bookings made after it — a booking you already have keeps the rate it was made at. From time to time we run a campaign that lowers these rates for a period; a campaign never raises them. Full detail is on our ',
           'Un changement de taux ne s’applique qu’aux réservations faites après — une réservation déjà en cours conserve le taux en vigueur au moment où elle a été faite. Il nous arrive de mener une campagne qui abaisse ces taux pour une période; une campagne ne les augmente jamais. Le détail complet est sur notre page ')}
        <Link href={`/${seg}/pricing/`}>{m.nav.pricing.toLowerCase()}</Link>.
      </p>

      <h2>{t('Verification', 'Vérification')}</h2>
      <p>
        {t(
          'You consent to identity verification and an enhanced criminal record check by an accredited provider. A person reads every result. Nothing is refused automatically, you will be told the reason for a refusal, and you can have it reviewed by a person.',
          'Vous consentez à une vérification d’identité et à une vérification approfondie des antécédents judiciaires par un fournisseur accrédité. Une personne lit chaque résultat. Rien n’est refusé automatiquement, le motif d’un refus vous sera communiqué et vous pouvez en demander la révision par une personne.',
        )}
      </p>

      <h2>{t('Tax', 'Fiscalité')}</h2>
      <p>
        {t(
          'You are responsible for your own taxes. We report your earnings to the Canada Revenue Agency as the law requires of platform operators, which is why we need your Social Insurance Number. We give you the same figures we report.',
          'Vous êtes responsable de vos impôts. Nous déclarons vos revenus à l’Agence du revenu du Canada comme la loi l’exige des exploitants de plateformes, d’où la nécessité de votre numéro d’assurance sociale. Nous vous remettons les mêmes chiffres que ceux déclarés.',
        )}
      </p>

      <h2>{t('What you commit to', 'Vos engagements')}</h2>
      <ul>
        <li>{t('Care for animals as described on your profile, and tell the owner promptly if anything goes wrong.',
               'Prendre soin des animaux comme décrit sur votre profil, et prévenir rapidement le propriétaire en cas de problème.')}</li>
        <li>{t('Keep bookings, messages and payments on Havre — that is how a booking stays covered and reviewable.',
               'Garder les réservations, les messages et les paiements sur Havre — c’est ainsi qu’une réservation reste couverte et évaluable.')}</li>
        <li>{t('Never ask an owner to remove or change a review.',
               'Ne jamais demander à un propriétaire de retirer ou de modifier un avis.')}</li>
        <li>{t('Hold any licence or insurance your municipality requires for the services you offer.',
               'Détenir tout permis ou assurance exigé par votre municipalité pour les services que vous offrez.')}</li>
      </ul>

      <h2>{t('If we end your access', 'Si nous mettons fin à votre accès')}</h2>
      <p>
        {t(
          'You get the reason in writing and two weeks’ notice, except where someone’s safety requires acting immediately. You can challenge the decision and a person will review it. Payouts already earned are still paid.',
          'Vous recevez le motif par écrit et un préavis de deux semaines, sauf lorsque la sécurité d’une personne exige d’agir immédiatement. Vous pouvez contester la décision et une personne la révisera. Les sommes déjà gagnées vous sont versées.',
        )}
      </p>
    </ContentPage>
  );
}
