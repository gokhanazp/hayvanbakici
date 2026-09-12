import { getMessages, type Locale } from '@havre/i18n';

const LEVELS = [
  null,
  { key: 'identity', color: 'var(--color-verify-id)' },
  { key: 'criminal', color: 'var(--color-verify-check)' },
  { key: 'licence', color: 'var(--color-verify-insured)' },
  { key: 'certification', color: 'var(--color-verify-pro)' },
] as const;

export function ShieldIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
      <path d="M8 1 2 3.5v4C2 11 4.6 14.2 8 15c3.4-.8 6-4 6-7.5v-4L8 1Zm2.9 5.3-3.4 3.6a.7.7 0 0 1-1 0L4.9 8.3a.7.7 0 1 1 1-1l1.1 1.2 2.9-3.1a.7.7 0 1 1 1 1Z" />
    </svg>
  );
}

export function VerificationBadge({ level, locale }: { level: 0 | 1 | 2 | 3 | 4; locale: Locale }) {
  if (level === 0) return null;
  const meta = LEVELS[level];
  if (!meta) return null;
  const m = getMessages(locale);

  return (
    /* Renk tek bilgi tasiyicisi degil: ikon + metin birlikte (WCAG 1.4.1) */
    <span
      className="badge"
      style={{ background: `color-mix(in srgb, ${meta.color} 12%, transparent)`, color: meta.color }}
    >
      <ShieldIcon />
      {m.verification[meta.key]}
    </span>
  );
}
