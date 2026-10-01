import {
  getMessages, interpolate, segmentFor, serviceSlug, type Locale,
} from '@havre/i18n';
import { servicesForPhase, type ServiceType } from '@havre/core';
import { Sym } from '@/components/Sym';
import { SERVICE_SYM } from '@/components/ServiceIcon';
import { DateRangeField } from '@/components/ui/DateRangeField';

/**
 * ANA ARAMA KUTUSU (.st-search).
 *
 * Ana sayfanin icinde elle yazilmisti. Sehir+hizmet sayfasi da ayni
 * kutuyu istiyor ve orada eski `.searchbar` duruyordu: AYNI sayfada
 * yeni tasarim dilinde bir kahraman ile eski dilde bir arama kutusu
 * yan yanaydi. Kopyalamak yerine tasindi — bir sonraki sayfa da bunu
 * kullanacak ve kutu tek yerden degisecek.
 *
 * SUNUCU BILESENI: form bir GET formu, hicbir yerinde durum yok.
 * (Tek istemci parcasi DateRangeField, kendi icinde.)
 *
 * SERVIS SEKMESI ONCEDEN SECILI GELEBILIR: sehir+hizmet sayfasina
 * gelen kisi hizmeti ZATEN secmis; sekmenin ilkini isaretlemek, o
 * kisinin secimini sessizce degistirmek olurdu.
 */
const LIVE_SERVICES = servicesForPhase('v1');

export function StSearch({
  locale, cityLabel, selected, defaultLocation,
}: {
  locale: Locale;
  /** Yer tutucudaki sehir adi — "Toronto'da mahalle veya posta kodu" */
  cityLabel: string;
  /** Isaretli gelecek hizmet; verilmezse ilki */
  selected?: ServiceType | undefined;
  /** Konum alaninin dolu gelecek degeri */
  defaultLocation?: string | undefined;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const active = selected ?? LIVE_SERVICES[0]!;

  return (
    <form className="st-search" action={`/${seg}/search/`} method="get">
      <div className="st-tabs">
        {LIVE_SERVICES.map((sv) => (
          <label key={sv} className="st-tab">
            <input
              type="radio"
              name="service"
              value={serviceSlug(sv, locale)}
              defaultChecked={sv === active}
            />
            <Sym name={SERVICE_SYM[sv]} size={18} />
            <span>{m.service[sv]}</span>
          </label>
        ))}
      </div>

      <div className="st-fields">
        <div className="st-field st-field-wide">
          <label htmlFor="hs-where">{m.search.location}</label>
          <div className="st-field-row">
            <Sym name="location" size={20} className="st-ic-sage" />
            <input
              id="hs-where"
              name="location"
              type="text"
              defaultValue={defaultLocation}
              placeholder={interpolate(m.home.searchWherePlaceholder, { city: cityLabel })}
            />
          </div>
        </div>

        {/*
          TARIH — tasarimda TEK satir ("18 oct – 22 oct"), tek takvim
          ikonu. Iki ham <input type="date"> yan yana konunca tarayici
          her birine KENDI takvim dugmesini ciziyordu.

          DateRangeField: JavaScript gelmeden iki native alan (form yine
          calisir), geldikten sonra tek ozetli dugme + takvim paneli.
        */}
        <div className="st-field st-field-dates">
          <span className="st-field-label">{m.search.dates}</span>
          <div className="st-field-row">
            <Sym name="calendar" size={20} className="st-ic-coral" />
            <DateRangeField
              locale={locale}
              startName="start"
              endName="end"
              label={m.search.dates}
            />
          </div>
        </div>

        <div className="st-field">
          <label htmlFor="hs-pet">{m.search.pet}</label>
          <div className="st-field-row">
            <Sym name="rabbit" size={20} className="st-ic-gold" />
            <input
              id="hs-pet"
              name="weight"
              type="number"
              min={1}
              max={100}
              placeholder={m.home.searchPetPlaceholder}
            />
          </div>
        </div>

        <button type="submit" className="st-search-btn">
          <Sym name="search" size={22} />
          <span>{m.search.submit}</span>
        </button>
      </div>

      <ul className="st-ribbon">
        <li><Sym name="verified" size={18} />{m.home.ribbonChecks}</li>
        <li><Sym name="shield" size={18} />{m.home.ribbonFees}</li>
        <li><Sym name="calendar" size={18} />{m.home.ribbonExpiry}</li>
        <li className="st-ribbon-accent"><Sym name="globe" size={18} />{m.home.ribbonCanada}</li>
      </ul>
    </form>
  );
}
