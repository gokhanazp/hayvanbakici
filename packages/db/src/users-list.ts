/**
 * YEREL HESAPLARI LISTELER.
 *
 *   npm run db:users
 *
 * NEDEN VAR: "e-posta ve sifre eslesmiyor" hatasi uc ayri seyin ayni
 * cumlesi — hesap hic yok, sifre yanlis, ya da hesap sifresiz acilmis
 * (sihirli baglanti). Hangisi oldugunu gormeden tahmin yurutmek
 * gereksiz tur attiriyor.
 *
 * SIFRE GOSTERILMIYOR ve gosterilemez: veritabaninda yalnizca ozet
 * (hash) duruyor. Bu komut "sifre var mi" sorusunu cevapliyor,
 * "sifre ne" sorusunu degil.
 *
 * Tohum hesaplari (@seed.havre.test) listede yok: yuzlerce tane var
 * ve hicbiri aranmiyor.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL ?? '', { max: 1 });
const db = drizzle(client);

const rows = (await db.execute(sql`
  SELECT u.email,
         u.role::text AS role,
         u.email_verified,
         u.created_at,
         EXISTS (
           SELECT 1 FROM accounts a
           WHERE a.user_id = u.id AND a.provider_id = 'credential' AND a.password IS NOT NULL
         ) AS has_password
  FROM users u
  /* Tohum (@seed.havre.test) ve otomatik test (@havre-test.ca) hesaplari
     disarida: ikisi de yuzlerce tane ve hicbiri aranmiyor. */
  WHERE u.email NOT LIKE '%@seed.havre.test'
    AND u.email NOT LIKE '%@havre-test.ca'
    AND u.email NOT LIKE '%@example.test'
  ORDER BY u.created_at DESC
  LIMIT 30
`)) as unknown as Array<{
  email: string; role: string; email_verified: boolean;
  created_at: Date; has_password: boolean;
}>;

if (rows.length === 0) {
  console.log('Kendi actigin hic hesap yok.\n');
  console.log('Kayit ol: http://localhost:3000/en/account/sign-up/');
} else {
  console.log(`${rows.length} hesap:\n`);
  for (const r of rows) {
    const flags = [
      r.role === 'admin' ? 'YONETICI' : r.role,
      r.email_verified ? 'dogrulanmis' : 'DOGRULANMAMIS',
      r.has_password ? 'sifreli' : 'SIFRESIZ (sihirli baglanti)',
    ];
    console.log(`  ${r.email}`);
    console.log(`     ${flags.join(' · ')}`);
  }
  console.log('');
  console.log('DOGRULANMAMIS  : sifreyle giris kapali. /en/account/dev-inbox/ adresinden');
  console.log('                 dogrulama baglantisina tikla.');
  console.log('SIFRESIZ       : hesapta sifre yok. Sifreyle degil sihirli baglantiyla');
  console.log('                 girilir; sifre istiyorsan "sifremi unuttum" ile kur.');
  console.log('yonetici yapmak: npm run admin:grant -- <e-posta>');
}

await client.end();
