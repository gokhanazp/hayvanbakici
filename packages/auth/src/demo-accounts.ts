/**
 * DEMO HESAPLARI — YALNIZCA TOHUM VERIYLE DOLU BIR DEMO ICIN.
 *
 * Demo yayininda ziyaretcinin (ve senin) kayit akisini beklemeden
 * icerini gezebilmesi gerekiyor: e-posta saglayicisi dogrulanmis bir
 * alan adi olmadan yalnizca kendi adresine mail atabiliyor, yani
 * "kayit ol" yolu demoyu gezmek icin tikaniyor.
 *
 * BU BETIK NE YAPIYOR: iki UYDURMA hesaba (bir sahip, bir bakici)
 * parola tanimliyor. Parola koda YAZILMIYOR, ortam degiskeninden
 * geliyor (DEMO_LOGIN_PASSWORD) ve uygulama tarafinda yalnizca sunucu
 * okuyor — tarayiciya hicbir zaman gitmiyor.
 *
 * NEDEN GUVENLI: secilen hesaplar `@seed.havre.test` adresli, yani
 * RFC 2606 ile ayrilmis, gercek olmasi MUMKUN OLMAYAN adresler. Ustelik
 * betik yalnizca bu adreslerde calisiyor; yanlislikla gercek bir
 * kullaniciya parola tanimlamasi mumkun degil.
 *
 * Calistirma:
 *   DEMO_LOGIN_PASSWORD=... npm run demo:accounts
 */
import { eq, sql } from 'drizzle-orm';
import { getDb, users, pickDemoAccounts, isSeedAddress } from '@havre/db';
import { getAuth } from './server.js';

async function main(): Promise<void> {
  const password = process.env.DEMO_LOGIN_PASSWORD;
  if (!password || password.length < 12) {
    console.error('\n✗ DEMO_LOGIN_PASSWORD tanimli degil (en az 12 karakter).\n' +
      '  Uretmek icin: openssl rand -base64 24\n');
    process.exit(1);
  }

  const db = getDb();
  const auth = getAuth();
  const ctx = await auth.$context;

  /*
    HANGI HESAPLAR: secim tek bir yerde tanimli (packages/db queries/demo).
    Uygulamadaki "demo olarak gir" ucu da ayni secimi okuyor; iki ayri
    sorgu olsaydi biri digerinin secmedigi hesaba parola tanimlardi.
  */
  const picked = await pickDemoAccounts(db);
  const targets = [
    { role: 'sahip', email: picked.ownerEmail },
    { role: 'bakici', email: picked.sitterEmail },
  ];

  for (const { role, email } of targets) {
    if (!email) {
      console.error(`✗ ${role} icin tohum hesabi bulunamadi — once: npm run db:seed`);
      process.exit(1);
    }
    if (!isSeedAddress(email)) {
      console.error(`✗ GUVENLIK: ${email} bir tohum adresi degil. Iptal.`);
      process.exit(1);
    }
    const rows = await db.execute(sql`SELECT id::text FROM users WHERE email = ${email} LIMIT 1`);
    const row = (rows as unknown as Array<{ id: string }>)[0];
    if (!row) { console.error(`✗ ${email} bulunamadi`); process.exit(1); }

    const hash = await ctx.password.hash(password);
    const existing = await db.execute(sql`
      SELECT id FROM accounts WHERE user_id = ${row.id}::uuid AND provider_id = 'credential' LIMIT 1
    `);
    if ((existing as unknown as unknown[]).length > 0) {
      await db.execute(sql`
        UPDATE accounts SET password = ${hash}, updated_at = now()
        WHERE user_id = ${row.id}::uuid AND provider_id = 'credential'
      `);
    } else {
      await db.execute(sql`
        INSERT INTO accounts (id, account_id, provider_id, user_id, password, created_at, updated_at)
        VALUES (gen_random_uuid(), ${row.id}, 'credential', ${row.id}::uuid, ${hash}, now(), now())
      `);
    }
    // Dogrulanmamis e-posta giris akisini kesiyor; bu hesaplar uydurma.
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, row.id));
    console.log(`✓ ${role}: ${email}`);
  }

  console.log('\nDemo girisi hazir. Uygulamada DEMO_MODE=1 ve ayni DEMO_LOGIN_PASSWORD gerekiyor.\n');
  process.exit(0);
}

void main();
