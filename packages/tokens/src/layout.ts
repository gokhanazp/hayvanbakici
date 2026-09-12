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
  8: '2rem',        // 32
  10: '2.5rem',     // 40
  12: '3rem',       // 48
  16: '4rem',       // 64
  20: '5rem',       // 80
  24: '6rem',       // 96
  32: '8rem',       // 128
} as const;

export const radius = {
  sm: '6px',     // rozet, etiket
  md: '10px',    // buton, input
  lg: '16px',    // kart
  xl: '24px',    // modal, bolum kapsayici
  full: '999px', // avatar, pill
} as const;

/** Golgeler siyah degil, sicak tonlu */
export const shadow = {
  sm: '0 1px 2px rgba(26,23,20,.05)',
  md: '0 4px 12px rgba(26,23,20,.07)',
  lg: '0 12px 32px rgba(26,23,20,.10)',
  xl: '0 24px 64px rgba(26,23,20,.12)',
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
