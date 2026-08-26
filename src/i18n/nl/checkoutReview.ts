import type { Messages } from '@/i18n';

const checkoutReview: Messages['checkoutReview'] = {
  products: {
    base: {
      name: 'Volledige Duiding van de Geboortehoroscoop',
      bullets: ['Volledige duiding van 10 pagina\'s', 'Direct toegang online en per mail'],
    },
    premium: {
      name: 'Volledige Duiding + 1 Maand Transits',
      bullets: [
        'Volledige duiding van 10 pagina\'s',
        '1 maand wekelijkse duidingen over de transits',
        'Cadeau: een persoonlijk transformerend gedicht',
      ],
    },
    synastry: {
      name: 'Synastrie voor Koppels',
      bullets: [
        'Acht delen over jullie relatie',
        'Downloadbare pdf, blijvende toegang',
        'Ongeveer 10 pagina\'s in helder Nederlands',
      ],
    },
    synastry_launch: {
      name: 'Synastrie voor Koppels',
      bullets: [
        'Acht delen over jullie relatie',
        'Downloadbare pdf, blijvende toegang',
        'Ongeveer 10 pagina\'s in helder Nederlands',
      ],
    },
  },
  title: 'Overzicht van je bestelling',
  subtitle: 'Loop de details van je bestelling nog even na.',
  instantAccess: 'Direct toegang',
  total: 'Totaal',
  howToPay: 'Hoe wil je betalen?',
  // Su Stripe il mercato NL mostra iDEAL insieme alle carte: nominarlo per primo
  // e' rassicurante, in Olanda vale la maggioranza dei pagamenti e-commerce.
  cardLabel: 'iDEAL, creditcard of debitcard',
  paypalNote: 'Snel en veilig met je account',
  securePayment: 'Veilig betalen',
  moneyBack: 'Niet tevreden, geld terug',
  noSubscription: 'Geen abonnement',
  errors: {
    noSession: 'Sessie niet beschikbaar. Ververs de pagina en probeer het opnieuw.',
    payment: 'Er ging iets mis bij het betalen. Probeer het opnieuw.',
  },
};

export default checkoutReview;
