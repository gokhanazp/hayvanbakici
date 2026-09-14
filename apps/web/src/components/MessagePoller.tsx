'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * YENI MESAJI KENDILIGINDEN GETIRIR.
 *
 * NASIL: birkac saniyede bir `/api/messages/ping` sorulur; son mesajin
 * zamani elimizdekinden yeniyse `router.refresh()` cagrilir ve sunucu
 * bilesenleri yeniden cizilir. Yani mesajlar tek bir yerden — sunucudan
 * — geliyor; istemcide ikinci bir mesaj listesi TUTMUYORUZ. Iki ayri
 * kaynak, er ya da gec birbirinden farkli iki yazisma demek.
 *
 * NEDEN WEBSOCKET DEGIL: kalici baglanti ayri bir sunucu sureci
 * gerektiriyor. Yoklama, bu asamada bir dakikalik gecikmeyi birkac
 * saniyeye indiriyor ve hicbir altyapi eklemiyor. Gercek zamanliya
 * gecilirse degisecek tek dosya bu.
 *
 * SEKME GORUNMUYORSA YOKLAMA YOK: arkada acik unutulmus bir sekmenin
 * saatlerce sunucuya sormasinin kimseye faydasi yok.
 */
const INTERVAL_MS = 7000;

export function MessagePoller({
  conversationId, lastAt,
}: {
  conversationId: string;
  lastAt: string | null;
}) {
  const router = useRouter();
  /* Sunucudan gelen son deger; tazeledikten sonra guncelleniyor ki
     ayni mesaj icin iki kez tazeleme yapilmasin. */
  const seen = useRef<string | null>(lastAt);
  const busy = useRef(false);

  useEffect(() => { seen.current = lastAt; }, [lastAt]);

  /*
    EN ALTA KAYDIR.
    Yazisma kutusu kendi icinde kaydiriliyor; acildiginda en ustte
    duruyordu, yani EN ESKI mesaj gorunuyordu. Sohbette dogru yer her
    zaman son mesaj. Yeni mesaj geldiginde de (lastAt degisince) asagi
    iniyor.
  */
  useEffect(() => {
    const box = document.querySelector('.thread-scroll');
    if (box) box.scrollTop = box.scrollHeight;
  }, [lastAt]);

  useEffect(() => {
    let alive = true;

    async function check() {
      if (!alive || busy.current) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      busy.current = true;
      try {
        const res = await fetch(`/api/messages/ping?c=${conversationId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { lastAt: string | null };
        const newer = data.lastAt && (!seen.current || data.lastAt > seen.current);
        if (newer && alive) {
          seen.current = data.lastAt;
          router.refresh();
        }
      } catch {
        /* Aglar kopar; yoklama bir sonraki turda devam eder. Hata
           gostermiyoruz: kullanicinin yapabilecegi bir sey yok. */
      } finally {
        busy.current = false;
      }
    }

    const timer = setInterval(check, INTERVAL_MS);
    /* Sekmeye geri donuldugunde BEKLEMEDEN bak: birkac saniye bos
       ekrana bakmak, yoklamanin butun faydasini goturuyor. */
    const onVisible = () => { if (document.visibilityState === 'visible') void check(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [conversationId, router]);

  return null;
}
