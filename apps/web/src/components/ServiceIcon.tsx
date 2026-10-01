import type { ServiceType } from '@havre/core';
import { Sym, type SymName } from '@/components/Sym';

/**
 * HIZMET IKONLARI — TEK KAYNAK.
 *
 * SITE GENELINDE IKI SET VARDI. Ana sayfa Stitch tasarimina gecirilince
 * oradaki kartlar tasarimin ikonlariyla (Sym) cizildi, basliktaki hizmet
 * menusu ve mobil cekmece ise eski elde cizilmis setle kaldi. Ayni
 * hizmet ayni ekranda iki farkli simgeyle goruniyordu: ana sayfada
 * "Ev bakiciligi" bir ev, cekmecede bir ANAHTARDI.
 *
 * Artik tek set var ve o set TASARIMIN seti. Bu dosya yalnizca
 * "hangi hizmet hangi cizim" eslemesini tutuyor, cizimler Sym'de.
 *
 * ESLEME tasarimin kendi ikon secimlerinden:
 *   konaklama     night_shelter — hayvan geceyi bakicinin evinde geciriyor
 *   ev bakiciligi home_pin      — bakici SIZIN adresinize geliyor
 *   kisa ziyaret  pets          — isin kendisi: besleme, kum, oyun
 *   gezdirme      directions_walk
 *   gunduz bakimi wb_sunny      — gunduz
 * Silueti birbirine benzeyen iki ikon yok.
 *
 * Ikonlar DEKORATIF: her zaman yaninda hizmetin adi yaziyor, bu yuzden
 * Sym hepsini aria-hidden ciziyor. Bilgi tasiyan bir simge olsaydi
 * metin karsiligi gerekirdi (WCAG 1.1.1).
 */
export const SERVICE_SYM: Record<ServiceType, SymName> = {
  boarding:      'night',
  house_sitting: 'home-pin',
  drop_in:       'pets',
  dog_walking:   'walk',
  /* v1'de kapali olan hizmetler — ikonlari ayni dilde hazir duruyor */
  day_care:      'sun',
  training:      'verified',
  grooming:      'tune',
};

/** Pastel kutucuk tonlari — dort hizmet dort ayri tonda. */
export const SERVICE_TILE = ['tile-rose', 'tile-sage', 'tile-apricot', 'tile-peri'] as const;

export function ServiceIcon({ service, size = 24 }: { service: ServiceType; size?: number }) {
  return <Sym name={SERVICE_SYM[service]} size={size} />;
}
