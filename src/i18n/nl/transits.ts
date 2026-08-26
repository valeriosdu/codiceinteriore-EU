import type { Messages } from '@/i18n';

const transits: Messages['transits'] = {
  upsell: {
    errors: {
      noUrl: 'URL niet beschikbaar',
      checkout: 'We konden de betaling niet openen. Probeer het zo opnieuw.',
    },
    ariaActive: 'Transits van de maand actief',
    ariaInactive: 'Activeer de maandelijkse transitduiding',
    activeBadge: 'Actief',
    activeTitle: 'Je hebt de transits van deze maand',
    validUntil: 'Geldig tot',
    validUntilFallback: 'het einde van de inbegrepen periode',
    activeBody:
      'Ze lopen tot de genoemde datum. Wil je daarna doorgaan, dan kun je verlengen met de maandelijkse duiding, of het hierbij laten.',
    kicker: 'Transits van de maand',
    title: 'Je hebt je geboortehoroscoop gelezen. Nu kun je het moment van nu lezen.',
    body: 'De geboortehoroscoop is je structuur, vastgelegd bij je geboorte: die verandert niet. De hemel beweegt daarentegen elke dag. De planeten schuiven dagelijks over de punten van jouw horoscoop (je Zon, Maan, Ascendant en zo verder) en zetten bepaalde delen aan, afhankelijk van het aspect dat ze maken.',
    monthlyListTitle: 'Elke maand krijg je een duiding die je vertelt:',
    monthlyList: [
      'Welke gebieden van je horoscoop onder spanning staan, meewind hebben of onder druk liggen, en waar je op kunt letten',
      'De sleutelmomenten van de maand, met precieze data, en wat je week na week kunt aanmoedigen',
      'Hoe lang duurt wat je nu doormaakt, en wat er daarna komt',
    ],
    ctaActive: (priceLabel) => `Ga door met de maandelijkse transits - ${priceLabel} per maand`,
    ctaInactive: (priceLabel) => `Lees de transits van de maand - ${priceLabel} per maand`,
    renewNoteActive: 'Maandelijkse verlenging, opzegbaar wanneer je wilt',
    renewNoteInactive: 'Elke maand een nieuwe duiding. Opzegbaar wanneer je wilt.',
    secureNote: 'Veilig betalen - Direct toegang',
  },
};

export default transits;
