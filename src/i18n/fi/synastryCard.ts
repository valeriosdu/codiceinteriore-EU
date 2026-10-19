import type { Messages } from '@/i18n';

const synastryCard: Messages['synastryCard'] = {
  sections: {
    ritratto_coppia: 'Your portrait as a couple',
    attrazione_chimica: 'Attraction and chemistry',
    comunicazione: 'Communication',
    mondo_emotivo: 'Emotional world',
    sfide: 'Challenges as growth',
    pattern_karmico: 'Karmic pattern',
    direzione: 'Direction',
  },
  pdf: {
    unavailable: 'PDF unavailable',
    error: "We couldn't generate the PDF. Please try again.",
    preparing: 'Preparing...',
    download: 'Download PDF',
  },
  card: {
    title: 'Couple synastry',
    personA: 'Person A',
    personB: 'Person B',
    inPreparation: "Your synastry is being prepared. We'll let you know as soon as it's ready.",
    coupleChart: 'Your couple chart',
    yourMap: 'Your map',
    mapLabels: {
      cosa_siete: 'Who you are',
      dove_brillate: 'Where you shine',
      dove_inciampate: 'Where you stumble',
      dove_andate: "Where you're headed",
    },
  },
  upsell: {
    aria: 'Couple synastry',
    kicker: 'Couple synastry',
    title: 'See what happens when your sky meets someone else’s.',
    body: "Couple synastry overlays your birth chart with another person's and reads how your planets talk to each other: where there's natural ease, where there's friction, and what you can build together.",
    includesTitle: 'The reading includes:',
    includes: [
      'Your portrait as a couple: who you are together and the archetype of your relationship',
      'Attraction, communication, emotional world: where you click and where you struggle',
      'Challenges as growth, karmic patterns, and the direction of the relationship',
    ],
    cta: 'Discover Couple Synastry',
    note: 'One-time payment. Requires both birth details.',
    secureNote: 'Secure payment - Instant access',
  },
  another: {
    kicker: 'Another relationship',
    title: 'Want to explore another relationship?',
    body: "Get a new couple synastry with different birth details, to see how your sky talks to another person's.",
    cta: 'New synastry',
  },
};

export default synastryCard;
