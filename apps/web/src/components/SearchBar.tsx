import { getMessages, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { servicesForPhase } from '@havre/core';

/** V1 hizmetleri. day_care V1.5'te acilacak (yol haritasi §5.1). */
const LIVE_SERVICES = servicesForPhase('v1');

export function SearchBar({ locale }: { locale: Locale }) {
  const m = getMessages(locale);
  return (
    <form className="searchbar" action={`/${segmentFor(locale)}/search`}>
      <div className="field">
        <label htmlFor="service">{m.search.service}</label>
        <select id="service" name="service" defaultValue={serviceSlug('boarding', locale)}>
          {LIVE_SERVICES.map((s) => (
            <option key={s} value={serviceSlug(s, locale)}>{m.service[s]}</option>
          ))}
        </select>
      </div>
      <div className="field" style={{ flex: '2 1 240px' }}>
        <label htmlFor="location">{m.search.location}</label>
        <input id="location" name="location" type="text" autoComplete="postal-code" placeholder="M4M 1A1" />
      </div>
      <div className="field">
        <label htmlFor="start">{m.search.dates}</label>
        <input id="start" name="start" type="date" />
      </div>
      <div className="field" style={{ flex: '0 0 auto' }}>
        <button className="btn btn-primary" type="submit">{m.search.submit}</button>
      </div>
    </form>
  );
}
