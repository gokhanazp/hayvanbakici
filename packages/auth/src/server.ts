import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { getDb, users, sessions, accounts, authVerifications, profiles } from '@havre/db';
import { eq } from 'drizzle-orm';
import { DEFAULT_LOCALE, isLocale, type Locale } from '@havre/i18n';
import { createMailer, type Mailer } from './mail.js';
import { magicLinkEmail, resetPasswordEmail, verifyEmail } from './emails.js';

/**
 * KIMLIK DOGRULAMA SUNUCUSU.
 *
 * NEDEN BETTER AUTH: sifreli giris, e-posta dogrulama, sifre sifirlama ve
 * oturum iptali kutuphanenin kendisinde ve VERITABANI oturumlariyla calisiyor.
 * Auth.js v5 sifreli giriste JWT'ye zorluyor ve bu dort akisi bize yazdiriyor;
 * kimlik kodunu elle yazmak kacinilacak bir risk.
 *
 * VERI YERLESIMI: tum oturum, hesap ve jeton verisi BIZIM Postgres'imizde.
 * Ucuncu tarafa kisisel veri aktarimi yok -> Law 25 md. 17 degerlendirmesi
 * gerekmiyor, gizlilik politikasinda siniristi aktarim beyani gerekmiyor.
 */

export interface AuthDeps {
  db?: ReturnType<typeof getDb>;
  mailer?: Mailer;
  env?: NodeJS.ProcessEnv;
}

function siteUrl(env: NodeJS.ProcessEnv): string {
  return env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}

/**
 * Kullanicinin dili. Sosyal girislerde locale sutunu henuz bos olabilir,
 * o yuzden varsayilana dusuyoruz. E-posta YANLIS dilde gitmemeli: Quebec'te
 * bu Bill 96 ihlali, o yuzden kaynak users.locale — tarayici basligi degil.
 */
function localeOf(user: unknown): Locale {
  const v = (user as Record<string, unknown> | null)?.locale;
  return typeof v === 'string' && isLocale(v) ? v : DEFAULT_LOCALE;
}

/**
 * Sosyal saglayicilar yalnizca anahtarlari tanimliysa aciliyor.
 * Sebep: eksik anahtarla acilan bir saglayici, kullanici dugmeye bastiginda
 * bos bir hata sayfasi uretir. Yoksa dugme de gorunmez (bkz. enabledProviders).
 */
function socialProviders(env: NodeJS.ProcessEnv) {
  const out: Record<string, unknown> = {};

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    out.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }

  // Apple: clientSecret bir JWT'dir ve 6 ayda bir yenilenir (Apple siniri).
  // Uretimde bu jetonu uretip ortam degiskenine yazan bir is gerekiyor.
  if (env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET) {
    out.apple = {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
      appBundleIdentifier: env.APPLE_APP_BUNDLE_ID,
    };
  }

  return out as Parameters<typeof betterAuth>[0]['socialProviders'];
}

/** Arayuzun hangi dugmeleri cizecegini bilmesi icin — sunucu ve istemci ayni cevabi verir. */
export function enabledProviders(env: NodeJS.ProcessEnv = process.env) {
  return {
    google: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    apple: Boolean(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET),
  };
}

export function createAuth(deps: AuthDeps = {}) {
  const env = deps.env ?? process.env;
  const db = deps.db ?? getDb();
  const mailer = deps.mailer ?? createMailer(env);
  const base = siteUrl(env);

  const secret = env.BETTER_AUTH_SECRET;
  if (!secret && env.NODE_ENV === 'production') {
    throw new Error(
      'BETTER_AUTH_SECRET tanimli degil. Bu deger olmadan oturum cerezleri ' +
        'her yeniden baslatmada gecersiz olur ve imzalar dogrulanamaz. ' +
        'Uretmek icin: openssl rand -base64 32',
    );
  }

  return betterAuth({
    appName: 'Havre',
    baseURL: base,
    secret: secret ?? 'gelistirme-icin-sabit-anahtar-uretimde-kullanilamaz',

    database: drizzleAdapter(db, {
      provider: 'pg',
      // Anahtarlar kutuphanenin model adlari; degerler bizim Drizzle tablolarimiz.
      // "verification" bizim adli sicil `verifications` tablomuzla karismasin
      // diye auth_verification'a baglaniyor.
      schema: {
        user: users,
        session: sessions,
        account: accounts,
        verification: authVerifications,
      },
    }),

    advanced: {
      database: {
        // Tum tablolarda tek tip birincil anahtar: uuid.
        generateId: 'uuid',
      },
    },

    user: {
      additionalFields: {
        /** E-postalarin dogru dilde gitmesi icin oturum nesnesinde tasiniyor */
        locale: { type: 'string', required: false, input: false },
        /** 'owner' | 'sitter' | 'both' | 'admin' — yetki kontrolleri icin */
        role: { type: 'string', required: false, input: false },
      },
    },

    session: {
      /**
       * 30 gun, her 1 gunde bir tazeleniyor. Uzun olmasinin sebebi urun:
       * hayvan sahibi ayda bir kez rezervasyon yapiyor, her seferinde
       * yeniden giris istemek terk sebebi. Guvenlik tarafi oturum iptali
       * ve cihaz listesiyle dengeleniyor.
       */
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    emailAndPassword: {
      enabled: true,
      /**
       * Dogrulanmamis e-postayla giris YOK. Pazaryerinde kimlik dogrulamanin
       * ilk halkasi bu; dogrulanmamis adres hem sahte hesap hem de rezervasyon
       * bildirimlerinin ulasmamasi demek.
       */
      requireEmailVerification: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: false,
      /** Sifre degistiginde diger tum oturumlar dusuyor — hesap ele gecirme senaryosu */
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 60 * 60,
      sendResetPassword: async ({ user, url }) => {
        await mailer.send(resetPasswordEmail(user.email, url, localeOf(user)));
      },
    },

    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60,
      sendVerificationEmail: async ({ user, url }) => {
        await mailer.send(verifyEmail(user.email, url, localeOf(user)));
      },
      /**
       * Law 25 denetim izi: boolean "dogrulandi" yeterli degil, NE ZAMAN
       * dogrulandigi da lazim. Kutuphane emailVerified'i yaziyor, tarihi biz.
       */
      afterEmailVerification: async (user) => {
        await db
          .update(users)
          .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, user.id));
      },
    },

    socialProviders: socialProviders(env),

    plugins: [
      magicLink({
        expiresIn: 60 * 15,
        /** Jeton veritabaninda HASH'li duruyor — veritabani sizsa bile giris yapilamaz */
        storeToken: 'hashed',
        rateLimit: { window: 60, max: 3 },
        sendMagicLink: async ({ email, url }) => {
          const [row] = await db
            .select({ locale: users.locale })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          await mailer.send(magicLinkEmail(email, url, row ? localeOf(row) : DEFAULT_LOCALE));
        },
      }),
    ],

    databaseHooks: {
      user: {
        create: {
          /**
           * Her kullanici icin profil satiri aciliyor. Sosyal giriste ad
           * saglayicidan geliyor; gizlilik kurali geregi profillerde yalnizca
           * soyadinin BAS HARFI gosteriliyor (identity.ts'teki not).
           */
          after: async (user) => {
            const full = (user.name ?? '').trim();
            const parts = full.split(/\s+/).filter(Boolean);
            const firstName = parts[0] ?? '';
            const lastInitial = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';

            await db
              .insert(profiles)
              .values({
                userId: user.id,
                firstName,
                lastNameInitial: lastInitial.toUpperCase(),
                avatarUrl: user.image ?? null,
              })
              .onConflictDoNothing();
          },
        },
      },
    },

    /**
     * KALICI OLMAYAN rate limit — kutuphane bunu bellekte tutuyor.
     * Tek surecte yeterli; birden fazla sunucu ornegine cikildiginda
     * secondaryStorage (Redis) baglanmali, yoksa sinir ornek basina uygulanir.
     */
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60 * 60, max: 5 },
        '/forget-password': { window: 60 * 60, max: 5 },
        '/sign-in/magic-link': { window: 60, max: 3 },
      },
    },

    trustedOrigins: [base],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let _auth: Auth | null = null;

/** Tek ornek — her istekte yeniden kurmak veritabani havuzunu tuketirdi. */
export function getAuth(): Auth {
  _auth ??= createAuth();
  return _auth;
}
