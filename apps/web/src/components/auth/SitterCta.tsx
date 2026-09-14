'use client';

import Link from 'next/link';
import { getMessages, segmentFor, type Locale } from '@havre/i18n';
import { useSitterState } from './sitter-state';

/**
 * BASLIKTAKI BAKICI DUGMESI.
 *
 * Bakici olan birine "Bakici ol" demek, kullanicinin kendi durumundan
 * suphe etmesine yol aciyordu. Dugme artik duruma gore konusuyor:
 *
 *   kayit yok / oturum yok → "Bakici ol"       (davet)
 *   taslak                 → "Basvurunu bitir"
 *   diger                  → "Bakici paneli"
 *
 * ILK CIZIM HER ZAMAN DAVET: durum gelene kadar bos veya farkli bir dugme
 * gostermek hem yer kaymasi (CLS) hem yanip sonen bir arayuz demek.
 * HeaderAccount ile ayni yaklasim.
 */
export function SitterCta({ locale, className }: { locale: Locale; className: string }) {
  const m = getMessages(locale);
  const seg = segmentFor(locale);
  const { status, nextStep } = useSitterState();

  if (!status) {
    return (
      <Link href={`/${seg}/become-a-sitter/`} className={className}>
        {m.nav.becomeSitter}
      </Link>
    );
  }

  return status === 'draft' ? (
    <Link href={`/${seg}/become-a-sitter/${nextStep ?? 'about'}/`} className={className}>
      {m.nav.finishApplication}
    </Link>
  ) : (
    <Link href={`/${seg}/account/sitter/`} className={className}>
      {m.nav.sitterPanel}
    </Link>
  );
}
