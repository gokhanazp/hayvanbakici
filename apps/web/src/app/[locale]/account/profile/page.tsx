import { notFound, redirect } from 'next/navigation';
import { getMessages, interpolate, localeFromSegment, LOCALES, type Locale } from '@havre/i18n';
import { MAX_SITTER_PHOTOS, MAX_PET_PHOTOS } from '@havre/db';
import { getSession } from '@/lib/auth';
import { AccountShell } from '@/components/AccountShell';
import { Avatar } from '@/components/Avatar';
import { PhotoUpload, PhotoDelete } from '@/components/PhotoUpload';
import { ProfileForm } from '@/components/ProfileForm';
import { getAccountSummary, listSitterPhotos, isAdmin, unreadCount } from '@/lib/data';
import {
  uploadAvatarAction, removeAvatarAction, uploadHomePhotoAction, uploadPetPhotoAction,
  deleteHomePhotoAction, saveProfileAction,
} from './actions';

export const dynamic = 'force-dynamic';

/**
 * PROFIL DUZENLEME.
 *
 * Bugune kadar hic yoktu: kayit sirasinda yazilan ad ve bos avatar,
 * kullanicinin degistiremeyecegi seylerdi. Fotograf da buradan geliyor —
 * hem sahip hem bakici icin, cunku mesajlasmada ve rezervasyon
 * kartlarinda iki taraf da birbirini goruyor.
 */
export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const session = await getSession();
  if (!session) redirect(`/${seg}/account/sign-in/?next=/${seg}/account/profile/`);

  const me = await getAccountSummary(session.user.id);
  if (!me) notFound();

  const [allPhotos, admin, unread] = await Promise.all([
    me.sitter ? listSitterPhotos(session.user.id) : Promise.resolve([]),
    isAdmin(session.user.id),
    unreadCount(session.user.id),
  ]);
  const photos = allPhotos.filter((p) => p.kind === 'home');
  const petPhotos = allPhotos.filter((p) => p.kind === 'pet');

  const m = getMessages(locale);

  return (
    <AccountShell
      locale={locale}
      title={m.profile.title}
      lead={m.profile.lead}
      active="profile"
      isSitter={me.sitter !== null}
      sitterStatus={me.sitter?.status ?? null}
      isAdmin={admin}
      unread={unread}
    >
      <div className="stack" style={{ display: 'grid', gap: 'var(--space-8)', maxWidth: '44rem' }}>
        <section className="card card-pad">
          <h2 className="text-h4">{m.profile.photoHeading}</h2>
          <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{m.profile.photoLead}</p>

          <div className="row" style={{ gap: 'var(--space-5)', marginTop: 'var(--space-5)' }}>
            <Avatar src={me.avatarUrl} initials={initialsOf(me)} size={96} />
            <div style={{ flex: 1, minWidth: '14rem' }}>
              <PhotoUpload
                locale={locale}
                action={uploadAvatarAction}
                label={m.profile.avatarLabel}
              />
              <p className="field-hint" style={{ marginTop: 'var(--space-2)' }}>
                {m.profile.avatarNote}
              </p>
              {me.avatarUrl && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <PhotoDelete
                    locale={locale}
                    action={removeAvatarAction}
                    label={m.profile.remove}
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="card card-pad">
          <ProfileForm
            locale={locale}
            firstName={me.firstName ?? ''}
            lastNameInitial={me.lastNameInitial ?? ''}
            locales={LOCALES as readonly Locale[]}
            notifyMessages={me.notifyMessages}
            action={saveProfileAction}
          />
        </section>

        {/*
          EV FOTOGRAFLARI YALNIZCA BAKICIDA. Sahip hesabina bu bolumu
          gostermek, doldurulacak bir alan sanilirdi.
        */}
        {me.sitter && (
          <section className="card card-pad">
            <h2 className="text-h4">{m.profile.homeHeading}</h2>
            <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
              {interpolate(m.profile.homeLead, { max: MAX_SITTER_PHOTOS })}
            </p>

            {photos.length === 0 ? (
              <p className="field-hint" style={{ marginTop: 'var(--space-4)' }}>
                {m.profile.noPhotos}
              </p>
            ) : (
              <ul className="photo-grid">
                {photos.map((p) => (
                  <li key={p.id}>
                    {/* Yuklenen gorsel: olculeri bilinmiyor, bu yuzden
                        kayitli fotograf bileseni degil sabit oranli kutu */}
                    <span className="photo-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.alt ?? ''} loading="lazy" />
                    </span>
                    <PhotoDelete
                      locale={locale} action={deleteHomePhotoAction}
                      photoId={p.id} label={m.profile.remove}
                    />
                  </li>
                ))}
              </ul>
            )}

            {photos.length < MAX_SITTER_PHOTOS && (
              <div style={{ marginTop: 'var(--space-5)' }}>
                <PhotoUpload
                  locale={locale}
                  action={uploadHomePhotoAction}
                  label={m.profile.addHomePhoto}
                  withAlt
                  fieldId="home"
                />
              </div>
            )}
          </section>
        )}

        {/*
          KENDI HAYVANI. Yalnizca "evimde hayvan var" diyene soruluyor —
          ama fotograf yuklemis biri kutuyu sonradan kaldirdiysa yine
          gosteriliyor, yoksa fotograflari silecek ekrani kaybederdi.
        */}
        {me.sitter && (me.sitter.hasOwnPets || petPhotos.length > 0) && (
          <section className="card card-pad">
            <h2 className="text-h4">{m.profile.petHeading}</h2>
            <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
              {interpolate(m.profile.petLead, { max: MAX_PET_PHOTOS })}
            </p>

            {me.sitter.hasOwnPets && petPhotos.length === 0 && (
              <p className="notice notice-warning" style={{ marginTop: 'var(--space-4)' }}>
                {m.profile.petMissing}
              </p>
            )}

            {petPhotos.length > 0 && (
              <ul className="photo-grid">
                {petPhotos.map((p) => (
                  <li key={p.id}>
                    <span className="photo-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt={p.alt ?? ''} loading="lazy" />
                    </span>
                    <PhotoDelete
                      locale={locale} action={deleteHomePhotoAction}
                      photoId={p.id} label={m.profile.remove}
                    />
                  </li>
                ))}
              </ul>
            )}

            {petPhotos.length < MAX_PET_PHOTOS && (
              <div style={{ marginTop: 'var(--space-5)' }}>
                <PhotoUpload
                  locale={locale}
                  action={uploadPetPhotoAction}
                  label={m.profile.addPetPhoto}
                  withAlt
                  fieldId="pet"
                  altPlaceholder={m.profile.petAltPlaceholder}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </AccountShell>
  );
}

type Summary = NonNullable<Awaited<ReturnType<typeof getAccountSummary>>>;

function initialsOf(me: Summary): string {
  const a = (me.firstName ?? me.email).slice(0, 1).toUpperCase();
  const b = (me.lastNameInitial ?? '').slice(0, 1).toUpperCase();
  return `${a}${b}`;
}
