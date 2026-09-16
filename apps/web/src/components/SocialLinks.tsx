import { SOCIAL, SOCIAL_LABEL, type SocialNetwork } from '@/lib/social';

/**
 * SOSYAL HESAP IKONLARI.
 *
 * Hesap YOKSA hicbir sey cizilmiyor (lib/social.ts). Baslikta duran ama
 * hicbir yere gitmeyen bir ikon, ziyaretciye var olmayan bir sey vaat
 * eder; bos liste bu yuzden gecerli bir durum, eksik bir is degil.
 *
 * Baglantilar yeni sekmede aciliyor: sosyal hesap sitenin bir parcasi
 * degil, ve rezervasyon yapmak uzere olan birini siteden CIKARMAK
 * istemiyoruz. rel="me" hesabin bize ait oldugunu makineye soyluyor.
 */
export function SocialLinks({ size = 16, className }: { size?: number; className?: string }) {
  if (SOCIAL.length === 0) return null;
  return (
    <span className={className ? `social-links ${className}` : 'social-links'}>
      {SOCIAL.map((a) => {
        /*
          YER TUTUCU ADRES yeni sekmede ACILMAZ: bos bir sekme acmak,
          tiklayan kisiye bir sey bozulmus gibi gelir. Gercek adres
          konunca baglanti kendiliginden yeni sekmeye gecer.
        */
        const placeholder = a.url === '#';
        return (
          <a
            key={a.network}
            href={a.url}
            className="social-link"
            {...(placeholder ? {} : { target: '_blank', rel: 'me noreferrer' })}
            aria-label={SOCIAL_LABEL[a.network]}
          >
            <Icon network={a.network} size={size} />
          </a>
        );
      })}
    </span>
  );
}

function Icon({ network, size }: { network: SocialNetwork; size: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor',
    'aria-hidden': true, focusable: 'false' } as const;
  switch (network) {
    case 'instagram':
      return (
        <svg {...p}><path d="M12 2c2.7 0 3.1 0 4.1.06 1 .05 1.7.2 2.3.44.6.24 1.1.55 1.6 1.05s.8 1 1.05 1.6c.24.6.4 1.3.44 2.3.05 1 .06 1.3.06 4.5s0 3.5-.06 4.5c-.05 1-.2 1.7-.44 2.3-.24.6-.55 1.1-1.05 1.6s-1 .8-1.6 1.05c-.6.24-1.3.4-2.3.44-1 .05-1.4.06-4.1.06s-3.1 0-4.1-.06c-1-.05-1.7-.2-2.3-.44-.6-.24-1.1-.55-1.6-1.05s-.8-1-1.05-1.6c-.24-.6-.4-1.3-.44-2.3C2.4 15.5 2.4 15.2 2.4 12s0-3.5.06-4.5c.05-1 .2-1.7.44-2.3.24-.6.55-1.1 1.05-1.6s1-.8 1.6-1.05c.6-.24 1.3-.4 2.3-.44C8.9 2 9.3 2 12 2Zm0 1.8c-2.7 0-3 0-4 .06-.8.04-1.2.17-1.5.29-.4.15-.6.32-.9.6-.28.28-.45.5-.6.9-.12.3-.25.7-.29 1.5-.05 1-.06 1.3-.06 4s0 3 .06 4c.04.8.17 1.2.29 1.5.15.4.32.6.6.9.28.28.5.45.9.6.3.12.7.25 1.5.29 1 .05 1.3.06 4 .06s3 0 4-.06c.8-.04 1.2-.17 1.5-.29.4-.15.6-.32.9-.6.28-.28.45-.5.6-.9.12-.3.25-.7.29-1.5.05-1 .06-1.3.06-4s0-3-.06-4c-.04-.8-.17-1.2-.29-1.5-.15-.4-.32-.6-.6-.9-.28-.28-.5-.45-.9-.6-.3-.12-.7-.25-1.5-.29-1-.05-1.3-.06-4-.06Zm0 3.1a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2Zm0 1.8a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Zm5.3-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z" /></svg>
      );
    case 'facebook':
      return (
        <svg {...p}><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" /></svg>
      );
    case 'tiktok':
      return (
        <svg {...p}><path d="M16.5 2h-3v13.2a2.6 2.6 0 1 1-2.2-2.6v-3a5.6 5.6 0 1 0 5.2 5.6V8.8c1 .7 2.2 1.1 3.5 1.2V7c-2-.1-3.5-1.6-3.5-3.5V2Z" /></svg>
      );
    case 'youtube':
      return (
        <svg {...p}><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" /></svg>
      );
    case 'linkedin':
      return (
        <svg {...p}><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 21h4V9H3v12Zm7-12v12h4v-6.3c0-1.7 1.1-2.4 2.1-2.4 1 0 1.9.8 1.9 2.4V21h4v-7c0-3.4-1.9-5-4.4-5-1.7 0-2.9.9-3.5 1.8V9h-4Z" /></svg>
      );
  }
}
