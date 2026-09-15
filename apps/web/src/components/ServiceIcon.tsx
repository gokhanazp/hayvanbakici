import type { ServiceType } from '@havre/core';

/**
 * HIZMET IKONLARI — TEK KAYNAK.
 *
 * Ayni cizimler hem ana sayfadaki hizmet kartlarinda hem de bakici
 * basvurusundaki hizmet secimi kartlarinda kullaniliyor. Iki yerde iki
 * ayri path tutmak, birinde degisiklik yapilip digerinin unutulmasi
 * demekti: kullanici ayni hizmeti iki farkli simgeyle goruyordu.
 *
 * Ikonlar DEKORATIF: her zaman yaninda hizmetin adi yaziyor, bu yuzden
 * aria-hidden. Bilgi tasiyan bir simge olsaydi metin karsiligi
 * gerekirdi (WCAG 1.1.1).
 */
export const SERVICE_ICON: Record<ServiceType, string> = {
  boarding: 'M5 12.5 12 6l7 6.5 M7 11.5V18h10v-6.5 M10.5 18v-3.5h3V18',
  house_sitting: 'M12 5.5c-3 0-5.5 2.2-5.5 5 0 3.4 3.4 6.2 5.5 8 2.1-1.8 5.5-4.6 5.5-8 0-2.8-2.5-5-5.5-5Z M12 12.3v.01',
  drop_in: 'M4.5 9.5 12 5l7.5 4.5v8a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5Z M9.5 19v-5h5v5',
  dog_walking: 'M8 10.7V15l3.5 3 M11.5 12.5 16 11l3 2.5 M16 11v6 M8 6.3a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Z',
  day_care: 'M12 5v14 M5 12h14',
  training: 'M6 18l4-8 4 4 4-8',
  grooming: 'M7 5v9a5 5 0 0 0 10 0V5 M7 9h10',
};

/** Pastel kutucuk tonlari — dort hizmet dort ayri tonda. */
export const SERVICE_TILE = ['tile-rose', 'tile-sage', 'tile-apricot', 'tile-peri'] as const;

export function ServiceIcon({ service, size = 24 }: { service: ServiceType; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d={SERVICE_ICON[service]} />
    </svg>
  );
}
