/**
 * TASARIM YONLERI — GECICI.
 *
 * Her yon yalnizca CSS DEGISKENLERI ve birkac gorsel kural; hicbir
 * bilesen degismiyor. Boylece yonler gercek sayfalarda, gercek
 * icerikle denenebiliyor.
 *
 * KONTRAST: her paletin renkleri contrast.test.ts'teki 31 ciftin
 * hepsinde olculdu ve AA'yi geciyor (bkz. sohbet kaydi). Yon secilince
 * bu degerler tokens paketine gecirilecek ve test onlari koruyacak.
 *
 * Fontlar public/dev-fonts altinda; secim yapilinca kazanan font
 * src/fonts'a vendor'lanacak (Google'a istek gitmez, Law 25).
 */
export type ThemeId = 'now' | 'warm' | 'honey' | 'lilac' | 'toon';

interface Theme {
  id: ThemeId;
  name: string;
  note: string;
  swatch: string[];
  css: string;
}

const vars = (o: Record<string, string>) =>
  Object.entries(o).map(([k, v]) => `--color-${k}:${v};`).join('');

const face = (name: string, file: string, weights: string) =>
  `@font-face{font-family:'${name}';src:url('/dev-fonts/${file}') format('woff2');` +
  `font-weight:${weights};font-display:swap;}`;

/** Baslik fontunu degistirir — govde metni okunurluk icin ayni kaliyor. */
const heads = (family: string, tracking = '-0.01em', weight = '700') => `
  .text-display,.text-h1,.text-h2,.text-h3,.text-numeral,.wordmark,
  .section-title,.hero-title{
    font-family:'${family}',sans-serif !important;
    letter-spacing:${tracking} !important; font-weight:${weight} !important;
  }`;

/* ---------------------------------------------- 1. SICAK (olcülü) */
const WARM = {
  'canvas': '#FFF6F0', 'surface-sunken': '#FBEDE3', 'border': '#F2E3D8',
  'border-strong': '#E3CDBE', 'ink': '#33231B', 'ink-secondary': '#6B554A',
  'ink-muted': '#755E52', 'band-blush': '#FCE7E2', 'band-apricot': '#FCEBD8',
  'band-sage': '#EAF1E8', 'panel': '#2B1D16', 'panel-raised': '#3A2920',
  'panel-ink': '#FBF3EE', 'panel-ink-muted': '#DCCBC0',
};

/* ------------------------------------------------- 2. BAL & KREM */
const HONEY = {
  'canvas': '#FFF8EC', 'surface': '#FFFFFF', 'surface-sunken': '#FBEEDA',
  'border': '#F2E4CD', 'border-strong': '#E2CDAE',
  'ink': '#33240F', 'ink-secondary': '#6B5433', 'ink-muted': '#75603C',
  'primary': '#A94A1B', 'primary-hover': '#8E3D16', 'primary-active': '#8A3A16',
  'primary-subtle': '#FBE2D2', 'primary-on': '#FFFFFF',
  'accent': '#3F7D62', 'accent-hover': '#2F6B52', 'accent-subtle': '#DCEDE4',
  'band-blush': '#FCE8D8', 'band-apricot': '#FCEFD6', 'band-sage': '#E6F0E7',
  'panel': '#2A1D0E', 'panel-raised': '#3A2A16', 'panel-ink': '#FDF5E8',
  'panel-ink-muted': '#DCCBB0',
  'tile-rose': '#FBDFCF', 'tile-rose-ink': '#8A3A16',
  'tile-sage': '#DCEDE4', 'tile-sage-ink': '#2F6B52',
  'tile-apricot': '#FAE7C2', 'tile-apricot-ink': '#7A5210',
  'tile-peri': '#E2E2F4', 'tile-peri-ink': '#4A4590',
};

/* -------------------------------------------- 3. LEYLAK & SEFTALI */
const LILAC = {
  'canvas': '#FBF6FF', 'surface': '#FFFFFF', 'surface-sunken': '#F2EBFA',
  'border': '#E9E0F5', 'border-strong': '#D5C7E8',
  'ink': '#241E33', 'ink-secondary': '#584E70', 'ink-muted': '#635879',
  'primary': '#6B4CC4', 'primary-hover': '#5A3EA8', 'primary-active': '#4B3390',
  'primary-subtle': '#EAE2FA', 'primary-on': '#FFFFFF',
  'accent': '#C2703A', 'accent-hover': '#96521F', 'accent-subtle': '#FBE7D6',
  'band-blush': '#F1E9FC', 'band-apricot': '#FCEBDC', 'band-sage': '#E7F1EE',
  'panel': '#1E1830', 'panel-raised': '#2C2444', 'panel-ink': '#F7F3FD',
  'panel-ink-muted': '#CFC6E2',
  'tile-rose': '#EAE2FA', 'tile-rose-ink': '#4B3390',
  'tile-sage': '#E7F1EE', 'tile-sage-ink': '#2F6B5C',
  'tile-apricot': '#FBE7D6', 'tile-apricot-ink': '#96521F',
  'tile-peri': '#E3E6F8', 'tile-peri-ink': '#3F4A8F',
};

/* --------------------------------------------------- 4. CIZGI FILM */
const TOON = {
  'canvas': '#FFF7E8', 'surface': '#FFFFFF', 'surface-sunken': '#FCEEDA',
  'border': '#EFDFC4', 'border-strong': '#D9BE94',
  'ink': '#2E2012', 'ink-secondary': '#63503B', 'ink-muted': '#6E5A42',
  'primary': '#AF3453', 'primary-hover': '#962C47', 'primary-active': '#8E2942',
  'primary-subtle': '#FBDEE6', 'primary-on': '#FFFFFF',
  'accent': '#2F7D5E', 'accent-hover': '#25664C', 'accent-subtle': '#D8EDE2',
  'band-blush': '#FDE3E8', 'band-apricot': '#FDECCF', 'band-sage': '#DFF0E4',
  'panel': '#2B2114', 'panel-raised': '#3C2E1C', 'panel-ink': '#FFF7E8',
  'panel-ink-muted': '#DDC9AC',
  'tile-rose': '#FBDEE6', 'tile-rose-ink': '#8E2942',
  'tile-sage': '#D8EDE2', 'tile-sage-ink': '#25664C',
  'tile-apricot': '#FBE3BE', 'tile-apricot-ink': '#7A5210',
  'tile-peri': '#DFE3F7', 'tile-peri-ink': '#3F4A8F',
};

/*
  CIZGI FILM'in RENK DISI kismi — "sevimlilik renkte degil" itirazinin
  karsiligi. Kalin kenar, sert golge (cikartma hissi), daha yuvarlak
  kose ve ikon kutularinin buyumesi.
*/
const TOON_SHAPE = `
  :root{ --radius-sm:14px; --radius-md:20px; --radius-lg:28px; --radius-xl:36px; }
  .card,.feature-card,.city-card,.sitter-card,.booking-card,.auth-card,
  .banner-card,.empty-state-card,.activity-row,.pet-card{
    border-width:2px !important;
    box-shadow:4px 5px 0 rgba(46,32,18,.10) !important;
  }
  .btn{ border-radius:999px !important; }
  .btn-primary,.btn-ink{ box-shadow:0 3px 0 rgba(46,32,18,.22) !important; }
  .chip,.badge{ border-radius:999px !important; }
`;

export const THEMES: Theme[] = [
  {
    id: 'now', name: 'Şu an', note: 'Bugünkü hâli',
    swatch: ['#B33C6E', '#6F9E7F', '#FDF6F3'], css: '',
  },
  {
    id: 'warm', name: '1 · Sıcak', note: 'Aynı marka, sıcak mürekkep',
    swatch: ['#B33C6E', '#33231B', '#FFF6F0'],
    css: `:root{${vars(WARM)}}`,
  },
  {
    id: 'honey', name: '2 · Bal & Krem', note: 'Kiremit + orman yeşili, Nunito',
    swatch: ['#A94A1B', '#3F7D62', '#FFF8EC'],
    css: `${face('LabNunito', 'nunito.woff2', '400 900')}:root{${vars(HONEY)}}${heads('LabNunito')}`,
  },
  {
    id: 'lilac', name: '3 · Leylak & Şeftali', note: 'Menekşe + şeftali, Baloo 2',
    swatch: ['#6B4CC4', '#C2703A', '#FBF6FF'],
    css: `${face('LabBaloo', 'baloo-2.woff2', '400 800')}:root{${vars(LILAC)}}${heads('LabBaloo', '0em')}`,
  },
  {
    id: 'toon', name: '4 · Çizgi film', note: 'Kalın hat, çıkartma gölge, Fredoka',
    swatch: ['#AF3453', '#2F7D5E', '#FFF7E8'],
    css: `${face('LabFredoka', 'fredoka.woff2', '300 600')}:root{${vars(TOON)}}` +
      `${heads('LabFredoka', '0em', '600')}${TOON_SHAPE}`,
  },
];
