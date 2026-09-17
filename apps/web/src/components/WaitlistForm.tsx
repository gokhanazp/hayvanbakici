'use client';

import { useActionState } from 'react';
import { getMessages, interpolate, type Locale } from '@havre/i18n';
import type { WaitlistState } from '@/app/[locale]/[city]/[service]/actions';

/**
 * BEKLEME LISTESI FORMU.
 *
 * Yerini aldigi sey: sunucu bileseninde duran, olay isleyicisi olmayan bos
 * bir `<button>`. Tikliyordunuz, hicbir sey olmuyordu, kaydoldugunuzu
 * saniyordunuz.
 *
 * Kaydolduktan sonra form KAYBOLUYOR ve yerine tek cumle geliyor. Ayni
 * kisiye ikinci kez ayni kutuyu gostermek, ilk gonderimin gidip
 * gitmedigini belirsiz birakirdi (veritabani ayni kayda dusurup sessizce
 * yutuyor, ama kullanici bunu bilemez).
 */
export function WaitlistForm({
  locale, citySlug, cityName, serviceType, action,
}: {
  locale: Locale;
  citySlug: string;
  cityName: string;
  serviceType: string;
  action: (prev: WaitlistState, form: FormData) => Promise<WaitlistState>;
}) {
  const m = getMessages(locale);
  const [state, formAction, busy] = useActionState<WaitlistState, FormData>(action, {});

  if (state.done) {
    return (
      <p className="alert alert-success" role="status">
        {interpolate(m.search.waitlistDone, { city: cityName })}
      </p>
    );
  }

  const errorKey = state.error ? `waitlist.${state.error}` : null;
  const errorText = errorKey
    ? (m.search[errorKey as keyof typeof m.search] as string | undefined)
    : undefined;

  return (
    <form action={formAction} className="waitlist-form">
      <input type="hidden" name="citySlug" value={citySlug} />
      <input type="hidden" name="serviceType" value={serviceType} />
      <input type="hidden" name="locale" value={locale} />

      {errorText && <p className="alert alert-error" role="alert">{errorText}</p>}

      <div className="waitlist-row">
        <label className="sr-only" htmlFor="waitlist-email">{m.search.waitlistEmail}</label>
        <input
          id="waitlist-email" name="email" type="email" required
          autoComplete="email" placeholder={m.search.waitlistEmail}
        />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? m.messages.sending : m.search.joinWaitlist}
        </button>
      </div>

      {/* Ne icin toplandigi ekranda yaziyor — Law 25 md. 8. */}
      <p className="text-body-sm dim" style={{ marginTop: 'var(--space-3)' }}>
        {m.search.waitlistPrivacy}
      </p>
    </form>
  );
}
