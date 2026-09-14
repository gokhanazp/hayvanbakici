import type { CSSProperties, ReactNode } from 'react';

/**
 * EL CIZIMI KONTURLAR.
 *
 * Tasarim yonunun imzasi: sicak zemin uzerinde serbest cizgiler — kalp,
 * pati, kemik, balik, top.
 *
 * NEDEN TEK BUYUK SVG DEGIL: ilk surum 900x470'lik tek bir viewBox'ti ve
 * kapsayicinin oranina gore olceklendigi icin konturlar kaydi — ikisi arama
 * kartinin arkasina dusup yarim gorundu. Her kontur artik KENDI kucuk
 * svg'sinde ve yuzdeyle konumlandiriliyor; kapsayici ne kadar genis olursa
 * olsun oldugu yerde kaliyor ve orani bozulmuyor.
 *
 * KONUM KURALI — metin kutulari OLCULEREK belirlendi (1000/1280/1440/1700):
 *   metin sutunu      : sol %2,7 – %48,8 · dikey %16 – %72
 *   fotograf kolaji   : sol %62 – %97 · dikey %8 – %80
 *   arama karti       : alttan ~%11'i kapatiyor
 * Konturlar bu uc dikdortgenin DISINDA duruyor. Fotografin arkasina
 * konan bir kontur gorunmez (opak fotograf), metnin arkasina konan ise
 * okunurlugu bozuyor — ilk denemede kalp basligin uzerine binmisti.
 *
 * Her kontur birkac derece DONDURULMUS ve dikeyde kaydirilmis: ayni
 * hizada duran uc pati "ikon seridi" gibi okunuyordu, serpistirilmis
 * olanlar el cizimi hissini veriyor. Donme getBoundingClientRect'e
 * yansidigi icin cakisma testi dondurulmus haliyle olcuyor.
 *
 * aria-hidden: tamamen dekoratif.
 */

function Doodle({ style, children, viewBox, className }: {
  style: CSSProperties;
  viewBox: string;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ position: 'absolute', ...style }}
    >
      {children}
    </svg>
  );
}

/* ---------- Sekiller ---------- */

function Heart({ color, opacity, width = 2.6 }: { color: string; opacity: number; width?: number }) {
  return (
    <path
      d="M20 33S3 22 3 12.5A8 8 0 0 1 20 8a8 8 0 0 1 17 4.5C37 22 20 33 20 33Z"
      stroke={color} strokeWidth={width} strokeLinejoin="round" opacity={opacity}
    />
  );
}

function Paw({ color, opacity }: { color: string; opacity: number }) {
  return (
    <g fill={color} opacity={opacity}>
      <ellipse cx="10" cy="14" rx="6" ry="8" />
      <ellipse cx="24" cy="7" rx="5.5" ry="7.5" />
      <ellipse cx="38" cy="12" rx="5.5" ry="7.5" />
      <ellipse cx="48" cy="24" rx="5.5" ry="7.5" />
      <path d="M10 33c0-9 8-16 17-16s17 7 17 16-8 13-17 13-17-4-17-13Z" />
    </g>
  );
}

/** Kemik — kopek tarafi. Kedi tarafi icin balik var. */
function Bone({ color, opacity }: { color: string; opacity: number }) {
  return (
    <path
      d="M12 14a6 6 0 1 1 8-5.6h16A6 6 0 1 1 44 14a6 6 0 1 1-8 5.6H20A6 6 0 1 1 12 14Z"
      stroke={color} strokeWidth="2.6" strokeLinejoin="round" opacity={opacity}
    />
  );
}

function Fish({ color, opacity }: { color: string; opacity: number }) {
  return (
    <g stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      <path d="M4 16c7-9 20-9 27 0-7 9-20 9-27 0Z" />
      <path d="M31 16l7-6v12l-7-6Z" />
    </g>
  );
}

/*
  Oyuncak top. Burada once "hiz cizgileri" vardi (iki yay); tek basina
  duran iki yay parantez gibi okunuyordu — anlami olmayan bir sus.
  Konturlarin hepsi taninabilir bir sey olmali: kalp, pati, kemik, balik, top.
*/
function Ball({ color, opacity }: { color: string; opacity: number }) {
  return (
    <g stroke={color} strokeWidth="2.4" strokeLinecap="round" opacity={opacity}>
      <circle cx="17" cy="17" r="13" />
      <path d="M5 12c8 2 16 8 21 16" />
      <path d="M8 26c4-9 11-16 21-19" />
    </g>
  );
}

const PRIMARY = 'var(--color-primary)';
const ACCENT = 'var(--color-accent)';

export function HeroDoodles() {
  return (
    <div className="hero-doodles" aria-hidden="true">
      {/* ---- SOL: metin sutununun USTU (dikey %0–%15 bos) ---- */}
      <Doodle viewBox="0 0 54 50" style={{ left: '1.5%', top: '1%', width: 44, height: 41, transform: 'rotate(-12deg)' }}>
        <Paw color={ACCENT} opacity={0.34} />
      </Doodle>
      <Doodle viewBox="0 0 40 36" style={{ left: '11%', top: '4%', width: 26, height: 23, transform: 'rotate(11deg)' }}>
        <Heart color={PRIMARY} opacity={0.3} width={3} />
      </Doodle>
      <Doodle viewBox="0 0 48 26" style={{ left: '21%', top: '0.5%', width: 46, height: 25, transform: 'rotate(-7deg)' }}>
        <Bone color={ACCENT} opacity={0.28} />
      </Doodle>

      {/* ---- SOL: metin sutununun ALTI ----
           Ust sinir metin sutununun alti, alt sinir arama kartinin ustu.
           Bu pencere 1100px altinda kapaniyor (metin sutunu uzuyor), o
           genislikte CSS ile gizleniyorlar. */}
      <Doodle viewBox="0 0 40 36" className="doodle-lower" style={{ left: '2%', bottom: '16%', width: 34, height: 31, transform: 'rotate(-9deg)' }}>
        <Heart color={PRIMARY} opacity={0.38} />
      </Doodle>
      <Doodle viewBox="0 0 54 50" className="doodle-lower" style={{ left: '11.5%', bottom: '13.5%', width: 30, height: 28, transform: 'rotate(15deg)' }}>
        <Paw color={ACCENT} opacity={0.3} />
      </Doodle>
      <Doodle viewBox="0 0 42 32" className="doodle-lower" style={{ left: '21%', bottom: '16.5%', width: 38, height: 29, transform: 'rotate(-5deg)' }}>
        <Fish color={PRIMARY} opacity={0.26} />
      </Doodle>
      <Doodle viewBox="0 0 34 34" className="doodle-lower" style={{ left: '32%', bottom: '13.5%', width: 28, height: 28, transform: 'rotate(9deg)' }}>
        <Ball color={ACCENT} opacity={0.32} />
      </Doodle>

      {/* ---- ORTA BOSLUK: metin ile fotograf arasi (%49–%62) ----
           1100px altinda bu bosluk kapaniyor ve konturlar fotografin
           arkasina dusuyor; o genislikte CSS ile gizleniyorlar. */}
      <Doodle viewBox="0 0 40 36" className="doodle-gap" style={{ left: '53%', top: '4%', width: 40, height: 36, transform: 'rotate(-6deg)' }}>
        <Heart color={PRIMARY} opacity={0.45} />
      </Doodle>
      <Doodle viewBox="0 0 54 50" className="doodle-gap" style={{ left: '52.5%', top: '44%', width: 34, height: 31, transform: 'rotate(18deg)' }}>
        <Paw color={ACCENT} opacity={0.32} />
      </Doodle>
      <Doodle viewBox="0 0 40 36" className="doodle-gap" style={{ left: '54%', bottom: '13%', width: 24, height: 22, transform: 'rotate(13deg)' }}>
        <Heart color={PRIMARY} opacity={0.28} width={3.2} />
      </Doodle>
    </div>
  );
}

/** Bakici banneri icin daha sade bir kume */
export function BannerDoodles() {
  return (
    <div className="banner-doodles" aria-hidden="true">
      <Doodle viewBox="0 0 54 50" style={{ right: '8%', top: '14%', width: 68, height: 62 }}>
        <Paw color={ACCENT} opacity={0.32} />
      </Doodle>
      <Doodle viewBox="0 0 70 30" style={{ right: '16%', bottom: '16%', width: 70, height: 30 }}>
        <path d="M4 26C14 4 56 4 66 26" stroke={ACCENT} strokeWidth="3.5"
          strokeLinecap="round" opacity=".45" />
      </Doodle>
    </div>
  );
}
