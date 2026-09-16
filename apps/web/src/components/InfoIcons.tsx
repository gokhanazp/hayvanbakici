/**
 * BILGI SAYFALARINDAKI LISTE ISARETLERI.
 *
 * Madde isareti (•) yerine ne dendigini TASIYAN bir sekil: "sunlari
 * ucretlendirmiyoruz" listesinde yuvarlak icinde egik cizgi, "sunlar
 * gizli kalir" listesinde kilit. Ucu de dekoratif — yanindaki cumle
 * zaten her seyi soyluyor (WCAG 1.1.1).
 */

function Frame({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Yasak isareti — "bunu almiyoruz" */
export function NoIcon({ size = 18 }: { size?: number }) {
  return (
    <Frame size={size}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M5.9 18.1 18.1 5.9" />
    </Frame>
  );
}

/** Kilit — "bu gizli kaliyor" */
export function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M5.4 10.6h13.2v9.8H5.4z" />
      <path d="M8.4 10.6V7.8a3.6 3.6 0 0 1 7.2 0v2.8" />
    </Frame>
  );
}

/** Onay — "bunu yapiyoruz" */
export function CheckIcon({ size = 18 }: { size?: number }) {
  return (
    <Frame size={size}>
      <path d="M4.4 12.6 9.4 17.6 19.6 6.8" />
    </Frame>
  );
}
