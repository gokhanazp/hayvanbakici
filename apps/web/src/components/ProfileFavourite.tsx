'use client';

import { useEffect, useState, useTransition } from 'react';
import { getMessages, type Locale } from '@havre/i18n';
import { toggleFavouriteAction } from '@/app/actions/favourites';

/**
 * BAKICI PROFILINDEKI KALP.
 *
 * Arama kartindaki kalpten farkli bir bilesen olmasinin TEK sebebi
 * onbellek: profil sayfasi ISR ile saatte bir uretiliyor ve onbellege
 * alinmis bir HTML'de "sizin favoriniz" gibi kisiye ozel bir durum
 * bulunamaz. Kalp bu yuzden once durumunu soruyor.
 *
 * DURUM BILINENE KADAR HICBIR SEY CIZILMIYOR. Once bos kalp cizip sonra
 * doldurmak, favorisinde olan bir bakicida "favorim degilmis" demek ve
 * bir an sonra kendiliginden degismek olurdu — kullanici bunu kendi
 * tiklamasi sandi mi, ne yaptigini bilemez. Yanlis durum gostermektense
 * hic gostermemek.
 *
 * JS KAPALIYSA kalp GORUNMUYOR; arama kartlarindaki kalp JS'siz de
 * calisiyor, yani ozellik erisilemez hale gelmiyor.
 */
export function ProfileFavourite({
  sitterId, locale, path,
}: {
  sitterId: string;
  locale: Locale;
  path: string;
}) {
  const m = getMessages(locale);
  const [state, setState] = useState<boolean | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    let alive = true;
    fetch(`/api/favourites?sitter=${encodeURIComponent(sitterId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setState(Boolean(d.isFavourite)); })
      /* Sorgu basarisizsa kalp cizilmiyor — yanlis durum gostermektense yok. */
      .catch(() => undefined);
    return () => { alive = false; };
  }, [sitterId]);

  if (state === null) return null;
  const label = state ? m.favourites.remove : m.favourites.add;

  return (
    <button
      type="button"
      className={`fav-btn${state ? ' is-on' : ''}`}
      title={label}
      aria-label={label}
      disabled={pending}
      onClick={() => start(async () => {
        /*
          IYIMSER CEVIRME: sunucu cevabini beklemeden kalp doluyor.
          Tiklamayla dolus arasinda bir ag gidis-donusu beklemek,
          kullanicinin ikinci kez tiklamasina ve favoriyi geri
          silmesine yol aciyordu.
        */
        setState(!state);
        const fd = new FormData();
        fd.set('sitterId', sitterId);
        fd.set('path', path);
        await toggleFavouriteAction(fd);
      })}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
        fill={state ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 20.3s-7.5-4.6-7.5-9.6a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5-7.5 9.6-7.5 9.6Z" />
      </svg>
    </button>
  );
}
