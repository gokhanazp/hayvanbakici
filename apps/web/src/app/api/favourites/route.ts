import { getSession } from '@/lib/auth';
import { favouriteIds } from '@/lib/data';
import { readAnonFavourites } from '@/lib/favourites';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * "BU BAKICILARDAN HANGILERI FAVORIMDE?"
 *
 * NEDEN VAR: sehir sayfasi ve bakici profili ISR ile onbellege aliniyor
 * (saatte bir uretiliyor). Kalbi sunucuda cizmek icin cerez okumak
 * gerekir, cerez okuyan sayfa da onbellege alinamaz — birkac kalp
 * ugruna sehir sayfalarinin statik uretimini kaybederdik. O sayfalarda
 * kalp durumunu buradan soruyor.
 *
 * NEDEN "TUM FAVORILERIM" DEGIL: cevap yalnizca SORULAN bakicilari
 * kapsiyor. Kullanicinin butun favori listesini dondurmek, sorulan
 * soruya gore fazla veri olurdu.
 *
 * TAVAN: bir sayfada en fazla bu kadar kart var; daha uzun bir liste
 * gonderen, sorusunu degil baska bir seyi soruyor demektir.
 */
const MAX_ASK = 60;

export async function GET(req: Request): Promise<Response> {
  const asked = new URL(req.url).searchParams.getAll('sitter').slice(0, MAX_ASK);
  if (asked.length === 0) return Response.json({ error: 'missing_sitter' }, { status: 400 });

  const session = await getSession();
  const mine = session
    ? await favouriteIds(session.user.id)
    : new Set(await readAnonFavourites());

  return Response.json(
    { favourites: asked.filter((id) => mine.has(id)) },
    /* Kisiye ozel — onbellege ALINMAZ. */
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
