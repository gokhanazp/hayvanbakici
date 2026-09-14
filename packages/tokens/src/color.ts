/**
 * Renk paleti — "Bogurtlen & Adacayi".
 *
 * NEDEN BU PALET: rakiplerden ayrismak bir zevk meselesi degil, stratejik
 * varlik. Rover mavi-yesil, Hipaw turuncu-yesil kullaniyor; onceki
 * paletimiz (ladin yesili + kehribar) ikisine de tehlikeli derecede
 * yakindi. Bogurtlen + adacayi ikilisi kategoride kimsede yok.
 *
 * ROL DAGILIMI: bogurtlen EYLEM rengidir (ara, rezerve et, bakici ol),
 * adacayi DESTEK (basari, onay, sakinlik). Guven rozetleri (kimlik,
 * sicil, sigorta, pro) marka renginden AYRI kalmaya devam ediyor —
 * bilincli: rozet marka degil, bagimsiz bir iddia.
 *
 * Tum metin/zemin ciftleri WCAG 2.2 AA hedefler ve
 * packages/tokens/src/contrast.test.ts icinde OLCULUR.
 */

export const palette = {
  // Sicak notr omurga — hafif gul altili krem
  canvas:        '#FDF6F3',
  surface:       '#FFFFFF',
  surfaceSunken: '#F8EAE4',
  border:        '#EFDDD8',
  borderStrong:  '#E0C7BF',

  // Murekkep (metin) — patlican
  ink:          '#2A1C26',
  inkSecondary: '#6B5A64',
  /*
    5.46:1 krem zeminde. Daha acik bir gri (#9C8D95) 2.95'te kaliyordu.
    #7C6B78 krem zeminde 4.64 ile geciyordu ama RENKLI BANTLAR eklenince
    (blush 4.27, sage 4.44) AA'nin altina dustu: ayni token artik dort ayri
    zemin uzerinde yasiyor, dolayisiyla en KOYU banda gore secildi.
  */
  inkMuted:     '#71606E',

  // Birincil — "Bogurtlen". EYLEM rengi.
  primary50:  '#FADDE6',
  primary100: '#F3C3D4',
  primary300: '#D07C9F',
  primary500: '#B33C6E',
  primary600: '#96305B',
  primary700: '#8E2C56',
  primary900: '#4E152E',

  // Aksan — "Adacayi". DESTEK rengi.
  accent100: '#DEEBE0',
  accent500: '#6F9E7F',
  /* Rozet metni pastel adacayi zeminde yasiyor: #4B7A5C orada 4.03'te
     kaliyordu (11px yari kalin = kucuk metin, 4.5 gerekir). */
  accent600: '#456F54',

  /*
    BOLUM BANTLARI — sayfa artik tek bir krem zemin degil.
    Kahraman bandi govdeden ACIK SEKILDE farkli bir sicaklikta; aralarindaki
    gecis yuvarlatilmis kose ile yapiliyor. Bantlar bilincli olarak SOLUK:
    ustlerinde ink/ink-secondary/ink-muted/primary hepsi AA'yi gecmek zorunda
    (contrast.test.ts'te dordu de olculuyor), bu da tonu sinirliyor.
  */
  bandBlush:   '#F8E5EC',
  bandApricot: '#FBEBDE',
  bandSage:    '#E9F2EC',

  // Durum
  success500: '#2E7D4F',
  warning500: '#C8860D',
  danger100:  '#FBEAE6',
  danger500:  '#B23A2E',
  danger700:  '#8A2A20',
  info500:    '#2C5F8A',

  // Panel — koyu patlican. Sayfa acik kalir, koyuluk TEK bir bloga hapsedilir
  // (tasarim karari: koyu arayuz uzun bakici listelerinde yoruyor).
  panel:          '#211621',
  panelRaised:    '#2E1F2C',
  panelInk:       '#F9F2F4',
  panelInkMuted:  '#D8C9D0',
  panelPrimary:   '#F0A0C0',
  panelAccent:    '#9CC4A8',

  // PASTEL KUTUCUKLAR — hizmet kartlarindaki ikon zeminleri.
  // Dort ayri ton bilincli: tek marka rengiyle boyanmis dort kart,
  // "dort ayri hizmet" hissini vermiyor.
  tileRose:   '#FADDE6',
  tileSage:   '#DEEBE0',
  tileApricot:'#FBE6D2',
  tilePeri:   '#E2E2F4',
  tileRoseInk:    '#8E2C56',
  tileSageInk:    '#3F6B4E',
  tileApricotInk: '#92541C',
  tilePeriInk:    '#4A4590',

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
  'info':            palette.info500,
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
  'warning':         '#D9A43A',
  'danger':          '#E0776A',
  'danger-subtle':   '#2E1613',
  'danger-strong':   '#F3B4AA',
  'info':            '#7FA8CC',
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

/**
 * YONETICI PANELI TEMASI — "Kul".
 *
 * Neden AYRI bir palet: panel siteden farkli hissetmeli. Ayni markanin
 * koyu hali olsa, yonetici bir an icin musteri sayfasinda oldugunu sanip
 * gercek veriyle demo veriymis gibi oynar. Notr arduvaz zemin + bogurtlen
 * vurgu: renk hala Havre'nin, ama zemin apayri.
 *
 * Neden darkTheme kullanilmadi: o palet mor-bordo ve MUSTERI koyu temasi
 * icin duruyor; tasarlanip onaylandigi gun degisecek. Panelin gorunumu o
 * karara bagli olmamali.
 *
 * Tum ciftler contrast.test.ts icinde AYNI kurallarla olculuyor.
 */
export const adminTheme: Record<keyof typeof lightTheme, string> = {
  'canvas':          '#0E1014',
  'surface':         '#161A20',
  'surface-sunken':  '#1B2027',
  'border':          '#252B34',
  'border-strong':   '#3A4350',
  'ink':             '#E8ECF1',
  'ink-secondary':   '#B6BFCB',
  'ink-muted':       '#8D97A5',
  'primary':         '#E78AB0',
  'primary-hover':   '#F0A0C0',
  'primary-active':  '#F6B8D0',
  'primary-subtle':  '#2B1520',
  'primary-on':      '#1A0C14',
  'accent':          '#7FC49A',
  'accent-hover':    '#9AD3AF',
  'accent-subtle':   '#12251A',
  /* Panelde "bant" yok; anahtarlar palet butunlugu icin duruyor ve
     yine de okunabilir olmak zorunda. */
  'band-blush':      '#1A1218',
  'band-apricot':    '#191510',
  'band-sage':       '#101814',
  'panel':           '#0A0C10',
  'panel-raised':    '#12161C',
  'panel-ink':       '#E8ECF1',
  'panel-ink-muted': '#A8B2BF',
  'panel-primary':   '#F0A0C0',
  'panel-accent':    '#9AD3AF',
  'success':         '#6FBF8C',
  'warning':         '#D9A43A',
  'danger':          '#E88178',
  'danger-subtle':   '#2A1614',
  'danger-strong':   '#F5AFA6',
  'info':            '#7FB0DC',
  'verify-id':       '#7FB0DC',
  'verify-check':    '#7FC49A',
  'verify-insured':  '#B29BD8',
  'verify-pro':      '#D4AC4E',
  'tile-rose':       '#2B1520',
  'tile-rose-ink':   '#F0A0C0',
  'tile-sage':       '#12251A',
  'tile-sage-ink':   '#8FCFA6',
  'tile-apricot':    '#2C2013',
  'tile-apricot-ink':'#E0AC6C',
  'tile-peri':       '#1B1D30',
  'tile-peri-ink':   '#A8A5E4',
};
