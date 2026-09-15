import { getSession } from '@/lib/auth';
import { listConversations } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * KONUSMA LISTESI — sohbet balonu icin.
 *
 * Ayni veriyi gelen kutusu sayfasi da gosteriyor; orada sunucu
 * bileseninden geliyor, burada JSON olarak. Sorgunun KENDISI tek:
 * `listConversations`. Iki ayri sorgu yazmak, bir gun ikisinin farkli
 * seyler gostermesi demekti.
 *
 * Adres cubugunda kimlik YOK: konusmalar oturumdan cikariliyor.
 */
export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return Response.json({ rows: [] }, { status: 401, headers: NO_STORE });

  const rows = await listConversations(session.user.id);
  return Response.json({ rows }, { headers: NO_STORE });
}

const NO_STORE = { 'Cache-Control': 'no-store, private' };
