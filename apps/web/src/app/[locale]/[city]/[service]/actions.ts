'use server';

import { joinWaitlist } from '@/lib/data';

export interface WaitlistState {
  error?: string | undefined;
  done?: boolean | undefined;
}

/**
 * BEKLEME LISTESI KAYDI.
 *
 * Oturum GEREKMIYOR — bu sayfayi goren kisinin henuz hesabi olmamasi
 * beklenen durum: sehirde bakici yok, kayit olmasi icin bir sebep de yok.
 * Kaydi hesaba degil e-postaya bagliyoruz.
 *
 * Sehir ve hizmet ADRESTEN geliyor, gizli form alanindan degil; kullanici
 * hangi sayfadaysa o sehre kaydoluyor. Sunucu sehri yine de veritabaninda
 * dogruluyor (`joinWaitlist`), uydurma bir dilim kayit acamiyor.
 */
export async function joinWaitlistAction(
  _prev: WaitlistState, form: FormData,
): Promise<WaitlistState> {
  const email = String(form.get('email') ?? '');
  const citySlug = String(form.get('citySlug') ?? '');
  const serviceType = String(form.get('serviceType') ?? '');
  const locale = String(form.get('locale') ?? '');

  const res = await joinWaitlist({ email, citySlug, serviceType, locale });
  if (!res.ok) return { error: res.error };
  return { done: true };
}
