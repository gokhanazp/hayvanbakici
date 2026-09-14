import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';
import { isAdmin, recordAudit } from '@/lib/data';

/**
 * YONETICI KORUMASI.
 *
 * Yetkisiz kullaniciya 403 DEGIL 404 donuyoruz: "buraya giremezsiniz"
 * demek, buranin VAR OLDUGUNU soylemektir. Panelin adresini bilmeyen biri
 * icin /admin sadece olmayan bir sayfadir.
 *
 * Giris ekranina da yonlendirmiyoruz — yonetici olmayan birini giris
 * yapmaya davet etmenin anlami yok.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) notFound();
  if (!(await isAdmin(session.user.id))) notFound();
  return session;
}

/** Hassas bir listeyi/kaydi acan yonetici islemini kaydeder. */
export async function auditView(
  actorId: string, entity: string, entityId?: string | undefined,
): Promise<void> {
  const h = await headers();
  await recordAudit({
    actorId,
    action: 'admin.view',
    entity,
    ...(entityId ? { entityId } : {}),
    // Vekil sunucu arkasinda gercek IP bu baslikta gelir
    ...(h.get('x-forwarded-for') ? { ip: h.get('x-forwarded-for')! } : {}),
  });
}
