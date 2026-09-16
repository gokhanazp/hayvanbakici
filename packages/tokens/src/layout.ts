/** Uzay, kose yaricapi, golge, hareket, kirilma noktalari */

/** 4px taban olcek */
export const space = {
  0: '0',
  0.5: '0.125rem',  // 2
  1: '0.25rem',     // 4
  2: '0.5rem',      // 8
  3: '0.75rem',     // 12
  4: '1rem',        // 16
  5: '1.25rem',     // 20
  6: '1.5rem',      // 24
  7: '1.75rem',     // 28
  8: '2rem',        // 32
  10: '2.5rem',     // 40
  12: '3rem',       // 48
  14: '3.5rem',     // 56
  16: '4rem',       // 64
  20: '5rem',       // 80
  24: '6rem',       // 96
  32: '8rem',       // 128
} as const;

/**
 * Yumusatilmis geometri — "Bogurtlen & Adacayi" yonunun imzasi.
 * Onceki degerlerden bir kademe daha yuvarlak: hayvan bakimi kategorisinde
 * keskin kose soguk duruyor. Rozet, cip ve birincil CTA hap bicimli.
 */
export const radius = {
  sm: '14px',    // kucuk kontrol
  md: '20px',    // buton, input
  lg: '28px',    // kart
  xl: '36px',    // hero, banner, modal
  full: '999px', // avatar, rozet, filtre cipi, birincil CTA
} as const;

/**
 * GOLGELER — IKI AILE.
 *
 * YUMUSAK aile (sm–xl) eskisi gibi: acilir menu, cekmece, kip pencere
 * gibi sayfanin USTUNDE YUZEN seyler icin. Onlar gercekten havada
 * duruyor; yumusak golge dogru okuyor.
 *
 * CIKARTMA ailesi (stickerSm/stickerMd) YENI ve bu tasarimin imzasi:
 * dagilmayan, kaymis, tek renk bir golge. Kart sayfanin uzerine
 * YAPISTIRILMIS gibi duruyor — cocuk kitabi ve cikartma dilinden
 * geliyor, kategoriye sicaklik katan sey de bu.
 *
 * RENK SABIT DEGIL: `color-mix` ile murekkep tokenindan turetiliyor,
 * boylece koyu tema geldigin gun golge de kendiliginden dogru tona
 * geciyor. Sabit rgba yazilsaydi koyu zeminde gorunmez olurdu.
 */
export const shadow = {
  sm: '0 1px 2px rgba(46,32,18,.05)',
  md: '0 4px 12px rgba(46,32,18,.07)',
  lg: '0 12px 32px rgba(46,32,18,.10)',
  xl: '0 24px 64px rgba(46,32,18,.12)',
  stickerSm: '3px 3px 0 color-mix(in srgb, var(--color-ink) 10%, transparent)',
  stickerMd: '5px 6px 0 color-mix(in srgb, var(--color-ink) 12%, transparent)',
} as const;

export const motion = {
  duration: { micro: '120ms', standard: '200ms', enter: '320ms' },
  easing: {
    standard: 'cubic-bezier(.2,.8,.2,1)',
    exit: 'cubic-bezier(.4,0,.2,1)',
  },
} as const;

export const breakpoint = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/** WCAG 2.2 AA: dokunma hedefi min 24x24 CSS px (2.5.8) */
export const minTouchTarget = '44px';
