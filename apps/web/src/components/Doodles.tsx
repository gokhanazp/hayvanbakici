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


/* ------------------------------------------------ BOLUM KONTURLARI */

/**
 * ALT BOLUMLER ICIN SERIT — KAHRAMANIN AYNISI, AMA SESSIZ.
 *
 * Kahramandaki fikir sayfanin geri kalaninda birakiliyordu: ilk ekrandan
 * sonra zemin duz krem oluyor ve sayfa "baska bir siteye" gecmis gibi
 * okunuyordu. Ayni serit mantigi alt bolumlerde de var, uc farkla:
 *
 *  1. DAHA SEYREK. Bolum basina iki-uc sekil. Kahraman bir kez
 *     goruluyor, alt bolumler pes pese geliyor; ayni yogunluk konfetiye
 *     donuyordu.
 *  2. DAHA SOLUK. Opaklik kahramanin yaklasik yarisi: burada sekiller
 *     ICERIGE eslik ediyor, sahne kurmuyor.
 *  3. ANIMASYON YOK. Kahramandaki suzulme bilincli olarak burada
 *     tekrarlanmiyor: ekranin disindaki bir animasyon pil harciyor ve
 *     kimse gormuyor. Sayfadaki surekli animasyon sayisi artmadi.
 *
 * Konum kurali kahramandakiyle ayni: konturlar ICERIGIN DISINDA, iki
 * kenarda. 1280 altinda hic cizilmiyor — o genislikte kenar seridi
 * kalmiyor ve sekiller metnin altina giriyor.
 */
type Shape = 'paw' | 'heart' | 'bone' | 'fish' | 'ball';

interface RailSpec {
  side: RailSide;
  top: number;
  offset: number;
  size: number;
  rotate: number;
  shape: Shape;
  tone: 'primary' | 'accent';
  opacity: number;
}

const VIEWBOX: Record<Shape, string> = {
  paw: '0 0 54 50',
  heart: '0 0 40 36',
  bone: '0 0 48 26',
  fish: '0 0 42 32',
  ball: '0 0 34 34',
};

function shapeOf(shape: Shape, color: string, opacity: number): ReactNode {
  switch (shape) {
    case 'paw': return <Paw color={color} opacity={opacity} />;
    case 'heart': return <Heart color={color} opacity={opacity} width={2.2} />;
    case 'bone': return <Bone color={color} opacity={opacity} />;
    case 'fish': return <Fish color={color} opacity={opacity} />;
    case 'ball': return <Ball color={color} opacity={opacity} />;
  }
}

/**
 * Hazir dizilimler. Her bolum kendi kumesini secmiyor, ISMIYLE
 * cagiriyor: boylece yogunluk tek yerden gorulebiliyor ve iki bolum
 * yanlislikla ayni dizilimi almiyor.
 */
const SETS = {
  /*
    DUZ KREM ZEMINDE DAHA KOYU. Bantlarda ise yarayan opaklik burada
    kayboluyordu: krem, blush veya adacayindan acik, dolayisiyla ayni
    deger daha az kontrast veriyor. Deger zemine gore secildi, tek bir
    "sekil opakligi" diye bir sey yok.
  */
  services: [
    { side: 'left', top: 16, offset: 0.3, size: 46, rotate: -11, shape: 'bone', tone: 'accent', opacity: 0.4 },
    { side: 'left', top: 62, offset: -0.1, size: 58, rotate: 9, shape: 'paw', tone: 'primary', opacity: 0.22 },
    { side: 'right', top: 24, offset: -0.18, size: 64, rotate: 12, shape: 'heart', tone: 'primary', opacity: 0.24 },
    { side: 'right', top: 70, offset: 0.34, size: 38, rotate: -7, shape: 'ball', tone: 'accent', opacity: 0.38 },
  ],
  features: [
    { side: 'left', top: 12, offset: -0.2, size: 70, rotate: 13, shape: 'paw', tone: 'accent', opacity: 0.2 },
    { side: 'left', top: 46, offset: 0.36, size: 40, rotate: -8, shape: 'fish', tone: 'primary', opacity: 0.14 },
    { side: 'left', top: 80, offset: 0.04, size: 52, rotate: 6, shape: 'heart', tone: 'accent', opacity: 0.18 },
    { side: 'right', top: 18, offset: 0.28, size: 44, rotate: -13, shape: 'ball', tone: 'primary', opacity: 0.14 },
    { side: 'right', top: 52, offset: -0.24, size: 76, rotate: 10, shape: 'bone', tone: 'accent', opacity: 0.2 },
    { side: 'right', top: 84, offset: 0.16, size: 48, rotate: -6, shape: 'paw', tone: 'primary', opacity: 0.12 },
  ],
  /* Referanslar BEYAZ bant uzerinde — en acik zemin, en koyu sekiller. */
  testimonials: [
    { side: 'left', top: 22, offset: 0.22, size: 52, rotate: 8, shape: 'heart', tone: 'primary', opacity: 0.26 },
    { side: 'left', top: 68, offset: -0.16, size: 62, rotate: -10, shape: 'paw', tone: 'accent', opacity: 0.36 },
    { side: 'right', top: 34, offset: -0.2, size: 56, rotate: -9, shape: 'fish', tone: 'primary', opacity: 0.24 },
    { side: 'right', top: 78, offset: 0.3, size: 42, rotate: 11, shape: 'bone', tone: 'accent', opacity: 0.38 },
  ],
  /* Ic sayfa basligi — bant alcak, iki sekil yetiyor. */
  pageHead: [
    { side: 'left', top: 26, offset: -0.12, size: 58, rotate: -9, shape: 'bone', tone: 'accent', opacity: 0.26 },
    { side: 'left', top: 72, offset: 0.3, size: 40, rotate: 12, shape: 'ball', tone: 'primary', opacity: 0.18 },
    { side: 'right', top: 18, offset: 0.26, size: 46, rotate: -12, shape: 'paw', tone: 'accent', opacity: 0.28 },
    { side: 'right', top: 64, offset: -0.18, size: 66, rotate: 9, shape: 'heart', tone: 'primary', opacity: 0.18 },
  ],
  fees: [
    { side: 'left', top: 30, offset: -0.14, size: 60, rotate: -7, shape: 'ball', tone: 'accent', opacity: 0.36 },
    { side: 'right', top: 26, offset: 0.26, size: 50, rotate: 10, shape: 'paw', tone: 'primary', opacity: 0.22 },
    { side: 'right', top: 74, offset: -0.18, size: 64, rotate: -12, shape: 'heart', tone: 'accent', opacity: 0.34 },
  ],
} satisfies Record<string, readonly RailSpec[]>;

export type DoodleSet = keyof typeof SETS;

export function SectionDoodles({ set }: { set: DoodleSet }) {
  const specs = SETS[set] as readonly RailSpec[];
  return (
    <div className="section-doodles" aria-hidden="true">
      <div className="doodle-rail doodle-rail-left">
        {specs.filter((d) => d.side === 'left').map((d, i) => (
          <Rail
            key={`l${i}`} side="left" top={d.top} offset={d.offset}
            size={d.size} rotate={d.rotate} viewBox={VIEWBOX[d.shape]}
          >
            {shapeOf(d.shape, d.tone === 'primary' ? PRIMARY : ACCENT, d.opacity)}
          </Rail>
        ))}
      </div>
      <div className="doodle-rail doodle-rail-right">
        {specs.filter((d) => d.side === 'right').map((d, i) => (
          <Rail
            key={`r${i}`} side="right" top={d.top} offset={d.offset}
            size={d.size} rotate={d.rotate} viewBox={VIEWBOX[d.shape]}
          >
            {shapeOf(d.shape, d.tone === 'primary' ? PRIMARY : ACCENT, d.opacity)}
          </Rail>
        ))}
      </div>
    </div>
  );
}
