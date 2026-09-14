import Image from 'next/image';
import { resolvePhoto } from '@/lib/photos';

/**
 * KISI FOTOGRAFI — fotograf varsa fotograf, yoksa bas harfler.
 *
 * Bas harf geri donusu sart: bir bakici fotograf yuklemeden once de
 * profili gorunur, yorum yazan sahiplerin cogunun fotografi hic olmayacak.
 * Bos gri daire yerine bas harf, listeyi okunur tutuyor.
 *
 * Fotograflar kare kirpilir (object-fit: cover) — portre/manzara karisimi
 * bir listede farkli oranlar satiri bozuyordu.
 */
export function Avatar({
  src, initials, size = 44, className,
}: {
  src?: string | null | undefined;
  initials: string;
  size?: number | undefined;
  className?: string | undefined;
}) {
  const url = resolvePhoto(src);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (!url) {
    return (
      <span className={`avatar avatar-initials${className ? ` ${className}` : ''}`} style={style} aria-hidden="true">
        {initials}
      </span>
    );
  }

  return (
    <span className={`avatar${className ? ` ${className}` : ''}`} style={style}>
      {/* Dekoratif: adi zaten yaninda yaziyor, ekran okuyucu iki kez okumasin */}
      <Image src={url} alt="" width={size * 2} height={size * 2} sizes={`${size}px`} />
    </span>
  );
}
