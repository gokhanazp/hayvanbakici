import { getMessages, interpolate, type Locale } from '@havre/i18n';
import { Avatar } from '@/components/Avatar';
import { PhotoUpload, PhotoDelete } from '@/components/PhotoUpload';
import {
  uploadAvatarAction, removeAvatarAction, uploadHomePhotoAction, deleteHomePhotoAction,
} from '@/app/[locale]/account/profile/actions';

/**
 * BASVURUDAKI FOTOGRAF ADIMI.
 *
 * Hesap ekranindaki ile AYNI eylemleri kullaniyor — ayri bir yukleme
 * yolu yazmak, birinde dogrulamayi unutmanin kisa yoluydu.
 *
 * Adim ZORUNLU DEGIL ve bunu ekranda SOYLUYOR. Fotografsiz gonderilen
 * basvuru kabul ediliyor; ama fotograf doluluk oranina giriyor ve
 * siralamayi etkiliyor, bu yuzden "istege bagli" demek yetmez, NEDEN
 * eklemesi gerektigini de yaziyoruz.
 */
export function PhotoStep({
  locale, photos, max, avatarUrl, firstName,
}: {
  locale: Locale;
  photos: Array<{ id: string; url: string; alt: string | null }>;
  max: number;
  avatarUrl: string | null;
  firstName: string;
}) {
  const m = getMessages(locale);

  return (
    <div className="stack" style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <p className="field-hint">{m.onboarding['photos.optional']}</p>

      <section>
        <h2 className="text-h4">{m.profile.photoHeading}</h2>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>{m.profile.photoLead}</p>
        <div className="row" style={{ gap: 'var(--space-5)', marginTop: 'var(--space-5)' }}>
          <Avatar src={avatarUrl} initials={(firstName.slice(0, 1) || '?').toUpperCase()} size={88} />
          <div style={{ flex: 1, minWidth: '14rem' }}>
            <PhotoUpload locale={locale} action={uploadAvatarAction} label={m.profile.avatarLabel} />
            {avatarUrl && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <PhotoDelete locale={locale} action={removeAvatarAction} label={m.profile.remove} />
              </div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-h4">{m.profile.homeHeading}</h2>
        <p className="muted" style={{ marginTop: 'var(--space-2)' }}>
          {interpolate(m.profile.homeLead, { max })}
        </p>

        {photos.length > 0 && (
          <ul className="photo-grid">
            {photos.map((p) => (
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

        {photos.length < max && (
          <div style={{ marginTop: 'var(--space-5)' }}>
            <PhotoUpload
              locale={locale} action={uploadHomePhotoAction}
              label={m.profile.homeHeading} withAlt
            />
          </div>
        )}
      </section>
    </div>
  );
}
