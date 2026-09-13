import { cache } from 'react';
import { headers } from 'next/headers';
import { getAuth, enabledProviders } from '@havre/auth';

/**
 * Sunucu bileseninden oturumu okur.
 *
 * cache() ile sarili: ayni istek icinde kac kez cagrilirsa cagrilsin
 * veritabanina tek sorgu gider (layout + sayfa + bilesen hepsi soruyor).
 */
export const getSession = cache(async () => {
  const auth = getAuth();
  return auth.api.getSession({ headers: await headers() });
});

export type Session = Awaited<ReturnType<typeof getSession>>;

/** Hangi sosyal giris dugmelerinin cizilecegi — anahtar yoksa dugme de yok. */
export function providers() {
  return enabledProviders();
}
