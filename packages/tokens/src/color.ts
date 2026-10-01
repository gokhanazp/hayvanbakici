/**
 * Renk paleti — "Warm Paw".
 *
 * KAYNAK: Stitch'te uretilen tasarim sisteminin (warm_paw_companion)
 * token'lari. Oradan AYNEN alinmadi; iki yerde bilerek ayrildi ve ikisi
 * de kontrast yuzunden (contrast.test.ts hepsini olcuyor):
 *
 *  1. EYLEM RENGI KOYULASTIRILDI. Tasarimda dolgulu dugmeler parlak
 *     mercan (#F37B5C) ve uzerinde beyaz yazi var; o cift 2,7:1 veriyor
 *     ve AA'nin cok altinda. Parlak mercan artik bir YUZEY rengi
 *     (band-blush, primary-300) ve uzerine koyu murekkep yaziliyor;
 *     dolgulu dugmeler #BF4426 ile ciziliyor (beyaz yazi 5,0:1).
 *     Ekranda fark neredeyse gorunmuyor, okunurluk farki buyuk.
 *  2. SOLUK METIN KOYULASTIRILDI. Tasarimin "Neutral Muted" tonu
 *     (#84776D) krem zeminde 4,2'de kaliyordu.
 *
 * ROL DAGILIMI: mercan EYLEM (ara, rezerve et, bakici ol), adacayi
 * yesili DESTEK ve GUVEN (dogrulanmis rozeti, aktif gezinme, koyu
 * panel). Onceki palette eylem gul, destek yesildi; roller ayni kaldi,
 * yalnizca tonlar degisti — bu yuzden sayfalarin hicbirinde sinif
 * degistirmek gerekmedi.
 *
 * Tum metin/zemin ciftleri WCAG 2.2 AA hedefler ve
 * packages/tokens/src/contrast.test.ts icinde OLCULUR.
 */

export const palette = {
  // Sicak notr omurga — "warm vanilla"
  canvas:        '#FFF8F4',
  surface:       '#FFFFFF',
  surfaceSunken: '#FBF0E7',
  border:        '#EFE7DE',
  borderStrong:  '#DCCFC2',

  // Murekkep (metin) — espresso tonlu, saf siyah degil
  ink:          '#221A12',
  inkSecondary: '#53483E',
  /* Tasarimin #84776D tonu krem zeminde 4,2'de kaliyordu. */
  inkMuted:     '#70645A',

  // Birincil — "Mercan". EYLEM rengi.
  primary50:  '#FDEEE9',
  primary100: '#FAD9CE',
  /* Tasarimin parlak mercani: YUZEY olarak kullaniliyor, yazi rengi olarak degil */
  primary300: '#F37B5C',
  primary500: '#BF4426',
  primary600: '#A83A1F',
  primary700: '#8E3019',
  primary900: '#4A180B',

  // Aksan — "Adacayi yesili". DESTEK ve GUVEN rengi.
  accent100: '#EBF3EF',
  accent500: '#226150',
  accent600: '#1A4F41',

  /*
    BOLUM BANTLARI. Tasarimda sayfa tek bir krem zemin degil: hizmet
    kartlari seftali, adimlar bal, guven paneli koyu yesil zeminde.
  */
  bandBlush:   '#FDEEE9',
  bandApricot: '#FEF4E6',
  bandSage:    '#EBF3EF',

  // Durum
  success100: '#E6F2EB',
  success500: '#2E7D4F',
  success700: '#1F5B39',
  warning100: '#FEF4E6',
  warning500: '#C8860D',
  warning900: '#6B4405',
  danger100:  '#FFEAE6',
  danger500:  '#BA1A1A',
  danger700:  '#93000A',
  info100:    '#E8EEF6',
  info500:    '#2C5F8A',
  info700:    '#1E4667',

  /*
    PANEL — koyu adacayi yesili. Tasarimdaki "guven kalkani" bolumu bu
    zeminde duruyor. Sayfanin geri kalani acik kaliyor: koyuluk tek bir
    bloga hapsedilmis durumda.
  */
  panel:          '#1E4F42',
  panelRaised:    '#2A6355',
  panelInk:       '#FFF8F4',
  panelInkMuted:  '#BFD9CE',
  panelPrimary:   '#FFB4A2',
  panelAccent:    '#95D3BE',

  // PASTEL KUTUCUKLAR — hizmet kartlarindaki ikon zeminleri
  tileRose:   '#FDEEE9',
  tileSage:   '#EBF3EF',
  tileApricot:'#FEF4E6',
  tilePeri:   '#E8EEF6',
  tileRoseInk:    '#8E3019',
  tileSageInk:    '#1A4F41',
  tileApricotInk: '#8A5A0B',
  tilePeriInk:    '#2F4F7A',

  // Guven rozetleri — bilincli olarak marka renginden ayri
  verifyId:      '#2C5F8A',
  verifyCheck:   '#226150',
  verifyInsured: '#6B4E9E',
  verifyPro:     '#8A5A0B',
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
  'band-blush':      palette.bandBlush,
  'band-apricot':    palette.bandApricot,
  'band-sage':       palette.bandSage,
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
  'success-subtle':  palette.success100,
  'success-strong':  palette.success700,
  'warning-subtle':  palette.warning100,
  'warning-strong':  palette.warning900,
  'info':            palette.info500,
  'info-subtle':     palette.info100,
  'info-strong':     palette.info700,
  'verify-id':       palette.verifyId,
  'verify-check':    palette.verifyCheck,
  'verify-insured':  palette.verifyInsured,
  'verify-pro':      palette.verifyPro,
  'tile-rose':       palette.tileRose,
  'tile-rose-ink':   palette.tileRoseInk,
  'tile-sage':       palette.tileSage,
  'tile-sage-ink':   palette.tileSageInk,
  'tile-apricot':    palette.tileApricot,
  'tile-apricot-ink':palette.tileApricotInk,
  'tile-peri':       palette.tilePeri,
  'tile-peri-ink':   palette.tilePeriInk,
} as const;

/**
 * Koyu tema — "C — Kuzey" paletinden turetildi (tasarim kanvasinda begenilen yon).
 *
 * DIKKAT: Koyu tema HENUZ TASARLANMADI ve onaylanmadi. Bu yuzden OTOMATIK
 * DEVREYE GIRMIYOR: yalnizca [data-theme="dark"] ile acilir, isletim sisteminin
 * koyu modu siteyi karartmaz. Gerekce build-css.ts icinde yazili.
 */
export const darkTheme: Record<keyof typeof lightTheme, string> = {
  'canvas':          '#161015',
  'surface':         '#1E161D',
  'surface-sunken':  '#261C24',
  'border':          '#332633',
  'border-strong':   '#453444',
  'ink':             '#F6EFF2',
  'ink-secondary':   '#CFC0C8',
  'ink-muted':       '#9B8B95',
  'primary':         '#E88AB2',
  'primary-hover':   '#F0A0C0',
  'primary-active':  '#F6B8D0',
  'primary-subtle':  '#33182A',
  'primary-on':      '#1A0C14',
  'accent':          '#8CBE9C',
  'accent-hover':    '#A3CDB0',
  'accent-subtle':   '#17261B',
  'band-blush':      '#20141C',
  'band-apricot':    '#1F1711',
  'band-sage':       '#131B16',
  'panel':           '#120C12',
  'panel-raised':    '#1D141C',
  'panel-ink':       '#F9F2F4',
  'panel-ink-muted': '#C3B3BB',
  'panel-primary':   '#F0A0C0',
  'panel-accent':    '#9CC4A8',
  'success':         '#6BAE83',
  'success-subtle':  '#16281D',
  'success-strong':  '#9ED3B0',
  'warning':         '#D9A43A',
  'warning-subtle':  '#2B2008',
  'warning-strong':  '#E8C275',
  'danger':          '#E0776A',
  'danger-subtle':   '#2E1613',
  'danger-strong':   '#F3B4AA',
  'info':            '#7FA8CC',
  'info-subtle':     '#15222E',
  'info-strong':     '#A8C8E2',
  'verify-id':       '#7FA8CC',
  'verify-check':    '#8CBE9C',
  'verify-insured':  '#B29BD8',
  'verify-pro':      '#D4AC4E',
  'tile-rose':       '#33182A',
  'tile-rose-ink':   '#F0A0C0',
  'tile-sage':       '#17261B',
  'tile-sage-ink':   '#8CBE9C',
  'tile-apricot':    '#2E2014',
  'tile-apricot-ink':'#DFA96A',
  'tile-peri':       '#1E1D33',
  'tile-peri-ink':   '#A7A3E0',
};

export type ThemeToken = keyof typeof lightTheme;
