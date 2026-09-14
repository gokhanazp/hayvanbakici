/**
 * GRAFIKLER — kutuphanesiz, duz SVG.
 *
 * Neden kutuphane yok: bir grafik kutuphanesi (recharts/chart.js) istemci
 * paketine 100 KB'in uzerinde ekliyor ve hepsi tarayicida calisiyor. Burada
 * cizilen sey yirmi-otuz sayidan ibaret; sunucuda SVG uretmek hem daha
 * hizli hem de panelde JavaScript'e hic ihtiyac birakmiyor.
 *
 * ERISILEBILIRLIK: her grafik `role="img"` ve ozetleyen bir `aria-label`
 * tasiyor; ayrica altinda gercek sayilar metin olarak yaziyor. Ekran
 * okuyucu kullanan biri icin "yukselen bir egri" hicbir sey ifade etmez.
 */

export interface Point {
  date: string;
  value: number;
}

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / mag) * mag;
}

/*
  viewBox GENISLIGI kartin gercek genisligine yakin tutuluyor (~360).
  Once 640 idi: ucte bir genislikteki bir kartta SVG 0,55 oraninda
  kuculuyor ve 10px'lik eksen yazilari ekranda 5px'e dusup okunmaz
  oluyordu. Oran 1'e yaklastikca yazi boyutu da gercek kaliyor.
*/
const W = 360;
const H = 150;
const PAD_L = 40;
const PAD_B = 16;

export function LineChart({
  points, label, format,
}: {
  points: Point[];
  label: string;
  format?: ((n: number) => string) | undefined;
}) {
  const fmt = format ?? ((n: number) => String(n));
  if (points.length < 2) return <p className="a-dim">Not enough data yet.</p>;

  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const stepX = (W - PAD_L) / (points.length - 1);
  const y = (v: number) => H - PAD_B - (v / max) * (H - PAD_B - 6);
  const x = (i: number) => PAD_L + i * stepX;

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - PAD_B} L${PAD_L},${H - PAD_B} Z`;

  const total = points.reduce((s, p) => s + p.value, 0);

  return (
    <>
      <svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label={`${label}: ${fmt(total)} over ${points.length} days, peak ${fmt(max)}`}>
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line className="grid" x1={PAD_L} x2={W} y1={y(max * f)} y2={y(max * f)} />
            <text x={0} y={y(max * f) + 3}>{fmt(Math.round(max * f))}</text>
          </g>
        ))}
        <path className="area" d={area} />
        <path className="line" d={line} />
        <text x={PAD_L} y={H - 3}>{points[0]!.date}</text>
        <text x={W} y={H - 3} textAnchor="end">{points[points.length - 1]!.date}</text>
      </svg>
    </>
  );
}

export function BarChart({
  points, label, format,
}: {
  points: Point[];
  label: string;
  format?: ((n: number) => string) | undefined;
}) {
  const fmt = format ?? ((n: number) => String(n));
  if (points.length === 0) return <p className="a-dim">Not enough data yet.</p>;

  const max = niceMax(Math.max(...points.map((p) => p.value)));
  const slot = (W - PAD_L) / points.length;
  const barW = Math.max(1, slot - 2);
  const total = points.reduce((s, p) => s + p.value, 0);

  return (
    <svg className="a-chart" viewBox={`0 0 ${W} ${H}`} role="img"
         aria-label={`${label}: ${fmt(total)} over ${points.length} days, peak ${fmt(max)}`}>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line className="grid" x1={PAD_L} x2={W}
                y1={H - PAD_B - f * (H - PAD_B - 6)} y2={H - PAD_B - f * (H - PAD_B - 6)} />
          <text x={0} y={H - PAD_B - f * (H - PAD_B - 6) + 3}>{fmt(Math.round(max * f))}</text>
        </g>
      ))}
      {points.map((p, i) => {
        const h = (p.value / max) * (H - PAD_B - 6);
        return (
          <rect key={p.date} className="bar"
                x={PAD_L + i * slot + 1} y={H - PAD_B - h}
                width={barW} height={Math.max(p.value > 0 ? 1 : 0, h)} rx={1}>
            <title>{`${p.date}: ${fmt(p.value)}`}</title>
          </rect>
        );
      })}
      <text x={PAD_L} y={H - 3}>{points[0]!.date}</text>
      <text x={W} y={H - 3} textAnchor="end">{points[points.length - 1]!.date}</text>
    </svg>
  );
}

/** Yatay oranli cubuklar — sehir/hizmet dagilimi gibi kisa listeler icin. */
export function RankBars({
  rows,
}: {
  rows: Array<{ label: string; value: number; suffix?: string }>;
}) {
  if (rows.length === 0) return <p className="a-dim">No data.</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="a-bars">
      {rows.map((r) => (
        <div key={r.label} className="row">
          <span>{r.label}</span>
          <span className="a-num a-dim">{r.value}{r.suffix ?? ''}</span>
          <span className="track">
            <span className="fill" style={{ width: `${Math.round((r.value / max) * 100)}%` }} />
          </span>
        </div>
      ))}
    </div>
  );
}
