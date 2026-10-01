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
  /*
    HANGI IKON HANGI HIZMETTE — TASARIMDAN, TAHMINDEN DEGIL.

    Referansin arama sekmelerinde dogrudan yaziyor:
      Dog Walking    -> directions_walk
      House Sitting  -> night_shelter
      Daycare        -> wb_sunny
      Drop-In Visits -> home_pin
    Bakici basvuru ekraninda ayrica:
      House Boarding -> cottage

    Bizim "boarding" (hayvan bakicinin evinde kaliyor) tasarimin
    "House Boarding"i; "house_sitting" (bakici sahibin evinde kaliyor)
    ise tasarimin "House Sitting"i. Yani uc ev benzeri ikon var ve
    hangisinin nerede durdugu tasarimda belli.

    Egitim ve tima tasarimda HIC gecmiyor (v2 hizmetleri); onlar icin
    anlama en yakin ikon secildi ve bu bir TAHMIN, tasarim degil.
  */
  boarding: 'cottage',
  house_sitting: 'night',
  drop_in: 'home-pin',
  dog_walking: 'walk',
  day_care: 'sun',
  training: 'verified',
  grooming: 'tune',
};

/** Pastel kutucuk tonlari — dort hizmet dort ayri tonda. */
export const SERVICE_TILE = ['tile-rose', 'tile-sage', 'tile-apricot', 'tile-peri'] as const;

export function ServiceIcon({ service, size = 24 }: { service: ServiceType; size?: number }) {
  return <Sym name={SERVICE_SYM[service]} size={size} />;
}
