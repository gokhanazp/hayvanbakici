import Image from 'next/image';
import { PHOTOS, photoSrc, type PhotoId } from '@/lib/photos';
import type { Locale } from '@havre/i18n';

/**
 * Kayitli bir fotograf yuvasini basar.
 *
 * NEDEN next/image: olculer kayittan geldigi icin tarayici yeri ONCEDEN
 * ayirir (CLS yok), AVIF/WebP'ye donusturur ve `sizes` ile telefona 1600px
 * gondermez. Ham <img> kullanan ilk denemede galeri yuklenirken sayfa
 * ziplyordu.
 *
 * ALTERNATIF METIN kayitta ve iki dilde — JSX'te unutulamaz. Dekoratif
 * kullanimda `decorative` ile bos alt verilir (WCAG 1.1.1: susleme amacli
 * gorsel ekran okuyucuya okunmamali).
 */
export function Photo({
  id, locale, className, sizes, priority = false, decorative = false, alt,
}: {
  id: PhotoId;
  locale: Locale;
  className?: string | undefined;
  sizes?: string | undefined;
  priority?: boolean | undefined;
  decorative?: boolean | undefined;
  alt?: string | undefined;
}) {
  const spec = PHOTOS[id];
  return (
    <Image
      src={photoSrc(id)}
      alt={decorative ? '' : (alt ?? spec.alt[locale])}
      width={spec.width}
      height={spec.height}
      sizes={sizes ?? '100vw'}
      priority={priority}
      className={className}
    />
  );
}
