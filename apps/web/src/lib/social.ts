/**
 * SOSYAL HESAPLAR — TEK KAYNAK.
 *
 * !!! SU ANKI ADRESLER YER TUTUCU ('#') — YAYINA CIKMADAN ONCE
 * !!! DEGISTIRILMESI GEREKIYOR. Hesaplar henuz acilmadi; ikonlar
 * !!! tasarim gorunsun diye duruyor ve hicbir yere gitmiyor.
 * !!! Ayrica claude/02-eksikler.md icindeki yayin oncesi listede.
 *
 * Hesap acildiginda yapilacak tek is, asagidaki `url` alanini gercek
 * adresle degistirmek. Liste bosaltilirsa ikonlar HIC cizilmiyor;
 * baslik seridi de alt bilgi de ayni listeyi okuyor, dolayisiyla
 * tasarim iki durumda da calisiyor.
 */
export const SOCIAL_NETWORKS = ['instagram', 'facebook', 'tiktok', 'youtube', 'linkedin'] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export interface SocialAccount {
  network: SocialNetwork;
  /** Hesabin tam adresi — https:// ile */
  url: string;
}

/** Adi ekran okuyucuya soylenir; marka adlari cevrilmez. */
export const SOCIAL_LABEL: Record<SocialNetwork, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
};

export const SOCIAL: readonly SocialAccount[] = [
  { network: 'instagram', url: '#' },
  { network: 'facebook', url: '#' },
  { network: 'tiktok', url: '#' },
];

/** Adres hala yer tutucu mu — arayuz ve kontrol listesi icin. */
export const SOCIAL_IS_PLACEHOLDER = SOCIAL.some((a) => a.url === '#');
