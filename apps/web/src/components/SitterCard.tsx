import Link from 'next/link';
import Image from 'next/image';
import { getMessages, interpolate, segmentFor, type Locale } from '@havre/i18n';
import { SERVICES, type ServiceType } from '@havre/core';
import type { SitterSummary } from '@/lib/data';
import { money, responseTime } from '@/lib/format';
import { VerificationBadge } from './VerificationBadge';
import { FavouriteButton } from './FavouriteButton';
import { FavouriteHeart } from './FavouriteScope';
import { resolvePhoto } from '@/lib/photos';

export function SitterCard({
  sitter,
  serviceType,
  locale,
  citySlug,
  distanceLabel,
  favourite,
  layout = 'grid',
}: {
  sitter: SitterSummary;
  serviceType: ServiceType;
  locale: Locale;
  /** Profil adresi sehir altinda: /en/toronto/sitter/camille-b-7f3a */
  citySlug: string;
  /** Yalnizca aramada: "1,2 km uzakta". Landing sayfasinda mesafe anlamsiz. */
  distanceLabel?: string | undefined;
  /**
   * Favori kalbi. Verilmezse kalp CIZILMIYOR.
   *
   * isFavourite VERILMISSE kalp sunucuda ciziliyor ve JS'siz calisiyor
   * (arama, favoriler sayfasi — ikisi de zaten dinamik). VERILMEMISSE
   * kart ONBELLEGE ALINAN bir sayfada demektir (sehir sayfasi): orada
   * durum sunucuda bilinemez, kalp kendi durumunu istemcide soruyor ve
   * bunun icin kartin bir FavouriteScope icinde olmasi gerekir.
   */
  favourite?: { path: string; isFavourite?: boolean | undefined } | undefined;
  /**
   * 'grid'  — sehir sayfasindaki dikey kart (fotograf ustte).
   * 'row'   — arama sonucundaki yatay kart (fotograf solda).
   *
   * Tasarimda bu iki kart farkli: arama sonucunda satirlar yan yana
   * daha fazla bakici gosteriyor. Ikinci bir bilesen yazmak yerine
   * TEK sinif degisiyor; yerlesimi CSS yapiyor, yoksa ayni veriyi iki
   * yerde cizen iki kopya olurdu ve biri mutlaka geride kalirdi.
   */
  layout?: 'grid' | 'row' | undefined;
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
    <div className={`card card-hover sitter-card${layout === 'row' ? ' sitter-card-row' : ''}`}>
      {/*
        Fotograf varsa fotograf, yoksa bas harfler. Karti bos bir gri kutuyla
        birakmak, fotograf yuklememis bakicinin aleyhine olurdu.
        alt="" bilincli: ad hemen altinda yaziyor, ekran okuyucu iki kez okumasin.
      */}
      <div className="sitter-photo" aria-hidden={photo ? undefined : true}>
        {photo
          ? <Image src={photo} alt="" width={516} height={387} sizes="(min-width: 700px) 258px, 50vw" />
          : sitter.photoInitials}
        {/*
          Tasarimda arama kartinda puan FOTOGRAFIN UZERINDE, sol ustte
          duruyor. Yalnizca satir kartta: dikey kartta fotograf zaten
          dar ve rozet adi orterdi.

          Puan ROZET DEGIL, VERI: yorum sayisi da yaninda, cunku "5,0"
          tek basina iki yorumdan mi altmis yorumdan mi geldigini
          soylemiyor.
        */}
        {layout === 'row' && sitter.reviewCount > 0 && (
          <span className="sitter-rate" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8Z" />
            </svg>
            <span className="tabular">{sitter.rating.toFixed(1)}</span>
            <span className="sitter-rate-n tabular">({sitter.reviewCount})</span>
          </span>
        )}
      </div>

      {favourite && (
        <div className="sitter-fav">
          {favourite.isFavourite === undefined
            ? <FavouriteHeart sitterId={sitter.id} />
            : (
              <FavouriteButton
                sitterId={sitter.id}
                isFavourite={favourite.isFavourite}
                locale={locale}
                path={favourite.path}
              />
            )}
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
            <p className="dim text-body-sm">
              {sitter.neighbourhood}
              {layout === 'row' && distanceLabel && <> · <span className="tabular">{distanceLabel}</span></>}
            </p>
          </div>
          {/* Drip pricing yasagi: gosterilen fiyat TAM fiyattir */}
          <div className="tabular" style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className={layout === 'row' ? 'sitter-price' : undefined} style={layout === 'row' ? undefined : { fontWeight: 600 }}>
              {money(sitter.priceCents, locale)}
            </div>
            <div className="dim text-body-sm">/ {unit}</div>
          </div>
        </div>

        {layout === 'row' ? (
          /*
            OZELLIK HAPLARI. Tasarimda kartta uc kucuk hap var
            ("Positive Trainer", "Fenced Yard", "Live GPS Walks").
            Bizdekiler UYDURMA DEGIL, bakicinin profilinden geliyor:
            dogrulama kademesi, cit, kedi, ev tipi. Olmayan bir ozellik
            hap da uretmiyor — bos birakmak, olmayan bir seyi yazmaktan
            iyidir.
          */
          <div className="sitter-traits">
            <VerificationBadge level={sitter.badgeLevel} locale={locale} />
            {sitter.yardFenced && <span className="sitter-trait">{m.searchPage.yard}</span>}
            {sitter.acceptsCats && <span className="sitter-trait">{m.searchPage.cats}</span>}
            {sitter.repeatClients > 0 && (
              <span className="sitter-trait tabular">
                {interpolate(m.searchPage.repeatClients, { count: String(sitter.repeatClients) })}
              </span>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}

        {/*
          GERCEK BIR YORUMDAN ALINTI.

          Referans tasarimda her bakici kartinda bir yorum cumlesi
          var; bizde kart yalnizca sayilardan olusuyordu. Sayi guven
          VERIR, cumle guven KURAR.

          Alinti uydurulmuyor: yayinlanmis, gizlenmemis ve bakiciya
          yazilmis en yeni yorumun govdesi (bkz. landing.ts sorgusu).
          Yorum yoksa satir HIC cizilmiyor -- yer tutucu bir cumle
          koymak, olmayan bir musteriyi konusturmak olurdu.

          Kirpma CSS'te (iki satir) degil burada degil: metnin tamami
          DOM'da kaliyor ki ekran okuyucu yarim cumle okumasin.
        */}
        {sitter.quote && (
          <p className="sitter-quote">
            <span aria-hidden="true">&ldquo;</span>
            {sitter.quote}
            <span aria-hidden="true">&rdquo;</span>
          </p>
        )}

        {/*
          SATIR KARTTA ALT SATIR. Tasarimin arama kartinda altta bir
          eylem satiri var ("Message" + "View Profile"). Mesaj dugmesi
          KONULMADI: mesajlasma giris ve acik bir rezervasyon istegi
          istiyor, karttan dogrudan mesaj atilamiyor — calismayan bir
          dugme koymaktansa hic koymamak dogru. Profil dugmesi gercek
          ve kartin kendi yayilan baglantisiyla ayni yere gidiyor.
        */}
        {layout === 'row' && (
          <div className="sitter-row-foot">
            <span className="sitter-reply">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M13.4 2.8 5.2 13.3h5.3l-.9 7.9 8.2-10.5h-5.3Z" />
              </svg>
              {responseTime(sitter.responseMinutes, locale)}
            </span>
            <Link href={href} className="sitter-view">{m.searchPage.viewProfile}</Link>
          </div>
        )}
      </div>
    </div>
  );
}
