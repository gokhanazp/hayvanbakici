import { createAuthClient } from 'better-auth/react';
import { magicLinkClient } from 'better-auth/client/plugins';

/**
 * TARAYICI ISTEMCISI.
 *
 * MOBIL UYUMU (Faz 4): ayni kutuphanenin better-auth/client girisi React
 * Native'de de calisiyor. Bu dosya React'e ozel; mobil kendi ince sarmalayicisini
 * yazacak ama SUNUCU tarafi (server.ts) aynen paylasiliyor. Yol haritasindaki
 * "web ve mobil uyumlu olmali" sarti kimlik katmaninda boyle karsilanryor.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL ?? undefined,
  plugins: [magicLinkClient()],
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
