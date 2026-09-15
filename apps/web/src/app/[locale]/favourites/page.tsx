import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  getMessages, interpolate, localeFromSegment, segmentFor, type Locale,
} from '@havre/i18n';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { SitterCard } from '@/components/SitterCard';
import { ClaimFavourites } from '@/components/ClaimFavourites';
import { EmptyState, HeartArt } from '@/components/EmptyState';
import {
  favouriteIdsOrdered, favouriteSitters, getAccountSummary, isAdmin,
} from '@/lib/data';
import { readAnonFavourites } from '@/lib/favourites';

/** Kisiye ozel liste — cerez okunuyor, onbellege alinamaz. */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * FAVORI BAKICILAR.
 *
 * SAYFA /account ALTINDA DEGIL — bilincli. Giris yapmamis ziyaretci de
 * favorileyebiliyor, dolayisiyla listesini gorebilmeli; /account altina
 * koysaydik kendi isaretledigi seyi gormek icin hesap acmasi gerekirdi
 * ve ozellik yarim kalirdi. Giris yapmis kullanici icin sayfa yine hesap
 * cercevesiyle (sekmelerle) ciziliyor, yani hesabin bir parcasi gibi
 * duruyor; giris yapmamis olan ise sade bir baslik goruyor.
 *
 * NE SOZ VERILIYOR: hicbir sey. Favorilemek rezervasyon degil, bakiciya
 * haber gitmiyor, fiyat kilitlenmiyor. Ekranda da aynen boyle yaziyor —
 * "kaydettiniz" gibi bir sey ima etmek, kullanicinin geri donduğunde
 * bulamayacagi bir beklenti yaratirdi.
 */
export default async function FavouritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);
  const session = await getSession();
  const anonIds = await readAnonFavourites();

  /*
    KIMLIKLER NEREDEN: giris yapmissa hesaptan, yapmamissa cerezden.
    Ikisi birlikte GOSTERILMIYOR — giris yapmis kullanicinin cerezinde
    kalmis liste, tasinmasi gereken bir artik; ustteki serit bunu
    soyluyor ve tek tikla tasiyor. Sessizce birlestirseydik kullanici
    listesinin nerede durdugunu hic bilemezdi.
  */
  const ids = session ? await favouriteIdsOrdered(session.user.id) : anonIds;
  const sitters = await favouriteSitters(ids, locale);

  /*
    DUSEN KAYIT: favorilenmis bir bakici hesabini kapatmis olabilir.
    Sessizce eksiltmek, kullanicinin "burada üç tane vardı" demesi
    demek — sayiyi soyluyoruz.
  */
  const dropped = ids.length - sitters.length;

  const body = (
    <>
      {session && anonIds.length > 0 && (
        <ClaimFavourites count={anonIds.length} locale={locale} />
      )}

      {sitters.length === 0 ? (
        <EmptyState
          icon={HeartArt}
          title={m.favourites.empty}
          body={m.favourites.emptyHint}
          action={
            <Link href={`/${seg}/search/`} className="btn btn-primary">
              {m.favourites.findSitter}
            </Link>
          }
        />
      ) : (
        <>
          <p className="muted text-body-sm">
            {sitters.length === 1
              ? m.favourites.countOne
              : interpolate(m.favourites.count, { count: String(sitters.length) })}
            {dropped > 0 && (
              <> · {interpolate(m.favourites.dropped, { count: String(dropped) })}</>
            )}
          </p>

          <div className="grid grid-cards" style={{ marginTop: 'var(--space-5)' }}>
            {sitters.map((s) => (
              <SitterCard
                key={s.id}
                sitter={s}
                serviceType={s.serviceType}
                locale={locale}
                citySlug={locale === 'fr-CA' ? s.citySlugFr : s.citySlugEn}
                favourite={{ isFavourite: true, path: `/${seg}/favourites/` }}
              />
            ))}
          </div>
        </>
      )}

      {/* Liste BOSKEN "bu favoriler" demek yok: ortada favori yok. */}
      {!session && sitters.length > 0 && (
        <p className="muted text-body-sm" style={{ marginTop: 'var(--space-6)' }}>
          {m.favourites.anonNote}{' '}
          <Link href={`/${seg}/account/sign-in/?next=/${seg}/favourites/`}>
            {m.favourites.signIn}
          </Link>
        </p>
      )}
    </>
  );

  if (!session) {
    return (
      <>
        <section className="band band-blush band-round-b">
          <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
            <h1 className="text-h1">{m.favourites.title}</h1>
            <p className="text-body-lg muted" style={{ marginTop: 'var(--space-3)', maxWidth: '40rem' }}>
              {m.favourites.lead}
            </p>
          </div>
        </section>
        <div className="container" style={{ paddingBlock: 'var(--space-8) var(--section-y)' }}>
          {body}
        </div>
      </>
    );
  }

  const [me, admin] = await Promise.all([
    getAccountSummary(session.user.id),
    isAdmin(session.user.id),
  ]);

  return (
    <AccountShell
      locale={locale}
      title={m.favourites.title}
      lead={m.favourites.lead}
      active="favourites"
      isSitter={me?.sitter != null}
      sitterStatus={me?.sitter?.status ?? null}
      isAdmin={admin}
      unread={me?.counts.unreadMessages ?? 0}
    >
      {body}
    </AccountShell>
  );
}
