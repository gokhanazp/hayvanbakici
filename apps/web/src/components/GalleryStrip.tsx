import { getMessages, type Locale } from '@havre/i18n';
import { PetTile } from '@/components/PetTile';

/**
 * "HAVRE ANLARI" — rezervasyon sirasinda paylasilan fotograflar.
 *
 * BUGUN BOS: gercek rezervasyon yok, dolayisiyla gercek fotograf da yok.
 * Stok fotografla doldurup "topluluğumuzun anlari" demek uydurma sosyal
 * kanit olurdu; onun yerine kendi cizimlerimiz duruyor ve bunun gecici
 * oldugu sayfada ACIKCA yaziyor.
 *
 * FOTOGRAFA GECIS: `photos` dolu geldiginde cizimler hic ciziyor.
 * KURAL — yalnizca sahibin acikca izin verdigi fotograflar yayimlanir
 * (Law 25 / PIPEDA; riza consent_records tablosunda kayitli olmali).
 */

export interface GalleryPhoto {
  id: string;
  url: string;
  /** Ekran okuyucu icin: "Sokakta bekleyen Dino" gibi */
  alt: string;
  petName?: string | undefined;
  caption?: string | undefined;
}

/** Masonry hissi: karolar farkli oranlarda. Sabit sira — her yenilemede
 *  degisen bir duzen goze huzursuzluk veriyor. */
const PLACEHOLDERS = [
  { variant: 'dog', tint: 0, ratio: 1.32 },
  { variant: 'paws', tint: 2, ratio: 0.86 },
  { variant: 'cat', tint: 1, ratio: 1.18 },
  { variant: 'heart', tint: 3, ratio: 1.0 },
  { variant: 'cat', tint: 2, ratio: 1.34 },
  { variant: 'dog', tint: 3, ratio: 1.12 },
  { variant: 'heart', tint: 0, ratio: 0.92 },
  { variant: 'paws', tint: 1, ratio: 1.26 },
] as const;

export function GalleryStrip({
  locale,
  photos = [],
}: {
  locale: Locale;
  photos?: GalleryPhoto[] | undefined;
}) {
  const m = getMessages(locale);
  const hasPhotos = photos.length > 0;

  return (
    <section className="container section">
      <span className="badge" style={{
        background: 'var(--color-primary-subtle)',
        color: 'var(--color-primary-active)',
      }}>
        {m.gallery.eyebrow}
      </span>

      <h2 className="text-h1" style={{ margin: 'var(--space-4) 0 var(--space-3)' }}>
        {m.gallery.title}
      </h2>
      <p className="text-body-lg muted" style={{ maxWidth: '34rem', textWrap: 'pretty' }}>
        {m.gallery.subtitle}
      </p>

      <div className="gallery-masonry" style={{ marginTop: 'var(--space-8)' }}>
        {hasPhotos
          ? photos.map((p) => (
              <figure key={p.id} className="gallery-item">
                {/* eslint-disable-next-line @next/next/no-img-element -- kaynak
                    kullanici yuklemesi; boyutlar onceden bilinmiyor */}
                <img src={p.url} alt={p.alt} className="gallery-photo" loading="lazy" />
                {p.petName && (
                  <figcaption className="gallery-caption">
                    <span className="gallery-caption-name">{p.petName}</span>
                    {p.caption && <span className="gallery-caption-text">{p.caption}</span>}
                  </figcaption>
                )}
              </figure>
            ))
          : PLACEHOLDERS.map((t, i) => (
              <div key={i} className="gallery-item">
                <PetTile variant={t.variant} tint={t.tint} ratio={t.ratio} />
              </div>
            ))}
      </div>

      {!hasPhotos && (
        <p className="field-hint" style={{ marginTop: 'var(--space-5)' }}>
          {m.gallery.placeholderNote}
        </p>
      )}
    </section>
  );
}
