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
  console.error(`Boyle bir kullanici yok: ${email}\n`);

  /*
    BENZERLERINI GOSTER.

    Bu komut bir kez yazilan bir e-postayla calisiyor ve tek bir yazim
    hatasi (sonuna kacan bir '~', eksik bir harf) "boyle bir kullanici
    yok" ile bitiyordu — dogru adresin ne oldugunu soylemeden. Yerel bir
    gelistirme aracinda cikmaz sokak birakmanin anlami yok.

    ONCE benzer adresler, sonra son acilan hesaplar. Tohum hesaplari
    (seed.havre.test) listeden cikariliyor: yuzlerce tane var ve hicbiri
    aranmiyor.
  */
  const local = email.split('@')[0] ?? email;
  const near = await db.execute(sql`
    SELECT email, role::text, created_at FROM users
    WHERE email NOT LIKE '%seed.havre.test'
      AND email ILIKE ${'%' + local.replace(/[\\%_]/g, (c) => '\\' + c) + '%'} ESCAPE '\\'
    ORDER BY created_at DESC LIMIT 5
  `);
  const nearRows = near as unknown as Array<Record<string, unknown>>;

  if (nearRows.length > 0) {
    console.error('Bunu mu demek istediniz?');
    for (const r of nearRows) console.error(`  ${r.email}${r.role === 'admin' ? '  (zaten yonetici)' : ''}`);
  } else {
    const recent = await db.execute(sql`
      SELECT email, role::text FROM users
      WHERE email NOT LIKE '%seed.havre.test'
      ORDER BY created_at DESC LIMIT 10
    `);
    const list = recent as unknown as Array<Record<string, unknown>>;
    if (list.length === 0) {
      console.error('Veritabaninda hic gercek hesap yok.');
      console.error('Once siteden hesap acin: /en/account/sign-up/');
    } else {
      console.error('Son acilan hesaplar:');
      for (const r of list) console.error(`  ${r.email}${r.role === 'admin' ? '  (zaten yonetici)' : ''}`);
    }
  }

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
