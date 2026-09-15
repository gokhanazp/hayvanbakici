import Image from 'next/image';
import { getMessages, type Locale } from '@havre/i18n';
import { resolvePhoto } from '@/lib/photos';

/**
 * BAKICININ EV FOTOGRAFLARI.
 *
 * Fotograf yoksa bolum HIC CIKMAZ — "fotograf eklenmemis" diyen bos bir
 * kutu, bakicinin aleyhine calisan bir bosluk olurdu.
 *
 * Ilk fotograf buyuk, digerleri yaninda kucuk: sahibin gordugu ilk sey
 * hayvanin kalacagi yer olsun. Alternatif metin bakicinin kendi yazdigi
 * aciklama; yoksa genel ama dogru bir ifade (uydurma detay yazmiyoruz).
 */
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

  return (
    <section>
      {/*
        Galerinin kendi basligi. "The home" DEGIL: asagida ayni metni
        tasiyan bir bolum var ve ekran okuyucu ayni basligi iki kez
        okuyordu — kullanici iki ayri bolum sandi.
      */}
      <h2 className="sr-only">{m.sitter.galleryHeading}</h2>
      <div className="sitter-gallery" data-count={Math.min(usable.length, 3)}>
        {usable.slice(0, 3).map((p, i) => (
          <div key={p.url + i} className="photo-frame">
            <Image
              src={p.src!}
              alt={p.alt ?? fallbackAlt}
              width={1200}
              height={800}
              sizes={i === 0 ? '(min-width: 1000px) 44rem, 100vw' : '(min-width: 1000px) 20rem, 50vw'}
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
