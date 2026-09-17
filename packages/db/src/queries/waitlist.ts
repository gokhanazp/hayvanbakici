import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';

export type WaitlistError = 'invalid_email' | 'unknown_city' | 'rate_limited';
export type WaitlistResult = { ok: true } | { ok: false; error: WaitlistError };

/** En fazla kac kayit, saatte, ayni IP'siz ortamda ayni sehir icin. */
const CITY_HOURLY_LIMIT = 200;

/*
  E-POSTA DOGRULAMASI BILEREK GEVSEK.

  Tek amac acik sacma girdiyi elemek. RFC 5322'yi tam uygulayan bir
  duzenli ifade, gecerli adresleri de reddetmesiyle unludur ve burada
  kaybedilen her adres bir kullanicinin haber alamamasi demek. Gercek
  dogrulama zaten ilk e-postanin ulasip ulasmamasiyla olacak.
*/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function joinWaitlist(
  db: Database,
  input: { email: string; citySlug: string; serviceType: string; locale: string },
): Promise<WaitlistResult> {
  const email = input.email.trim().toLowerCase().slice(0, 254);
  if (!EMAIL.test(email)) return { ok: false, error: 'invalid_email' };

  return withDbErrors(async () => {
    const cityRows = await db.execute<{ id: string }>(sql`
      SELECT id FROM cities WHERE slug_en = ${input.citySlug} OR slug_fr = ${input.citySlug} LIMIT 1
    `) as unknown as Array<{ id: string }>;
    const cityId = cityRows[0]?.id;
    if (!cityId) return { ok: false, error: 'unknown_city' as const };

    /* Kaba bir tavan: bir sehir icin saatte bu kadar yeni kayit gelmesi
       gercek ilgi degil, otomatik gonderimdir. */
    const burst = await db.execute<{ n: number }>(sql`
      SELECT count(*)::int AS n FROM waitlist_signups
      WHERE city_id = ${cityId} AND created_at > now() - interval '1 hour'
    `) as unknown as Array<{ n: number }>;
    if ((burst[0]?.n ?? 0) >= CITY_HOURLY_LIMIT) {
      return { ok: false, error: 'rate_limited' as const };
    }

    /* Ayni kisi iki kez basarsa hata degil: ayni kayit. */
    await db.execute(sql`
      INSERT INTO waitlist_signups (email, city_id, service_type, locale)
      VALUES (${email}, ${cityId}, ${input.serviceType}::service_type, ${input.locale}::locale)
      ON CONFLICT (email, city_id, service_type) DO NOTHING
    `);
    return { ok: true as const };
  });
}
