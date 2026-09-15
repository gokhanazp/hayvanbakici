'use client';

import {
  createContext, useContext, useEffect, useMemo, useState, useTransition,
  type ReactNode,
} from 'react';
import { getMessages, type Locale } from '@havre/i18n';
import { toggleFavouriteAction } from '@/app/actions/favourites';

/**
 * ONBELLEGE ALINAN SAYFALARDA KALP.
 *
 * Sehir sayfasi ve bakici profili ISR ile saatte bir uretiliyor.
 * Onbellege alinmis bir HTML'de "sizin favoriniz" gibi kisiye ozel bir
 * durum bulunamaz — arama sayfasindaki JS'siz kalp burada
 * calismazdi. Bu yuzden o sayfalarda kalp durumunu istemcide soruyor.
 *
 * TEK SORGU, ON IKI KALP: her kart kendi durumunu ayri ayri sorsaydi
 * sehir sayfasi acilirken on iki istek giderdi. Kapsam bileseni
 * listedeki butun kimlikleri TEK istekte soruyor ve sonucu kalplere
 * dagitiyor.
 *
 * DURUM BILINENE KADAR KALP CIZILMIYOR. Once bos kalp gosterip sonra
 * doldurmak, favorisinde olan bir bakicida "favorim degilmis" demek ve
 * bir an sonra kendiliginden degismek olurdu; kullanici bunu kendi
 * tiklamasi sandi mi ne yaptigini bilemez. Yanlis durum gostermektense
 * hic gostermemek.
 *
 * JS KAPALIYSA bu kalpler gorunmuyor. Arama sayfasindaki kalp JS'siz de
 * calisiyor (duz form), yani ozellik erisilemez hale gelmiyor.
 */
interface Scope {
  ready: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  pending: boolean;
  path: string;
  locale: Locale;
}

const Ctx = createContext<Scope | null>(null);

export function FavouriteScope({
  ids, locale, path, children,
}: {
  ids: readonly string[];
  locale: Locale;
  /** Eylemden sonra tazelenecek yol. */
  path: string;
  children: ReactNode;
}) {
  const [set, setSet] = useState<Set<string> | null>(null);
  const [pending, start] = useTransition();

  /* ids her cizimde yeni bir dizi; bagimlilik olarak dizenin kendisi. */
  const key = ids.join(',');

  useEffect(() => {
    if (!key) { setSet(new Set()); return; }
    let alive = true;
    const q = key.split(',').map((id) => `sitter=${encodeURIComponent(id)}`).join('&');
    fetch(`/api/favourites?${q}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive && d) setSet(new Set(d.favourites as string[])); })
      /* Sorgu basarisizsa kalp cizilmiyor — yanlis durum gostermektense yok. */
      .catch(() => undefined);
    return () => { alive = false; };
  }, [key]);

  const value = useMemo<Scope>(() => ({
    ready: set !== null,
    has: (id) => set?.has(id) ?? false,
    pending,
    path,
    locale,
    toggle: (id) => start(async () => {
      /*
        IYIMSER CEVIRME: sunucu cevabini beklemeden kalp doluyor.
        Tiklama ile dolus arasinda bir ag gidis-donusu beklemek,
        kullanicinin ikinci kez tiklamasina ve favoriyi geri silmesine
        yol aciyordu.
      */
      setSet((prev) => {
        const next = new Set(prev ?? []);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
      const fd = new FormData();
      fd.set('sitterId', id);
      fd.set('path', path);
      await toggleFavouriteAction(fd);
    }),
  }), [set, pending, path, locale]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Kapsam icindeki tek kalp. Kapsam yoksa ya da durum bilinmiyorsa cizilmez. */
export function FavouriteHeart({ sitterId }: { sitterId: string }) {
  const scope = useContext(Ctx);
  if (!scope || !scope.ready) return null;

  const m = getMessages(scope.locale);
  const on = scope.has(sitterId);
  const label = on ? m.favourites.remove : m.favourites.add;

  return (
    <button
      type="button"
      className={`fav-btn${on ? ' is-on' : ''}`}
      title={label}
      aria-label={label}
      onClick={() => scope.toggle(sitterId)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
        fill={on ? 'currentColor' : 'none'}
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 20.3s-7.5-4.6-7.5-9.6a4.3 4.3 0 0 1 7.5-2.9 4.3 4.3 0 0 1 7.5 2.9c0 5-7.5 9.6-7.5 9.6Z" />
      </svg>
    </button>
  );
}
