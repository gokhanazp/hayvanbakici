/** Tohum verisi tanimlari — gercek Kanada cografyasi, uretilmis kullanicilar. */

export interface SeedCity {
  slugEn: string; slugFr: string; nameEn: string; nameFr: string;
  province: 'ON' | 'QC' | 'BC' | 'AB';
  lon: number; lat: number;
  tier: 1 | 2 | 3;
  population: number;
  /** Kac bakici uretilecek — arz esigi kuralini sinamak icin bilincli olarak degisken */
  sitterCount: number;
  neighbourhoods: Array<{ en: string; fr?: string; lon: number; lat: number }>;
}

export const SEED_CITIES: SeedCity[] = [
  {
    slugEn: 'toronto', slugFr: 'toronto', nameEn: 'Toronto', nameFr: 'Toronto',
    province: 'ON', lon: -79.3832, lat: 43.6532, tier: 1, population: 2794356,
    sitterCount: 42,
    neighbourhoods: [
      { en: 'Leslieville', lon: -79.3300, lat: 43.6640 },
      { en: 'Liberty Village', lon: -79.4200, lat: 43.6380 },
      { en: 'The Annex', lon: -79.4050, lat: 43.6700 },
      { en: 'The Junction', lon: -79.4690, lat: 43.6650 },
      { en: 'Riverside', lon: -79.3480, lat: 43.6590 },
      { en: 'Roncesvalles', lon: -79.4490, lat: 43.6480 },
    ],
  },
  {
    slugEn: 'montreal', slugFr: 'montreal', nameEn: 'Montreal', nameFr: 'Montréal',
    province: 'QC', lon: -73.5673, lat: 45.5017, tier: 1, population: 1762949,
    sitterCount: 37,
    neighbourhoods: [
      { en: 'Le Plateau', fr: 'Le Plateau-Mont-Royal', lon: -73.5800, lat: 45.5230 },
      { en: 'Rosemont', fr: 'Rosemont', lon: -73.5800, lat: 45.5500 },
      { en: 'Verdun', fr: 'Verdun', lon: -73.5690, lat: 45.4590 },
      { en: 'Mile End', fr: 'Mile End', lon: -73.6000, lat: 45.5240 },
      { en: 'Villeray', fr: 'Villeray', lon: -73.6200, lat: 45.5410 },
    ],
  },
  {
    slugEn: 'vancouver', slugFr: 'vancouver', nameEn: 'Vancouver', nameFr: 'Vancouver',
    province: 'BC', lon: -123.1207, lat: 49.2827, tier: 1, population: 662248,
    sitterCount: 26,
    neighbourhoods: [
      { en: 'Kitsilano', lon: -123.1660, lat: 49.2680 },
      { en: 'Mount Pleasant', lon: -123.1000, lat: 49.2640 },
      { en: 'Commercial Drive', lon: -123.0700, lat: 49.2690 },
      { en: 'West End', lon: -123.1340, lat: 49.2860 },
    ],
  },
  {
    slugEn: 'calgary', slugFr: 'calgary', nameEn: 'Calgary', nameFr: 'Calgary',
    province: 'AB', lon: -114.0719, lat: 51.0447, tier: 1, population: 1306784,
    sitterCount: 19,
    neighbourhoods: [
      { en: 'Kensington', lon: -114.0900, lat: 51.0530 },
      { en: 'Inglewood', lon: -114.0300, lat: 51.0400 },
      { en: 'Bridgeland', lon: -114.0400, lat: 51.0540 },
    ],
  },
  {
    slugEn: 'ottawa', slugFr: 'ottawa', nameEn: 'Ottawa', nameFr: 'Ottawa',
    province: 'ON', lon: -75.6972, lat: 45.4215, tier: 1, population: 1017449,
    sitterCount: 13,
    neighbourhoods: [
      { en: 'The Glebe', fr: 'Le Glebe', lon: -75.6900, lat: 45.4030 },
      { en: 'Westboro', lon: -75.7500, lat: 45.3900 },
      { en: 'Hintonburg', lon: -75.7250, lat: 45.4020 },
    ],
  },
  // Tier 2 — arz esigi "buyuyen" bandi (3-7 bakici): index ama yakin sehir modulu genis
  {
    slugEn: 'hamilton', slugFr: 'hamilton', nameEn: 'Hamilton', nameFr: 'Hamilton',
    province: 'ON', lon: -79.8711, lat: 43.2557, tier: 2, population: 569353,
    sitterCount: 5,
    neighbourhoods: [
      { en: 'Westdale', lon: -79.9060, lat: 43.2620 },
      { en: 'Durand', lon: -79.8760, lat: 43.2500 },
    ],
  },
  // Tier 3 — "ince arz" bandi (1-2): noindex + bekleme listesi
  {
    slugEn: 'london', slugFr: 'london', nameEn: 'London', nameFr: 'London',
    province: 'ON', lon: -81.2497, lat: 42.9849, tier: 3, population: 422324,
    sitterCount: 2,
    neighbourhoods: [{ en: 'Old North', lon: -81.2400, lat: 43.0000 }],
  },
  // Tier 3 — arz YOK: sayfa hic uretilmemeli (404)
  {
    slugEn: 'victoria', slugFr: 'victoria', nameEn: 'Victoria', nameFr: 'Victoria',
    province: 'BC', lon: -123.3656, lat: 48.4284, tier: 3, population: 91867,
    sitterCount: 0,
    neighbourhoods: [{ en: 'Fernwood', lon: -123.3500, lat: 48.4300 }],
  },
];

export const FIRST_NAMES = [
  'Sarah', 'David', 'Marie', 'Ahmed', 'Priya', 'Jean', 'Emma', 'Lucas', 'Chloé',
  'Noah', 'Fatima', 'Liam', 'Camille', 'Éric', 'Olivia', 'Mateo', 'Hannah',
  'Owen', 'Léa', 'Jasmine', 'Theo', 'Simone', 'Raj', 'Nadia',
];

export const HOME_TYPES = ['house', 'townhouse', 'apartment', 'condo'] as const;

/*
  BAKICININ KENDI CUMLELERI — TOHUM VERI.

  Hepsi kurgu ve ortalama uzunlukta: tasarimi "ideal" iki satirlik bir
  metinle test edersek, gercek bakicinin yazdigi sekiz satir sayfayi
  bozar. Bilerek farkli uzunluklarda, bazilari satir sonlu.

  Tohum bakicilarin BIR KISMINDA bu alanlar BOS birakiliyor (seed.ts):
  sayfanin alan doldurulmamisken de duzgun gorunmesi gerekiyor ve
  bunu ancak bos ornek varken gorebiliriz.
*/
export const SCHEDULE_TEXTS_EN = [
  'I work from home Monday to Thursday, so your dog is with someone almost all day. Fridays I am out from about 9 to 2.',
  'Part-time nurse — I work three twelve-hour shifts a week, and on those days my partner is home with the pets.',
  'Retired. I am home unless I am out walking, which is four or five times a day anyway.',
  'I teach evenings, so mornings and afternoons are ours. Never more than three hours alone.',
];
export const TYPICAL_DAY_TEXTS_EN = [
  '7:00 — out for the first walk, about 30 minutes.\n8:00 — breakfast, then a nap while I work.\n12:30 — second walk and some yard time.\n18:00 — dinner, then a long evening walk.\n22:00 — last garden break before bed.',
  'Morning walk, breakfast, then the dogs settle in my office. Lunchtime is a proper run at the off-leash park. Dinner at six, short walk after, and everyone is asleep by ten.',
  'We keep whatever routine you already have — I would rather follow your times than teach your dog mine. The only fixed thing here is a long midday walk.',
];
export const SAFETY_TEXTS_EN = [
  'Fully fenced yard, six-foot cedar. Dogs are never off-leash outside it. My vet is Bloor West Animal Hospital, five minutes away, and I have a car at all times.',
  'I keep a crate if your dog uses one, and a baby gate between floors. First-aid kit for pets in the kitchen. If anything worries me I call you before I call anyone else.',
  'No off-leash parks unless you tell me your dog is reliable there. I have pet first-aid training from 2024 and the emergency clinic number on the fridge.',
];
export const OWNER_PREFS_TEXTS_EN = [
  'How your dog is with other dogs on leash, whether they can be left alone at all, and the name of your vet.',
  'Tell me about food — brand, how much, how often — and anything that scares them. Thunder, vacuum, skateboards, anything.',
  'Two things: is your pet spayed or neutered, and are they comfortable with stairs? My place is on two floors.',
  'Any medication, the last time they had a walk before drop-off, and a phone number I can actually reach you on.',
];

export const SCHEDULE_TEXTS_FR = [
  "Je travaille de la maison du lundi au jeudi, donc votre chien est accompagné presque toute la journée. Le vendredi, je sors de 9 h à 14 h environ.",
  "Infirmière à temps partiel — trois quarts de douze heures par semaine, et ces jours-là mon conjoint est à la maison avec les animaux.",
  "À la retraite. Je suis à la maison sauf quand je promène, ce qui arrive quatre ou cinq fois par jour de toute façon.",
];
export const TYPICAL_DAY_TEXTS_FR = [
  "7 h — première promenade, environ 30 minutes.\n8 h — déjeuner, puis sieste pendant que je travaille.\n12 h 30 — deuxième promenade et un peu de cour.\n18 h — souper, puis longue promenade.\n22 h — dernière sortie avant le dodo.",
  "Promenade du matin, déjeuner, puis les chiens s'installent dans mon bureau. Le midi, vraie course au parc à chiens. Souper à 18 h, courte sortie ensuite, et tout le monde dort à 22 h.",
  "On garde la routine que vous avez déjà — je préfère suivre vos heures plutôt que d'imposer les miennes. La seule chose fixe ici, c'est la longue promenade du midi.",
];
export const SAFETY_TEXTS_FR = [
  "Cour entièrement clôturée, cèdre de six pieds. Les chiens ne sont jamais sans laisse à l'extérieur. Mon vétérinaire est à cinq minutes et j'ai une voiture en tout temps.",
  "Je garde une cage si votre chien en utilise une, et une barrière entre les étages. Trousse de premiers soins pour animaux dans la cuisine. Si quelque chose m'inquiète, je vous appelle avant d'appeler qui que ce soit d'autre.",
  "Pas de parc sans laisse à moins que vous me disiez que votre chien y est fiable. J'ai une formation en premiers soins animaliers depuis 2024.",
];
export const OWNER_PREFS_TEXTS_FR = [
  "Comment votre chien réagit aux autres chiens en laisse, s'il peut rester seul, et le nom de votre vétérinaire.",
  "Parlez-moi de la nourriture — marque, quantité, fréquence — et de ce qui lui fait peur. Tonnerre, aspirateur, planches à roulettes, n'importe quoi.",
  "Deux choses : votre animal est-il stérilisé, et est-il à l'aise dans les escaliers? Mon logement est sur deux étages.",
];

/** Hizmet basina taban fiyat (cent) — Rover'in Toronto verisine yakin */
export const BASE_PRICE_CENTS: Record<string, number> = {
  boarding: 5000, house_sitting: 6000, drop_in: 2400,
  dog_walking: 2500, day_care: 4000,
};

export const REVIEW_BODIES_EN = [
  'Sent photos twice a day and our anxious rescue came home completely relaxed.',
  'Third time booking. She remembered that Luna will not eat unless her bowl is off the floor.',
  'Kept to our routine exactly, right down to the evening walk time.',
  'Told us the boring parts too — what he ate, whether he slept. That is what we wanted.',
  'The fenced yard was perfect. Our dog came back tired and happy.',
  'Answered within minutes every time, even on the Sunday we were delayed at the airport.',
  'Gave our diabetic cat her injections on schedule and wrote down every single one.',
  'Met us beforehand, asked good questions, and took notes. It showed during the stay.',
  'Two dogs, one of them reactive, and she walked them separately without being asked.',
  'Sent a photo of the water bowl being refilled. Small thing, but it is why we rebooked.',
  'Our old beagle needs stairs avoided and he was carried up every night without a word.',
  'Flight got cancelled and she kept him an extra night. Charged exactly what was agreed.',
];

export const REVIEW_BODIES_FR = [
  'Des photos deux fois par jour et notre chien anxieux est revenu parfaitement détendu.',
  'Troisième réservation. Elle se souvenait que Luna ne mange pas si son bol est au sol.',
  'La routine a été respectée à la lettre, jusqu’à l’heure de la promenade du soir.',
  'On nous a aussi raconté les détails ennuyeux — ce qu’il a mangé, s’il a dormi.',
  'La cour clôturée était parfaite. Notre chien est revenu fatigué et heureux.',
  'Elle a répondu en quelques minutes à chaque fois, même le dimanche où notre vol a été retardé.',
  'A donné ses injections à notre chatte diabétique à l’heure et a tout noté.',
  'Nous avons fait connaissance avant, avec de bonnes questions et des notes prises. Ça s’est vu.',
  'Deux chiens, dont un réactif, promenés séparément sans qu’on ait à le demander.',
  'Une photo du bol d’eau qu’on remplit. Un détail, mais c’est pour ça qu’on a réservé de nouveau.',
  'Notre vieux beagle ne doit pas monter les escaliers : il a été porté chaque soir, sans un mot.',
  'Vol annulé, elle l’a gardé une nuit de plus. Elle a facturé exactement ce qui était convenu.',
];


/**
 * TOHUM TANITIM METINLERI — SAHTE VERI.
 *
 * Profil sayfasinin bos durmamasi icin. Pazarlama malzemesinde, ekran
 * goruntusunde ya da yatirimci sunumunda KULLANILMAZ: bunlar gercek
 * bakicilarin yazdigi metinler degil.
 */
export const BIOS = {
  en: [
    'I grew up with two shepherds and have looked after friends\u2019 dogs for years. My place is quiet, ground floor, and five minutes from the park.',
    'Retired teacher, home most of the day. I send a photo after every walk because I know that is the part you wait for.',
    'I work from home and take two breaks a day for walks. Comfortable with senior dogs and with medication schedules.',
    'Cats are my specialty \u2014 I foster for a local rescue. Slow introductions, no forced handling, and a quiet room if yours needs one.',
    'Runner, so your dog gets a real walk, not a lap of the block. Happy to keep to a shorter route for older dogs.',
  ],
  fr: [
    'J\u2019ai grandi avec deux bergers et je garde les chiens de mes amis depuis des ann\u00e9es. Mon logement est calme, au rez-de-chauss\u00e9e, \u00e0 cinq minutes du parc.',
    'Enseignante \u00e0 la retraite, \u00e0 la maison la plupart du temps. J\u2019envoie une photo apr\u00e8s chaque promenade.',
    'Je travaille de la maison et je prends deux pauses par jour pour les promenades. \u00c0 l\u2019aise avec les chiens \u00e2g\u00e9s et les horaires de m\u00e9dicaments.',
    'Les chats sont ma sp\u00e9cialit\u00e9 \u2014 je suis famille d\u2019accueil pour un refuge. Pr\u00e9sentations en douceur et une pi\u00e8ce tranquille au besoin.',
    'Je cours, donc votre chien a une vraie promenade. Je raccourcis volontiers le parcours pour les chiens plus \u00e2g\u00e9s.',
  ],
} as const;

/**
 * FOTOGRAF YUVALARI — apps/web/src/lib/photos.ts kaydindaki adlar.
 *
 * Neden burada sadece AD var, yol yok: yol uygulama katmaninin isi
 * (resolvePhoto). Veritabani ya bir yuva adi ya da gercek bir yukleme
 * adresi tutar; ikisi de ayni alanda yasar.
 *
 * DIKKAT — bunlar DEMO verisidir. Stok bir yuzu gercek bir bakici ya da
 * gercek bir musteri gibi sunmak uydurma sosyal kanittir; bu yuvalar
 * yalnizca tohum veride kullanilir, canliya cikmadan once gercek
 * kullanicilarin kendi yukledikleriyle degisir.
 */
export const PERSON_PHOTO_SLOTS = [
  'person-01', 'person-02', 'person-03', 'person-04', 'person-05', 'person-06',
  'person-07', 'person-08', 'person-09', 'person-10', 'person-11', 'person-12',
] as const;

export const HOME_PHOTO_SLOTS = ['home-a', 'home-b', 'home-c', 'care-a', 'care-b'] as const;

/**
 * TOHUM HAYVAN ADLARI.
 *
 * Kanada'da yaygin kullanilan adlar; ikisi Fransizca konusan sahipler
 * icin. Rezervasyonlar bunlara baglaniyor — pet_ids BOS birakiliyordu
 * ve bu yuzden demo ekranlarda "hangi hayvan" satiri hic gorunmuyordu,
 * oysa siteden yapilan gercek bir rezervasyon her zaman bir hayvan
 * tasiyor. Demo verinin gercekten daha yoksul olmasi, tasarimi yanlis
 * yerden degerlendirmeye yol aciyordu.
 */
export const PET_SEEDS = [
  { name: 'Maple',   species: 'dog' as const, breed: 'Golden retriever' },
  { name: 'Nour',    species: 'cat' as const, breed: null },
  { name: 'Biscuit', species: 'dog' as const, breed: 'Beagle' },
  { name: 'Poutine', species: 'dog' as const, breed: 'Bernese mountain dog' },
  { name: 'Sable',   species: 'cat' as const, breed: null },
  { name: 'Moose',   species: 'dog' as const, breed: 'Labrador' },
  { name: 'Clementine', species: 'cat' as const, breed: null },
  { name: 'Pistache', species: 'dog' as const, breed: 'Border collie' },
  { name: 'Juniper', species: 'dog' as const, breed: 'Husky' },
  { name: 'Câline',  species: 'cat' as const, breed: null },
];
