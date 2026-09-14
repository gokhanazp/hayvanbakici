import { getSession } from '@/lib/auth';
import { conversationPing } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "Yeni bir sey var mi?" — acik yazismanin yoklama ucu.
 *
 * DONEN SEY ICERIK DEGIL, ZAMAN. Son mesajin zamani ve okunmamis
 * sayisi. Arayuz bunlari elindekiyle karsilastirip degisiklik varsa
 * sayfayi tazeliyor. Her yoklamada mesajlari gondermek, bu ucu
 * birkac kullanicidan sonra en pahali sorgumuz yapardi.
 *
 * Kimlik kontrolu sorgunun WHERE'inde: baskasinin konusmasinin id'si
 * yazilirsa cevap bos doner.
 */
export async function GET(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return Response.json({ lastAt: null, unread: 0 }, { headers: NO_STORE });

  const raw = new URL(req.url).searchParams.get('c') ?? '';
  const conversationId = UUID.test(raw) ? raw : undefined;

  const ping = await conversationPing(session.user.id, conversationId);
  return Response.json(ping, { headers: NO_STORE });
}

const NO_STORE = { 'Cache-Control': 'no-store, private' };
