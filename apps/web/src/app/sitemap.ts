import type { MetadataRoute } from 'next';
import { evaluateIndexability, servicesForPhase } from '@havre/core';
import { LOCALES, serviceSlug } from '@havre/i18n';
import { CITIES, citySlug, getLandingData } from '@/lib/data';
import { landingUrl, urlFor } from '@/lib/seo';

/**
 * DINAMIK SITEMAP.
 * KURAL: Yalnizca ARZ ESIGINI GECEN sayfalar dahil edilir.
 * Bos veya ince sayfayi sitemap'e koymak, Google'a "bu sayfa degerli" demektir —
 * degilse tum sitenin guveni zarar gorur.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const services = servicesForPhase('v1');

  for (const locale of LOCALES) {
    entries.push({ url: urlFor(locale), changeFrequency: 'daily', priority: 1 });

    for (const service of services) {
      entries.push({
        url: urlFor(locale, serviceSlug(service, locale)),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    for (const city of CITIES) {
      for (const service of services) {
        const data = await getLandingData(city, service, locale);
        const rule = evaluateIndexability({ sitterCount: data.sitterCount });
        if (!rule.index) continue; // <- arz esigi kurali

        entries.push({
          url: landingUrl(city, service, locale),
          lastModified: new Date(data.dataAsOf),
          changeFrequency: 'daily',
          priority: city.tier === 1 ? 0.9 : 0.6,
          alternates: {
            languages: Object.fromEntries(
              LOCALES.map((l) => [l, landingUrl(city, service, l)]),
            ),
          },
        });
      }
      void citySlug;
    }
  }

  return entries;
}
