'use server';

import { revalidatePath } from 'next/cache';
import { MAX_EXTRA_PET_CENTS, MAX_HOLIDAY_PCT, MAX_PRICE_CENTS, MIN_PRICE_CENTS } from '@havre/core';
import { getSession } from '@/lib/auth';
import { getOnboardingState, updateSitterPricing, isSitter, getSitterDashboard } from '@/lib/data';

export interface PricesState {
  error?: string | undefined;
  errors?: Record<string, string> | undefined;
  saved?: boolean | undefined;
}

const POLICIES = new Set(['flexible', 'moderate', 'strict']);

/** "65" / "65,50" -> kurus. Bos ya da bozuk girdi NaN doner. */
function cents(raw: string): number {
  const n = Number(raw.trim().replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}
/** Bos = 0 ("istemiyorum"), bozuk = NaN (hata). */
function centsOrZero(raw: string): number {
  return raw.trim() === '' ? 0 : cents(raw);
}
function pctOrZero(raw: string): number {
  if (raw.trim() === '') return 0;
  const n = Number(raw.trim().replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
}

/**
 * UCRETLERI KAYDET.
 *
 * HANGI HIZMETLER GUNCELLENECEGI FORMDAN DEGIL VERITABANINDAN geliyor:
 * once bakicinin acik hizmetleri okunuyor, sonra her biri icin formdaki
 * degerlere bakiliyor. Formdaki listeye guvenseydik, uydurulmus bir
 * hizmet adi gonderen biri olmayan bir hizmeti acmaya calisabilirdi
 * (sorgu yine de UPDATE, yani satir yaratmazdi — ama dogrulama hatalari
 * hayali hizmetler icin uretilirdi).
 *
 * DOGRULAMA SUNUCUDA TEKRAR EDILIYOR. Formdaki min/max yalnizca
 * tarayicinin kolayligi; eylem dogrudan cagrilabilir.
 */
export async function savePricesAction(
  _prev: PricesState, form: FormData,
): Promise<PricesState> {
  const session = await getSession();
  if (!session) return { error: 'not_allowed' };
  if (!(await isSitter(session.user.id))) return { error: 'not_allowed' };

  const state = await getOnboardingState(session.user.id);
  if (!state || state.services.length === 0) return { error: 'none' };

  const errors: Record<string, string> = {};
  const updates = state.services.map((svc) => {
    const t = svc.serviceType;
    const price = cents(String(form.get(`price.${t}`) ?? ''));
    const extra = centsOrZero(String(form.get(`extraPet.${t}`) ?? ''));
    const holiday = pctOrZero(String(form.get(`holiday.${t}`) ?? ''));
    const policy = String(form.get(`cancellation.${t}`) ?? svc.cancellationPolicy);

    if (!Number.isFinite(price) || price < MIN_PRICE_CENTS || price > MAX_PRICE_CENTS) {
      errors[`price.${t}`] = 'priceRange';
    }
    if (!Number.isFinite(extra) || extra < 0 || extra > MAX_EXTRA_PET_CENTS) {
      errors[`extraPet.${t}`] = 'extraPetRange';
    }
    if (!Number.isFinite(holiday) || holiday < 0 || holiday > MAX_HOLIDAY_PCT) {
      errors[`holiday.${t}`] = 'holidayRange';
    }

    return {
      serviceType: t,
      priceCents: price,
      extraPetPriceCents: extra,
      holidaySurchargePct: holiday,
      /* Tanimsiz bir politika gelirse mevcut politika korunuyor —
         sessizce 'moderate'a dusurmek bakicinin sectigi kurali
         degistirirdi. */
      cancellationPolicy: (POLICIES.has(policy) ? policy : svc.cancellationPolicy) as
        'flexible' | 'moderate' | 'strict',
    };
  });

  /* TEK BIR ALAN BILE HATALIYSA HICBIRI KAYDEDILMIYOR: yarisi yeni
     yarisi eski fiyatlarla kalan bir profil, bakicinin hic beklemedigi
     bir seydir. */
  if (Object.keys(errors).length > 0) return { errors };

  await updateSitterPricing(session.user.id, updates);

  const seg = String(form.get('locale') ?? 'en');
  revalidatePath(`/${seg}/account/sitter/prices/`);

  /*
    HERKESE ACIK PROFIL HEMEN TAZELENIYOR — iki dilde birden.

    O sayfa saatlik ISR ile yayinlaniyor. Tazelemeseydik, bakici
    fiyatini 59 dolardan 72'ye cikardiktan sonra profil sayfasi bir saat
    boyunca 59 yazmaya devam ederdi; o sirada tiklayan sahip, talep
    ekraninda 72 gorurdu — cunku talep fiyati CANLI okuyor. Ekranin iki
    yerde iki farkli fiyat soylemesi, ucret seffafligi iddiasiyla
    dogrudan celisir.

    Iki dil AYRI adres, dolayisiyla ayri onbellek girdisi.
  */
  const dash = await getSitterDashboard(session.user.id);
  if (dash?.slug) {
    if (dash.citySlugEn) revalidatePath(`/en/${dash.citySlugEn}/sitter/${dash.slug}`);
    if (dash.citySlugFr) revalidatePath(`/fr/${dash.citySlugFr}/sitter/${dash.slug}`);
  }

  return { saved: true };
}
