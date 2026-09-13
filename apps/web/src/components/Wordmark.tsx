/**
 * MARKA ISARETI.
 *
 * "Havre" = siginak, liman. Isaret bunu okuyor: bir catinin altinda duran
 * bir pati. Ozgun ve tek renkli — tek bir currentColor ile her zeminde
 * calisiyor, ayri bir koyu/acik surum gerektirmiyor.
 */
export function HavreMark({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flex: '0 0 auto' }}
    >
      {/*
        Cati inceltildi, pati buyutuldu. Ilk surumde pati parmaklari 26px'te
        tek bir lekeye donusuyordu — isaret bu boyutta okunmak zorunda,
        baska boyutta kullanilmiyor.
      */}
      <path
        d="M3.5 14.8 16 4.5l12.5 10.3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 16.6v9.4a1.5 1.5 0 0 0 1.5 1.5h16a1.5 1.5 0 0 0 1.5-1.5v-9.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g fill="currentColor">
        <ellipse cx="11.4" cy="18.6" rx="1.8" ry="2.3" />
        <ellipse cx="16" cy="17.6" rx="1.8" ry="2.3" />
        <ellipse cx="20.6" cy="18.6" rx="1.8" ry="2.3" />
        {/* Pati yastigi cati tabaniyla birlesmesin diye yukari alindi */}
        <path d="M16 20.6c3 0 5 1.9 5 3.6 0 1.5-2.2 2-5 2s-5-.5-5-2c0-1.7 2-3.6 5-3.6Z" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="wordmark-lockup">
      <span style={{ color: 'var(--color-primary)' }}>
        <HavreMark size={size} />
      </span>
      <span className="wordmark">havre</span>
    </span>
  );
}
