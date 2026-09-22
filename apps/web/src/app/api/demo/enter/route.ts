import { NextResponse } from 'next/server';
import { getAuth } from '@havre/auth';
import { segmentFor, localeFromSegment } from '@havre/i18n';
import { isDemo } from '@/lib/demo';
import { getDemoAccounts } from '@/lib/data';

/**
 * "DEMO OLARAK GIR" — YALNIZCA DEMO YAYININDA.
 *
 * Neden var: gonderen alan adi dogrulanmadan e-posta saglayicisi
 * yalnizca hesap sahibinin adresine mail atabiliyor. Yani demoyu
 * gezmek isteyen biri kayit ekraninda tikanip kaliyor — "baglanti
 * gonderdik" yaziyor ama hicbir sey gelmiyor. Bu uc o tikanikligi
 * kaldiriyor.
 *
 * UC KILIT:
 *  1. DEMO_MODE kapaliysa bu adres 404 — uretimde HIC YOK.
 *  2. DEMO_LOGIN_PASSWORD yoksa 503; sessizce calisan bir arka kapi
 *     olmasin diye acikca duruyor.
 *  3. Yalnizca `@seed.havre.test` adresli UYDURMA hesaplara giriliyor
 *     (RFC 2606 ile ayrilmis, gercek olmasi mumkun olmayan alan adi).
 *     Hangi hesaplar oldugu tek yerde tanimli (queries/demo.ts) ve
 *     parolayi tanimlayan betik de ayni secimi okuyor.
 *
 * Parola TARAYICIYA GITMIYOR: form yalnizca rolu gonderiyor, parolayi
 * sunucu kendi ortamindan okuyup Better Auth'a veriyor.
 */
export async function POST(req: Request): Promise<Response> {
  if (!isDemo()) return new NextResponse('Not found', { status: 404 });

  const password = process.env.DEMO_LOGIN_PASSWORD;
  if (!password) {
    return new NextResponse(
      'DEMO_LOGIN_PASSWORD tanimli degil. Once: npm run demo:accounts',
      { status: 503 },
    );
  }

  const form = await req.formData();
  const role = String(form.get('role') ?? 'owner');
  const seg = String(form.get('locale') ?? 'en');
  const locale = localeFromSegment(seg) ?? 'en-CA';

  const accounts = await getDemoAccounts();
  const email = role === 'sitter' ? accounts.sitterEmail : accounts.ownerEmail;
  if (!email) {
    return new NextResponse('Demo hesabi bulunamadi. Once: npm run db:seed', { status: 503 });
  }

  const auth = getAuth();
  const signIn = await auth.api.signInEmail({
    body: { email, password },
    asResponse: true,
  });

  if (!signIn.ok) {
    return new NextResponse(
      'Demo hesabina girilemedi. Parola bu veritabaninda tanimli mi? npm run demo:accounts',
      { status: 503 },
    );
  }

  const target = role === 'sitter'
    ? `/${segmentFor(locale)}/account/sitter/`
    : `/${segmentFor(locale)}/account/`;

  const out = NextResponse.redirect(new URL(target, req.url), 303);
  // Oturum cerezini Better Auth uretiyor; oldugu gibi tasiniyor.
  for (const cookie of signIn.headers.getSetCookie()) out.headers.append('set-cookie', cookie);
  return out;
}
