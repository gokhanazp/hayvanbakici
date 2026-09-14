import { getStorage, safeKey } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * YUKLENEN GORSELLERI SUNAR.
 *
 * Neden bir rota, neden `public/` degil: `public/` klasoru depoya ait ve
 * dagitim sirasinda dondurulur; calisirken yazilan dosya oraya ait degil.
 * Ayrica bu rota, S3'e gecince dogrudan CDN adresine YONLENDIRMEYE
 * donusebilecek tek nokta.
 *
 * Anahtar disaridan geliyor: `safeKey` gecmeyen hicbir istek diske
 * inmiyor (yol kacisi).
 *
 * Adresler rastgele ve degismez; bu yuzden uzun onbellek guvenli.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key } = await params;
  const safe = safeKey(key.join('/'));
  if (!safe) return new Response('Not found', { status: 404 });

  const file = await getStorage().read(safe);
  if (!file) return new Response('Not found', { status: 404 });

  return new Response(new Uint8Array(file.body), {
    headers: {
      'Content-Type': file.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(file.body.byteLength),
    },
  });
}
