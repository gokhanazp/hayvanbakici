import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, segmentFor } from '@havre/i18n';
import { calculateCommission, compareToRover, dollars } from '@havre/core';
import { ContentPage } from '@/components/ContentPage';
import { NoIcon } from '@/components/InfoIcons';
import { money, dayFmt } from '@/lib/format';
import { getCommission } from '@/lib/data';

/**
 * UCRET SAYFASI.
 *
 * Tum rakamlar O AN GECERLI yapilandirmadan geliyor (getCommission:
 * taban oranlar + varsa yururlukteki kampanya). Elle yazilmis bir
 * yuzde, ilk degisiklikten sonra sessizce yalana donerdi.
 *
 * SAYFA ISR: oran veritabanindan okundugu icin statik uretilemez, ama
 * her istekte sorgu da gerekmiyor. Yonetici oran degistirdiginde
 * eylem `revalidatePath` cagiriyor — yani degisiklik ANINDA yansiyor,
 * bes dakikalik tazeleme yalnizca emniyet kemeri.
 *
 * COMPETITION ACT (yol haritasi §8.6): "gizli ucret yok" iddiasinin
 * dayanagi bu sayfadir — sayfada listelenmeyen hicbir kalem tahsil
 * edilmiyor ve rakip karsilastirmasi ISPATLANABILIR bir orana dayaniyor.
 */
export const revalidate = 300;

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const fr = locale === 'fr-CA';
  return {
    title: fr ? 'Nos frais' : 'Our fees',
    description: fr
      ? 'Les trois taux de commission, les frais de service du propriétaire et ce que nous ne facturons pas.'
      : 'The three commission rates, the owner service fee, and what we do not charge for.',
  };
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();
  const m = getMessages(locale);
  const fr = locale === 'fr-CA';
  const t = (en: string, f: string) => (fr ? f : en);
  const { config: c, campaignName, campaignEndsAt } = await getCommission();

  const sample = dollars(500);
  const ours = calculateCommission({ subtotalCents: sample, attribution: 'platform', config: c });
  const vs = compareToRover(sample, ours, 'standard');

  return (
    <ContentPage
      locale={locale}
      title={t('Our fees', 'Nos frais')}
      lead={t(
        'Three commission rates for sitters, one service fee for owners, and nothing else. This page is the whole of it.',
        'Trois taux de commission pour les gardiens, un frais de service pour les propriétaires, et rien d’autre. Cette page, c’est tout.',
      )}
      photo="care-a"
      wide
      aside={
        <>
          <div className="card card-pad">
            <h2 className="text-h4">{t('For sitters', 'Pour les gardiens')}</h2>
            <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
              {t('Bring your own clients and we take nothing on their bookings.',
                 'Amenez vos propres clients et nous ne prenons rien sur leurs réservations.')}
            </p>
            <Link href={`/${seg}/become-a-sitter/`} className="btn btn-primary btn-block" style={{ marginTop: 'var(--space-4)' }}>
              {m.nav.becomeSitter}
            </Link>
          </div>
          <div className="card card-pad">
            <h2 className="text-h4">{t('Questions about a charge?', 'Une question sur un montant?')}</h2>
            <p className="text-body-sm muted" style={{ marginTop: 'var(--space-2)' }}>
              {t('Every booking shows a line-by-line breakdown before you confirm.',
                 'Chaque réservation affiche un détail ligne par ligne avant la confirmation.')}
            </p>
            <Link href={`/${seg}/contact/`} className="btn btn-secondary btn-block" style={{ marginTop: 'var(--space-4)' }}>
              {m.footer.contact}
            </Link>
          </div>
        </>
      }
    >
      {/*
        KAMPANYA BANDI — RAKAMIN NEDEN FARKLI OLDUGUNU SOYLUYOR.

        Kampanya varken kartlardaki oran indirimli olur. Bandi
        koymasaydik, sayfaya bakan bir bakici "%10" gorup kalicı
        sanir ve kampanya bitince orani biz sessizce artirmis
        olurduk. Bitis TARIHI yaziyor: bir indirimin ne zaman
        bittigini soylememek, indirim yapmamaktan kotudur.
      */}
      {campaignName && campaignEndsAt && (
        <div className="notice notice-accent">
          <p>
            <strong>{campaignName}</strong>{' — '}
            {t(
              `Sitter commission is lower until ${dayFmt(campaignEndsAt, locale)}. The owner service fee is not affected.`,
              `La commission des gardiens est réduite jusqu’au ${dayFmt(campaignEndsAt, locale)}. Les frais de service du propriétaire ne changent pas.`,
            )}
          </p>
        </div>
      )}

      {/*
        UC ORAN, UC KART.

        Tablo satiriydi ve sayfanin ASIL IDDIASI — sifir komisyon —
        ucuncu sutunda kucuk bir "%0" olarak duruyordu. Rakam artik
        kartin kendisi; kendi musterisini getiren bakicinin karti
        ayrica vurgulu.
      */}
      <section className="card card-pad">
        <h2 className="text-h2">{t('What the sitter pays', 'Ce que paie le gardien')}</h2>
        <p className="text-body-sm muted">
          {t(
            'The rate depends on where the booking came from — not on how long the sitter has been here, and not on how many clients they have.',
            'Le taux dépend de l’origine de la réservation — pas de l’ancienneté du gardien ni du nombre de ses clients.',
          )}
        </p>

        <div className="info-grid rate-grid">
          <div className="rate-card rate-card-lead">
            <span className="rate-value">{c.sitterPct.sitter_referral}%</span>
            <p className="text-body-sm">
              {t('A client the sitter brought themselves', 'Un client amené par le gardien')}
            </p>
          </div>
          <div className="rate-card">
            <span className="rate-value">{c.sitterPct.repeat}%</span>
            <p className="text-body-sm">
              {t('A repeat booking with the same owner', 'Une réservation répétée avec le même propriétaire')}
            </p>
          </div>
          <div className="rate-card">
            <span className="rate-value">{c.sitterPct.platform}%</span>
            <p className="text-body-sm">
              {t('A client who found the sitter through Havre', 'Un client qui a trouvé le gardien via Havre')}
            </p>
          </div>
        </div>

        <p className="text-body-sm">
          {t(
            'The 0% is permanent, not an introductory offer. If a sitter invites a client with their own referral code, that client stays at 0% for every booking they ever make with that sitter.',
            'Le 0 % est permanent, ce n’est pas une offre de lancement. Si un gardien invite un client avec son propre code de parrainage, ce client reste à 0 % pour toutes ses réservations futures avec ce gardien.',
          )}
        </p>
      </section>

      <section className="card card-pad">
        <h2 className="text-h2">{t('What the owner pays', 'Ce que paie le propriétaire')}</h2>
        <p>
          {t(
            `A service fee of ${c.ownerPct}% of the sitter’s rate, capped at ${money(c.ownerFeeCapCents, locale)} per booking. It covers payment processing, the background checks behind the badges on every profile, and support if something goes wrong during a stay.`,
            `Des frais de service de ${c.ownerPct} % du tarif du gardien, plafonnés à ${money(c.ownerFeeCapCents, locale)} par réservation. Ils couvrent le traitement des paiements, les vérifications d’antécédents derrière les badges de chaque profil, et le soutien en cas de problème pendant un séjour.`,
          )}
        </p>
        <p className="text-body-sm muted">
          {t(
            'Applicable taxes (GST/HST, and QST in Québec) are added and shown as their own line. The total you see before confirming is the total you are charged.',
            'Les taxes applicables (TPS/TVH, et TVQ au Québec) s’ajoutent et apparaissent sur leur propre ligne. Le total affiché avant la confirmation est le total facturé.',
          )}
        </p>
      </section>

      <section className="card card-pad">
        <h2 className="text-h2">{t('A worked example', 'Un exemple chiffré')}</h2>
        <p className="text-body-sm muted">
          {t(
            `On a ${money(sample, locale)} booking from an owner who found the sitter through Havre:`,
            `Sur une réservation de ${money(sample, locale)} d’un propriétaire ayant trouvé le gardien via Havre :`,
          )}
        </p>
        <table className="info-table">
          <tbody>
            <tr>
              <td>{t('Sitter’s rate', 'Tarif du gardien')}</td>
              <td className="tabular">{money(sample, locale)}</td>
            </tr>
            <tr>
              <td>{t(`Our commission (${ours.sitterPct}%)`, `Notre commission (${ours.sitterPct} %)`)}</td>
              <td className="tabular">−{money(ours.sitterCommissionCents, locale)}</td>
            </tr>
            <tr>
              <td><strong>{t('The sitter receives', 'Le gardien reçoit')}</strong></td>
              <td className="tabular"><strong>{money(sample - ours.sitterCommissionCents, locale)}</strong></td>
            </tr>
            <tr>
              <td>{t(`Owner service fee (${ours.ownerPct}%${ours.ownerFeeCapped ? ', capped' : ''})`,
                     `Frais de service du propriétaire (${ours.ownerPct} %${ours.ownerFeeCapped ? ', plafonnés' : ''})`)}</td>
              <td className="tabular">+{money(ours.ownerFeeCents, locale)}</td>
            </tr>
            <tr>
              <td><strong>{t('The owner pays, before tax', 'Le propriétaire paie, avant taxes')}</strong></td>
              <td className="tabular"><strong>{money(sample + ours.ownerFeeCents, locale)}</strong></td>
            </tr>
          </tbody>
        </table>
        <p className="text-body-sm dim">
          {t(
            `The same booking on the largest competitor at its 20% standard rate leaves the sitter ${money(vs.sitterSavesCents, locale)} less and costs the owner ${money(vs.ownerSavesCents, locale)} more.`,
            `La même réservation chez le plus grand concurrent, à son taux standard de 20 %, laisse au gardien ${money(vs.sitterSavesCents, locale)} de moins et coûte ${money(vs.ownerSavesCents, locale)} de plus au propriétaire.`,
          )}
        </p>
      </section>

      {/*
        "NEYI UCRETLENDIRMIYORUZ" KOYU PANELDE.

        Bir kart daha olsaydi yukaridaki ucretlerin devami gibi
        okunurdu; oysa bunlar sitenin kendini SINIRLADIGI cumleler.
        Sayfada koyu panel bir tane: en cok okunmasini istedigimiz yer.
      */}
      <section className="info-panel">
        <h2 className="text-h2">{t('What we do not charge for', 'Ce que nous ne facturons pas')}</h2>
        <ul className="info-list info-list-no">
          {[
            t('Creating a profile or keeping it listed', 'La création d’un profil ou son maintien en ligne'),
            t('Messaging an owner or a sitter', 'L’envoi de messages à un propriétaire ou à un gardien'),
            t('Subscriptions, boosts, or paid placement in search results',
              'Les abonnements, les mises en avant ou le placement payant dans les résultats'),
            t('Cancelling before a sitter accepts', 'L’annulation avant l’acceptation du gardien'),
          ].map((line) => (
            <li key={line}><NoIcon />{line}</li>
          ))}
        </ul>
        <p>
          {t(
            'Search ranking cannot be bought. The inputs are published on every sitter profile: rating, response time, acceptance rate, cancellation rate, profile completeness, verification level and distance.',
            'Le classement dans la recherche ne s’achète pas. Les critères sont publiés sur chaque profil : évaluation, délai de réponse, taux d’acceptation, taux d’annulation, exhaustivité du profil, niveau de vérification et distance.',
          )}
        </p>
      </section>

      <section className="card card-pad">
        <h2 className="text-h2">{t('Cancellations', 'Annulations')}</h2>
        <p>
          {t(
            'Each sitter chooses one of three published cancellation policies — flexible, moderate or strict — and it is shown on their profile next to the service, before you book.',
            'Chaque gardien choisit l’une des trois politiques d’annulation publiées — flexible, modérée ou stricte — et elle figure sur son profil à côté du service, avant la réservation.',
          )}
        </p>
      </section>
    </ContentPage>
  );
}
