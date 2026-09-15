import type { ReactNode } from 'react';

/**
 * BOS DURUM — TEK BIR SEKIL, HER YERDE.
 *
 * Her hesap ekrani kendi bos halini ayri yazmisti ve hepsi ayni seyi
 * farkli yapiyordu: rezervasyonlarda sola yapisik kucuk bir beyaz kutu,
 * mesajlarda IKI dev bos panel, favorilerde kesik cerceveli bir kart.
 * Ucu de ayni soruya cevap veriyor — "burada henuz bir sey yok, ne
 * yapayim?" — ve hicbiri ayni gorunmuyordu.
 *
 * ORTALANMIS ve GENIS. Bos bir sayfada icerigi sol uste sikistirmak,
 * ekranin geri kalanini "yuklenmedi mi?" hissi veren bir bosluga
 * ceviriyordu.
 *
 * CIZIM DEKORATIF ve hafif: bos durum bir kutlama degil, bir yol
 * tarifi. Asil is CTA'da.
 *
 * SOZ VERMIYOR. "Yakinda!" gibi bir sey yazmiyor; yalnizca su an ne
 * oldugunu ve kullanicinin ne yapabilecegini soyluyor.
 */
export function EmptyState({
  icon, title, body, action, tone = 'plain',
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode | undefined;
  /** 'card' — kendi cercevesini cizer (izgara icinde duranlar icin). */
  tone?: 'plain' | 'card' | undefined;
}) {
  return (
    <div className={`empty-state${tone === 'card' ? ' empty-state-card' : ''}`}>
      <span className="empty-art" aria-hidden="true">{icon}</span>
      <h2 className="text-h3 empty-title">{title}</h2>
      <p className="muted empty-body">{body}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}

/* --------------------------------------------------------- cizimler */
/*
  Ikonlar degil CIZIMLER: 64 pikselde ince cizgili bir ikon soluk
  kaliyor, bos sayfayi daha da bos gosteriyordu. Her biri yumusak bir
  zemin dairesi icinde duruyor — sayfadaki tek gorsel oge o.
*/

function Art({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="32" fill="var(--color-primary-subtle)" />
      <g stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

/** Takvim — rezervasyon yok. */
export const CalendarArt = (
  <Art>
    <rect x="18" y="20" width="28" height="26" rx="4" />
    <path d="M18 28h28M26 16v6M38 16v6" />
    <path d="M25 35h4M35 35h4M25 41h4" />
  </Art>
);

/** Konusma balonu — mesaj yok. */
export const ChatArt = (
  <Art>
    <path d="M46 34a4 4 0 0 1-4 4H26l-8 6V24a4 4 0 0 1 4-4h20a4 4 0 0 1 4 4Z" />
    <path d="M26 27h12M26 32h7" />
  </Art>
);

/** Kalp — favori yok. */
export const HeartArt = (
  <Art>
    <path d="M32 46s-12-7.4-12-15.4A6.9 6.9 0 0 1 32 26a6.9 6.9 0 0 1 12 4.6C44 38.6 32 46 32 46Z" />
  </Art>
);

/** Pati — hayvan yok. */
export const PawArt = (
  <Art>
    <ellipse cx="24" cy="26" rx="3.4" ry="4.6" />
    <ellipse cx="32" cy="23" rx="3.4" ry="4.8" />
    <ellipse cx="40" cy="26" rx="3.4" ry="4.6" />
    <path d="M32 33c-4.6 0-8.4 3.2-8.4 6.8 0 2.6 2.2 4.2 5 4.2 1.6 0 2.4-.6 3.4-.6s1.8.6 3.4.6c2.8 0 5-1.6 5-4.2 0-3.6-3.8-6.8-8.4-6.8Z" />
  </Art>
);
