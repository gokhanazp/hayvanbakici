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
];

export const REVIEW_BODIES_FR = [
  'Des photos deux fois par jour et notre chien anxieux est revenu parfaitement détendu.',
  'Troisième réservation. Elle se souvenait que Luna ne mange pas si son bol est au sol.',
  'La routine a été respectée à la lettre, jusqu’à l’heure de la promenade du soir.',
  'On nous a aussi raconté les détails ennuyeux — ce qu’il a mangé, s’il a dormi.',
  'La cour clôturée était parfaite. Notre chien est revenu fatigué et heureux.',
];
