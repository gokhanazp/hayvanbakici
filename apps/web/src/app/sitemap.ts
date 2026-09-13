import type { MetadataRoute } from 'next';
import { evaluateIndexability, servicesForPhase } from '@havre/core';
import { LOCALES, serviceSlug } from '@havre/i18n';
import { getCities, getLandingData, getSitterSlugsForBuild } from '@/lib/data';
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
  const cities = await getCities();

  for (const locale of LOCALES) {
    entries.push({ url: urlFor(locale), changeFrequency: 'daily', priority: 1 });

    /*
      HIZMET HUB SAYFALARI (/en/dog-boarding) SITEMAP'TE DEGIL.
      Daha once buraya ekleniyorlardi ama o rotalar HENUZ YOK ve 404
      donuyorlardi — tarayicida dogrulandi. Sitemap'e 404 koymak, Google'a
      "bu adresler var" demektir ve sitenin taranma guvenini zedeler.
      Rotalar yazildiginda bu blok geri gelir.
    */

    for (const city of cities) {
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
    }
  }

  /*
    BAKICI PROFILLERI.
    Yalnizca Tier-1 sehirlerin aktif bakicilari — listSitterSlugsForBuild
    zaten status='active' ve slug IS NOT NULL suzuyor. Pasif ya da taslak bir
    bakicinin adresi sitemap'e girerse Google onu tarar ve 404 bulur.
  */
  const sitters = await getSitterSlugsForBuild();
  for (const s of sitters) {
    for (const locale of LOCALES) {
      const city = locale === 'fr-CA' ? s.citySlugFr : s.citySlugEn;
      entries.push({
        url: urlFor(locale, city, 'sitter', s.slug),
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: {
          languages: Object.fromEntries(
            LOCALES.map((l) => [
              l,
              urlFor(l, l === 'fr-CA' ? s.citySlugFr : s.citySlugEn, 'sitter', s.slug),
            ]),
          ),
        },
      });
    }
  }

  return entries;
}
