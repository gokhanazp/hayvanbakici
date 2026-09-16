/**
 * MENU IKONLARI.
 *
 * Ikon kutuphanesi YOK. Yedi ikon icin lucide/heroicons kurmak, istemci
 * paketine binlerce satir tasimak demek; hepsi burada, tek bir cizim
 * dilinde: 20x20 kutu, 1.6 kalinlik, `currentColor`, yuvarlatilmis uc.
 * Ayni kalinlik ve ayni kutu = tutarli gorunum; ikon setlerini
 * karistirmanin en kolay yakalanan hatasi budur.
 *
 * `aria-hidden`: ikonun yaninda her zaman bir metin var (menu daralinca
 * metin gorsel olarak gizlenir ama DOM'da kalir). Ikonun ayrica
 * seslendirilmesi tekrar olurdu.
 */
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export type IconName =
  | 'dashboard' | 'applications' | 'users' | 'bookings'
  | 'reviews' | 'reports' | 'audit' | 'settings'
  | 'collapse' | 'expand' | 'back' | 'signout';

export function Icon({ name }: { name: IconName }) {
  switch (name) {
    /* Komisyon ayarlari — disli degil YUZDE: menudeki tek "ayar"
       burasi ve ne ayari oldugunu soylemesi gerekiyor. */
    case 'settings':
      return (
        <svg {...base}>
          <circle cx="7.5" cy="7.5" r="3" />
          <circle cx="16.5" cy="16.5" r="3" />
          <path d="M18.5 5.5 5.5 18.5" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...base}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case 'applications':
      return (
        <svg {...base}>
          <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H15l5 5v9.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
          <path d="M14.5 4v4.5H19" />
          <path d="M8.5 13.5h7M8.5 16.5h4" />
        </svg>
      );
    case 'users':
      return (
        <svg {...base}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
          <path d="M16 5.6a3.2 3.2 0 0 1 0 6.3" />
          <path d="M17.5 14.2a5.5 5.5 0 0 1 3 5.3" />
        </svg>
      );
    case 'bookings':
      return (
        <svg {...base}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
          <path d="M8 13.5h3.5" />
        </svg>
      );
    case 'reviews':
      return (
        <svg {...base}>
          <path d="M12 4.2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.9l5.4-.8Z" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...base}>
          <path d="M5 21V4.5h9l-1 3h6l-1.5 4.2 1.5 4.3h-8l-1-3H5" />
        </svg>
      );
    case 'audit':
      return (
        <svg {...base}>
          <path d="M12 3.2 5 6v6c0 4.2 2.9 7.5 7 8.8 4.1-1.3 7-4.6 7-8.8V6Z" />
          <path d="m9.2 12.2 2 2 3.6-3.8" />
        </svg>
      );
    case 'collapse':
      return (
        <svg {...base}>
          <path d="M14.5 7 9.5 12l5 5" />
        </svg>
      );
    case 'expand':
      return (
        <svg {...base}>
          <path d="m9.5 7 5 5-5 5" />
        </svg>
      );
    case 'back':
      return (
        <svg {...base}>
          <path d="M20 12H4" />
          <path d="m9.5 6.5-5.5 5.5 5.5 5.5" />
        </svg>
      );
    case 'signout':
      return (
        <svg {...base}>
          <path d="M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14" />
          <path d="M16 8.5 19.5 12 16 15.5" />
          <path d="M19.5 12h-9" />
        </svg>
      );
  }
}
