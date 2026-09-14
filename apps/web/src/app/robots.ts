import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

/**
 * ROBOTS.TXT (yol haritasi §7.4).
 *
 * En kritik karar: /search/ TAMAMEN ENGELLI (Rover modeli).
 * Filtreli arama bir URUN ozelligidir, SEO varligi degildir.
 * Google'a bildirilen tarama sorunlarinin %50'si faceted navigation kaynakli.
 *
 * AI crawler'lar ACIK: sitelerin %73'unde erisim engeli var — en ucuz avantaj.
 * UYARI: Cloudflare/CDN bot yonetiminde de beyaz listeye alinmali,
 * yoksa buradaki izin tek basina ise yaramaz.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          // Yonetici paneli: duzen ayrica noindex gonderiyor, bu ikinci kilit
          '/admin/',
          '/search/',
          '/checkout/',
          '/messages/',
          '/account/',
          '/*?sort=',
          '/*?utm_',
          '/*?start=',
          '/*?lat=',
        ],
      },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
