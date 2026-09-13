import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { getDb, users, sessions, accounts, profiles } from '@havre/db';
import { createAuth } from './server.js';
import type { Mailer, OutgoingEmail } from './mail.js';
import { checkPassword } from './password.js';

/**
 * BU TESTLER GERCEK VERITABANINA YAZIYOR.
 *
 * Sahte adapter ile test etmek burada ise yaramaz: dogrulamak istedigimiz sey
 * tam olarak kutuphanenin BIZIM sema ile konusabilmesi — uuid birincil
 * anahtarlar, auth_verification tablo adi, users tablosundaki ek sutunlar.
 * Bellek adapter'i bu uc seyin hicbirini kirmaz, uretim ise kirardi.
 */

class CapturingMailer implements Mailer {
  readonly name = 'test';
  sent: OutgoingEmail[] = [];
  async send(email: OutgoingEmail): Promise<void> {
    this.sent.push(email);
  }
  last(): OutgoingEmail {
    const e = this.sent[this.sent.length - 1];
    if (!e) throw new Error('hic e-posta gonderilmedi');
    return e;
  }
  urlFromLast(): string {
    const m = this.last().text.match(/https?:\/\/\S+/);
    if (!m) throw new Error('e-postada baglanti yok');
    return m[0];
  }
  clear(): void {
    this.sent = [];
  }
}

const db = getDb();
const mailer = new CapturingMailer();
const auth = createAuth({
  db,
  mailer,
  env: {
    NEXT_PUBLIC_SITE_URL: 'http://localhost:3000',
    BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-1234',
    NODE_ENV: 'test',
  } as NodeJS.ProcessEnv,
});

const EMAIL = `test-${Date.now()}@havre-test.ca`;
const PASSWORD = 'kanada-kedi-kopek-2026';

async function cleanup(): Promise<void> {
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.email, EMAIL));
  for (const r of rows) {
    await db.delete(sessions).where(eq(sessions.userId, r.id));
    await db.delete(accounts).where(eq(accounts.userId, r.id));
    await db.delete(profiles).where(eq(profiles.userId, r.id));
    await db.delete(users).where(eq(users.id, r.id));
  }
}

beforeAll(cleanup);
afterAll(cleanup);

describe('sifre kurallari', () => {
  it('kisa sifreyi reddeder', () => {
    expect(checkPassword('kisa')).toContain('too_short');
  });
  it('yaygin sifreyi reddeder, rakam eklenmis olsa bile', () => {
    expect(checkPassword('password123')).toContain('common');
    expect(checkPassword('montreal2026')).toContain('common');
  });
  it('e-posta adresini iceren sifreyi reddeder', () => {
    expect(checkPassword('gokhanyildirim-abc', 'gokhanyildirim@example.com'))
      .toContain('contains_email');
  });
  it('iyi bir sifreyi kabul eder', () => {
    expect(checkPassword(PASSWORD, EMAIL)).toEqual([]);
  });
});

describe('e-posta + sifre akisi', () => {
  let userId = '';

  it('kayit olur, profil satiri acilir ve dogrulama e-postasi gider', async () => {
    mailer.clear();
    const res = await auth.api.signUpEmail({
      body: { email: EMAIL, password: PASSWORD, name: 'Camille Bourque' },
    });
    expect(res.user.email).toBe(EMAIL);
    userId = res.user.id;

    // uuid uretiliyor mu — kutuphanenin kendi string id'si degil
    expect(userId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    expect(profile?.firstName).toBe('Camille');
    // Gizlilik kurali: yalnizca soyadi bas harfi
    expect(profile?.lastNameInitial).toBe('B');

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.last().to).toBe(EMAIL);
    expect(mailer.last().locale).toBe('en-CA');
  });

  it('dogrulanmadan giris YAPILAMAZ', async () => {
    await expect(
      auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD } }),
    ).rejects.toThrow();
  });

  it('dogrulama baglantisi emailVerified ve emailVerifiedAt alanlarini birlikte yazar', async () => {
    const url = new URL(mailer.urlFromLast());
    const token = url.searchParams.get('token');
    expect(token).toBeTruthy();

    await auth.api.verifyEmail({ query: { token: token as string } });

    const [u] = await db.select().from(users).where(eq(users.id, userId));
    expect(u?.emailVerified).toBe(true);
    expect(u?.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('dogrulamadan sonra giris yapilir ve oturum VERITABANINA yazilir', async () => {
    const res = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD } });
    expect(res.user.email).toBe(EMAIL);

    const rows = await db.select().from(sessions).where(eq(sessions.userId, userId));
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('yanlis sifre reddedilir', async () => {
    await expect(
      auth.api.signInEmail({ body: { email: EMAIL, password: 'yanlis-sifre-12345' } }),
    ).rejects.toThrow();
  });

  it('sifre sifirlama e-postasi kullanicinin dilinde gider', async () => {
    await db.update(users).set({ locale: 'fr-CA' }).where(eq(users.id, userId));
    mailer.clear();

    await auth.api.requestPasswordReset({
      body: { email: EMAIL, redirectTo: '/fr/compte/nouveau-mot-de-passe' },
    });

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.last().locale).toBe('fr-CA');
    // Bill 96: Fransizca surum gercekten Fransizca olmali, EN metnin kopyasi degil
    expect(mailer.last().subject).toContain('mot de passe');
    expect(mailer.last().html).toContain('lang="fr-CA"');
  });

  it('sihirli baglanti jetonu veritabaninda DUZ METIN durmaz', async () => {
    mailer.clear();
    await auth.api.signInMagicLink({
      body: { email: EMAIL, callbackURL: '/fr/compte' },
      headers: new Headers({ 'x-forwarded-for': '127.0.0.1' }),
    });

    const url = new URL(mailer.urlFromLast());
    const token = url.searchParams.get('token');
    expect(token).toBeTruthy();

    const rows = await db.select().from(
      (await import('@havre/db')).authVerifications,
    );
    const plain = rows.find((r) => r.value === token);
    expect(plain).toBeUndefined();
  });
});
