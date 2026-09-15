'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { getMessages, type Locale, type Messages } from '@havre/i18n';
import type { UploadState } from '@/app/[locale]/account/profile/actions';

type Action = (prev: UploadState, form: FormData) => Promise<UploadState>;

/**
 * FOTOGRAF SECME VE YUKLEME.
 *
 * TEK ADIM GORUNUR, DIGERLERI GELDIGINDE.
 *
 * Ilk surumde bir fotograf icin BES oge alt alta duruyordu: tarayicinin
 * dosya kutusu, bicim ipucu, "Bu fotografi anlatin" alani, onun ipucu ve
 * KAPALI bir "Yukle" dugmesi. Ekranin buyuk bolumu, kullanici henuz
 * hicbir sey secmemisken kullanilamayan alanlarla doluydu — ve ayni
 * yigin sayfada iki kez tekrarliyordu (ev ve hayvan). Kullanici "burada
 * tam olarak ne yapmam gerekiyor?" diye sordu, hakliydi.
 *
 * Artik dosya secilene kadar TEK bir birakma alani var. Secildigi anda
 * onizleme, alt metin ve gonder dugmesi geliyor — hepsi o noktada
 * anlamli.
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
 * kullanici yuklenmedigini saniyordu (bizzat bildirildi).
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
   * ekran okuyucu ikisini tek alan saniyor.
   */
  fieldId?: string | undefined;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<UploadState, FormData>(action, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const id = fieldId ?? label;

  function clear() {
    setPreview((url) => { if (url) URL.revokeObjectURL(url); return null; });
    setFileName(null);
    setLocalError(null);
    formRef.current?.reset();
  }

  /* Basarili yuklemeden sonra formu bosalt: sunucudaki liste zaten
     yeni fotografi gosteriyor, kutuda duran eski secim yaniltici. */
  useEffect(() => {
    if (!state.done) return;
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.done]);

  const text = (k: string) =>
    (m.profile[k as keyof Messages['profile']] as string | undefined) ?? k;

  const error = localError ?? (state.error ? text(`error.${state.error}`) : null);

  function choose(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setLocalError(null);
    if (!f) { clear(); return; }
    if (!ACCEPT.split(',').includes(f.type)) {
      setLocalError(text('error.unsupported_format'));
      e.target.value = ''; setPreview(null); setFileName(null);
      return;
    }
    if (f.size > MAX_BYTES) {
      setLocalError(text('error.too_large'));
      e.target.value = ''; setPreview(null); setFileName(null);
      return;
    }
    setPreview(URL.createObjectURL(f));
    setFileName(f.name);
    /*
      ALT METIN SORULMUYORSA HEMEN GONDER. Ayri bir "Yukle" dugmesi,
      dosyayi secip sayfadan ayrilan kullanicinin fotografini kaybetmesi
      demekti. Alt metin isteniyorsa beklemek gerekiyor: metin
      yazilmadan gonderirsek alan bos kalir.
    */
    if (!withAlt) e.target.form?.requestSubmit();
  }

  return (
    <form action={formAction} className="upload" ref={formRef}>
      {error && <p className="alert alert-error" role="alert">{error}</p>}
      {state.done && !error && (
        <p className="alert alert-ok" role="status">{m.profile.uploaded}</p>
      )}

      {/*
        GERCEK INPUT HER ZAMAN DOM'DA ve etiketle bagli — klavye ve ekran
        okuyucu icin degisen bir sey yok. Gorunen kutu yalnizca onun
        etiketi. Tarayicinin kendi "Choose File — No file chosen" kutusu
        sayfadaki tek bicimsiz ogeydi.
      */}
      <input
        ref={inputRef}
        id={`file-${id}`}
        type="file"
        name="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={choose}
      />

      {!preview ? (
        <label className="dropzone" htmlFor={`file-${id}`}>
          <span className="dropzone-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 16.5V18a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1.5" />
              <path d="M12 4v10M8 7.5 12 4l4 3.5" />
            </svg>
          </span>
          <span className="dropzone-label">{label}</span>
          {/* Bicim ve boyut kutunun ICINDE: ayri bir ipucu satiri, henuz
              hicbir sey secmemis kullanici icin fazladan bir satirdi. */}
          <span className="dropzone-hint">{m.profile.uploadHint}</span>
        </label>
      ) : (
        <div className="upload-chosen">
          <span className="upload-thumb">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" />
          </span>
          <div className="upload-chosen-body">
            <p className="upload-filename">{fileName}</p>
            <button
              type="button" className="btn btn-ghost btn-sm"
              onClick={() => { clear(); inputRef.current?.click(); }}
            >
              {m.profile.changePhoto}
            </button>
          </div>
        </div>
      )}

      {/* Alt metin ve gonder dugmesi YALNIZCA bir dosya secildikten
          sonra: ikisi de o ana kadar kullanilamiyordu. */}
      {withAlt && preview && (
        <>
          <div className="field-block">
            <label htmlFor={`alt-${id}`}>{m.profile.altLabel}</label>
            <input
              id={`alt-${id}`} name="alt" maxLength={140}
              placeholder={altPlaceholder ?? m.profile.altPlaceholder}
            />
            <span className="field-hint">{m.profile.altHint}</span>
          </div>

          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? (busyLabel ?? m.profile.uploading) : m.profile.upload}
            </button>
            <button type="button" className="btn btn-ghost" onClick={clear} disabled={busy}>
              {m.profile.cancelUpload}
            </button>
          </div>
        </>
      )}

      {!withAlt && busy && (
        <p className="field-hint" role="status">{busyLabel ?? m.profile.uploading}</p>
      )}
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
  const [state, formAction, busy] = useActionState<UploadState, FormData>(action, {});
  void locale;

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
