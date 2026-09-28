import Link from 'next/link';
import { type ServiceType } from '@havre/core';
import { getMessages, interpolate, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { WaitlistForm } from '@/components/WaitlistForm';
import { citySlug, cityName, type CityRecord } from '@/lib/data';

/**
 * HENUZ ACILMAMIS SEHIR.
 *
 * NEDEN 404 DEGIL: "Ottawa'da kopek pansiyonu" arayan biri bizim icin
 * bir bilgi. Kapiyi yuzune kapatmak o bilgiyi de atmak olurdu. Ama
 * sayfa ACIKCA soyluyor: burada henuz yokuz. Bakici karti, fiyat
 * araligi, "rezervasyon iste" dugmesi YOK — hicbiri dogru olmazdi.
 *
 * NEDEN NOINDEX: Google'a hizmet vermedigimiz bir sehrin sayfasini
 * sunmak, tiklayan herkese tutamadigimiz bir soz vermek demek. Sehir
 * acildigi gun sayfa kendiliginden normal haline donuyor ve
 * indekslenmeye baslanir.
 *
 * ACIK SEHIRLER LISTESI ALTTA: gelen kisiye kapiyi kapatmak yerine
 * bugun nerede oldugumuzu soyluyoruz.
 */
export function ComingSoon({
  locale, city, service, liveCities, action,
}: {
  locale: Locale;
  city: CityRecord;
  service: ServiceType;
  liveCities: CityRecord[];
  action: (prev: unknown, form: FormData) => Promise<unknown>;
}) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const name = cityName(city, locale);
  const svc = m.service[service];

  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
      <div className="coming-soon">
        <p className="eyebrow-plain">{svc}</p>
        <h1 className="text-h1">{interpolate(m.coverage.heading, { city: name })}</h1>
        <p className="text-body-lg muted">{interpolate(m.coverage.lead, { city: name })}</p>

        <div className="coming-soon-form">
          <WaitlistForm
            locale={locale}
            citySlug={citySlug(city, locale)}
            cityName={name}
            serviceType={service}
            action={action as never}
          />
        </div>

        {liveCities.length > 0 && (
          <section className="coming-soon-open">
            <h2 className="text-h4">{m.coverage.openHeading}</h2>
            <div className="row">
              {liveCities.map((c) => (
                <Link
                  key={c.id}
                  href={`/${seg}/${citySlug(c, locale)}/${serviceSlug(service, locale)}/`}
                  className="chip"
                >
                  {cityName(c, locale)}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/*
          BAKICI DAVETI BURADA. Bu sayfayi acan kisi bazen hayvan sahibi
          degil, o sehirde bakicilik yapmak isteyen biri. Basvuru kapali
          sehirlerde de ACIK: sehri acabilmemiz icin once orada bakici
          olmasi gerekiyor. Ekran bunu oldugu gibi soyluyor -- "hemen
          kazanmaya baslayin" demiyor.
        */}
        <section className="coming-soon-sitter">
          <h2 className="text-h4">{interpolate(m.coverage.sitterHeading, { city: name })}</h2>
          <p className="muted text-body-sm">{m.coverage.sitterBody}</p>
          <Link href={`/${seg}/become-a-sitter/`} className="btn btn-secondary">
            {m.nav.becomeSitter}
          </Link>
        </section>
      </div>
    </div>
  );
}
