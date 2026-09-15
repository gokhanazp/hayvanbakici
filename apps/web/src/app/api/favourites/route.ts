import { getSession } from '@/lib/auth';
import { favouriteIds } from '@/lib/data';
import { readAnonFavourites } from '@/lib/favourites';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * "BU BAKICI FAVORIMDE MI?" — tek bakici, tek cevap.
 *
 * NEDEN VAR: bakici profili ISR ile onbellege aliniyor (saatte bir
 * uretiliyor, bkz. sitter/[slug]/page.tsx). Kalbi sunucuda cizmek icin
 * cerez okumak gerekir, cerez okuyan sayfa da onbellege alinamaz — tek
 * bir kalp ugruna profil sayfalarinin statik uretimini kaybederdik.
 * Kalp bu yuzden istemci tarafinda durumunu soruyor.
 *
 * NEDEN TUM LISTE DEGIL: kullanicinin favori listesinin tamami, sorulan
 * soruya gore fazla veri. Soru "bu bakici" ise cevap da "evet/hayir"
 * olmali.
 *
 * Yanit ONBELLEGE ALINMAZ: kisiye ozel.
 */
export async function GET(req: Request): Promise<Response> {
  const sitterId = new URL(req.url).searchParams.get('sitter') ?? '';
  if (!sitterId) return Response.json({ error: 'missing_sitter' }, { status: 400 });

  const session = await getSession();
  const isFavourite = session
    ? (await favouriteIds(session.user.id)).has(sitterId)
    : (await readAnonFavourites()).includes(sitterId);

  return Response.json({ isFavourite }, {
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
