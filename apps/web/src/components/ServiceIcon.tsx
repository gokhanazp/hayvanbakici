import type { ReactNode } from 'react';
import type { ServiceType } from '@havre/core';

/**
 * HIZMET IKONLARI — TEK KAYNAK.
 *
 * Ayni cizimler hem ana sayfadaki hizmet kartlarinda hem de bakici
 * basvurusundaki hizmet secimi kartlarinda kullaniliyor. Iki yerde iki
 * ayri path tutmak, birinde degisiklik yapilip digerinin unutulmasi
 * demekti: kullanici ayni hizmeti iki farkli simgeyle goruyordu.
 *
 * NEDEN YENIDEN CIZILDI: eski dort ikon genel arayuz simgeleriydi — ev,
 * harita ignesi, EV (ayni sekil ikinci kez) ve bir cop adam. Ucu de
 * "bir yer" anlatiyordu, hangisinin hangi hizmet oldugu ancak yazidan
 * anlasiliyordu; ustelik sayfanin geri kalani el cizimi pati/kemik
 * diliyle konusurken kartlarin icinde baska bir dil vardi.
 *
 * Yeni set HER HIZMET ICIN FARKLI BIR NESNE kullaniyor ve nesneler
 * hayvan bakimindan geliyor:
 *   konaklama    — cati altinda bir pati (hayvan BASKASININ evinde)
 *   ev bakiciligi— anahtar (bakici SIZIN evinize geliyor, anahtari siz
 *                  veriyorsunuz)
 *   kisa ziyaret — mama kabi (isin kendisi: besleme, kum, oyun)
 *   gezdirme     — tasma: el halkasi, kayis ve boyunluk
 * Silueti birbirine benzeyen iki ikon kalmadi.
 *
 * DOLGU + KONTUR KARISIK: pati yastiklari dolgulu, gerisi konturlu.
 * Tek `path` string'i ile bu yapilamiyordu (eski surum oyleydi), bu
 * yuzden ikonlar artik JSX parcasi.
 *
 * Ikonlar DEKORATIF: her zaman yaninda hizmetin adi yaziyor, bu yuzden
 * aria-hidden. Bilgi tasiyan bir simge olsaydi metin karsiligi
 * gerekirdi (WCAG 1.1.1).
 */

/** Pati — dort parmak + yastik. Dolgulu: konturlu pati bu boyutta lekeye donuyor. */
function PawGlyph({ cx, cy, s = 1 }: { cx: number; cy: number; s?: number }) {
  const t = (x: number, y: number) => ({ cx: cx + x * s, cy: cy + y * s });
  return (
    <g fill="currentColor" stroke="none">
      <ellipse {...t(0, 2.2)} rx={2.4 * s} ry={1.85 * s} />
      <ellipse {...t(-2.75, -1.1)} rx={0.9 * s} ry={1.2 * s} transform={`rotate(-20 ${cx - 2.75 * s} ${cy - 1.1 * s})`} />
      <ellipse {...t(-0.95, -2.25)} rx={0.9 * s} ry={1.25 * s} />
      <ellipse {...t(0.95, -2.25)} rx={0.9 * s} ry={1.25 * s} />
      <ellipse {...t(2.75, -1.1)} rx={0.9 * s} ry={1.2 * s} transform={`rotate(20 ${cx + 2.75 * s} ${cy - 1.1 * s})`} />
    </g>
  );
}

const ICONS: Record<ServiceType, ReactNode> = {
  /* Konaklama — cati altinda pati */
  boarding: (
    <>
      <path d="M3.6 10.9 12 4.2l8.4 6.7" />
      <path d="M6.1 10v8.4a1.4 1.4 0 0 0 1.4 1.4h9a1.4 1.4 0 0 0 1.4-1.4V10" />
      <PawGlyph cx={12} cy={14.8} s={0.88} />
    </>
  ),

  /* Ev bakiciligi — anahtar */
  house_sitting: (
    <>
      <circle cx="7.4" cy="12" r="3.4" />
      <path d="M10.8 12h9.6" />
      <path d="M16.6 12v3.1" />
      <path d="M19.6 12v2.2" />
      <circle cx="7.4" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),

  /* Kisa ziyaret — mama kabi */
  drop_in: (
    <>
      {/*
        Kabin ICINE bir cizgi konmustu ve ikon bu boyutta gulen bir agza
        benziyordu; kaldirildi. Altindaki kisa cizgi kabi zemine oturtuyor.
      */}
      <path d="M3.9 12.4h16.2c0 4.1-3.4 6.6-8.1 6.6s-8.1-2.5-8.1-6.6Z" />
      <path d="M9.2 19.6h5.6" />
      <g fill="currentColor" stroke="none">
        <circle cx="9" cy="9.6" r="1.05" />
        <circle cx="12" cy="8.4" r="1.05" />
        <circle cx="15" cy="9.6" r="1.05" />
      </g>
    </>
  ),

  /*
    Gezdirme — PATI IZI.

    Once tasma cizilmisti: bir halka, bir kayis ve bir boyunluk. Bu
    boyutta "cember-cizgi-cember" oluyor ve paylas ikonuna benziyordu.
    Uc pati, yurunmus bir yolu tek bakista anlatiyor ve sayfanin geri
    kalanindaki kontur diliyle ayni sozlukten.
  */
  dog_walking: (
    <>
      <PawGlyph cx={6.4} cy={18} s={0.72} />
      <PawGlyph cx={12} cy={12.4} s={0.9} />
      <PawGlyph cx={17.8} cy={6.6} s={1.08} />
    </>
  ),

  /* --- v1'de kapali hizmetler (ikonlar ayni dilde hazir) --- */

  /* Gunduz bakimi — gunes + pati */
  day_care: (
    <>
      <path d="M12 3.2v1.9M19.1 6.3l-1.3 1.3M21 13.4h-1.9M4.9 13.4H3M6.2 7.6 4.9 6.3" />
      <PawGlyph cx={12} cy={13.6} s={1.15} />
    </>
  ),

  /* Egitim — pati + onay */
  training: (
    <>
      <PawGlyph cx={9.4} cy={11} s={1} />
      <path d="M14.2 17.4 16.6 19.8 21 14.6" />
    </>
  ),

  /* Bakim/tuvalet — firca */
  grooming: (
    <>
      <path d="M7.4 4.6h9.2a1.6 1.6 0 0 1 1.6 1.6v4.4a1.6 1.6 0 0 1-1.6 1.6H7.4a1.6 1.6 0 0 1-1.6-1.6V6.2a1.6 1.6 0 0 1 1.6-1.6Z" />
      <path d="M8.6 12.2v5.2M12 12.2v6.4M15.4 12.2v5.2" />
    </>
  ),
};

/** Pastel kutucuk tonlari — dort hizmet dort ayri tonda. */
export const SERVICE_TILE = ['tile-rose', 'tile-sage', 'tile-apricot', 'tile-peri'] as const;

export function ServiceIcon({ service, size = 24 }: { service: ServiceType; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {ICONS[service]}
    </svg>
  );
}
