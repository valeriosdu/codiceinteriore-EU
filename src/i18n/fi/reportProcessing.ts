import type { Messages } from '@/i18n';

const reportProcessing: Messages['reportProcessing'] = {
  messages: [
    'Haemme tulkintaasi',
    'Järjestämme tärkeimmät osa-alueet',
    'Valmistelemme osia, joita et ole vielä nähnyt',
    'Viimeistelemme henkilökohtaista karttaasi',
    'Hetken kuluttua pääset koko versioon',
    'Hiomme hienovaraisimpia yksityiskohtia',
    'Melkein valmista – enää hetki',
  ],
  errors: {
    signIn: 'Kirjaudu tilillesi viimeistelläksesi ostamasi tulkinnan.',
    profileNotFound: 'Emme löydä profiiliasi. Kirjaudu uudelleen tai ota meihin yhteyttä.',
    paymentMismatch: 'Maksu ei vastaa kyselyn istuntoa, joka pitäisi viimeistellä.',
    noSession: 'Emme löydä maksuun liitettyä kyselyn istuntoa.',
    paymentRequired:
      'Uuden tulkinnan luomiseen tarvitaan hyväksytty maksu. Jos sinulla on jo tulkinta, avaa se omalta sivultasi.',
    generic:
      'Tulkintaasi valmistellaan. Maksusi on kirjattu oikein, ja saat kaiken sähköpostitse muutaman minuutin kuluessa. Jos 10 minuutin jälkeen ei kuulu mitään, ota meihin yhteyttä, autamme mielellämme.',
  },
  errorScreen: {
    title: 'Tulkinta tarkistettavana',
    cta: 'Ota yhteyttä',
  },
  verifying: 'Tarkistamme pääsysi tulkintaan…',
  processing: {
    title: 'Viimeistelemme tulkintaasi',
    body: 'Olet jo nähnyt alun. Nyt valmistelemme koko Carta Interior -tulkintasi, jossa on paljon uutta ja kokonaiskuva sisäisestä rakenteestasi. Älä sulje tai päivitä sivua.',
    slowHint:
      'Monimutkaisemmilla kartoilla valmistelu voi kestää jopa 10 minuuttia. Voit jäädä tälle sivulle tai sulkea sen: saat kaiken sähköpostitse heti, kun tulkinta on valmis.',
  },
};

export default reportProcessing;
