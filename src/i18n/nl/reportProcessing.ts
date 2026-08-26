import type { Messages } from '@/i18n';

const reportProcessing: Messages['reportProcessing'] = {
  messages: [
    'We halen je duiding op',
    'We ordenen de belangrijkste gebieden',
    'We maken de delen klaar die je nog niet hebt gezien',
    'We maken je persoonlijke kaart compleet',
    'Zo meteen ga je door naar de volledige versie',
    'We werken de fijnste details bij',
    'Bijna klaar — nog heel even',
  ],
  errors: {
    signIn: 'Log in op je account om de gekochte duiding af te ronden.',
    profileNotFound: 'We konden je profiel niet vinden. Log opnieuw in of neem contact met ons op.',
    paymentMismatch: 'De betaling hoort niet bij de vragenlijstsessie die afgerond moet worden.',
    noSession: 'We vonden geen vragenlijstsessie die aan de betaling gekoppeld is.',
    paymentRequired:
      'Voor een nieuwe duiding is een afgeronde betaling nodig. Heb je al een duiding, open hem dan vanuit je persoonlijke omgeving.',
    generic:
      'Je duiding wordt klaargemaakt. De betaling is goed geregistreerd en je krijgt alles binnen een paar minuten per mail. Komt er na 10 minuten nog niets, schrijf ons dan even — we helpen je graag.',
  },
  errorScreen: {
    title: 'Duiding in controle',
    cta: 'Schrijf ons',
  },
  verifying: 'We controleren je toegang tot de duiding…',
  processing: {
    title: 'We maken je duiding compleet',
    body: 'Je hebt het begin al gezien. Nu maken we je volledige duiding klaar, met veel nieuwe elementen en een compleet beeld van je Carta Interior. Sluit of ververs deze pagina niet.',
    slowHint:
      'Bij de complexere horoscopen kan het klaarmaken tot 10 minuten duren. Je kunt op deze pagina blijven of hem sluiten: je krijgt alles per mail zodra het klaar is.',
  },
};

export default reportProcessing;
