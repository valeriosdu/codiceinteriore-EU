import type { Messages } from '@/i18n';

const astrologyGuide: Messages['astrologyGuide'] = {
  name: 'Astrologiegids',
  openAria: 'Open de Astrologiegids',
  closeAria: 'Sluiten',
  freeBadge: (n) => `${n} gratis`,
  questionsCount: (n) => `${n} ${n === 1 ? 'vraag' : 'vragen'}`,
  freeInline: (n) => `· ${n} gratis`,
  empty: {
    exhaustedTitle: 'Je vragen zijn op',
    exhaustedBody: (packCredits) =>
      `Voeg een nieuw pakket van ${packCredits} vragen toe om verder de diepte in te gaan met je horoscoop.`,
    introTitle: 'Je persoonlijke astrologiegids',
    introBody:
      'Stel vragen over je geboortehoroscoop en, als je de synastrie voor koppels of de transits van de maand hebt gekocht, ook daarover: de antwoorden zijn altijd afgestemd op jouw astrologische gegevens.',
    howTitle: 'Hoe het werkt',
    howSteps: [
      'Stel hieronder een vraag, vrij of aan de hand van de suggesties.',
      'Het antwoord komt binnen een paar uur, tijdens kantooruren.',
      'Je leest het hier en in je mail.',
    ],
    firstQuestions: 'Eerste 2 vragen',
    free: 'Gratis ✦',
    additional: 'Extra vragen',
    additionalValue: (packCredits, priceLabel) =>
      `${packCredits} extra vragen voor ${priceLabel}`,
  },
  composer: {
    genericChips: [
      'Welk gehechtheidspatroon draag ik mee sinds mijn kindertijd?',
      'Welk deel van mezelf vermijd ik op dit moment aan te kijken?',
    ],
    sectionChips: {
      identity: [
        'Welk deel van mijn identiteit ligt het diepst verborgen en is voor anderen het minst zichtbaar?',
        'Wat in mijn horoscoop verklaart mijn behoefte om me anders te voelen dan anderen?',
      ],
      emotions: [
        'Waarom overspoelen sommige emoties me terwijl ik andere nauwelijks voel?',
        'Wat gaat er schuil achter mijn neiging om dicht te klappen als ik echt lijd?',
      ],
      emotions_relationships: [
        'Welke emotionele wond wordt telkens weer geraakt in mijn intieme relaties?',
        'Waarom verlang ik zo vaak naar wie mij op afstand houdt?',
      ],
      relationships: [
        'Welk gehechtheidspatroon herhaalt zich in mijn belangrijkste relaties?',
        'Wat zoek ik werkelijk in een partner, voorbij wat ik erover zeg?',
      ],
      blocks_patterns: [
        'Welk patroon blokkeert me precies wanneer ik op het punt sta echt te veranderen?',
        'Wat bescherm ik als ik dichtklap of mezelf saboteer?',
      ],
      blocks: [
        'Wat gaat er schuil achter mijn neiging om te stoppen net als het goed gaat?',
        'Welke onderhuidse angst weerhoudt me ervan positie te kiezen?',
      ],
      patterns: [
        'Welk patroon herken ik wel, maar krijg ik nog niet losgemaakt?',
        'Waar komt mijn moeite vandaan om te vragen wat ik nodig heb?',
      ],
      work: [
        'Welk werk past echt bij mij, los van geld en zekerheid?',
        'Waarom raak ik uitgeput, zelfs bij dingen waar ik van hou?',
      ],
      work_direction: [
        'Wat vermijd ik aan te kijken in mijn professionele traject?',
        'Welke richting past bij mij, ook al maakt die me bang?',
      ],
      advice: [
        'Wat mag ik nu loslaten om ruimte te maken voor iets nieuws?',
        'Op welk deel van mezelf zou ik me de komende maanden moeten richten?',
      ],
    },
    placeholder: 'Schrijf je vraag…',
    send: 'Versturen',
    remaining: (n) => `Je hebt nog ${n} ${n === 1 ? 'vraag' : 'vragen'}.`,
  },
  message: {
    answerUseful: 'Nuttig antwoord',
    answerNotUseful: 'Niet nuttig antwoord',
    commentPlaceholder: 'Wat beviel je niet?',
    commentSend: 'Versturen',
    thanksFeedback: 'Dank je voor je feedback.',
    pending: 'Je antwoord komt binnen een paar uur.',
    pendingEmail: 'We laten het je ook per mail weten.',
    failed: 'We konden het antwoord niet maken. Je vraag is teruggezet, je kunt het opnieuw proberen.',
  },
  buyMore: {
    exhaustedHeadline: 'Je hebt al je vragen gebruikt',
    nearEndHeadline: 'Je vragen raken op',
    exhaustedSub: (packCredits) =>
      `Koop ${packCredits} nieuwe vragen om verder de diepte in te gaan met je horoscoop.`,
    nearEndSub: (packCredits) =>
      `Voeg nog ${packCredits} vragen toe zodat je niet hoeft te stoppen net als het interessant wordt.`,
    balance: (n) => `Huidig saldo: ${n} ${n === 1 ? 'vraag' : 'vragen'}.`,
    buyCta: (packCredits, priceLabel) => `Koop ${packCredits} vragen · ${priceLabel}`,
  },
  askButton: {
    deepen: (label) => `Verdiep: ${label}`,
    deepenGeneric: 'Verdiep dit onderdeel',
    free: 'gratis',
  },
  toasts: {
    packActivated: (added) =>
      `Pakket geactiveerd. Je hebt ${added} ${added === 1 ? 'nieuwe vraag' : 'nieuwe vragen'}.`,
    paymentProcessing: 'De betaling wordt verwerkt. Ververs over een paar seconden om je nieuwe vragen te zien.',
    sendError: 'Er ging iets mis bij het versturen.',
    noCredits: (packCredits, priceLabel) =>
      `Je vragen zijn op. Koop er ${packCredits} bij voor ${priceLabel}.`,
    duplicate: 'Deze vraag heb je net al gesteld. Het antwoord staat in het gesprek (of is onderweg).',
    submitError: 'We konden je vraag niet versturen. Probeer het opnieuw.',
    noUrl: 'URL niet beschikbaar',
    checkoutError: 'We konden de betaling niet openen. Probeer het zo opnieuw.',
  },
};

export default astrologyGuide;
