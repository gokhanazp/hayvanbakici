'use client';

import { useState } from 'react';
import { getMessages, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { servicesForPhase } from '@havre/core';
import { Select } from '@/components/ui/Select';
import { DateRangeField } from '@/components/ui/DateRangeField';

/** V1 hizmetleri. day_care V1.5'te acilacak (yol haritasi §5.1). */
const LIVE_SERVICES = servicesForPhase('v1');

/**
 * Arama cubugu ana sayfada BOS, sonuc sayfasinda DOLU ciziliyor.
 * Sonuc sayfasinda kullanicinin yazdigi degerleri geri gostermek sart:
 * bos bir kutu, "aramam kayboldu" demektir.
 */
export function SearchBar({
  locale, defaults,
}: {
  locale: Locale;
  defaults?: {
    service?: string | undefined;
    location?: string | undefined;
    start?: string | undefined;
    end?: string | undefined;
  } | undefined;
}) {
  const m = getMessages(locale);
  const [service, setService] = useState(defaults?.service ?? serviceSlug('boarding', locale));

  // GET: arama sonucu bir ADRES olmali — paylasilabilir, geri tusuyla
  // calisir, yenilenince ayni sonucu verir.
  return (
    <form className="searchbar" method="get" action={`/${segmentFor(locale)}/search/`}>
      <div className="field">
        <label htmlFor="service">{m.search.service}</label>
        <Select
          id="service"
          name="service"
          value={service}
          onChange={setService}
          options={LIVE_SERVICES.map((s) => ({
            value: serviceSlug(s, locale),
            label: m.service[s],
            description: m.serviceDescription[s],
          }))}
        />
      </div>

      <div className="field" style={{ flex: '2 1 240px' }}>
        <label htmlFor="location">{m.search.location}</label>
        {/*
          defaultValue (value degil): alan KONTROLSUZ kalmali, aksi halde
          kullanici yazdikca React'e bagli olur ve JS yuklenmeden once
          yazilan sey kaybolur.
          Placeholder artik mahalle de oneriyor — posta kodu yalnizca sehir
          kesinligi veriyor ve kullanicinin bunu bilmesi gerekiyor.
        */}
        <input
          id="location" name="location" type="text"
          autoComplete="postal-code"
          defaultValue={defaults?.location ?? ''}
          placeholder={locale === 'fr-CA' ? 'Quartier, ville ou code postal' : 'Neighbourhood, city or postal code'}
        />
      </div>

      <div className="field" style={{ flex: '1.4 1 220px' }}>
        <span className="field-label-static">{m.search.dates}</span>
        <DateRangeField
          locale={locale} startName="start" endName="end" label={m.search.dates}
          defaultStart={defaults?.start} defaultEnd={defaults?.end}
        />
      </div>

      <div className="field" style={{ flex: '0 0 auto' }}>
        <button className="btn btn-primary" type="submit">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
            strokeWidth="1.9" aria-hidden="true"><circle cx="9" cy="9" r="5.5" /><path d="m13.2 13.2 3.4 3.4" strokeLinecap="round" /></svg>
          {m.search.submit}
        </button>
      </div>
    </form>
  );
}
