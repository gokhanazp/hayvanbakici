import type { ReactNode } from 'react';

/**
 * PANELIN KUCUK PARCALARI.
 *
 * Hepsi sunucu bileseni: hicbiri tarayicida is yapmiyor. Panelde
 * JavaScript yalnizca iki yerde var (sol menunun aktif satiri ve karar
 * formlarindaki "gerekce yazilmadan dugme acilmaz" kontrolu).
 */

export function Page({
  title, lead, actions, children,
}: {
  title: string;
  lead?: string | undefined;
  actions?: ReactNode | undefined;
  children: ReactNode;
}) {
  return (
    <>
      <header className="a-top">
        <div className="a-top-text">
          <h1>{title}</h1>
          {lead && <p>{lead}</p>}
        </div>
        {actions && <div className="a-row" style={{ marginLeft: 'auto' }}>{actions}</div>}
      </header>
      <div className="a-content">{children}</div>
    </>
  );
}

export function Card({
  title, hint, children, style,
}: {
  title?: string | undefined;
  hint?: string | undefined;
  children: ReactNode;
  style?: React.CSSProperties | undefined;
}) {
  return (
    <section className="a-card" style={style}>
      {title && <h2>{title}</h2>}
      {hint && <p className="a-dim" style={{ fontSize: 11, marginTop: 2 }}>{hint}</p>}
      <div style={{ marginTop: title || hint ? 12 : 0 }}>{children}</div>
    </section>
  );
}

export function Stat({
  label, value, delta, hint,
}: {
  label: string;
  value: string;
  delta?: number | null | undefined;
  hint?: string | undefined;
}) {
  return (
    <div className="a-card a-stat">
      <p className="k">{label}</p>
      <p className="v">{value}</p>
      {delta !== undefined && (
        <p className={`d ${delta === null ? 'a-flat' : delta > 0 ? 'a-up' : delta < 0 ? 'a-down' : 'a-flat'}`}>
          {/* Onceki donem sifirsa yuzde degisim TANIMSIZDIR — "%∞ artis"
              yazmak yerine bunu acikca soyluyoruz. */}
          {delta === null ? 'no earlier period' : `${delta > 0 ? '+' : ''}${delta}% vs previous`}
        </p>
      )}
      {hint && <p className="d a-flat">{hint}</p>}
    </div>
  );
}

const TONE: Record<string, string> = {
  // bekleyen / insan gerektiren
  pending: 'a-badge-wait', requested: 'a-badge-wait', open: 'a-badge-wait',
  reviewing: 'a-badge-wait', manual_review: 'a-badge-wait',
  // iyi giden
  active: 'a-badge-ok', confirmed: 'a-badge-ok', completed: 'a-badge-ok',
  passed: 'a-badge-ok', paid: 'a-badge-ok', payout_released: 'a-badge-ok',
  published: 'a-badge-ok', actioned: 'a-badge-ok',
  // kotu biten
  declined: 'a-badge-bad', cancelled: 'a-badge-bad', expired: 'a-badge-bad',
  deactivated: 'a-badge-bad', suspended: 'a-badge-bad', failed: 'a-badge-bad',
  hidden: 'a-badge-bad', disputed: 'a-badge-bad',
  // bilgi
  in_progress: 'a-badge-info', admin: 'a-badge-info',
};

/** Renk TEK tasiyici degil: metin her zaman yaziyor (WCAG 1.4.1). */
export function Badge({ value, label }: { value: string; label?: string | undefined }) {
  return <span className={`a-badge ${TONE[value] ?? ''}`}>{label ?? value.replace(/_/g, ' ')}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="a-empty">{children}</p>;
}

/** Uzun kimlikleri ekranda kisaltir; tam degeri title'da tutar. */
export function ShortId({ id }: { id: string }) {
  return <span className="a-num a-dim" title={id}>{id.slice(0, 8)}…</span>;
}
