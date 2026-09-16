import type { ReactNode } from 'react';

/**
 * EV OZELLIKLERI IKONLARI — BAKICI PROFILI.
 *
 * NEDEN ONAY ISARETI DEGIL: butun maddeler ayni yesil onay isaretiyle
 * cizilirken "hayvanlar yatakta yatabilir" ile "sigara icilmeyen ev"
 * ayni agirlikta ve ikisi de bir BASARI gibi okunuyordu. Oysa biri
 * evin hali, digeri bakicinin tercihi; hicbiri iyi ya da kotu degil.
 * Her maddenin kendi resmi olunca liste tek bakista taranabiliyor —
 * sahip aradigi satiri okumadan buluyor.
 *
 * "OLMAYAN" HALLER AYNI IKON + EGIK CIZGI.
 * "Yatakta yatabilir" ve "yatakta yatmaz" AYNI yatak resmini
 * paylasiyor, ikincisinde uzerinde egik bir cizgi var. Iki ayri resim
 * cizseydik ayni sorunun iki cevabi oldugu anlasilmazdi.
 *
 * BU BOYUTTA AZ CIZGI. Daha once bir mama kabi 24 pikselde gulen bir
 * agza, bir tasma da paylas ikonuna benzemisti. Buradaki her ikon uc
 * dort konturu geciyorsa basitlestirildi.
 *
 * IKONLAR DEKORATIF: yaninda her zaman cumlenin kendisi yaziyor
 * (WCAG 1.1.1 — bilgi yalnizca resimde degil).
 */

export type HomeIconName =
  | 'house' | 'townhouse' | 'apartment' | 'condo' | 'farm'
  | 'fence' | 'tree' | 'paw' | 'pets' | 'noSmoking'
  | 'person' | 'bed' | 'sofa' | 'clock';

const GLYPHS: Record<HomeIconName, ReactNode> = {
  /* --- Ev tipleri: silueti birbirinden AYRI olmali --- */
  house: (
    <>
      <path d="M3.4 11.2 12 4.3l8.6 6.9" />
      <path d="M5.9 10.2v9.5h12.2v-9.5" />
      <path d="M10.2 19.7v-4.3h3.6v4.3" />
    </>
  ),
  /* Bitisik nizam: IKI cati — tek catili evden ilk bakista ayriliyor */
  townhouse: (
    <>
      <path d="M2.6 11.4 7 7.8l4.4 3.6" />
      <path d="M12.6 11.4 17 7.8l4.4 3.6" />
      <path d="M4.2 10.6v9.1h15.6v-9.1" />
      <path d="M10.4 19.7v-3.8h3.2v3.8" />
    </>
  ),
  /* Apartman: genis blok, iki sira pencere */
  apartment: (
    <>
      <path d="M5.2 4.3h13.6v15.4H5.2z" />
      <path d="M9 8.2h1.8M13.2 8.2H15M9 12.1h1.8M13.2 12.1H15" />
      <path d="M10.4 19.7v-3.6h3.2v3.6" />
    </>
  ),
  /* Condo: dar ve yuksek kule + yanindaki alcak blok */
  condo: (
    <>
      <path d="M8.6 19.7V4.3h9.2v15.4" />
      <path d="M11.4 8.4h3.6M11.4 12.4h3.6" />
      <path d="M8.6 19.7H3.4v-8.4h5.2" />
    </>
  ),
  /* Ciftlik: ahir — genis tabana oturan kirik cati */
  farm: (
    <>
      <path d="M3.4 10.6 12 5.1l8.6 5.5v9.1H3.4z" />
      <path d="M12 19.7v-6.2" />
      <path d="M7.8 13.5h8.4" />
    </>
  ),

  /* --- Bahce --- */
  /* Cevrili bahce: dort kazik + iki yatay kusak */
  /*
    Cevrili bahce — SIVRI UCLU UC KAZIK, TEK KUSAK.

    Ilk hali duz cizgilerden orulmustu: dort dikey + iki yatay, yani
    bu boyutta bir DIYEZ isareti. Kaziklarin ucu artik sivri (kendi
    silueti var) ve yatay kusak bire indi — dikeyler baskin kaldi.
  */
  fence: (
    <>
      <path d="M5.5 20v-8.6L7 9.4l1.5 2V20" />
      <path d="M10.5 20v-8.6L12 9.4l1.5 2V20" />
      <path d="M15.5 20v-8.6L17 9.4l1.5 2V20" />
      <path d="M3.4 14.4h17.2" />
    </>
  ),
  /* Cevrili olmayan bahce: agac */
  tree: (
    <>
      <path d="M12 19.8v-4.2" />
      <path d="M12 4.2 6.6 12.4h10.8z" />
      <path d="M12 9.4l-3.6 6.2h7.2z" />
    </>
  ),

  /* --- Hayvanlar --- */
  /* Pati: dolgulu. Konturlu pati bu boyutta lekeye donuyor. */
  paw: (
    <g fill="currentColor" stroke="none">
      <ellipse cx="12" cy="15.4" rx="3.5" ry="2.7" />
      <ellipse cx="7.9" cy="10.6" rx="1.35" ry="1.8" transform="rotate(-20 7.9 10.6)" />
      <ellipse cx="10.6" cy="8.9" rx="1.35" ry="1.85" />
      <ellipse cx="13.4" cy="8.9" rx="1.35" ry="1.85" />
      <ellipse cx="16.1" cy="10.6" rx="1.35" ry="1.8" transform="rotate(20 16.1 10.6)" />
    </g>
  ),
  /*
    Birden fazla hayvan — IKI PATI, biri kucuk.

    Once ic ice iki halkaydi ve sonsuzluk isareti gibi okunuyordu.
    Sayi cumlede yaziyor ("en fazla 3"), ikon yalnizca "birden fazla
    hayvan" diyor.
  */
  pets: (
    <g fill="currentColor" stroke="none">
      <ellipse cx="14.9" cy="17" rx="3.1" ry="2.4" />
      <ellipse cx="11.3" cy="12.8" rx="1.2" ry="1.6" transform="rotate(-20 11.3 12.8)" />
      <ellipse cx="13.7" cy="11.3" rx="1.2" ry="1.65" />
      <ellipse cx="16.1" cy="11.3" rx="1.2" ry="1.65" />
      <ellipse cx="18.5" cy="12.8" rx="1.2" ry="1.6" transform="rotate(20 18.5 12.8)" />
      <ellipse cx="7.1" cy="10.2" rx="2.1" ry="1.6" />
      <ellipse cx="4.6" cy="7.4" rx="0.8" ry="1.1" transform="rotate(-20 4.6 7.4)" />
      <ellipse cx="6.3" cy="6.4" rx="0.8" ry="1.1" />
      <ellipse cx="7.9" cy="6.4" rx="0.8" ry="1.1" />
      <ellipse cx="9.6" cy="7.4" rx="0.8" ry="1.1" transform="rotate(20 9.6 7.4)" />
    </g>
  ),

  /*
    SIGARA ICILMEYEN EV — HAZIR TABELA, uzerine cizgi cekilen bir
    sigara DEGIL.

    Once sigara cizilip genel egik cizgi uygulanmisti: 26 pikselde
    once pile benziyor, cizgi gelince tamamen okunmaz oluyordu. Bu
    madde HER ZAMAN olumsuz (alan adi `smokeFree`), yani ikonun iki
    hali yok — dogrudan herkesin bildigi yasak tabelasi cizildi.
  */
  noSmoking: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M7.4 12h6.4" />
      <path d="M15.8 12h.9M18.4 12h.9" />
      <path d="M5.9 18.1 18.1 5.9" stroke="var(--icon-slash-bg, #fff)" strokeWidth="4" />
      <path d="M5.9 18.1 18.1 5.9" strokeWidth="1.9" />
    </>
  ),

  /* Kisi — "evde cocuk" sorusunun iki cevabi da bunu kullaniyor */
  person: (
    <>
      <circle cx="12" cy="7.2" r="3.8" />
      <path d="M4.8 20.2c0-4 3.2-7.2 7.2-7.2s7.2 3.2 7.2 7.2" />
    </>
  ),

  bed: (
    <>
      <path d="M3.2 19.4v-9.2" />
      <path d="M3.2 13.6h17.6v5.8" />
      <path d="M6.8 13.6v-3.4h11.4a2.6 2.6 0 0 1 2.6 2.6v.8" />
    </>
  ),

  sofa: (
    <>
      <path d="M4.6 11.6V9.4a2 2 0 0 1 2-2h10.8a2 2 0 0 1 2 2v2.2" />
      <path d="M3.2 11.6h17.6v5.6H3.2z" />
      <path d="M6.8 17.2v2M17.2 17.2v2" />
    </>
  ),

  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.2V12l3.2 2" />
    </>
  ),
};

/**
 * KOPEK SILUETI — BOYUT KUTUCUKLARI ICIN.
 *
 * Dolgulu, konturlu degil: 20 pikselde konturlu bir kopek lekeye
 * donuyor, dolgulu siluet kuculdukce okunmaya devam ediyor. Ayni
 * siluet dort boyutta ciziliyor — kademeler arasindaki fark BOYUTUN
 * kendisi, dort ayri irk cizmek o farki gizlerdi.
 *
 * Ikon dekoratif: yaninda her zaman kilo araligi yaziyor.
 */
export function DogSilhouette({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="currentColor" stroke="none" aria-hidden="true"
    >
      {/* Govde */}
      <rect x="4.6" y="10.4" width="11.6" height="6" rx="2.9" />
      {/* Bas ve burun */}
      <circle cx="18" cy="9.8" r="3.3" />
      <rect x="19.4" y="9.4" width="3.4" height="2.5" rx="1.25" />
      {/* Kulak */}
      <path d="M16.4 7.2 15.1 3.8l3.3 1.7z" />
      {/* Bacaklar */}
      <rect x="5.2" y="14.8" width="2.3" height="5.4" rx="1.15" />
      <rect x="13.2" y="14.8" width="2.3" height="5.4" rx="1.15" />
      {/* Kuyruk — tek konturlu parca, govdeden yukari kivriliyor */}
      <path
        d="M4.8 11.6c-1.9-.5-2.9-2.1-2.6-3.9"
        fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"
      />
    </svg>
  );
}

/** Veteriner arti — "kisirlastirilmis hayvan" satirinin isareti */
export function VetIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {/* Kisa ve KALIN kollar: ince uzun bir arti 22 pikselde "ekle"
          dugmesi gibi okunuyordu, kalin kisa olan tibbi isaret. */}
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 8.8v6.4M8.8 12h6.4" strokeWidth="2.6" />
    </svg>
  );
}

export function HomeIcon({
  name, slashed = false, size = 26,
}: {
  name: HomeIconName;
  /** Ayni resmin "degil" hali — uzerine egik bir cizgi ciziliyor */
  slashed?: boolean;
  size?: number;
}) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      {GLYPHS[name]}
      {/*
        Egik cizgi EN USTTE ve altinda zeminle ayni renkte kalin bir
        cizgi var: dolgulu patinin uzerinden gecerken cizgi kayboluyordu.
        Zemin cizgisi kartin zeminini kullaniyor, boylece koyu temada da
        dogru renk.
      */}
      {slashed && (
        <>
          <path d="M5.4 18.6 18.6 5.4" stroke="var(--icon-slash-bg, #fff)" strokeWidth="4.2" />
          <path d="M5.4 18.6 18.6 5.4" strokeWidth="1.9" />
        </>
      )}
    </svg>
  );
}
