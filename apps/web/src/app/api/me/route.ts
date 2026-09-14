import { completedSteps, ONBOARDING_STEPS } from '@havre/core';
import { getSession } from '@/lib/auth';
import { getAccountSummary } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * OTURUM SAHIBININ ROL DURUMU — yalnizca basliktaki dugme icin.
 *
 * Neden bir uc nokta: site basligi SUNUCU BILESENI ve statik uretiliyor
 * (bkz. Header.tsx). Statik bir baslik kullanicinin bakici olup olmadigini
 * bilemez; oturumu sunucuda okumak ise tum sayfalari dinamik yapar ve
 * ISR biter. Bu yuzden karar istemcide, tek ve kucuk bir istekle veriliyor.
 *
 * DONEN TEK SEY bakici kaydinin durumu ve taslakta sirada duran adim.
 * E-posta, ad, sayilar — hicbiri burada yok: bu uc noktanin isi bir
 * dugmenin etiketini ve hedefini secmek, hesap bilgisi dagitmak degil.
 */
export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) return Response.json({ sitter: null }, { headers: NO_STORE });

  const me = await getAccountSummary(session.user.id);
  if (!me?.sitter) return Response.json({ sitter: null, nextStep: null }, { headers: NO_STORE });

  const done = completedSteps(me.sitter.steps);
  const nextStep = ONBOARDING_STEPS.find((s) => s !== 'review' && !done[s]) ?? 'review';

  return Response.json(
    { sitter: me.sitter.status, nextStep: me.sitter.status === 'draft' ? nextStep : null },
    { headers: NO_STORE },
  );
}

/* Ara belleklenirse bir kullanicinin durumu digerine gosterilebilir. */
const NO_STORE = { 'Cache-Control': 'no-store, private' };
