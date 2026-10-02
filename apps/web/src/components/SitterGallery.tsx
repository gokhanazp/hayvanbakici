import Image from 'next/image';
import { getMessages, interpolate, type Locale } from '@havre/i18n';
import { resolvePhoto } from '@/lib/photos';

/**
 * BAKICININ EV FOTOGRAFLARI.
 *
 * Fotograf yoksa bolum HIC CIKMAZ — "fotograf eklenmemis" diyen bos bir
 * kutu, bakicinin aleyhine calisan bir bosluk olurdu.
 *
 * REFERANSTAKI DUZEN: gorunur bir baslik, yaninda kac fotograf oldugu,
 * bes karolu bir bento ve sonuncunun uzerinde "+N daha". Bizde baslik
 * EKRAN OKUYUCUYA OZELDI (sr-only), yalnizca uc fotograf ciziliyordu ve
 * kac tane oldugu hic yazmiyordu.
 *
 * ALTYAZI = BAKICININ KENDI YAZDIGI ACIKLAMA. Referansta fotograflarin
 * uzerinde birer cumle var ("Daily pack walk at Trinity Bellwoods").
 * Bizde o cumle zaten `alt` olarak duruyordu; artik GORUNUR de. Ayni
 * metni hem altyazi hem alt olarak vermek ekran okuyucuya iki kez
 * okutur, o yuzden altyazisi olan karoda `alt` bos birakiliyor
 * (figure/figcaption duzeni). Aciklama yazmamis bakicinin fotografinda
 * altyazi hic cizilmiyor ve alt metni genel ama DOGRU bir ifade
 * oluyor — uydurma detay yazmiyoruz.
 */
const MAX_TILES = 5;

export function SitterGallery({
  locale, photos, name,
}: {
  locale: Locale;
  photos: Array<{ url: string; alt: string | null }>;
  name: string;
}) {
  const usable = photos.map((p) => ({ ...p, src: resolvePhoto(p.url) })).filter((p) => p.src);
  if (usable.length === 0) return null;
  const m = getMessages(locale);
  const fallbackAlt = locale === 'fr-CA' ? `Le domicile de ${name}` : `${name}’s home`;

  const tiles = usable.slice(0, MAX_TILES);
  const hidden = usable.length - tiles.length;

  return (
    <section className="sp-gal">
      <div className="sp-gal-head">
        <h2 className="sp-gal-h">{m.sitter.galleryHeading}</h2>
        <span className="sp-gal-count tabular">
          {interpolate(m.sitter.galleryCount, { count: usable.length })}
        </span>
      </div>

      <div className="sitter-gallery" data-count={Math.min(tiles.length, MAX_TILES)}>
        {tiles.map((p, i) => {
          const last = i === tiles.length - 1 && hidden > 0;
          return (
            <figure key={p.url + i} className="photo-frame">
              <Image
                src={p.src!}
                alt={p.alt ? '' : fallbackAlt}
                width={1200}
                height={800}
                sizes={i === 0 ? '(min-width: 1000px) 44rem, 100vw' : '(min-width: 1000px) 20rem, 50vw'}
                priority={i === 0}
              />
              {p.alt && <figcaption className="sp-gal-cap">{p.alt}</figcaption>}
              {/*
                "+N daha" bir DUGME DEGIL: acacak bir isik kutusu yok ve
                calismayan bir dugme koymaktansa sayiyi soylemek dogru.
                Fotograflarin tamami bu sayfada degil; kalanlar bakici
                paneline yuklenmis olanlar.
              */}
              {last && (
                <span className="sp-gal-more" aria-hidden="true">
                  +{hidden}
                </span>
              )}
            </figure>
          );
        })}
      </div>
    </section>
  );
}
