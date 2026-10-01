/**
 * TASARIMDAKI IKONLAR — ELDE CIZILMIS.
 *
 * Stitch ciktisi Material Symbols kullaniyor ve o, Google Fonts'tan
 * yuklenen bir ikon FONTU. Biz yazi tiplerini bilerek self-host
 * ediyoruz (apps/web/src/app/[locale]/layout.tsx): Google'a sinir
 * otesi istek gitmiyor, Law 25 icin PIA gerekmiyor ve ilk boyama
 * harici bir baglantiyi beklemiyor. Ikon fontu icin bu karari bozmak
 * anlamsiz olurdu.
 *
 * Bu yuzden tasarimda kullanilan ikonlar burada satir ici SVG olarak
 * cizildi: ayni kalinlik (1.8), ayni yuvarlak uclar, ayni 24'luk
 * kutu. `currentColor` kullaniyorlar, yani rengi her zaman icinde
 * bulunduklari metinden aliyorlar — tipki ikon fontu gibi.
 */
export type SymName =
  | 'walk' | 'night' | 'sun' | 'home-pin' | 'pets' | 'cat'
  | 'house' | 'location' | 'calendar' | 'search' | 'verified' | 'shield'
  | 'health' | 'lock' | 'support' | 'bolt' | 'star' | 'arrow-right'
  | 'globe' | 'heart' | 'chat' | 'help' | 'tune' | 'camera' | 'people'
  | 'user' | 'rabbit';

const BOX = { viewBox: '0 0 24 24', fill: 'none' } as const;

export function Sym({
  name, size = 20, filled = false, className,
}: {
  name: SymName;
  size?: number;
  /** Yildiz gibi dolu cizilmesi gereken ikonlar icin */
  filled?: boolean;
  className?: string;
}) {
  const stroke = {
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  const common = {
    ...BOX,
    width: size,
    height: size,
    'aria-hidden': true as const,
    ...(className ? { className } : {}),
  };

  switch (name) {
    case 'walk':
      return (
        <svg {...common}>
          <circle cx="13" cy="4.3" r="1.8" {...stroke} />
          <path d="M11.4 21l1.1-5.2-2.3-2.1.8-4.4 3.2 1.4 1.4 2.6" {...stroke} />
          <path d="M9.6 9.3 7.2 11l-.9 3.2" {...stroke} />
          <path d="m12.5 15.8-2.6 2.4-2.1 2.8" {...stroke} />
        </svg>
      );
    /*
      GECELEME. Onceki cizim catinin altina bir KAPI koyuyordu ve
      18 pikselde duz bir evden ayirt edilemiyordu — marka isaretiyle
      ayni sekle dusuyordu. Tasarimin kullandigi night_shelter gibi
      catinin altinda bir YATAK var: silueti artik tek basina
      "burada uyunuyor" diyor.
    */
    case 'night':
      return (
        <svg {...common}>
          <path d="M3.4 10.8 12 4.2l8.6 6.6" {...stroke} />
          <path d="M6 10v9h12v-9" {...stroke} />
          <path d="M8 16.4h8" {...stroke} />
          <path d="M8 16.4v-2.2a1.4 1.4 0 0 1 1.4-1.4h5.2a1.4 1.4 0 0 1 1.4 1.4v2.2" {...stroke} />
          <path d="M8 16.4V19M16 16.4V19" {...stroke} />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" {...stroke} />
          <path d="M12 2.6v2.1M12 19.3v2.1M4.2 4.2l1.5 1.5M18.3 18.3l1.5 1.5M2.6 12h2.1M19.3 12h2.1M4.2 19.8l1.5-1.5M18.3 5.7l1.5-1.5" {...stroke} />
        </svg>
      );
    /* Adrese gelme — damlanin icinde bir ev. Damla biraz doldu, 18
       pikselde icindeki ev artik seciliyor. */
    case 'home-pin':
      return (
        <svg {...common}>
          <path d="M12 21.2c3.9-4.2 6.2-7.4 6.2-10.4A6.2 6.2 0 0 0 5.8 10.8c0 3 2.3 6.2 6.2 10.4Z" {...stroke} />
          <path d="m8.8 11.2 3.2-2.8 3.2 2.8" {...stroke} />
          <path d="M9.9 10.6v3.8h4.2v-3.8" {...stroke} />
        </svg>
      );
    case 'pets':
      return (
        <svg {...common}>
          <circle cx="6.6" cy="9.4" r="1.9" fill="currentColor" />
          <circle cx="10.4" cy="6.3" r="1.9" fill="currentColor" />
          <circle cx="14.6" cy="6.3" r="1.9" fill="currentColor" />
          <circle cx="18" cy="9.9" r="1.9" fill="currentColor" />
          <path d="M12.3 11.4c2.9 0 5 2.5 5 4.7 0 1.9-1.6 2.9-3.2 2.9h-3.8c-1.6 0-3.2-1-3.2-2.9 0-2.2 2.2-4.7 5.2-4.7Z" fill="currentColor" />
        </svg>
      );
    case 'cat':
      return (
        <svg {...common}>
          <path d="M5.4 9.6 4.6 4.8l3.7 2.5" {...stroke} />
          <path d="M18.6 9.6 19.4 4.8l-3.7 2.5" {...stroke} />
          <path d="M12 7.1c3.7 0 6.6 2.9 6.6 6.5S15.7 20 12 20s-6.6-2.8-6.6-6.4S8.3 7.1 12 7.1Z" {...stroke} />
          <path d="M10.2 13.1h.01M13.8 13.1h.01" {...stroke} />
          <path d="M8.1 15.2H5.6M18.4 15.2h-2.5" {...stroke} />
        </svg>
      );
    case 'house':
      return (
        <svg {...common}>
          <path d="M3.5 11.4 12 4.6l8.5 6.8" {...stroke} />
          <path d="M6 10.4V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8.6" {...stroke} />
          <circle cx="14.6" cy="15" r="1.3" {...stroke} />
          <path d="M13.3 15H9.6" {...stroke} />
        </svg>
      );
    case 'location':
      return (
        <svg {...common}>
          <path d="M12 21s6.4-5.6 6.4-10.4A6.4 6.4 0 0 0 5.6 10.6C5.6 15.4 12 21 12 21Z" {...stroke} />
          <circle cx="12" cy="10.4" r="2.4" {...stroke} />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.6" y="5.4" width="16.8" height="15" rx="2.6" {...stroke} />
          <path d="M3.6 10h16.8M8.4 3.4v3.6M15.6 3.4v3.6" {...stroke} />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="10.8" cy="10.8" r="6.4" {...stroke} />
          <path d="m15.6 15.6 4.2 4.2" {...stroke} />
        </svg>
      );
    case 'verified':
      return (
        <svg {...common}>
          <path d="m12 2.8 2.3 1.8 2.9-.3 1 2.7 2.5 1.5-1 2.7 1 2.7-2.5 1.5-1 2.7-2.9-.3L12 21.2l-2.3-1.8-2.9.3-1-2.7-2.5-1.5 1-2.7-1-2.7 2.5-1.5 1-2.7 2.9.3Z" {...stroke} />
          <path d="m8.8 12 2.2 2.2 4.2-4.4" {...stroke} />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3.2 5 5.9v5.4c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V5.9Z" {...stroke} />
        </svg>
      );
    case 'health':
      return (
        <svg {...common}>
          <path d="M12 3.2 5 5.9v5.4c0 4.2 2.9 8.1 7 9.5 4.1-1.4 7-5.3 7-9.5V5.9Z" {...stroke} />
          <path d="M12 8.7v5.6M9.2 11.5h5.6" {...stroke} />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4.6" y="10.2" width="14.8" height="10.2" rx="2.4" {...stroke} />
          <path d="M8.2 10.2V7.8a3.8 3.8 0 0 1 7.6 0v2.4" {...stroke} />
        </svg>
      );
    case 'support':
      return (
        <svg {...common}>
          <path d="M4.6 14.4v-2.6a7.4 7.4 0 0 1 14.8 0v2.6" {...stroke} />
          <rect x="2.9" y="13.3" width="3.6" height="5.4" rx="1.8" {...stroke} />
          <rect x="17.5" y="13.3" width="3.6" height="5.4" rx="1.8" {...stroke} />
          <path d="M19.3 18.7v.6a2.2 2.2 0 0 1-2.2 2.2h-2.5" {...stroke} />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13.4 2.8 5.2 13.3h5.3l-.9 7.9 8.2-10.5h-5.3Z" {...stroke} />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path
            d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8Z"
            {...(filled ? { fill: 'currentColor' } : stroke)}
          />
        </svg>
      );
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M4.4 12h15.2M13.6 6l6 6-6 6" {...stroke} />
        </svg>
      );
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" {...stroke} />
          <path d="M3.6 12h16.8M12 3.6c2.1 2.3 3.2 5.3 3.2 8.4s-1.1 6.1-3.2 8.4c-2.1-2.3-3.2-5.3-3.2-8.4S9.9 5.9 12 3.6Z" {...stroke} />
        </svg>
      );
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20.2S3.8 15.1 3.8 9.4a4.6 4.6 0 0 1 8.2-2.8 4.6 4.6 0 0 1 8.2 2.8c0 5.7-8.2 10.8-8.2 10.8Z" {...stroke} />
        </svg>
      );
    case 'chat':
      return (
        <svg {...common}>
          <path d="M20.4 11.6c0 4-3.8 7.2-8.4 7.2-1 0-2-.15-2.9-.43L4.2 20l1.3-3.5a6.9 6.9 0 0 1-2-4.9c0-4 3.8-7.2 8.5-7.2s8.4 3.2 8.4 7.2Z" {...stroke} />
        </svg>
      );
    case 'help':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.4" {...stroke} />
          <path d="M9.7 9.5a2.4 2.4 0 1 1 3.2 2.3c-.6.25-.9.8-.9 1.5v.4" {...stroke} />
          <path d="M12 16.9h.01" {...stroke} />
        </svg>
      );
    case 'tune':
      return (
        <svg {...common}>
          <path d="M4 7.4h10M18 7.4h2M4 16.6h4M12 16.6h8" {...stroke} />
          <circle cx="16" cy="7.4" r="2.1" {...stroke} />
          <circle cx="10" cy="16.6" r="2.1" {...stroke} />
        </svg>
      );
    case 'camera':
      return (
        <svg {...common}>
          <path d="M4.6 8.4h3l1.4-2.2h6l1.4 2.2h3a1.6 1.6 0 0 1 1.6 1.6v8a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 18V10a1.6 1.6 0 0 1 1.6-1.6Z" {...stroke} />
          <circle cx="12" cy="13.6" r="3.2" {...stroke} />
        </svg>
      );
    /*
      IKI KISI. Tasarimda bu yerde el sikisma (handshake) var; o cizim
      18 pikselde KONTUR olarak okunmuyor — denenen dort varyantin
      hepsi papyona ya da zikzaga benzedi. (Material'in kendi glifi
      DOLU cizildigi icin o boyutta tutuyor; bizim set bastan sona
      konturlu ve tek bir ikonu dolduramayiz.) Anlam korunuyor:
      tanisma. Iki bas + iki omuz 18 pikselde tek bakista okunuyor.
    */
    case 'people':
      return (
        <svg {...common}>
          <circle cx="8.4" cy="8.2" r="2.9" {...stroke} />
          <circle cx="15.6" cy="8.2" r="2.9" {...stroke} />
          <path d="M3.4 19.2a5 5 0 0 1 10 0" {...stroke} />
          <path d="M13.4 14.4a5 5 0 0 1 7.2 4.8" {...stroke} />
        </svg>
      );
    /*
      Tasarimda arama kutusundaki "evcil hayvaniniz" alani pati degil
      TAVSAN cizimi kullaniyor (cruelty_free). Nedeni acik: pati zaten
      hizmet kartlarinda duruyor, bu alan ise "hangi hayvan" diye
      soruyor ve tavsan koepek-kedi disini de kapsiyor.
    */
    case 'rabbit':
      return (
        <svg {...common}>
          <path d="M9.1 9.4 7.4 4.3a1.3 1.3 0 0 1 2.2-1.2l3 4.3" {...stroke} />
          <path d="M14.9 9.4l1.7-5.1a1.3 1.3 0 0 0-2.2-1.2l-1.8 2.6" {...stroke} />
          <path d="M12 8.6c3 0 5.4 2.5 5.4 5.6 0 3.1-2.4 5.4-5.4 5.4s-5.4-2.3-5.4-5.4c0-3.1 2.4-5.6 5.4-5.6Z" {...stroke} />
          <path d="M10.4 13.6h.01M13.6 13.6h.01" {...stroke} />
          <path d="M12 15.6v1.2" {...stroke} />
        </svg>
      );
    /* Giris yapilmamisken hesap hapinda duran silueti */
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8.4" r="3.6" {...stroke} />
          <path d="M4.8 20.2a7.2 7.2 0 0 1 14.4 0" {...stroke} />
        </svg>
      );
    default:
      return null;
  }
}
