import type { Messages } from '@/i18n';

const teaser: Messages['teaser'] = {
  loading: {
    title: 'We maken je eerste duiding af',
    slow: 'Het duurt langer dan verwacht. Blijf op deze pagina: we proberen het zo automatisch opnieuw.',
    normal: 'We controleren de geboortehoroscoop en de inzichten voordat we je het aanbod laten zien.',
    complex: 'Jouw horoscoop is bijzonder rijk: we hebben nog een paar minuten nodig. Blijf op deze pagina, we zijn er bijna.',
  },
  failed: {
    title: 'We konden de duiding niet maken',
    body: 'Er gaat iets niet zoals het hoort. Probeer het over een paar tellen opnieuw.',
    retry: 'Opnieuw proberen',
  },
  toasts: {
    previewPaymentsDisabled: 'Voorbeeldweergave: betalen staat uit in de preview.',
    stillCompleting: 'We maken je eerste duiding nog af. Probeer het zo opnieuw.',
    stillPreparing: 'We zijn je duiding nog aan het klaarmaken. Probeer het over een paar seconden opnieuw.',
  },
  hero: {
    title: (name) => (name ? `${name}, hier is je eerste duiding` : 'Hier is je eerste duiding'),
    subtitle: 'Wat er naar boven komt uit een eerste lezing van je geboortehoroscoop.',
    wrongData: 'Kloppen de gegevens niet?',
  },
  openFullReport: 'Open de volledige duiding',
  offers: {
    baseName: 'Volledige Duiding van je Geboortehoroscoop',
    baseCta: 'Haal de Volledige Duiding',
    premiumName: 'Volledige Duiding + 1 Maand Transits',
    premiumPromise:
      'Begrijpen wat je diep vanbinnen stuurt, en ook het moment dat je nu beleeft helder lezen',
    premiumFeatures: [
      'Alles wat in de Volledige Duiding zit',
      '1 maand wekelijkse persoonlijke duidingen over de transits van die periode',
      'Een extra houvast om te begrijpen wat er nu emotioneel wordt aangeraakt',
      'Cadeau: een persoonlijk transformerend gedicht',
    ],
    premiumCta: 'Haal de Duiding + Transits',
  },
  faq: {
    kicker: 'Veelgestelde vragen',
    heading: 'Hier vind je de antwoorden op de vragen die het vaakst terugkomen voor je koopt.',
  },
  bottomCta: 'Haal de volledige duiding',
  reassurance: {
    instantAccess: 'Direct toegang',
    securePayment: 'Veilig betalen',
    humanLanguage: 'Geschreven in menselijke taal',
  },
};

export default teaser;
