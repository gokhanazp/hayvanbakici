'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * PROFILDEKI "SORU SOR" DUGMESI — SAYFA DEGISTIRMEDEN.
 *
 * Soru, bakiciya BAKARKEN doguyor. Eski akista dugme ayri bir sayfaya
 * goturuyordu: profil kayboluyor, fiyat kayboluyor, takvim kayboluyor;
 * kullanici "neydi o tarih" diye geri donuyordu. Artik sag alttaki
 * sohbet paneli aciliyor ve profil ekranda kaliyor.
 *
 * NEDEN OLAY (event), NEDEN DOGRUDAN CAGRI DEGIL:
 *
 * Bakici profili STATIK uretiliyor (ISR, revalidate 3600). Oturumu
 * sunucuda okumak sayfayi dinamik yapar ve ISR biter — projede bu
 * kural bir kez ogrenildi. Panelin kendisi ise oturuma bagli bir
 * istemci bileseni ve kok yerlesimde duruyor. Ikisini bir baglam
 * (context) saglayicisiyla birlestirmek, saglayiciyi butun sayfa
 * agacina sokardi. Iptal edilebilir bir pencere olayi ikisini de
 * birbirinden habersiz birakiyor.
 *
 * VE ASIL KAZANC — AKIS HICBIR KOSULDA KIRILMIYOR:
 * `dispatchEvent` yalnizca bir dinleyici `preventDefault()` cagirdiysa
 * `false` donuyor. Yani panel isi USTLENDIYSE baglanti iptal ediliyor;
 * ustlenmediyse (JavaScript yuklenmemis, kullanici giris yapmamis,
 * panelin gizli oldugu bir sayfa, ya da kisi kendi profiline bakiyor)
 * baglanti oldugu gibi calisiyor ve eski /ask/ sayfasi aciliyor. Eski
 * sayfa SILINMEDI: giris yapmamis ziyaretcinin giris ekranina
 * yonlendirilmesi hala oradan geciyor.
 */
export const ASK_EVENT = 'havre:ask-sitter';

export interface AskDetail {
  sitterId: string;
  firstName: string;
  /** Profildeki `photoInitials` — bas harfler zaten orada hazir. */
  initials: string;
  avatarUrl: string | null;
}

export function AskInChat({
  href, className, detail, children,
}: {
  href: string;
  className?: string;
  detail: AskDetail;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        const ev = new CustomEvent<AskDetail>(ASK_EVENT, { detail, cancelable: true });
        if (!window.dispatchEvent(ev)) e.preventDefault();
      }}
    >
      {children}
    </Link>
  );
}
