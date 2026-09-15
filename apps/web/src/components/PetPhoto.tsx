'use client';

import { useActionState, useRef, useState } from 'react';
import { getMessages, type Locale, type Messages } from '@havre/i18n';
import { Avatar } from './Avatar';
import {
  uploadPetAvatarAction, removePetAvatarAction, type PetPhotoState,
} from '@/app/[locale]/account/pets/actions';

const EMPTY: PetPhotoState = {};
const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * HAYVANIN FOTOGRAFI.
 *
 * Bir hayvanin TEK fotografi var — ev galerisi gibi cok fotografli
 * degil. Sahibin burada yaptigi sey "bu benim Max" demek; ikinci bir
 * fotograf kimseye yeni bir sey soylemiyor ve her fotograf, sonradan
 * silinmesi gereken bir dosya daha demek.
 *
 * Onizleme YEREL: secilen dosya aninda gorunuyor. Once yukleyip sonra
 * gostermek, yavas baglantida "bir sey oldu mu?" hissi birakiyordu —
 * ayni ders profil fotografinda ogrenilmisti.
 */
export function PetPhoto({
  locale, petId, name, photoUrl, showAvatar = true,
}: {
  locale: Locale;
  petId: string;
  name: string;
  photoUrl: string | null;
  /**
   * Fotografin KENDISI cizilsin mi. Hayvanlar sayfasinda kart zaten
   * fotografi gosteriyor; ikinci bir kopya, kullanicinin "hangisi
   * gercek" diye sordugu bir ekran demekti.
   */
  showAvatar?: boolean | undefined;
}) {
  const m = getMessages(locale);
  const [state, action, busy] = useActionState<PetPhotoState, FormData>(uploadPetAvatarAction, EMPTY);
  const [removeState, removeAction, removing] = useActionState<PetPhotoState, FormData>(
    removePetAvatarAction, EMPTY,
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const text = (k: string) =>
    (m.profile[k as keyof Messages['profile']] as string | undefined) ?? k;
  const error = localError
    ?? (state.error ? text(`error.${state.error}`) : null)
    ?? (removeState.error ? text(`error.${removeState.error}`) : null);

  return (
    <div className="pet-photo">
      {showAvatar && (
        <Avatar
          src={preview ?? photoUrl}
          initials={(name.slice(0, 1) || '?').toUpperCase()}
          size={72}
        />
      )}
      <div style={{ minWidth: 0 }}>
        {error && <p className="field-error" role="alert">{error}</p>}
        <form action={action} ref={formRef} className="stack">
          <input type="hidden" name="petId" value={petId} />
          <label className="btn btn-secondary btn-sm pet-photo-pick">
            {busy ? m.profile.uploading : (photoUrl ? m.pets.changePhoto : m.pets.addPhoto)}
            <input
              type="file" name="file" accept={ACCEPT} className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setLocalError(null);
                if (!f) { setPreview(null); return; }
                if (!ACCEPT.split(',').includes(f.type)) {
                  setLocalError(text('error.unsupported_format'));
                  e.target.value = ''; return;
                }
                if (f.size > MAX_BYTES) {
                  setLocalError(text('error.too_large'));
                  e.target.value = ''; return;
                }
                /* Secer secmez gonderiliyor: ayri bir "Yukle" dugmesi,
                   dosyayi secip sayfadan ayrilan kullanicinin
                   fotografini kaybetmesi demekti. */
                setPreview(URL.createObjectURL(f));
                e.target.form?.requestSubmit();
              }}
            />
          </label>
        </form>
        {photoUrl && !preview && (
          <form action={removeAction} style={{ marginTop: 'var(--space-2)' }}>
            <input type="hidden" name="petId" value={petId} />
            <button type="submit" className="btn btn-ghost btn-sm" disabled={removing}>
              {m.pets.removePhoto}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
