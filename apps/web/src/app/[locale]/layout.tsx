import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMessages, localeFromSegment, LOCALES, segmentFor } from '@havre/i18n';
import { Header } from '@/components/Header';
import { organizationJsonLd, SITE_URL } from '@/lib/seo';

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: segmentFor(l) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> },
): Promise<Metadata> {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) return {};
  const m = getMessages(locale);

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${m.brand.name} — ${m.brand.tagline}`, template: `%s · ${m.brand.name}` },
    description: m.home.heroSubtitle,
    openGraph: { siteName: m.brand.name, locale, type: 'website' },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: seg } = await params;
  const locale = localeFromSegment(seg);
  if (!locale) notFound();

  const m = getMessages(locale);

  return (
    <html lang={locale}>
      <body>
        {/* WCAG 2.4.1 — icerige atlama baglantisi */}
        <a href="#main" className="sr-only">Skip to content</a>
        <Header locale={locale} />
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="container stack">
            <p>
              © {new Date().getFullYear()} {m.brand.name}
            </p>
            {/*
              Law 25: Gizlilik sorumlusunun adi ve iletisimi sitede YAYIMLANMALI.
              Atanmazsa varsayilan olarak CEO sorumludur.
            */}
            <p className="muted">
              {locale === 'fr-CA'
                ? 'Responsable de la protection des renseignements personnels : [ATANACAK]'
                : 'Privacy Officer: [TO BE APPOINTED]'}
            </p>
            <p className="muted">{m.verification.disclaimer}</p>
          </div>
        </footer>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </body>
    </html>
  );
}
