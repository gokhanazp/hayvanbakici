/**
 * Renk paleti — "Sakin luks" yonu.
 * Yol haritasi §4.2. Tum metin/zemin ciftleri WCAG 2.2 AA hedefler.
 */

export const palette = {
  // Sicak notr omurga
  canvas:        '#FBF8F4',
  surface:       '#FFFFFF',
  surfaceSunken: '#F3EEE7',
  border:        '#E7DFD4',
  borderStrong:  '#D3C8B8',

  // Murekkep (metin)
  ink:          '#1A1714',
  inkSecondary: '#5C544C',
  inkMuted:     '#8A8078',

  // Birincil — "Pine"
  primary50:  '#EEF5F1',
  primary100: '#D3E5DA',
  primary300: '#7FB39B',
  primary500: '#2F6B52',
  primary600: '#255743',
  primary700: '#1B412F',
  primary900: '#0E2419',

  // Aksan — "Ember"
  accent100: '#FCEBD6',
  accent500: '#D9803A',
  accent600: '#BE6A2A',

  // Durum
  success500: '#2E7D4F',
  warning500: '#C8860D',
  danger500:  '#B23A2E',
  info500:    '#2C5F8A',

  // Guven rozetleri — bilincli olarak marka renginden ayri
  verifyId:      '#2C5F8A',
  verifyCheck:   '#2F6B52',
  verifyInsured: '#6B4E9E',
  verifyPro:     '#B8892B',
} as const;

/** Acik tema semantik eslemesi */
export const lightTheme = {
  'canvas':          palette.canvas,
  'surface':         palette.surface,
  'surface-sunken':  palette.surfaceSunken,
  'border':          palette.border,
  'border-strong':   palette.borderStrong,
  'ink':             palette.ink,
  'ink-secondary':   palette.inkSecondary,
  'ink-muted':       palette.inkMuted,
  'primary':         palette.primary500,
  'primary-hover':   palette.primary600,
  'primary-active':  palette.primary700,
  'primary-subtle':  palette.primary50,
  'primary-on':      '#FFFFFF',
  'accent':          palette.accent500,
  'accent-hover':    palette.accent600,
  'accent-subtle':   palette.accent100,
  'success':         palette.success500,
  'warning':         palette.warning500,
  'danger':          palette.danger500,
  'info':            palette.info500,
  'verify-id':       palette.verifyId,
  'verify-check':    palette.verifyCheck,
  'verify-insured':  palette.verifyInsured,
  'verify-pro':      palette.verifyPro,
} as const;

/** Koyu tema — gun 1'den itibaren */
export const darkTheme: Record<keyof typeof lightTheme, string> = {
  'canvas':          '#121110',
  'surface':         '#1C1A18',
  'surface-sunken':  '#242119',
  'border':          '#322E29',
  'border-strong':   '#443E37',
  'ink':             '#F5F1EB',
  'ink-secondary':   '#B8AFA4',
  'ink-muted':       '#8A8078',
  'primary':         '#4E9B79',
  'primary-hover':   '#5FAE8A',
  'primary-active':  '#6FBF9A',
  'primary-subtle':  '#16281F',
  'primary-on':      '#0E2419',
  'accent':          '#E29354',
  'accent-hover':    '#EDA467',
  'accent-subtle':   '#2E1F13',
  'success':         '#4E9B6E',
  'warning':         '#D9A43A',
  'danger':          '#D0604F',
  'info':            '#5A90BC',
  'verify-id':       '#5A90BC',
  'verify-check':    '#4E9B79',
  'verify-insured':  '#9B82C4',
  'verify-pro':      '#D4AC4E',
};

export type ThemeToken = keyof typeof lightTheme;
