import Link from 'next/link';
import { SERVICES, type ServiceType } from '@havre/core';
import { getMessages, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { ServiceIcon, SERVICE_TILE } from '@/components/ServiceIcon';

/**
 * Hizmet kartlari — pastel ikon kutucuklariyla.
 *
 * Her hizmet kendi tonunda. Tek marka rengiyle boyanmis dort kart, goz
 * tarafindan tek blok olarak okunuyordu; ayri tonlar "dort ayri secim"
 * hissini geri veriyor.
 */


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
            <span className={`tile ${SERVICE_TILE[i % SERVICE_TILE.length]}`}>
              <ServiceIcon service={s} />
            </span>
            <h3 className="text-h4">{m.service[s]}</h3>
            <p className="text-body-sm muted">{m.serviceDescription[s]}</p>
            {/* .tabular YOK: "53 $ / nuit" gibi metinde rakam disi karakterleri de araliyor */}
            {cents !== undefined && (
              <p className="text-body-sm dim">
                {/* Birim adi da cevrilmeli — ham anahtar ('night') Ingilizce */}
                {locale === 'fr-CA'
                  ? `à partir de ${Math.round(cents / 100)} $ / ${m.unit[SERVICES[s].unit]}`
                  : `from $${Math.round(cents / 100)} / ${m.unit[SERVICES[s].unit]}`}
              </p>
            )}
          </Link>
        );
      })}
    </div>
  );
}
