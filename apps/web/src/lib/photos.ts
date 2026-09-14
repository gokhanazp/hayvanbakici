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

const portrait = (file: string, tint: 0 | 1 | 2 | 3, query: string): PhotoSpec => ({
  file, width: 512, height: 512, query, kind: 'portrait', tint,
  alt: { 'en-CA': 'Sitter profile photo', 'fr-CA': 'Photo de profil du gardien' },
});

export const PHOTOS = {
  'hero-primary': scene('scene/hero-primary', 1040, 1240, 0,
    'woman hugging golden retriever at home',
    'A sitter sitting on the floor of her home with a dog leaning against her',
    'Une gardienne assise au sol chez elle, un chien appuyé contre elle'),

  'hero-side-a': scene('scene/hero-side-a', 640, 640, 1,
    'cat sleeping on sofa sunlight',
    'A cat asleep on a sunlit sofa',
    'Un chat endormi sur un canapé ensoleillé'),

  'hero-side-b': scene('scene/hero-side-b', 640, 820, 2,
    'small dog looking at camera apartment',
    'A small dog looking straight at the camera',
    'Un petit chien regardant droit vers l’objectif'),

  'sitter-banner': scene('scene/sitter-banner', 1600, 900, 1,
    'man walking dog city sidewalk autumn',
    'A sitter walking a dog along a city street',
    'Un gardien promenant un chien dans une rue de la ville'),

  'auth-panel': scene('scene/auth-panel', 900, 1200, 3,
    'cozy living room with dog on couch',
    'A living room with a dog resting on the couch',
    'Un salon avec un chien qui se repose sur le canapé'),

  'city-toronto': scene('scene/city-toronto', 1600, 900, 2,
    'toronto street dog walker',
    'A dog on a Toronto street',
    'Un chien dans une rue de Toronto'),

  'city-montreal': scene('scene/city-montreal', 1600, 900, 0,
    'montreal plateau street dog',
    'A dog on a Montréal street',
    'Un chien dans une rue de Montréal'),

  'home-a': scene('scene/home-a', 1200, 800, 1, 'bright living room plants',
    'A bright living room', 'Un salon lumineux'),
  'home-b': scene('scene/home-b', 1200, 800, 2, 'backyard garden fence house',
    'A fenced backyard', 'Une cour clôturée'),
  'home-c': scene('scene/home-c', 1200, 800, 3, 'dog bed blanket corner home',
    'A dog bed in the corner of a room', 'Un panier pour chien dans un coin de la pièce'),

  'care-a': scene('scene/care-a', 1000, 750, 0, 'person feeding dog kitchen',
    'A person feeding a dog in a kitchen', 'Une personne nourrissant un chien dans une cuisine'),
  'care-b': scene('scene/care-b', 1000, 750, 1, 'veterinarian examining dog clinic',
    'A dog being examined at a clinic', 'Un chien examiné dans une clinique'),

  'person-01': portrait('people/01', 0, 'portrait smiling woman outdoors'),
  'person-02': portrait('people/02', 1, 'portrait smiling man outdoors'),
  'person-03': portrait('people/03', 2, 'portrait young woman city'),
  'person-04': portrait('people/04', 3, 'portrait man beard friendly'),
  'person-05': portrait('people/05', 0, 'portrait woman glasses smiling'),
  'person-06': portrait('people/06', 1, 'portrait man smiling casual'),
  'person-07': portrait('people/07', 2, 'portrait woman curly hair smiling'),
  'person-08': portrait('people/08', 3, 'portrait older woman warm smile'),
  'person-09': portrait('people/09', 0, 'portrait man older friendly'),
  'person-10': portrait('people/10', 1, 'portrait woman short hair smiling'),
  'person-11': portrait('people/11', 2, 'portrait man glasses smiling'),
  'person-12': portrait('people/12', 3, 'portrait woman smiling park'),
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
