import Link from 'next/link';
import Image from 'next/image';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';
import { SERVICES, type ServiceType } from '@havre/core';
import type { SitterSummary } from '@/lib/data';
import { money, responseTime } from '@/lib/format';
import { VerificationBadge } from './VerificationBadge';
import { FavouriteButton } from './FavouriteButton';
import { resolvePhoto } from '@/lib/photos';

export function SitterCard({
  sitter,
  serviceType,
  locale,
  citySlug,
  distanceLabel,
  favourite,
}: {
  sitter: SitterSummary;
  serviceType: ServiceType;
  locale: Locale;
  /** Profil adresi sehir altinda: /en/toronto/sitter/camille-b-7f3a */
  citySlug: string;
  /** Yalnizca aramada: "1,2 km uzakta". Landing sayfasinda mesafe anlamsiz. */
  distanceLabel?: string | undefined;
  /**
   * Favori kalbi. Verilmezse kalp CIZILMIYOR — ana sayfadaki tanitim
   * seridi gibi yerlerde favori dugmesi anlamsiz (ve orada hangi
   * sayfanin tazelenecegi de belirsiz).
   */
  favourite?: { isFavourite: boolean; path: string } | undefined;
}) {
  const m = getMessages(locale);
  const unit = m.unit[SERVICES[serviceType].unit];
  const photo = resolvePhoto(sitter.avatarUrl);
  const href = `/${segmentFor(locale)}/${citySlug}/sitter/${sitter.slug}/`;

  /*
    KART ARTIK BIR <a> DEGIL.

    Once tum kart tek bir baglantiydi; kalbi icine koymak, baglantinin
    icine buton koymak demek — gecersiz HTML ve klavyede tahmin
    edilemez davranis. Simdi kart bir kutu, baglanti yalnizca BAKICININ
    ADINDA ve "yayilan baglanti" (::after) ile kartin tamamini
    tikllanabilir yapiyor. Kalp baglantinin USTUNDE duruyor.

    Kazanci yalnizca kalp degil: sekme ile gezen kullanici artik kartin
    adini duyuyor ("Camille B."), eskiden kartin BUTUN metnini tek
    baglanti adi olarak dinliyordu.
  */
  return (
    <div className="card card-hover sitter-card">
      {/*
        Fotograf varsa fotograf, yoksa bas harfler. Karti bos bir gri kutuyla
        birakmak, fotograf yuklememis bakicinin aleyhine olurdu.
        alt="" bilincli: ad hemen altinda yaziyor, ekran okuyucu iki kez okumasin.
      */}
      <div className="sitter-photo" aria-hidden={photo ? undefined : true}>
        {photo
          ? <Image src={photo} alt="" width={516} height={387} sizes="(min-width: 700px) 258px, 50vw" />
          : sitter.photoInitials}
      </div>

      {favourite && (
        <div className="sitter-fav">
          <FavouriteButton
            sitterId={sitter.id}
            isFavourite={favourite.isFavourite}
            locale={locale}
            path={favourite.path}
          />
        </div>
      )}

      <div className="sitter-body">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <div style={{ minWidth: 0 }}>
            <h3 className="text-h4">
              <Link href={href} className="stretch-link">
                {sitter.firstName} {sitter.lastNameInitial}.
              </Link>
            </h3>
            <p className="dim text-body-sm">{sitter.neighbourhood}</p>
          </div>
          {/* Drip pricing yasagi: gosterilen fiyat TAM fiyattir */}
          <div className="tabular" style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 600 }}>{money(sitter.priceCents, locale)}</div>
            <div className="dim text-body-sm">/ {unit}</div>
          </div>
        </div>

        <p className="muted text-body-sm tabular">
          ★ {sitter.rating.toFixed(1)} ({sitter.reviewCount}) · {responseTime(sitter.responseMinutes, locale)}
        </p>

        <div><VerificationBadge level={sitter.badgeLevel} locale={locale} /></div>

        <p className="dim text-body-sm">
          {locale === 'fr-CA'
            ? `${sitter.repeatClients} clients réguliers`
            : `${sitter.repeatClients} repeat clients`}
          {distanceLabel && <> · <span className="tabular">{distanceLabel}</span></>}
        </p>
      </div>
    </div>
  );
}
