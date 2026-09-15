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

/**
 * KAHRAMAN KONTURLARI — IKI YANDA, TAM GENISLIKTE.
 *
 * Once konturlar konteynerin icine, metnin ustune ve altina ve metin
 * ile fotograf arasindaki bosluga serpistirilmisti. Uc sorunu vardi:
 * her yeni duzen degisikliginde konumlarin yeniden olculmesi
 * gerekiyordu (bosluk kapandiginda konturlar fotografin arkasina
 * dusuyordu), icerigin ortasinda durduklari icin okumayi bolüyorlardi,
 * ve bandin tam genisligi bos kaliyordu.
 *
 * Artik iki DIKEY SERIT halindeler: ekranin sol ve sag kenarinda,
 * icerigin disinda. Icerik hicbir genislikte konturla cakismiyor ve
 * konum hesabi tek bir seye bagli — kenara olan uzaklik.
 *
 * KENARDAN TASIYORLAR. Bir kismi ekran disinda kaliyor (bant
 * kirpiyor): bu hem daha buyuk, daha rahat sekiller kullanmayi
 * sagliyor hem de serit "kesilmis" degil "devam ediyor" gibi
 * okunuyor.
 *
 * Konum degerleri --edge degiskeninden turuyor; o da bandin kenari ile
 * konteynerin kenari arasindaki gercek mesafe (CSS'te hesaplaniyor).
 * Boylece 1280'de dar, 1700'de genis seride kendiliginden uyuyorlar.
 */
type RailSide = 'left' | 'right';

/**
 * Seritteki tek kontur.
 *
 * Kenardan uzaklik FIZIKSEL (left/right), mantiksal degil: konturlarin
 * yeri ekranin sag/sol kenarina gore tanimli, yazi yonune gore degil.
 * Fransizca da soldan saga yaziliyor; mantiksal ozellik burada yalnizca
 * bir hata kaynagiydi.
 */
function Rail({
  side, top, offset, size, rotate, viewBox, children,
}: {
  side: RailSide;
  /** Seridin icinde dikey konum (%) */
  top: number;
  /** Kenardan uzaklik — --edge'in kati. Negatif deger ekran disina tasirir. */
  offset: number;
  size: number;
  rotate: number;
  viewBox: string;
  children: ReactNode;
}) {
  const place = `calc(var(--edge) * ${offset})`;
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{
        position: 'absolute',
        top: `${top}%`,
        ...(side === 'left' ? { left: place } : { right: place }),
        width: size,
        height: 'auto',
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </svg>
  );
}

export function HeroDoodles() {
  return (
    <div className="hero-doodles" aria-hidden="true">
      {/* ---- SOL SERIT ---- */}
      <div className="doodle-rail doodle-rail-left">
        <Rail side="left" top={4} offset={0.18} size={56} rotate={-12} viewBox="0 0 54 50">
          <Paw color={ACCENT} opacity={0.34} />
        </Rail>
        <Rail side="left" top={19} offset={-0.22} size={78} rotate={10} viewBox="0 0 40 36">
          <Heart color={PRIMARY} opacity={0.24} width={2.2} />
        </Rail>
        <Rail side="left" top={38} offset={0.42} size={44} rotate={-6} viewBox="0 0 48 26">
          <Bone color={ACCENT} opacity={0.3} />
        </Rail>
        <Rail side="left" top={56} offset={-0.05} size={62} rotate={16} viewBox="0 0 42 32">
          <Fish color={PRIMARY} opacity={0.22} />
        </Rail>
        <Rail side="left" top={74} offset={0.3} size={38} rotate={-9} viewBox="0 0 34 34">
          <Ball color={ACCENT} opacity={0.3} />
        </Rail>
        <Rail side="left" top={88} offset={-0.28} size={70} rotate={8} viewBox="0 0 54 50">
          <Paw color={PRIMARY} opacity={0.18} />
        </Rail>
      </div>

      {/* ---- SAG SERIT ---- */}
      <div className="doodle-rail doodle-rail-right">
        <Rail side="right" top={6} offset={-0.24} size={72} rotate={14} viewBox="0 0 40 36">
          <Heart color={PRIMARY} opacity={0.22} width={2.2} />
        </Rail>
        <Rail side="right" top={22} offset={0.34} size={42} rotate={-8} viewBox="0 0 54 50">
          <Paw color={ACCENT} opacity={0.32} />
        </Rail>
        <Rail side="right" top={40} offset={-0.1} size={58} rotate={7} viewBox="0 0 48 26">
          <Bone color={PRIMARY} opacity={0.22} />
        </Rail>
        <Rail side="right" top={58} offset={0.4} size={36} rotate={-14} viewBox="0 0 34 34">
          <Ball color={ACCENT} opacity={0.3} />
        </Rail>
        <Rail side="right" top={72} offset={-0.26} size={74} rotate={11} viewBox="0 0 54 50">
          <Paw color={PRIMARY} opacity={0.18} />
        </Rail>
        <Rail side="right" top={89} offset={0.22} size={48} rotate={-5} viewBox="0 0 42 32">
          <Fish color={ACCENT} opacity={0.26} />
        </Rail>
      </div>
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
