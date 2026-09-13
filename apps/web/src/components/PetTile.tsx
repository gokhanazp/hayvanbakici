/**
 * GALERI KARO GORSELI — GECICI.
 *
 * NEDEN STOK FOTOGRAF DEGIL: "topluluğumuzun anlari" diye stok fotograf
 * koymak uydurma sosyal kanittir. Ilk rezervasyonlar gelene kadar burada
 * kendi cizimlerimiz duruyor; boylece hicbir sey gercekmis gibi sunulmuyor.
 *
 * GEOMETRI HeroArt'TAN GELIYOR — bilincli. Ilk denemede karolar icin ayri
 * cizimler turetmistim; kopek ve tavsan blob gibi cikti. Kahraman
 * gorselindeki oranlar tarayicida dogrulanmisti, onlari olcekleyerek
 * kullanmak yeniden cizmekten hem daha guvenli hem daha tutarli.
 *
 * FOTOGRAFA GECIS: GalleryStrip'e `photos` verildiginde bu bilesen hic
 * cizilmiyor. Fotograf kurali: yalnizca sahibin ACIKCA izin verdigi
 * rezervasyon fotograflari (Law 25 / PIPEDA — riza consent_records'ta).
 */

export type PetTileVariant = 'dog' | 'cat' | 'paws' | 'heart';

const TINTS = [
  ['var(--color-tile-rose)', 'var(--color-tile-rose-ink)'],
  ['var(--color-tile-sage)', 'var(--color-tile-sage-ink)'],
  ['var(--color-tile-apricot)', 'var(--color-tile-apricot-ink)'],
  ['var(--color-tile-peri)', 'var(--color-tile-peri-ink)'],
] as const;

export function PetTile({ variant, tint, ratio }: {
  variant: PetTileVariant;
  /** 0-3 — TINTS dizisindeki ton */
  tint: number;
  /** Yukseklik/genislik. Masonry hissi icin karolar farkli oranlarda. */
  ratio: number;
}) {
  const [bg, ink] = TINTS[tint % TINTS.length] ?? TINTS[0];

  return (
    <div className="gallery-tile" style={{ background: bg, aspectRatio: `1 / ${ratio}` }}>
      <svg viewBox="0 0 200 200" fill="none" aria-hidden="true" focusable="false"
        style={{ width: '66%', height: 'auto', color: ink }}>

        {variant === 'dog' && (
          // HeroArt kopegi: x 86..194, y 96..292 -> 200x200 karoya olceklendi
          // fill zorunlu: sekiller BIRBIRINI ORTMELI. Fillsiz cizildiginde
          // kulaklar govdeyle kesisiyor ve kopek fok balinasina donuyordu.
          <g transform="translate(-22 -69) scale(0.87)" stroke="currentColor" strokeWidth="6"
            fill="var(--color-surface)" strokeLinejoin="round" strokeLinecap="round">
            <path d="M104 292v-58c0-20 16-34 36-34s36 14 36 34v58" />
            <path d="M92 148c-12 10-14 44-4 60 8 13 22 10 26-2" />
            <path d="M188 148c12 10 14 44 4 60-8 13-22 10-26-2" />
            <ellipse cx="140" cy="150" rx="50" ry="46" />
            <ellipse cx="140" cy="178" rx="22" ry="16" strokeWidth="4" opacity=".5" />
            <circle cx="122" cy="144" r="6" fill="currentColor" stroke="none" />
            <circle cx="158" cy="144" r="6" fill="currentColor" stroke="none" />
            <path d="M133 170h14l-7 8Z" fill="currentColor" stroke="none" />
            <path d="M140 178v5m0 0c-3 6-10 6-13 2m13-2c3 6 10 6 13 2" strokeWidth="5" fill="none" />
          </g>
        )}

        {variant === 'cat' && (
          // HeroArt kedisi: x 258..360, y 144..292 -> 200x200 karoya olceklendi
          <g transform="translate(-255 -151) scale(1.15)" stroke="currentColor" strokeWidth="4.5"
            fill="var(--color-surface)" strokeLinejoin="round" strokeLinecap="round">
            <path d="M262 292v-52c0-20 16-34 38-34s38 14 38 34v52" />
            <path d="M268 178l-4-34 30 16" />
            <path d="M332 178l4-34-30 16" />
            <ellipse cx="300" cy="188" rx="40" ry="36" />
            <circle cx="286" cy="184" r="4.5" fill="currentColor" stroke="none" />
            <circle cx="314" cy="184" r="4.5" fill="currentColor" stroke="none" />
            <path d="M296 198h8l-4 6Z" fill="currentColor" stroke="none" />
            <path d="M300 204c-3 5-9 5-12 2m12-2c3 5 9 5 12 2" strokeWidth="3.6" fill="none" />
            <path d="M258 190h-16m16 8-15 4M342 190h16m-16 8 15 4" strokeWidth="2.8"
              opacity=".6" fill="none" />
            <path d="M338 286c26 2 34-18 22-32" fill="none" />
          </g>
        )}

        {variant === 'paws' && (
          <g fill="currentColor" opacity=".8">
            {[[58, 62], [126, 44], [152, 118], [74, 146]].map(([x, y], i) => (
              <g key={i} transform={`translate(${x} ${y}) scale(0.58)`}>
                <ellipse cx="-26" cy="-12" rx="10" ry="13" />
                <ellipse cx="-2" cy="-23" rx="9" ry="12" />
                <ellipse cx="22" cy="-15" rx="9" ry="12" />
                <ellipse cx="38" cy="4" rx="9" ry="12" />
                <path d="M-26 16c0-16 13-28 29-28s29 12 29 28-13 21-29 21-29-5-29-21Z" />
              </g>
            ))}
          </g>
        )}

        {variant === 'heart' && (
          <g stroke="currentColor" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round">
            <path d="M100 168S26 122 26 74a30 30 0 0 1 74-18 30 30 0 0 1 74 18c0 48-74 94-74 94Z" />
            <g fill="currentColor" stroke="none" transform="translate(100 84) scale(0.44)">
              <ellipse cx="-26" cy="-12" rx="10" ry="13" />
              <ellipse cx="-2" cy="-23" rx="9" ry="12" />
              <ellipse cx="22" cy="-15" rx="9" ry="12" />
              <ellipse cx="38" cy="4" rx="9" ry="12" />
              <path d="M-26 16c0-16 13-28 29-28s29 12 29 28-13 21-29 21-29-5-29-21Z" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
