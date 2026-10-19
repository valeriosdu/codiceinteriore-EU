import type { Messages } from '@/i18n';

const teaser: Messages['teaser'] = {
  loading: {
    title: 'Viimeistelemme ensimmäistä tulkintaasi',
    slow: 'Tämä vie odotettua pidempään. Pysy tällä sivulla: yritämme automaattisesti uudelleen hetken kuluttua.',
    normal: 'Tarkistamme syntymäkarttasi ja oivallukset, ennen kuin näytämme tarjouksen.',
    complex: 'Karttasi on poikkeuksellisen monipuolinen: tarvitsemme vielä pari minuuttia. Pysy tällä sivulla, olemme melkein valmiita.',
  },
  failed: {
    title: 'Tulkinnan luominen ei onnistunut',
    body: 'Jokin ei toimi niin kuin pitäisi. Yritä hetken kuluttua uudelleen.',
    retry: 'Yritä uudelleen',
  },
  toasts: {
    previewPaymentsDisabled: 'Esikatselu: maksaminen ei ole käytössä esikatselutilassa.',
    stillCompleting: 'Viimeistelemme vielä ensimmäistä tulkintaasi. Yritä hetken kuluttua uudelleen.',
    stillPreparing: 'Valmistelemme vielä tulkintaasi. Yritä muutaman sekunnin kuluttua uudelleen.',
  },
  hero: {
    title: (name) => (name ? `${name}, tässä on ensimmäinen tulkintasi` : 'Tässä on ensimmäinen tulkintasi'),
    subtitle: 'Ensimmäinen katsaus siihen, mitä syntymäkarttasi kertoo.',
    wrongData: 'Eivätkö tiedot ole oikein?',
  },
  openFullReport: 'Avaa koko tulkinta',
  offers: {
    baseName: 'Syntymäkartan koko tulkinta',
    baseCta: 'Hanki koko tulkinta',
    premiumName: 'Koko tulkinta + 1 kuukausi transiitteja',
    premiumPromise:
      'Ymmärrä, mikä sinua syvimmiltään ohjaa, ja näe selkeästi myös hetki, jota elät juuri nyt',
    premiumFeatures: [
      'Kaikki, mitä koko tulkintaan kuuluu',
      'Kuukauden ajan viikoittainen, henkilökohtainen tulkinta ajankohtaisista transiiteista',
      'Lisätukea sen ymmärtämiseen, mikä sinussa herää tunnetasolla juuri nyt',
      'Lahjana: henkilökohtainen runo muutoksen tueksi',
    ],
    premiumCta: 'Hanki tulkinta + transiitit',
  },
  faq: {
    kicker: 'Usein kysyttyä',
    heading: 'Vastauksia yleisimpiin kysymyksiin ennen ostoa.',
  },
  bottomCta: 'Hanki koko tulkinta',
  reassurance: {
    instantAccess: 'Heti luettavissa',
    securePayment: 'Turvallinen maksu',
    humanLanguage: 'Kirjoitettu selkeällä kielellä',
  },
};

export default teaser;
