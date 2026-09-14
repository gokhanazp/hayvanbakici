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
  locale, title, lead, photo, updated, children, aside,
}: {
  locale: Locale;
  title: string;
  lead?: string | undefined;
  photo?: PhotoId | undefined;
  /** ISO tarih — hukuki metinlerde zorunlu */
  updated?: string | undefined;
  children: ReactNode;
  aside?: ReactNode | undefined;
}) {
  return (
    <>
      <section className="band band-blush band-round-b">
        <div className="container page-head">
          <div className={photo ? 'page-head-grid' : undefined}>
            <div>
              <h1 className="text-display" style={{ maxWidth: '22ch' }}>{title}</h1>
              {lead && (
                <p className="text-body-lg muted" style={{ marginTop: 'var(--space-4)', maxWidth: '38rem', textWrap: 'pretty' }}>
                  {lead}
                </p>
              )}
            </div>
            {photo && (
              <div className="photo-frame" style={{ aspectRatio: '4 / 3' }}>
                <Photo id={photo} locale={locale} priority sizes="(min-width: 900px) 24rem, 100vw" />
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container section">
        <div className={aside ? 'content-grid' : undefined}>
          <div className="prose">{children}</div>
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
