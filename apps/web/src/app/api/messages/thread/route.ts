import { getSession } from '@/lib/auth';
import { getThread, markRead } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * TEK YAZISMA — sohbet balonu icin.
 *
 * ACINCA OKUNDU: balonda da sayfadaki kuralla ayni. Ayri bir "okundu"
 * ucu yazmadik; okundu isareti okumanin YAN ETKISI, kullanicinin
 * beyan etmesi gereken bir sey degil.
 *
 * Kimlik kontrolu `getThread`'in WHERE'inde: baskasinin konusmasinin
 * kimligi yazilirsa 404 doner, "yasak" degil — varligini da
 * soylemiyoruz.
 */
export async function GET(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return new Response('Unauthorized', { status: 401, headers: NO_STORE });

  const id = new URL(req.url).searchParams.get('c') ?? '';
  if (!UUID.test(id)) return new Response('Not found', { status: 404, headers: NO_STORE });

  const thread = await getThread(id, session.user.id);
  if (!thread) return new Response('Not found', { status: 404, headers: NO_STORE });

  await markRead(id, session.user.id);

  return Response.json({ thread }, { headers: NO_STORE });
}

const NO_STORE = { 'Cache-Control': 'no-store, private' };
