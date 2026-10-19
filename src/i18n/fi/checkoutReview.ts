import type { Messages } from '@/i18n';

const checkoutReview: Messages['checkoutReview'] = {
  products: {
    base: {
      name: 'Syntymäkartan koko tulkinta',
      bullets: ['10 sivun koko tulkinta', 'Heti luettavissa verkossa ja sähköpostissa'],
    },
    premium: {
      name: 'Koko tulkinta + 1 kuukausi transiitteja',
      bullets: [
        '10 sivun koko tulkinta',
        '1 kuukausi viikoittaisia transiittitulkintoja',
        'Lahjana: henkilökohtainen runo muutoksen tueksi',
      ],
    },
    synastry: {
      name: 'Parin synastria',
      bullets: [
        'Kahdeksan osiota parisuhteestanne',
        'Ladattava PDF, pysyvä pääsy',
        'Noin 10 sivua selkeällä suomella',
      ],
    },
    synastry_launch: {
      name: 'Parin synastria',
      bullets: [
        'Kahdeksan osiota parisuhteestanne',
        'Ladattava PDF, pysyvä pääsy',
        'Noin 10 sivua selkeällä suomella',
      ],
    },
  },
  title: 'Tilauksen yhteenveto',
  subtitle: 'Tarkista tilauksesi tiedot.',
  instantAccess: 'Heti luettavissa',
  total: 'Yhteensä',
  howToPay: 'Miten haluat maksaa?',
  cardLabel: 'Luotto- tai pankkikortti',
  paypalNote: 'Nopeasti ja turvallisesti omalla tililläsi',
  securePayment: 'Turvallinen maksu',
  moneyBack: 'Tyytyväisyystakuu',
  noSubscription: 'Ei kestotilausta',
  errors: {
    noSession: 'Istuntoa ei löydy. Päivitä sivu ja yritä uudelleen.',
    payment: 'Maksussa tapahtui virhe. Yritä uudelleen.',
  },
};

export default checkoutReview;
