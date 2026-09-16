/**
 * SOSYAL HESAPLAR — TEK KAYNAK.
 *
 * LISTE BILINCLI OLARAK BOS. Havre'nin henuz acilmis bir sosyal hesabi
 * yok; olmayan bir hesaba giden ikon ekranda DOGRU OLMAYAN bir sey
 * soyler ve tiklayan kisiyi bos bir sayfaya gonderir. Hesap acildiginda
 * buraya bir satir eklemek yeterli:
 *
 *   { network: 'instagram', url: 'https://instagram.com/havre.ca' },
 *
 * Baslik seridi ve alt bilgi ayni listeyi okuyor; liste bosken o bolum
 * HIC CIZILMIYOR, dolayisiyla tasarim iki durumda da calisiyor.
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

export const SOCIAL: readonly SocialAccount[] = [];
