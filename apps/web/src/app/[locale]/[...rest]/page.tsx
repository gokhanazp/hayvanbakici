import { notFound } from 'next/navigation';

/**
 * ESLESMEYEN HER ADRES — SADECE 404 ATMAK ICIN.
 *
 * NEDEN BOYLE BIR DOSYA GEREKTI: `not-found.tsx` yalnizca EŞLEŞEN bir
 * rotanin icinden `notFound()` cagrildiginda devreye giriyor. Hicbir
 * rotayla eslesmeyen bir adres (/en/olmayan-sayfa/) ise `[locale]`
 * segmentine hic girmiyor; Next kok sinira dusuyor ve orada markasiz,
 * tek dilli varsayilan ekran ciziliyor.
 *
 * Bu yakala-hepsini rotasi adresi `[locale]` agacinin ICINE sokuyor:
 * duzen calisiyor (baslik, alt bilgi, fontlar, CSS), `notFound()`
 * atiliyor ve `[locale]/not-found.tsx` dogru dilde ciziliyor.
 *
 * GERCEK ROTALARI GOLGELEMEZ: Next'te oncelik sirasi statik > dinamik >
 * yakala-hepsini. `[city]/[service]` ve `[city]/sitter/[slug]` bundan
 * once eslesiyor (dogrulandi).
 */
export const dynamic = 'force-dynamic';

export default function CatchAllNotFound(): never {
  notFound();
}
