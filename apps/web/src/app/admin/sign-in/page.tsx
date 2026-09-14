import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { isAdmin } from '@/lib/data';
import { one } from '@/lib/admin';
import { AdminSignInForm, AdminSignOut } from '@/components/admin/AdminSignInForm';

export const dynamic = 'force-dynamic';

/**
 * YONETICI GIRIS EKRANI.
 *
 * Neden ayri bir ekran: /admin'e giden bir yonetici, pazarlama basligi ve
 * "Bakici ol" dugmesi tasiyan musteri giris sayfasina dusuyordu. Ayrica
 * o sayfa Fransizca/Ingilizce ikizi olan, hesap acmaya davet eden bir
 * sayfa; ikisi de burada yanlis.
 *
 * NEREYE DONULECEGI DOGRULANIYOR. `next` parametresi adres cubugundan
 * geliyor; icerigine bakmadan yonlendirmek ACIK YONLENDIRME (open
 * redirect) zafiyetidir — "giris yap, seni panele goturecegim" diyen bir
 * baglanti, giristen sonra baska bir siteye atabilirdi. Bu yuzden yalniz
 * `/admin/...` ile baslayan, `//` ile baslamayan yollar kabul ediliyor.
 */
function safeNext(raw: string | undefined): string {
  if (!raw) return '/admin/';
  if (!raw.startsWith('/admin')) return '/admin/';
  if (raw.startsWith('//')) return '/admin/';
  return raw;
}

export default async function AdminSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = safeNext(one((await searchParams).next));
  const session = await getSession();

  /*
    Zaten yonetici olarak girilmisse burada oyalanmanin anlami yok.
    Yonetici OLMAYAN bir oturum varsa yonlendirmiyoruz: o kisi bos bir
    forma bakip neden calismadigini anlamazdi.
  */
  if (session && (await isAdmin(session.user.id))) redirect(next);

  return (
    <main className="a-auth">
      <div className="a-auth-card">
        <p className="a-auth-brand">havre <span>internal</span></p>

        {session ? (
          <>
            <h1>No access</h1>
            <p className="a-auth-lead">
              You are signed in as <strong>{session.user.email}</strong>, but this account is not an
              administrator. Ask someone who already has access to grant it from the Users screen.
            </p>
            <AdminSignOut />
            <p className="a-auth-foot">
              <Link href="/en/">← Back to the site</Link>
            </p>
          </>
        ) : (
          <>
            <h1>Sign in</h1>
            <p className="a-auth-lead">
              This is the internal panel. Accounts are not created here — an existing administrator
              grants access.
            </p>
            <AdminSignInForm next={next} />
            <p className="a-auth-foot">
              <Link href="/en/">← Back to the site</Link>
            </p>
          </>
        )}
      </div>

      {/*
        Panelin ne yaptigini giris ekraninda yazmak bir sure sonra
        gereksiz gorunebilir; ama burada duran cumle, panele ilk kez
        bakan birine neyin kayda gectigini bastan soyluyor.
      */}
      <p className="a-auth-note">
        Every decision made in this panel, and every look at someone’s record, is written to the
        audit log with your name on it.
      </p>
    </main>
  );
}
