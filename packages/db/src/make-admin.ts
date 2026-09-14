/**
 * ILK YONETICIYI ACAN KOMUT.
 *
 *   npm run admin:grant -- kisi@ornek.com
 *
 * NEDEN ARAYUZDE DEGIL: "beni yonetici yap" dugmesi olan bir sitede o
 * dugmeye ulasan herkes yoneticidir. Ilk yonetici her zaman veritabanina
 * erisimi olan kisi tarafindan acilir; sonrakiler panelden verilir ve
 * her biri denetim kaydina yazilir.
 *
 * Bu komut kendi kaydini da audit_log'a yaziyor: "kim, ne zaman, hangi
 * hesaba yonetici yetkisi verdi" sorusunun cevabi komut satirinda
 * kaybolmamali.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

const email = process.argv[2]?.trim().toLowerCase();

if (!email || !email.includes('@')) {
  console.error('Kullanim: npm run admin:grant -- kisi@ornek.com');
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL ?? '', { max: 1 });
const db = drizzle(client);

const rows = await db.execute(sql`
  SELECT id::text, role::text, email FROM users WHERE lower(email) = ${email} LIMIT 1
`);
const user = (rows as unknown as Array<Record<string, unknown>>)[0];

if (!user) {
  console.error(`Boyle bir kullanici yok: ${email}`);
  console.error('Once siteden hesap acin (/en/account/sign-up/), sonra bu komutu calistirin.');
  await client.end();
  process.exit(1);
}

if (String(user.role) === 'admin') {
  console.log(`${user.email} zaten yonetici.`);
  await client.end();
  process.exit(0);
}

await db.execute(sql`
  UPDATE users SET role = 'admin', updated_at = now() WHERE id = ${String(user.id)}
`);

await db.execute(sql`
  INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
  VALUES (NULL, 'user.role', 'user', ${String(user.id)},
          ${JSON.stringify({ role: user.role })}::jsonb,
          ${JSON.stringify({ role: 'admin', reason: 'granted from the command line' })}::jsonb)
`);

console.log(`✓ ${user.email} artik yonetici. Panel: /admin`);
await client.end();
