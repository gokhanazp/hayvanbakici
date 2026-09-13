import { headers } from 'next/headers';
import { getDb, consentRecords } from '@havre/db';
import { isLocale } from '@havre/i18n';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Bu surumun riza metni degisirse artir — eski riza gecersiz olur. */
const CONSENT_VERSION = '2026-09-1';

const ALLOWED = new Set([
  'cookies_analytics', 'cookies_marketing', 'email_marketing', 'sms_marketing',
  'tos_language', 'data_transfer_outside_quebec',
]);

/**
 * RIZA KAYDI.
 *
 * CASL: pazarlama izninin ispat yuku BIZDE — kimin, ne zaman, hangi metne,
 * hangi dilde onay verdigi kayit altinda olmali. Law 25 ayrica rizanin hangi
 * DILDE sunuldugunu istiyor.
 *
 * Adli sicil ve biyometrik riza BU UC NOKTADAN GECMEZ: onlar onboarding
 * akisinda, ayri ve acik bir ekranla aliniyor.
 */
export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const type = typeof b.type === 'string' ? b.type : '';
  const granted = b.granted === true;
  const localeShown = typeof b.localeShown === 'string' && isLocale(b.localeShown)
    ? b.localeShown
    : 'en-CA';

  if (!ALLOWED.has(type)) {
    return Response.json({ error: 'unknown_consent_type' }, { status: 400 });
  }

  const session = await getSession();
  const h = await headers();

  await getDb().insert(consentRecords).values({
    userId: session?.user.id ?? null,
    // Giris yapmamis ziyaretci: cerez rizasi hesap acilmadan once de alinir
    anonymousId: session ? null : (h.get('x-havre-anon') ?? null),
    type: type as 'email_marketing',
    granted,
    localeShown,
    version: CONSENT_VERSION,
    // IP yalnizca ispat icin; profilleme amaciyla kullanilmaz.
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    userAgent: h.get('user-agent') ?? null,
  });

  return Response.json({ ok: true });
}
