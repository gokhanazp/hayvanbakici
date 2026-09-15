import { getMessages, type Locale } from '@havre/i18n';
import { toggleFavouriteAction } from '@/app/actions/favourites';

/**
 * FAVORI DUGMESI — kalp.
 *
 * DUZ BIR FORM, JS YOK. Kalbi bir <button> yapip tiklamayi JS ile
 * yakalasaydik, JS yuklenmeden once basilan her tiklama kaybolurdu ve
 * kullanici "kalbe bastim, bir sey olmadi" derdi. Form gonderimi
 * tarayicinin kendi isi; Next, JS varsa ayni eylemi yerinde calistirip
 * sayfayi yenilemeden tazeliyor.
 *
 * ERISILEBILIRLIK: durum RENKLE DEGIL, ADLA tasiniyor — dugmenin
 * erisilebilir adi "Favorilere ekle" ya da "Favorilerden cikar", yani
 * ekran okuyucu hem ne oldugunu hem ne olacagini soyluyor. aria-pressed
 * bilincli olarak KULLANILMIYOR: dugmenin adi zaten degisiyor, ikisi
 * birden olunca bazi okuyucular "basili, favorilerden cikar" diye iki
 * kez durum okuyor.
 *
 * Kalbin kendisi aria-hidden — yaninda gorsel metin yok, adi butonda.
 */
export function FavouriteButton({
  sitterId, isFavourite, locale, path, size = 'md',
}: {
  sitterId: string;
  isFavourite: boolean;
  locale: Locale;
  /** Eylem bittiginde tazelenecek yol — kart hangi sayfadaysa orasi. */
  path: string;
  size?: 'sm' | 'md';
}) {
  const m = getMessages(locale);
  const label = isFavourite ? m.favourites.remove : m.favourites.add;

  return (
    <form action={toggleFavouriteAction} className="fav-form">
      <input type="hidden" name="sitterId" value={sitterId} />
      <input type="hidden" name="path" value={path} />
      <button
        type="submit"
        className={`fav-btn${isFavourite ? ' is-on' : ''}${size === 'sm' ? ' fav-sm' : ''}`}
        title={label}
        aria-label={label}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
          fill={isFavourite ? 'currentColor' : 'none'}
          stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M12 20.3s-7.5-4.6-7.5-9.6a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5-7.5 9.6-7.5 9.6Z" />
        </svg>
      </button>
    </form>
  );
}
