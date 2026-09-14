'use client';

import { useEffect, useState } from 'react';
import { authClient } from '@havre/auth/client';
import type { OnboardingStep } from '@havre/core';

export type SitterStatus = 'draft' | 'pending' | 'active' | 'deactivated' | null;

export interface SitterState {
  status: SitterStatus;
  /** Taslak basvuruda sirada duran adim — dugmeyi dogru yere baglamak icin */
  nextStep: OnboardingStep | null;
}

/*
  SAYFA BASINA TEK ISTEK.

  Bu durumu uc yer soruyor (baslik dugmesi, kahraman dugmeleri, alttaki
  cagri). Her biri kendi `fetch`'ini yapsaydi ayni cevap ic ice uc kez
  indirilirdi. Soz modul duzeyinde tutuluyor; oturum degisimi bu uygulamada
  tam sayfa gecisiyle oluyor (signOut sonrasi `location.assign`), dolayisiyla
  onbellek kendiliginden sifirlaniyor.
*/
let inflight: Promise<SitterState> | null = null;

function load(): Promise<SitterState> {
  inflight ??= fetch('/api/me', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : { sitter: null, nextStep: null }))
    .then((j) => ({
      status: (j.sitter ?? null) as SitterStatus,
      nextStep: (j.nextStep ?? null) as OnboardingStep | null,
    }))
    /* Sessiz basarisizlik bilincli: bu veri bir DUGMENIN ETIKETINI
       seciyor. Hata gostermek kullaniciya yapabilecegi bir sey vermez,
       davet dugmesi ise her durumda dogru bir varsayilan. */
    .catch(() => ({ status: null, nextStep: null }));
  return inflight;
}

export function useSitterState(): SitterState {
  const { data } = authClient.useSession();
  const [state, setState] = useState<SitterState>({ status: null, nextStep: null });

  useEffect(() => {
    if (!data) { setState({ status: null, nextStep: null }); return; }
    let alive = true;
    void load().then((s) => { if (alive) setState(s); });
    return () => { alive = false; };
  }, [data]);

  return state;
}

/** Oturum acik mi — dugmelerin \"giris yap\" varyantini secmek icin. */
export function useSignedIn(): boolean {
  const { data } = authClient.useSession();
  return Boolean(data);
}
