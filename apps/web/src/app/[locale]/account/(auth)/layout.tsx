import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { getMessages, localeFromSegment } from '@havre/i18n';
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

    "VERINIZ KANADA'DA KALIR" DEGIL, "SAKLANIR".

    Onceki metin her veriyi kapsiyordu ve e-posta saglayicimizin
    (Resend) Kanada bolgesi yok: rezervasyon bildirimleri ad ve tarih
    tasiyor, yani kisisel veri sinir disinda ISLENIYOR. Veritabani ve
    fotograflar gercekten ca-central-1'de — SAKLAMA Kanada'da, aktarim
    degil. Cumle artik tam olarak bunu soyluyor.

    Bu, formun tam yaninda duran bir cumle: kullanicinin e-postasini
    verip vermeme karari bu satira bakarak veriliyor. Burada "neredeyse
    dogru" diye bir sey yok.

    SES'e (ca-central-1) gecersek daha genis ifadeye donulebilir.
  */
  const points = fr
    ? ['Vos données de compte et vos fichiers sont hébergés au Canada',
       'Aucun frais avant la confirmation d’une réservation',
       'Connexion par lien courriel — aucun mot de passe requis']
    : ['Your account and files are stored in Canada',
       'Nothing is charged until a booking is confirmed',
       'Sign in by email link — no password required'];

  /*
    UC MADDE IKI YERDE DE AYNI KAYNAKTAN.

    Genis ekranda sagdaki panelde, dar ekranda formun ALTINDA
    gosteriliyorlar. Onceden dar ekranda HIC gorunmuyorlardi: oysa
    "e-postami verir miyim" karari en cok telefonda veriliyor ve o
    karara yarayan tek metin buydu.
  */
  const Points = ({ className }: { className: string }) => (
    <ul className={className}>
      {points.map((p) => (
        <li key={p}>
          <ShieldIcon size={14} />
          {p}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="auth-split">
      <div className="auth-shell">
        <div className="auth-card">{children}</div>
        <Points className="auth-points auth-points-inline" />
      </div>

      {/*
        SAG PANEL: fotograf artik TAM KANAMA DEGIL.

        Once sag sutunun tamami bir fotografla doluyordu; hem sayfanin
        agirlik merkezini formdan kaydiriyor hem de fotograf yuklenene
        kadar (ve yer tutucu goruntulerde) kocaman bos bir alan gibi
        duruyordu. Simdi fotograf sabit oranli, yuvarlatilmis bir kart;
        maddeler onun altinda, akisin icinde — kirpilma ihtimali yok.
      */}
      <aside className="auth-aside">
        <div className="auth-aside-inner">
          {/*
            Panelin bir isi olsun: yalnizca fotograf degil, markanin
            kendi cumlesi. Yeni bir iddia YAZILMIYOR — sitenin her
            yerinde duran slogan burada da duruyor.
          */}
          <p className="auth-aside-title">{getMessages(locale).brand.tagline}</p>
          <span className="auth-aside-photo">
            <Photo id="auth-panel" locale={locale} decorative sizes="(min-width: 960px) 32vw, 100vw" />
          </span>
          <Points className="auth-points" />
        </div>
      </aside>
    </div>
  );
}
