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
  danger100:  '#FBEAE6',
  danger500:  '#B23A2E',
  danger700:  '#8A2A20',
  info500:    '#2C5F8A',

  // Panel — koyu ladin. Sayfa acik kalir, koyuluk TEK bir bloga hapsedilir
  // (tasarim karari: koyu arayuz uzun bakici listelerinde yoruyor).
  panel:          '#161810',
  panelRaised:    '#1F2419',
  panelInk:       '#F7F4EC',
  panelInkMuted:  '#D2D0C5',
  panelPrimary:   '#7FD1AA',
  panelAccent:    '#E29354',

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
  'panel':           palette.panel,
  'panel-raised':    palette.panelRaised,
  'panel-ink':       palette.panelInk,
  'panel-ink-muted': palette.panelInkMuted,
  'panel-primary':   palette.panelPrimary,
  'panel-accent':    palette.panelAccent,
  'success':         palette.success500,
  'warning':         palette.warning500,
  'danger':          palette.danger500,
  /* Hata kutusu zemini ve metni: AA kontrast icin ayri tonlar gerekiyor —
     danger500 zemin olarak kullanilirsa uzerindeki metin okunmuyor. */
  'danger-subtle':   palette.danger100,
  'danger-strong':   palette.danger700,
  'info':            palette.info500,
  'verify-id':       palette.verifyId,
  'verify-check':    palette.verifyCheck,
  'verify-insured':  palette.verifyInsured,
  'verify-pro':      palette.verifyPro,
} as const;

/**
 * Koyu tema — "C — Kuzey" paletinden turetildi (tasarim kanvasinda begenilen yon).
 *
 * DIKKAT: Koyu tema HENUZ TASARLANMADI ve onaylanmadi. Bu yuzden OTOMATIK
 * DEVREYE GIRMIYOR: yalnizca [data-theme="dark"] ile acilir, isletim sisteminin
 * koyu modu siteyi karartmaz. Gerekce build-css.ts icinde yazili.
 */
export const darkTheme: Record<keyof typeof lightTheme, string> = {
  'canvas':          '#12130F',
  'surface':         '#1A1C15',
  'surface-sunken':  '#20221A',
  'border':          '#2A2C24',
  'border-strong':   '#3A3D33',
  'ink':             '#F2EFE7',
  'ink-secondary':   '#C9C7BC',
  'ink-muted':       '#8C8B81',
  'primary':         '#6FBF9A',
  'primary-hover':   '#8FD4B3',
  'primary-active':  '#A7E0C5',
  'primary-subtle':  '#16281F',
  'primary-on':      '#0E140F',
  'accent':          '#E29354',
  'accent-hover':    '#EDA467',
  'accent-subtle':   '#2E1F13',
  'panel':           '#0E100A',
  'panel-raised':    '#181C12',
  'panel-ink':       '#F7F4EC',
  'panel-ink-muted': '#B8B6AB',
  'panel-primary':   '#7FD1AA',
  'panel-accent':    '#E29354',
  'success':         '#4E9B6E',
  'warning':         '#D9A43A',
  'danger':          '#D0604F',
  'danger-subtle':   '#2C1714',
  'danger-strong':   '#F0A99D',
  'info':            '#5A90BC',
  'verify-id':       '#5A90BC',
  'verify-check':    '#6FBF9A',
  'verify-insured':  '#9B82C4',
  'verify-pro':      '#D4AC4E',
};

export type ThemeToken = keyof typeof lightTheme;
