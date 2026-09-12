/**
 * QUEBEC FRANSIZCASI.
 * UYARI: Bu dosya gelistirme icin bir taslaktir. Lansmandan once Quebec yerlisi
 * profesyonel bir cevirmen/editor tarafindan revize edilmelidir (Bill 96 riski).
 * Hukuki metinler ayrica Quebec avukati tarafindan denetlenmelidir.
 */
export const frCA = {
  brand: {
    name: 'Havre',
    tagline: "La garde d'animaux d'ici. Plus pour les gardiens, mieux pour vous.",
  },
  nav: {
    search: 'Trouver un gardien',
    becomeSitter: 'Devenir gardien',
    howItWorks: 'Comment ça marche',
    protection: 'Protection',
    pricing: 'Nos frais',
    signIn: 'Se connecter',
    signUp: "S'inscrire",
  },
  home: {
    heroTitle: 'Une garde attentionnée, tout près de chez vous',
    heroSubtitle:
      "Des gardiens vérifiés et assurés partout au Canada. Tous les frais sont affichés avant la réservation.",
    searchCta: 'Chercher un gardien',
    trustStripSitters: '{count} gardiens vérifiés à {city}',
    trustStripPrice: 'Prix médian de {price} $/nuit',
    trustStripBookings: '{count} réservations complétées',
  },
  search: {
    service: 'Service',
    location: 'Adresse ou code postal',
    dates: 'Dates',
    pet: 'Votre animal',
    submit: 'Chercher',
    resultsCount: '{count} gardiens disponibles',
    noResults: 'Aucun gardien dans ce secteur pour le moment',
    joinWaitlist: "S'inscrire à la liste d'attente",
  },
  service: {
    boarding: 'Pension pour chien',
    house_sitting: 'Gardiennage à domicile',
    drop_in: 'Visites à domicile',
    dog_walking: 'Promenade de chien',
    day_care: 'Garderie pour chien',
    training: 'Dressage de chien',
    grooming: 'Toilettage',
  },
  serviceDescription: {
    boarding:
      "Votre animal passe la nuit chez votre gardien. Aussi appelé hébergement pour chien.",
    house_sitting: 'Votre gardien reste chez vous et respecte la routine de votre animal.',
    drop_in: 'De courtes visites pour nourrir, jouer et changer la litière.',
    dog_walking: 'Une promenade dans votre quartier, avec suivi GPS et photos.',
    day_care: 'Garde de jour chez votre gardien pendant que vous travaillez.',
    training: "Des séances privées avec un éducateur certifié.",
    grooming: 'Bain, brossage et coupe par un toiletteur professionnel.',
  },
  unit: {
    night: 'nuit',
    visit: 'visite',
    walk: 'promenade',
    day: 'jour',
    session: 'séance',
  },
  quote: {
    base: 'Tarif du gardien',
    extraPets: 'Animaux supplémentaires',
    holidaySurcharge: 'Tarif des fêtes',
    addOns: 'Suppléments',
    serviceFee: 'Frais de service',
    sitterCommission: 'Commission de la plateforme',
    tax: 'Taxes',
    total: 'Total',
    allFeesIncluded: 'Tous les frais sont inclus. Les taxes sont ajoutées au paiement.',
  },
  commission: {
    platform: 'Nous vous avons présenté ce client : nous prenons 18 %.',
    sitter_referral: 'Vous avez amené ce client. Nous prenons 0 %.',
    repeat: 'Client régulier — nous prenons 10 %.',
    promo: 'Offre de lancement : 0 % de commission pendant vos 12 premiers mois.',
  },
  refund: {
    statutory: 'Annulation selon votre droit légal — remboursement complet.',
    'cancelledBy.sitter': 'Votre gardien a annulé. Vous êtes remboursé en entier.',
    'cancelledBy.platform':
      'Nous avons annulé cette réservation. Vous êtes remboursé en entier.',
    'policy.flexible': "Politique d'annulation flexible appliquée.",
    'policy.moderate': "Politique d'annulation modérée appliquée.",
    'policy.strict': "Politique d'annulation stricte appliquée.",
  },
  verification: {
    identity: 'Identité vérifiée',
    criminal: 'Vérification des antécédents judiciaires',
    licence: 'Licencié et assuré',
    certification: 'Pro certifié',
    disclaimer:
      "Vérification approfondie des antécédents judiciaires et vérification biométrique de l'identité.",
  },
  ranking: {
    'improve.reviewQuality': 'Demandez à vos clients satisfaits de laisser un avis.',
    'improve.responseSpeed': "Répondez aux demandes en moins d'une heure.",
    'improve.acceptance':
      'Tenez votre calendrier à jour pour accepter plus de demandes.',
    'improve.reliability': "Évitez d'annuler les réservations confirmées.",
    'improve.completeness': 'Ajoutez des photos de chez vous et complétez votre profil.',
    'improve.badges': "Complétez vos étapes de vérification.",
  },
  seo: {
    noSupply: 'Aucun gardien dans ce secteur pour le moment.',
    thinSupply: 'Nous commençons tout juste ici.',
    growingSupply: "Un groupe de gardiens en croissance.",
    healthySupply: 'De nombreux gardiens disponibles.',
  },
  legal: {
    languageNotice:
      "Cette entente vous est offerte en français. Vous pouvez poursuivre en français ou choisir expressément l'anglais.",
    cookieTitle: 'Nous utilisons des témoins',
    cookieBody:
      "Les témoins non essentiels ne sont activés qu'avec votre consentement. Vous pouvez changer d'avis à tout moment.",
    acceptAll: 'Tout accepter',
    rejectAll: 'Refuser les non essentiels',
    manage: 'Gérer',
  },
} as const;
