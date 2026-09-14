import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { localeFromSegment } from '@havre/i18n';
import { Photo } from '@/components/Photo';
import { ShieldIcon } from '@/components/VerificationBadge';

/**
 * Hesap ekranlari ARAMA MOTORLARINA KAPALI.
 * Giris ve sifre sifirlama sayfalarinin indekslenmesinin hicbir faydasi yok;
 * ayrica jeton tasiyan URL'lerin (reset-password?token=...) taranmasi
 * guvenlik acisindan istenmeyen bir durum.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AccountLayout({
  children, params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg) ?? 'en-CA';
  const fr = locale === 'fr-CA';

  /*
    Maddeler PAZARLAMA DEGIL, formun yaninda durmasi gereken bilgiler:
    hesabin neye yaradigi, verinin nerede durdugu, sifrenin nasil saklandigi.
    Giris ekraninda "binlerce mutlu musteri" yazmak, kullanicinin o an
    verdigi karara (e-postami verir miyim) hicbir sey katmaz.
  */
  const points = fr
    ? ['Vos données restent au Canada', 'Aucun frais avant la confirmation d’une réservation',
       'Connexion par lien courriel — aucun mot de passe requis']
    : ['Your data stays in Canada', 'Nothing is charged until a booking is confirmed',
       'Sign in by email link — no password required'];

  return (
    <div className="auth-split">
      <div className="auth-shell">
        <div className="auth-card">{children}</div>
      </div>

      {/* Genis ekranda fotografli panel; dar ekranda hic basilmaz (CSS) */}
      <aside className="auth-aside">
        <span className="photo-fill">
          <Photo id="auth-panel" locale={locale} decorative sizes="42vw" />
        </span>
        <div className="auth-aside-card">
          <ul>
            {points.map((p) => (
              <li key={p}>
                <ShieldIcon size={14} />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
