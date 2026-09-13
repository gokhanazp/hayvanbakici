/**
 * KAHRAMAN GORSELI — GECICI.
 *
 * Gercek fotograf gelene kadar yerini tutan ozgun cizim: oturan bir kopek ve
 * bir kedi. Fotograf hazir oldugunda bu bilesen su sekilde degistirilir:
 *
 *   <Image className="hero-art" src={hero} alt="" priority placeholder="blur" />
 *
 * FOTOGRAF SPEC'I: arka plani SILINMIS (kesilmis) PNG/WebP, en az 1200x1000,
 * konu ortada, sicak dogal isik, kedi VE kopek ideal, ticari kullanim hakki.
 * Kesilmis olmasi onemli: krem zemine dogrudan oturuyor ve metnin arkasina
 * hic gecmedigi icin karartma katmanina gerek kalmiyor.
 */
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 420 320" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="212" cy="292" rx="158" ry="14" fill="var(--color-surface-sunken)" />

      {/* kopek */}
      <g stroke="var(--color-ink)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M104 292v-58c0-20 16-34 36-34s36 14 36 34v58" fill="var(--color-surface)" />
        <path d="M92 148c-12 10-14 44-4 60 8 13 22 10 26-2" fill="var(--color-surface)" />
        <path d="M188 148c12 10 14 44 4 60-8 13-22 10-26-2" fill="var(--color-surface)" />
        <ellipse cx="140" cy="150" rx="50" ry="46" fill="var(--color-surface)" />
        <ellipse cx="140" cy="178" rx="22" ry="16" fill="var(--color-surface-sunken)" />
      </g>
      <circle cx="122" cy="144" r="5.5" fill="var(--color-ink)" />
      <circle cx="158" cy="144" r="5.5" fill="var(--color-ink)" />
      <path d="M133 170h14l-7 8Z" fill="var(--color-ink)" />
      <path d="M140 178v5m0 0c-3 6-10 6-13 2m13-2c3 6 10 6 13 2"
        stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M110 202h60l-30 30Z" fill="var(--color-primary)" />
      <path d="M116 292v-16m48 16v-16" stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round" />

      {/* kedi */}
      <g stroke="var(--color-ink)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round">
        <path d="M262 292v-52c0-20 16-34 38-34s38 14 38 34v52" fill="var(--color-surface)" />
        <path d="M268 178l-4-34 30 16" fill="var(--color-surface)" />
        <path d="M332 178l4-34-30 16" fill="var(--color-surface)" />
        <ellipse cx="300" cy="188" rx="40" ry="36" fill="var(--color-surface)" />
      </g>
      <circle cx="286" cy="184" r="4.5" fill="var(--color-ink)" />
      <circle cx="314" cy="184" r="4.5" fill="var(--color-ink)" />
      <path d="M296 198h8l-4 6Z" fill="var(--color-accent-hover)" />
      <path d="M300 204c-3 5-9 5-12 2m12-2c3 5 9 5 12 2"
        stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" fill="none" />
      <g stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" opacity=".55">
        <path d="M258 190h-16m16 8-15 4" /><path d="M342 190h16m-16 8 15 4" />
      </g>
      <path d="M338 286c26 2 34-18 22-32"
        stroke="var(--color-ink)" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
