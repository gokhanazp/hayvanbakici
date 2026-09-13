/**
 * SEO YARDIMCILARI (yol haritasi §7).
 *
 * En kritik iki kural:
 *  1. hreflang CIFT YONLU ve KENDINE REFERANSLI olmali (Rover bunu Kanada'da yapmiyor)
 *  2. Arz esigi kuralı robots meta'sini belirler
 */
import type { Metadata } from 'next';
import type { ServiceType } from '@havre/core';
import { evaluateIndexability } from '@havre/core';
import { LOCALES, segmentFor, serviceSlug, type Locale } from '@havre/i18n';
import { citySlug, type CityRecord } from './data';

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://havre.ca';

export function urlFor(locale: Locale, ...segments: string[]): string {
  const path = segments.filter(Boolean).join('/');
  return `${SITE_URL}/${segmentFor(locale)}${path ? `/${path}` : ''}/`;
}

export function landingUrl(city: CityRecord, service: ServiceType, locale: Locale): string {
  return urlFor(locale, citySlug(city, locale), serviceSlug(service, locale));
}

/**
 * Tum dil versiyonlarini uretir — her sayfa KENDISI DAHIL hepsini referans verir.
 * x-default -> Ingilizce.
 */
export function alternatesFor(
  city: CityRecord,
  service: ServiceType,
  current: Locale,
): Metadata['alternates'] {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = landingUrl(city, service, l);
  languages['x-default'] = landingUrl(city, service, 'en-CA');
  return { canonical: landingUrl(city, service, current), languages };
}

/** Arz esigi kuralini robots meta'sina cevirir */
export function robotsFor(sitterCount: number): Metadata['robots'] {
  const r = evaluateIndexability({ sitterCount });
  return { index: r.index, follow: r.follow };
}

// ---------------------------------------------------------------------------
// JSON-LD
// ---------------------------------------------------------------------------

/**
 * ⚠️ GOOGLE KURALI: "Incelenen varlik kendisi hakkindaki yorumlari kontrol
 * ediyorsa, LocalBusiness/Organization kullanan sayfalar yildiz degerlendirme
 * ozelligi icin uygun DEGILDIR."
 *
 * -> AggregateRating YALNIZCA bakici profil sayfalarinda kullanilir.
 * -> Kendi markamiz icin ASLA (self-serving ihlali).
 */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: 'Havre',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/logo.png`,
        areaServed: { '@type': 'Country', name: 'Canada' },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        inLanguage: ['en-CA', 'fr-CA'],
        publisher: { '@id': `${SITE_URL}/#org` },
      },
    ],
  };
}

export interface LandingJsonLdInput {
  city: CityRecord;
  service: ServiceType;
  locale: Locale;
  serviceName: string;
  cityName: string;
  provinceName: string;
  sitterCount: number;
  p25: number;
  p75: number;
  faqs: Array<{ q: string; a: string }>;
  sitterUrls: string[];
  homeLabel: string;
}

export function landingJsonLd(input: LandingJsonLdInput) {
  const url = landingUrl(input.city, input.service, input.locale);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: input.homeLabel, item: urlFor(input.locale) },
          { '@type': 'ListItem', position: 2, name: input.provinceName },
          { '@type': 'ListItem', position: 3, name: input.cityName },
          { '@type': 'ListItem', position: 4, name: input.serviceName },
        ],
      },
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: `${input.serviceName} ${input.cityName}`,
        serviceType: input.serviceName,
        provider: { '@type': 'Organization', '@id': `${SITE_URL}/#org` },
        areaServed: {
          '@type': 'City',
          name: input.cityName,
          address: {
            '@type': 'PostalAddress',
            addressLocality: input.cityName,
            addressRegion: input.city.province,
            addressCountry: 'CA',
          },
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'CAD',
          lowPrice: (input.p25 / 100).toFixed(2),
          highPrice: (input.p75 / 100).toFixed(2),
          offerCount: String(input.sitterCount),
        },
      },
      {
        '@type': 'ItemList',
        numberOfItems: input.sitterCount,
        itemListElement: input.sitterUrls.map((u, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: u,
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: input.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

/**
 * BAKICI PROFILI — JSON-LD.
 *
 * Person DEGIL, ProvideService: sayfanin konusu kisinin kendisi degil,
 * sundugu hizmet. Ayrica Person semasi arama sonuclarinda kisisel bilgi
 * cekmeye davet ediyor; biz soyadi bile gostermiyoruz.
 *
 * aggregateRating YALNIZCA gercek yorum varsa eklenir. Sifir yorumla
 * derecelendirme isaretlemek Google'in yapisal veri politikasina aykiri ve
 * zengin sonuc cezasi sebebi.
 */
export function sitterJsonLd(input: {
  name: string;
  url: string;
  cityName: string;
  province: string;
  description: string | null;
  rating: number;
  reviewCount: number;
  services: Array<{ name: string; priceCents: number }>;
}) {
  const lowest = input.services.length
    ? Math.min(...input.services.map((s) => s.priceCents))
    : null;

  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    url: input.url,
    serviceType: input.services.map((s) => s.name),
    ...(input.description ? { description: input.description } : {}),
    areaServed: {
      '@type': 'City',
      name: input.cityName,
      address: { '@type': 'PostalAddress', addressRegion: input.province, addressCountry: 'CA' },
    },
    provider: { '@type': 'Organization', name: 'Havre', url: SITE_URL },
    ...(lowest !== null
      ? {
          offers: {
            '@type': 'Offer',
            priceCurrency: 'CAD',
            price: (lowest / 100).toFixed(2),
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    ...(input.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.rating.toFixed(1),
            reviewCount: input.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}
