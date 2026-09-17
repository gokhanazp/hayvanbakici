'use client';

/**
 * EN DIS HATA SINIRI.
 *
 * Yalnizca kok duzenin KENDISI patlarsa buraya dusulur — yani normal
 * hata sinirinin (`[locale]/error.tsx`) ciziliemedigi durumda. Bu yuzden
 * kendi <html>'ini ciziyor ve stilleri satir ici: o noktada sitenin CSS
 * dosyasinin yuklendigine guvenemeyiz.
 *
 * Iki dilde, cunku hangi dilde oldugumuzu bilemiyoruz.
 */
export default function GlobalError({
  error, reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0, minHeight: '100dvh', display: 'grid', placeItems: 'center',
          padding: '2rem 1rem', background: '#fdf7ec', color: '#241a14',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          lineHeight: 1.5,
        }}
      >
        <main style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8125rem', letterSpacing: '.08em', textTransform: 'uppercase', color: '#7a6a5e', margin: 0 }}>
            Havre
          </p>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.1rem)', margin: '0.75rem 0 0.5rem' }}>
            Something went wrong on our side
            <span style={{ display: 'block', fontSize: '0.72em', color: '#7a6a5e', fontWeight: 400 }}>
              Quelque chose a mal tourné de notre côté
            </span>
          </h1>
          <p style={{ color: '#5c4f45', margin: '0 0 1.75rem' }}>
            This is our fault, not yours.
            <br />
            <span style={{ color: '#7a6a5e' }}>C’est notre faute, pas la vôtre.</span>
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem', borderRadius: '999px', border: 0,
              background: '#a81c3e', color: '#fff', fontWeight: 600,
              fontSize: '1rem', cursor: 'pointer',
            }}
          >
            Try again / Réessayer
          </button>
          {error.digest && (
            <p style={{ marginTop: '1.5rem', color: '#7a6a5e', fontSize: '0.8125rem', fontVariantNumeric: 'tabular-nums' }}>
              {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
