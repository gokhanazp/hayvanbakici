import type { CSSProperties } from 'react';

/**
 * EL CIZIMI KONTURLAR.
 *
 * Tasarim yonunun imzasi: krem zemin uzerinde serbest cizgiler — kalp, pati,
 * tasma, cizgiler.
 *
 * NEDEN TEK BUYUK SVG DEGIL: ilk surum 900x470'lik tek bir viewBox'ti ve
 * kapsayicinin oranina gore olceklendigi icin konturlar kaydi — ikisi arama
 * kartinin arkasina dusup yarim gorundu. Her kontur artik KENDI kucuk
 * svg'sinde ve yuzdeyle konumlandiriliyor; kapsayici ne kadar genis olursa
 * olsun oldugu yerde kaliyor ve orani bozulmuyor.
 *
 * KONUM KURALI: hicbiri metin sutununa (soldaki ilk %52) girmez.
 *
 * aria-hidden: tamamen dekoratif.
 */

function Doodle({ style, children, viewBox }: {
  style: CSSProperties;
  viewBox: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ position: 'absolute', ...style }}
    >
      {children}
    </svg>
  );
}

export function HeroDoodles() {
  return (
    <div className="hero-doodles" aria-hidden="true">
      {/* kalp — sol sutunun sagindan baslar */}
      <Doodle viewBox="0 0 40 36" style={{ left: '54%', top: '6%', width: 40, height: 36 }}>
        <path d="M20 33S3 22 3 12.5A8 8 0 0 1 20 8a8 8 0 0 1 17 4.5C37 22 20 33 20 33Z"
          stroke="var(--color-primary)" strokeWidth="2.6" strokeLinejoin="round" opacity=".45" />
      </Doodle>

      {/* tasma kavisi */}
      <Doodle viewBox="0 0 60 90" style={{ left: '70%', top: '2%', width: 60, height: 90 }}>
        <path d="M14 88C36 62 58 40 46 18 40 7 24 9 22 22c-2 12 12 16 18 8"
          stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" opacity=".55" />
      </Doodle>

      {/* pati */}
      <Doodle viewBox="0 0 54 50" style={{ right: '3%', top: '8%', width: 54, height: 50 }}>
        <g fill="var(--color-accent)" opacity=".5">
          <ellipse cx="10" cy="14" rx="6" ry="8" />
          <ellipse cx="24" cy="7" rx="5.5" ry="7.5" />
          <ellipse cx="38" cy="12" rx="5.5" ry="7.5" />
          <ellipse cx="48" cy="24" rx="5.5" ry="7.5" />
          <path d="M10 33c0-9 8-16 17-16s17 7 17 16-8 13-17 13-17-4-17-13Z" />
        </g>
      </Doodle>

      {/*
        Sol alt kosede bir cizgi kumesi daha vardi; arama karti kahramanin
        altina bindigi icin yarim gorunuyordu. Kaldirildi — kahraman zaten
        yeterince kalabalik.
      */}
      {/* hiz cizgileri */}
      <Doodle viewBox="0 0 34 44" style={{ right: '1%', top: '48%', width: 34, height: 44 }}>
        <g stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" opacity=".38">
          <path d="M12 8c-9 8-9 22 0 30" />
          <path d="M28 4c-14 12-14 32 0 40" />
        </g>
      </Doodle>

    </div>
  );
}

/** Bakici banneri icin daha sade bir kume */
export function BannerDoodles() {
  return (
    <div className="banner-doodles" aria-hidden="true">
      <Doodle viewBox="0 0 54 50" style={{ right: '8%', top: '14%', width: 68, height: 62 }}>
        <g fill="var(--color-accent)" opacity=".32">
          <ellipse cx="10" cy="14" rx="6" ry="8" />
          <ellipse cx="24" cy="7" rx="5.5" ry="7.5" />
          <ellipse cx="38" cy="12" rx="5.5" ry="7.5" />
          <ellipse cx="48" cy="24" rx="5.5" ry="7.5" />
          <path d="M10 33c0-9 8-16 17-16s17 7 17 16-8 13-17 13-17-4-17-13Z" />
        </g>
      </Doodle>
      <Doodle viewBox="0 0 70 30" style={{ right: '16%', bottom: '16%', width: 70, height: 30 }}>
        <path d="M4 26C14 4 56 4 66 26" stroke="var(--color-accent)" strokeWidth="3.5"
          strokeLinecap="round" opacity=".45" />
      </Doodle>
    </div>
  );
}
