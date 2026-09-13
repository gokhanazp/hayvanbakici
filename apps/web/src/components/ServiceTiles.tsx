import Link from 'next/link';
import { SERVICES, type ServiceType } from '@havre/core';
import { getMessages, segmentFor, serviceSlug, type Locale } from '@havre/i18n';

/**
 * Hizmet kartlari — pastel ikon kutucuklariyla.
 *
 * Her hizmet kendi tonunda. Tek marka rengiyle boyanmis dort kart, goz
 * tarafindan tek blok olarak okunuyordu; ayri tonlar "dort ayri secim"
 * hissini geri veriyor.
 */

const TILE = ['tile-rose', 'tile-sage', 'tile-apricot', 'tile-peri'] as const;

const ICON: Record<ServiceType, string> = {
  boarding: 'M5 12.5 12 6l7 6.5 M7 11.5V18h10v-6.5 M10.5 18v-3.5h3V18',
  house_sitting: 'M12 5.5c-3 0-5.5 2.2-5.5 5 0 3.4 3.4 6.2 5.5 8 2.1-1.8 5.5-4.6 5.5-8 0-2.8-2.5-5-5.5-5Z M12 12.3v.01',
  drop_in: 'M4.5 9.5 12 5l7.5 4.5v8a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5Z M9.5 19v-5h5v5',
  dog_walking: 'M8 10.7V15l3.5 3 M11.5 12.5 16 11l3 2.5 M16 11v6 M8 6.3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z',
  day_care: 'M12 5v14 M5 12h14',
  training: 'M6 18l4-8 4 4 4-8',
  grooming: 'M7 5v9a5 5 0 0 0 10 0V5 M7 9h10',
};

export function ServiceTiles({
  locale,
  services,
  citySlug,
  priceFrom,
}: {
  locale: Locale;
  services: readonly ServiceType[];
  citySlug: string;
  /** Hizmet basina en dusuk fiyat (kurus). Veri yoksa satir cizilmez. */
  priceFrom?: Partial<Record<ServiceType, number>> | undefined;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);

  return (
    <div className="grid grid-4">
      {services.map((s, i) => {
        const cents = priceFrom?.[s];
        return (
          <Link
            key={s}
            href={`/${seg}/${citySlug}/${serviceSlug(s, locale)}/`}
            className="card card-hover card-pad"
            style={{ display: 'grid', gap: 'var(--space-3)', alignContent: 'start' }}
          >
            <span className={`tile ${TILE[i % TILE.length]}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={ICON[s]} />
              </svg>
            </span>
            <h3 className="text-h4">{m.service[s]}</h3>
            <p className="text-body-sm muted">{m.serviceDescription[s]}</p>
            {cents !== undefined && (
              <p className="text-body-sm dim tabular">
                {locale === 'fr-CA'
                  ? `à partir de ${Math.round(cents / 100)} $ / ${SERVICES[s].unit}`
                  : `from $${Math.round(cents / 100)} / ${SERVICES[s].unit}`}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
