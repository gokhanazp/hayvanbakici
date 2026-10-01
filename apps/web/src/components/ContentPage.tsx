import type { ReactNode } from 'react';
import { type Locale } from '@havre/i18n';
import { Photo } from './Photo';
import type { PhotoId } from '@/lib/photos';

/**
 * ICERIK SAYFASI ISKELETI — ucretler, nasil calisir, yardim, hukuki metinler.
 *
 * Hepsi ayni yapida: renkli baslik bandi, dar okuma sutunu, tarih.
 * Tek iskelet olmasinin sebebi tutarlilik degil yalnizca; bu sayfalarin
 * yarisi hukuki metin ve SATIR UZUNLUGU okunurlugu dogrudan etkiliyor
 * (~68 karakter). Her sayfada ayri genislik verilseydi biri kacinilmaz
 * olarak 120 karakterlik satirla yayina girerdi.
 */
export function ContentPage({
  locale, title, lead, eyebrow, accent, photo, updated, children, aside, wide = false,
}: {
  locale: Locale;
  title: string;
  lead?: string | undefined;
  /** Ustteki kucuk hap — sayfanin hangi ailede oldugunu soyler */
  eyebrow?: string | undefined;
  /**
   * Baslikta VURGULANACAK son parca. Ana sayfadaki kahramanda sehir
   * adi yesil ve altinda dalgali cizgi var; bu sayfalar o dilin
   * disinda kaliyordu. Verilmezse baslik duz yazilir.
   */
  accent?: string | undefined;
  photo?: PhotoId | undefined;
  /** ISO tarih — hukuki metinlerde zorunlu */
  updated?: string | undefined;
  children: ReactNode;
  aside?: ReactNode | undefined;
  /**
   * ANLATIM SAYFASI (nasil calisir, koruma, ucretler) — hukuki metin degil.
   *
   * `.prose` 42rem'lik bir OKUMA sutunu ve dogru yeri sozlesme
   * metinleri. Adimlardan, oranlardan ve rozetlerden olusan bir
   * sayfa oraya sikistirildiginda hem sagi bos kaliyor hem de alti
   * bolum ayni gri metin blogu gibi okunuyor. `wide` bu sayfalarda
   * icerigi izgaraya aciyor; olcu artik paragrafin kendisinde
   * (`.content-flow p { max-width }`).
   */
  wide?: boolean;
}) {
  return (
    <>
      {/*
        BASLIK — ANA SAYFAYLA AYNI DIL.

        Onceden `band band-blush` + `page-head` idi: bandin yuksekligi
        sabit, icerigi iki satir. Ekranin ustunde "Ucretlerimiz" yazip
        400 piksel bos birakiyor, saginda da serbest duran bir
        fotograf bulunuyordu. On sayfa birden bu iskeleti kullaniyor,
        yani on sayfa birden eski dilde kaliyordu.

        Yeni hali kahramanin SAKIN surumu: ayni gradyan ve lekeler,
        ayni hap ve vurgulu baslik, ama yuksekligi iceriginden geliyor
        ve fotograf bir kart gibi duruyor.
      */}
      <section className="pg-hero">
        <div className="st-blobs" aria-hidden="true">
          <div className="st-blob st-blob-a"></div>
          <div className="st-blob st-blob-b"></div>
        </div>

        <div className="st-wrap pg-hero-inner">
          <div className={photo ? 'pg-hero-grid' : undefined}>
            <div className="pg-hero-copy">
              {eyebrow && <span className="st-eyebrow-pill">{eyebrow}</span>}
              <h1 className="pg-h1">
                {accent ? (
                  <>
                    {title}
                    {' '}
                    <span className="st-h1-accent">{accent}</span>
                  </>
                ) : title}
              </h1>
              {lead && <p className="pg-lead">{lead}</p>}
            </div>
            {photo && (
              <div className="pg-hero-art">
                <Photo id={photo} locale={locale} priority sizes="(min-width: 900px) 24rem, 100vw" />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container section">
        <div className={aside ? 'content-grid' : undefined}>
          <div className={wide ? 'content-flow' : 'prose'}>{children}</div>
          {aside && <aside className="content-aside">{aside}</aside>}
        </div>

        {updated && (
          <p className="field-hint" style={{ marginTop: 'var(--space-10)' }}>
            {locale === 'fr-CA' ? 'Dernière mise à jour : ' : 'Last updated: '}
            <time dateTime={updated}>
              {new Date(`${updated}T00:00:00Z`).toLocaleDateString(locale, {
                year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
              })}
            </time>
          </p>
        )}
      </div>
    </>
  );
}

/** Hukuki metinlerde: bu metin henuz yururlukte degil uyarisi */
export function DraftNotice({ locale }: { locale: Locale }) {
  return (
    <div className="notice notice-warning">
      <p>
        {locale === 'fr-CA'
          ? 'Ce document est une ébauche de travail. Il n’a pas encore été revu par un conseiller juridique et n’est pas en vigueur. Havre n’accepte pas encore de réservations.'
          : 'This document is a working draft. It has not yet been reviewed by counsel and is not in force. Havre is not taking bookings yet.'}
      </p>
    </div>
  );
}
