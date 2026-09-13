'use client';

import { useState } from 'react';
import { getMessages, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { servicesForPhase } from '@havre/core';
import { Select } from '@/components/ui/Select';
import { DateRangeField } from '@/components/ui/DateRangeField';

/** V1 hizmetleri. day_care V1.5'te acilacak (yol haritasi §5.1). */
const LIVE_SERVICES = servicesForPhase('v1');

export function SearchBar({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  const [service, setService] = useState(serviceSlug('boarding', locale));

  return (
    <form className="searchbar" action={`/${segmentFor(locale)}/search`}>
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
        <input id="location" name="location" type="text" autoComplete="postal-code" placeholder="M4M 1A1" />
      </div>

      <div className="field" style={{ flex: '1.4 1 220px' }}>
        <span className="field-label-static">{m.search.dates}</span>
        <DateRangeField locale={locale} startName="start" endName="end" label={m.search.dates} />
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
