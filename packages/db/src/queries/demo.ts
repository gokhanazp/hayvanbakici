import { sql } from 'drizzle-orm';
import { withDbErrors, type Database } from '../client.js';

/**
 * DEMO HESAPLARI — TEK TANIM.
 *
 * Hem parola tanimlayan betik (packages/auth demo-accounts) hem de
 * "demo olarak gir" ucu bu ayni secimi kullaniyor. Iki ayri sorgu
 * olsaydi biri digerinin secmedigi hesaba parola tanimlar ve giris
 * sessizce calismazdi.
 *
 * Secim kurali bilerek sabit: sahip icin tohumdaki degismeyen adres,
 * bakici icin adrese gore siralanmis ILK aktif bakici. Sirasiz bir
 * LIMIT 1, tohum her calistiginda baska bir hesap secebilirdi.
 */
export interface DemoAccounts {
  ownerEmail: string | null;
  sitterEmail: string | null;
}

const SEED_SUFFIX = '@seed.havre.test';

export async function pickDemoAccounts(db: Database): Promise<DemoAccounts> {
  return withDbErrors(async () => {
    const owner = await db.execute(sql`
      SELECT email FROM users WHERE email = ${'owner' + SEED_SUFFIX} LIMIT 1
    `);
    const sitter = await db.execute(sql`
      SELECT u.email
      FROM users u
      JOIN sitters s ON s.user_id = u.id
      WHERE u.email LIKE ${'%' + SEED_SUFFIX}
        AND s.slug IS NOT NULL AND s.status = 'active'
      ORDER BY u.email
      LIMIT 1
    `);
    const o = (owner as unknown as Array<{ email: string }>)[0];
    const s = (sitter as unknown as Array<{ email: string }>)[0];
    return {
      ownerEmail: o?.email ?? null,
      sitterEmail: s?.email ?? null,
    };
  });
}

/** Adres gercekten bir tohum adresi mi — parola tanimlamadan ONCE sorulur. */
export function isSeedAddress(email: string | null | undefined): boolean {
  return Boolean(email && email.endsWith(SEED_SUFFIX));
}
