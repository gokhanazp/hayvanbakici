import Link from 'next/link';
import type { ReactNode } from 'react';
import { Avatar } from './Avatar';

/**
 * BEKLEYEN ISLER — SAYI DEGIL, ISIN KENDISI.
 *
 * Hesap ozeti bugune kadar yalnizca SAYI gosteriyordu: "2" ve altinda
 * "Rezervasyonlariniz". Kullanicinin asil sordugu sorular — kiminle,
 * ne zaman, benden ne bekleniyor — baska bir sayfadaydi. Bir ozet
 * ekraninin isi, ikinci bir tiklama gerektirmeden durumu soylemek.
 *
 * Her satir TEK BIR BAGLANTI: kartin tamami tiklanabilir, icinde ikinci
 * bir baglanti yok. Rozet ve tarih metin; renk tek tasiyici degil.
 */
export function ActivityList({ children }: { children: ReactNode }) {
  return <ul className="activity-list">{children}</ul>;
}

export function ActivityRow({
  href, avatar, initials, icon, title, meta, note, when, badge, tone = 'plain',
}: {
  href: string;
  avatar?: string | null | undefined;
  initials?: string | undefined;
  /** Avatar yerine simge — kisiyle ilgili olmayan satirlarda */
  icon?: ReactNode | undefined;
  title: string;
  /** Ikinci satir: tarih, hizmet, sure */
  meta?: string | undefined;
  /**
   * Ucuncu satir — DIKKAT CEKEN bilgi. "X tarihine kadar cevap
   * bekleniyor" gibi, kullanicinin kacirmamasi gereken sey.
   */
  note?: string | undefined;
  /**
   * NE ZAMAN — gelen kutusundaki damganin aynisi (chatStamp). Bildirim
   * gibi okunan bir satirda "ne zaman" sorusu rozetten once geliyor:
   * yirmi dakika once gelen bir mesajla dun gelen ayni satir degil.
   */
  when?: string | undefined;
  badge?: ReactNode | undefined;
  /** 'wait' — cevap bekleyen, sicak tonda sol serit. */
  tone?: 'plain' | 'wait' | undefined;
}) {
  return (
    <li>
      <Link href={href} className={`activity-row${tone === 'wait' ? ' is-wait' : ''}`}>
        <span className="activity-lead" aria-hidden="true">
          {icon ?? <Avatar src={avatar ?? null} initials={initials ?? '?'} size={40} />}
        </span>

        <span className="activity-body">
          <span className="activity-title">{title}</span>
          {meta && <span className="activity-meta">{meta}</span>}
          {note && <span className="activity-note">{note}</span>}
        </span>

        {(when ?? badge) && (
          <span className="activity-end">
            {when && <span className="activity-when tabular">{when}</span>}
            {badge}
          </span>
        )}
      </Link>
    </li>
  );
}

/** Kisiyle ilgili olmayan satirlar icin yuvarlak simge kutusu. */
export function ActivityIcon({ children }: { children: ReactNode }) {
  return <span className="activity-icon">{children}</span>;
}
