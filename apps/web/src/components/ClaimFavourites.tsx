'use client';

import { useState, useTransition } from 'react';
import { getMessages, interpolate, type Locale } from '@havre/i18n';
import { claimFavouritesAction } from '@/app/actions/favourites';

/**
 * TARAYICIDAKI FAVORILERI HESABA TASI — acik dugme.
 *
 * NEDEN ACIK DUGME VAR: giris ekranindan gecen kullanicida tasima
 * OTOMATIK yapiliyor (bkz. auth formlari). Ama sosyal giris bizim
 * ekranimizdan gecmiyor: saglayiciya gidiyor, geri donerken Better
 * Auth'un kendi adresine dusuyor. O yolda calisacak bir kancamiz yok,
 * dolayisiyla cerezde kalmis liste icin gorunur bir kapi gerekiyor.
 *
 * Kullaniciya ne oldugunu SOYLUYOR: "3 favori bu tarayicida duruyor".
 * Sessizce birlestirseydik, kullanici listesinin nereye gittigini ya da
 * neden birden bire buyudugunu anlamazdi.
 */
export function ClaimFavourites({ count, locale }: { count: number; locale: Locale }) {
  const m = getMessages(locale);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<number | null>(null);

  if (done !== null) {
    return (
      <div className="fav-claim" role="status">
        <p>{done > 0
          ? interpolate(m.favourites.claimed, { count: String(done) })
          : m.favourites.claimedNone}</p>
      </div>
    );
  }

  return (
    <div className="fav-claim">
      <p>
        <strong>{interpolate(m.favourites.claimTitle, { count: String(count) })}</strong>
        {' '}{m.favourites.claimLead}
      </p>
      <button
        type="button"
        className="btn btn-primary btn-sm"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await claimFavouritesAction();
          setDone(res.moved);
        })}
      >
        {m.favourites.claimCta}
      </button>
    </div>
  );
}
