/**
 * FOTOGRAF KAYDI — sitedeki her fotograf yuvasi burada tanimli.
 *
 * NEDEN KAYIT: fotograf adreslerinin JSX icine dagilmasi, (a) alternatif
 * metnin unutulmasina, (b) yanlis en-boy orani yuzunden yerlesim kaymasina
 * (CLS), (c) fotograflari degistirmek icin on kadar dosyayi acmaya yol acar.
 * Tek kayit: yuva adi -> dosya, olcu, iki dilde alternatif metin.
 *
 * DOSYALAR KENDI SUNUCUMUZDA (apps/web/public/photos/). Uzak bir CDN'e
 * baglanmiyoruz — fontlarda verdigimiz kararla ayni gerekce:
 *   - LCP: harici baglanti kurulumu yok
 *   - Law 25: kullanicinin tarayicisindan sinir otesi istek gitmiyor
 *   - Build, dis servisin ayakta olmasina bagli degil
 *
 * BUGUN NE VAR: depoda MARKA RENKLI YER TUTUCULAR var (scripts/make-photo-
 * placeholders.mjs uretir). Gercek fotograflar icin:
 *     UNSPLASH_ACCESS_KEY=... npm run photos:fetch
 * ayni dosya adlarinin uzerine Unsplash'tan indirir ve CREDITS.md yazar.
 * Kendi fotograflarinizi koyacaksaniz: ayni ada, ayni orana kaydedin.
 */

export type PhotoId = keyof typeof PHOTOS;

export interface PhotoSpec {
  /** public/photos altindaki yol (uzantisiz) */
  readonly file: string;
  readonly width: number;
  readonly height: number;
  /** photos:fetch betiginin Unsplash'ta arattigi ifade */
  readonly query: string;
  readonly alt: { readonly 'en-CA': string; readonly 'fr-CA': string };
  /** Yer tutucu uretiminde kullanilan gorsel tema */
  readonly kind: 'scene' | 'portrait';
  readonly tint: 0 | 1 | 2 | 3;
}

const scene = (
  file: string, width: number, height: number, tint: 0 | 1 | 2 | 3,
  query: string, en: string, fr: string,
): PhotoSpec => ({ file, width, height, query, kind: 'scene', tint, alt: { 'en-CA': en, 'fr-CA': fr } });

/*
  KISI FOTOGRAFLARI HAYVANLI.

  ALTERNATIF METINDE "gardien/sitter" DEMIYORUZ: bunlar stok fotograflar,
  fotograftaki kisi bizim bakicimiz degil. Ekran okuyucuya "bir bakici"
  demek, gorsel bir sus olan kareyi gercek bir kisi iddiasina cevirirdi.
  Metin ne goruldugunu anlatiyor, kimin oldugunu degil.

  Ilk surumde sorgular duz portreydi ("portrait smiling woman"). Bu bir
  bakici pazaryerinde yanlis: sahibin gormesi gereken sey yuz degil, o
  kisinin bir hayvanla nasil durdugu. Sorgular insan + hayvan, tercihen
  temas eden kareler.

  Kare ve 900px: ayni dosya hem 30px'lik avatarda hem ana sayfadaki 520px
  genisligindeki karoda kullaniliyor. Kucuk avatarda yuzun ortada kalmasi
  icin indirici `crop=faces` istiyor; boylece hayvanli genis kare de,
  yuze kirpilmis kucuk avatar da ayni dosyadan cikiyor.
*/
const portrait = (file: string, tint: 0 | 1 | 2 | 3, query: string): PhotoSpec => ({
  file, width: 900, height: 900, query, kind: 'portrait', tint,
  alt: {
    'en-CA': 'A person with a pet',
    'fr-CA': 'Une personne avec un animal',
  },
});

export const PHOTOS = {
  'hero-primary': scene('scene/hero-primary', 1040, 1240, 0,
    'woman hugging golden retriever at home',
    'Someone sitting on the floor at home with a dog leaning against her',
    'Une personne assise au sol chez elle, un chien appuyé contre elle'),

  'hero-side-a': scene('scene/hero-side-a', 640, 640, 1,
    'woman cuddling cat on sofa at home',
    'Someone holding a cat on a sofa',
    'Une personne tenant un chat sur un canapé'),

  'hero-side-b': scene('scene/hero-side-b', 640, 820, 2,
    'man playing with small dog on floor at home',
    'Someone playing with a small dog on the floor',
    'Une personne jouant avec un petit chien au sol'),

  'sitter-banner': scene('scene/sitter-banner', 1600, 900, 1,
    'smiling person walking dog city sidewalk autumn',
    'Someone walking a dog along a city street',
    'Une personne promenant un chien dans une rue de la ville'),

  'auth-panel': scene('scene/auth-panel', 900, 1200, 3,
    'person reading on couch with dog resting beside them',
    'Someone on a couch with a dog resting beside them',
    'Une personne sur un canapé avec un chien qui se repose à côté'),

  'city-toronto': scene('scene/city-toronto', 1600, 900, 2,
    'dog walker toronto street with dog',
    'Someone with a dog on a Toronto street',
    'Une personne avec un chien dans une rue de Toronto'),

  'city-montreal': scene('scene/city-montreal', 1600, 900, 0,
    'person with dog montreal plateau street',
    'Someone with a dog on a Montréal street',
    'Une personne avec un chien dans une rue de Montréal'),

  'home-a': scene('scene/home-a', 1200, 800, 1, 'dog lying on rug in bright living room',
    'A dog lying on a rug in a bright living room',
    'Un chien allongé sur un tapis dans un salon lumineux'),
  'home-b': scene('scene/home-b', 1200, 800, 2, 'dog playing in fenced backyard garden',
    'A dog playing in a fenced backyard',
    'Un chien qui joue dans une cour clôturée'),
  'home-c': scene('scene/home-c', 1200, 800, 3, 'dog sleeping in its bed at home',
    'A dog asleep in its own bed', 'Un chien endormi dans son panier'),

  'care-a': scene('scene/care-a', 1000, 750, 0, 'woman feeding dog in kitchen smiling',
    'Someone feeding a dog in a kitchen', 'Une personne nourrissant un chien dans une cuisine'),
  'care-b': scene('scene/care-b', 1000, 750, 1, 'veterinarian with dog in clinic caring',
    'A dog being examined at a clinic', 'Un chien examiné dans une clinique'),

  'person-01': portrait('people/01', 0, 'woman hugging her dog outdoors'),
  'person-02': portrait('people/02', 1, 'man holding cat in his arms'),
  'person-03': portrait('people/03', 2, 'young woman sitting with golden retriever park'),
  'person-04': portrait('people/04', 3, 'bearded man petting dog on the sofa'),
  'person-05': portrait('people/05', 0, 'woman with glasses holding a kitten'),
  'person-06': portrait('people/06', 1, 'man laughing with dog licking his face'),
  'person-07': portrait('people/07', 2, 'woman with curly hair holding small dog'),
  'person-08': portrait('people/08', 3, 'older woman cuddling a cat at home'),
  'person-09': portrait('people/09', 0, 'older man walking his dog in the park'),
  'person-10': portrait('people/10', 1, 'woman with short hair hugging a big dog'),
  'person-11': portrait('people/11', 2, 'man with glasses holding a rabbit'),
  'person-12': portrait('people/12', 3, 'woman kneeling beside dog in a garden'),
} as const satisfies Record<string, PhotoSpec>;

/** Kisi fotografi yuvalari — seed ve profil atamasi bunu kullanir. */
export const PERSON_PHOTOS = Object.keys(PHOTOS).filter(
  (k) => PHOTOS[k as PhotoId].kind === 'portrait',
) as PhotoId[];

export function photoSrc(id: PhotoId): string {
  return `/photos/${PHOTOS[id].file}.jpg`;
}

/**
 * Veritabanindan gelen serbest metin bir fotograf yolu olabilir
 * (kullanici yuklemesi) ya da kayitli bir yuva adi. Ikisini de kabul et.
 */
export function resolvePhoto(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith('/') || value.startsWith('http')) return value;
  return value in PHOTOS ? photoSrc(value as PhotoId) : null;
}
