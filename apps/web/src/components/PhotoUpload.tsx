'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { getMessages, type Locale, type Messages } from '@havre/i18n';
import type { UploadState } from '@/app/[locale]/account/profile/actions';

type Action = (prev: UploadState, form: FormData) => Promise<UploadState>;

/**
 * FOTOGRAF SECME VE YUKLEME.
 *
 * ONIZLEME YEREL: secilen dosya `URL.createObjectURL` ile aninda
 * gosteriliyor. Once yukleyip sonra gostermek, yavas baglantida "bir sey
 * oldu mu?" hissi birakiyordu.
 *
 * DOGRULAMA IKI YERDE. Buradaki kontrol (tur ve boyut) yalnizca hizli
 * geri bildirim icin; ASIL kontrol sunucuda, dosyanin ICERIGINE bakarak
 * yapiliyor (lib/images.ts). Istemciye guvenmek, `.jpg` adli her seyi
 * kabul etmek olurdu.
 *
 * BASARI GORUNUR OLMALI. Ilk surumde yukleme sessizce basariliydi:
 * fotograf kaydediliyor ama ekranda hicbir sey degismedigi icin
 * kullanici yuklenmedigini saniyordu (bizzat bildirildi). Artik
 * "kaydedildi" yaziyor, secili dosya temizleniyor ve onizleme
 * kalkiyor — kalan onizleme "hala bekliyor" gibi okunuyordu.
 */
const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 8 * 1024 * 1024;

export function PhotoUpload({
  locale, action, label, withAlt = false, busyLabel, altPlaceholder, fieldId,
}: {
  locale: Locale;
  action: Action;
  label: string;
  /** Ev fotografinda alternatif metin de soruluyor */
  withAlt?: boolean | undefined;
  busyLabel?: string | undefined;
  /**
   * Alternatif metin ornegi. Varsayilan ev fotografina gore yazilmis
   * ("Cevrili arka bahce"); hayvan fotografinda bu ornek yanlis yolu
   * gosteriyordu.
   */
  altPlaceholder?: string | undefined;
  /**
   * Alan kimligi. AYNI SAYFADA IKI YUKLEME FORMU olabiliyor (fotograf
   * adiminda ev ve hayvan) ve ikisi de id="alt" cizdiginde sayfada
   * yinelenen kimlik olusuyor: etiketler yanlis alana baglaniyor ve
   * ekran okuyucu ikisini tek alan sanıyor.
   */
  fieldId?: string | undefined;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<UploadState, FormData>(action, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  /* Basarili yuklemeden sonra formu bosalt: sunucudaki liste zaten
     yeni fotografi gosteriyor, kutuda duran eski secim yaniltici. */
  useEffect(() => {
    if (!state.done) return;
    setPreview((url) => { if (url) URL.revokeObjectURL(url); return null; });
    setLocalError(null);
    formRef.current?.reset();
  }, [state.done]);

  const text = (k: string) =>
    (m.profile[k as keyof Messages['profile']] as string | undefined) ?? k;

  const error = localError ?? (state.error ? text(`error.${state.error}`) : null);

  return (
    <form action={formAction} className="stack" ref={formRef}>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {state.done && !error && (
        <p className="alert alert-ok" role="status">{m.profile.uploaded}</p>
      )}

      <div className="upload-row">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="upload-preview" />
        )}
        <div className="field-block" style={{ flex: 1, minWidth: 0 }}>
          <label htmlFor={`file-${fieldId ?? label}`}>{label}</label>
          <input
            ref={inputRef}
            id={`file-${fieldId ?? label}`}
            type="file"
            name="file"
            accept={ACCEPT}
            className="file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setLocalError(null);
              if (!f) { setPreview(null); return; }
              if (!ACCEPT.split(',').includes(f.type)) {
                setLocalError(text('error.unsupported_format'));
                setPreview(null);
                e.target.value = '';
                return;
              }
              if (f.size > MAX_BYTES) {
                setLocalError(text('error.too_large'));
                setPreview(null);
                e.target.value = '';
                return;
              }
              setPreview(URL.createObjectURL(f));
            }}
          />
          <span className="field-hint">{m.profile.uploadHint}</span>
        </div>
      </div>

      {withAlt && (
        <div className="field-block">
          <label htmlFor={`alt-${fieldId ?? label}`}>{m.profile.altLabel}</label>
          <input
            id={`alt-${fieldId ?? label}`} name="alt" maxLength={140}
            placeholder={altPlaceholder ?? m.profile.altPlaceholder}
          />
          <span className="field-hint">{m.profile.altHint}</span>
        </div>
      )}

      <button type="submit" className="btn btn-secondary" disabled={busy || !preview}>
        {busy ? (busyLabel ?? m.profile.uploading) : m.profile.upload}
      </button>
    </form>
  );
}

/** Tek dugmelik islemler: fotografi kaldir / sil. */
export function PhotoDelete({
  locale, action, photoId, label,
}: {
  locale: Locale;
  action: Action;
  photoId?: string | undefined;
  label: string;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<UploadState, FormData>(action, {});
  void m;

  return (
    <form action={formAction}>
      {photoId && <input type="hidden" name="photoId" value={photoId} />}
      <button type="submit" className="btn btn-ghost text-body-sm" disabled={busy}>
        {label}
      </button>
      {state.error && <span className="field-hint" role="alert">{state.error}</span>}
    </form>
  );
}
