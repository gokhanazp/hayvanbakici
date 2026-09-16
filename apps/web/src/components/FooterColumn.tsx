'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * ALT BILGI SUTUNU — DAR EKRANDA AKORDEON.
 *
 * Telefonda alt bilgi yirmi baglantiyla alt alta uzuyordu: sayfanin
 * sonuna varmak icin iki ekran daha kaydirmak gerekiyor ve o
 * baglantilarin hicbiri aranmiyor. Katlanmis haliyle dort baslik, dort
 * dokunusluk mesafede.
 *
 * NEDEN ISTEMCI BILESENI — ve neden SUNUCUDA ACIK:
 *
 * `<details>` kapaliyken icerigi CSS ile ACILAMIYOR (tarayici bunu
 * `::details-content` / slot uzerinden yapiyor, cocuk `display`
 * kurallari ezmiyor). Yani "masaustunde hep acik, telefonda kapali"
 * medya sorgusuyla yazilamiyor.
 *
 * Sunucu her zaman ACIK ciziyor: JavaScript calismazsa da, arama
 * motoru gelirse de butun baglantilar ortada. Kapanma yalnizca
 * baglanma sonrasi ve yalnizca dar ekranda oluyor. Sunucu ile ilk
 * istemci cizimi ayni oldugu icin hydration uyusmazligi yok.
 */
export function FooterColumn({
  heading, children,
}: {
  heading: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  /*
    Daraltilabilir OLUP OLMADIGI da durumda: masaustunde ucgen
    isaretini ve dokunma hedefini hic cizmemek gerekiyor, yoksa
    baslik tiklanabilir gorunuyor ama bir ise yaramiyor.
  */
  const [collapsible, setCollapsible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const apply = () => {
      setCollapsible(mq.matches);
      /* Genis ekrana donuldugunde ZORLA aciliyor: kullanici telefonda
         kapatip tabletе dondugunde sutunun kaybolmasi sasirtici. */
      if (ref.current) ref.current.open = !mq.matches;
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <details ref={ref} className="footer-col" open data-collapsible={collapsible ? 'true' : undefined}>
      <summary className="footer-heading">
        {heading}
        <svg className="footer-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="footer-col-body">{children}</div>
    </details>
  );
}
