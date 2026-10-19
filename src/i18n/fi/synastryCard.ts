import type { Messages } from '@/i18n';

const synastryCard: Messages['synastryCard'] = {
  sections: {
    ritratto_coppia: 'Parin muotokuva',
    attrazione_chimica: 'Vetovoima ja kemia',
    comunicazione: 'Viestintä',
    mondo_emotivo: 'Tunnemaailma',
    sfide: 'Haasteet kasvuna',
    pattern_karmico: 'Karmakuvio',
    direzione: 'Suunta',
  },
  pdf: {
    unavailable: 'PDF ei ole saatavilla',
    error: 'PDF:n luominen ei onnistunut. Yritä uudelleen.',
    preparing: 'Valmistellaan...',
    download: 'Lataa PDF',
  },
  card: {
    title: 'Parin synastria',
    personA: 'Henkilö A',
    personB: 'Henkilö B',
    inPreparation: 'Synastriaasi valmistellaan. Saat ilmoituksen, kun se on valmis.',
    coupleChart: 'Parin synastriakartta',
    yourMap: 'Suhteenne kartta',
    mapLabels: {
      cosa_siete: 'Keitä te olette',
      dove_brillate: 'Missä loistatte',
      dove_inciampate: 'Missä kompastutte',
      dove_andate: 'Minne olette menossa',
    },
  },
  upsell: {
    aria: 'Parin synastria',
    kicker: 'Parin synastria',
    title: 'Katso, mitä tapahtuu, kun syntymäkarttasi kohtaa toisen ihmisen kartan.',
    body: 'Parin synastria asettaa syntymäkarttasi toisen ihmisen kartan päälle ja tulkitsee, miten planeettanne keskustelevat keskenään: missä on luontevaa sopusointua, missä kitkaa ja mitä voitte rakentaa yhdessä.',
    includesTitle: 'Tulkinta sisältää:',
    includes: [
      'Parin muotokuva: keitä olette yhdessä ja millainen on suhteenne arkkityyppi',
      'Vetovoima, viestintä, tunnemaailma: missä toimitte hyvin ja missä on vaikeampaa',
      'Haasteet kasvuna, karmakuviot ja suhteen suunta',
    ],
    cta: 'Tutustu parin synastriaan',
    note: 'Kertamaksu. Tarvitaan molempien syntymätiedot.',
    secureNote: 'Turvallinen maksu – heti käyttöösi',
  },
  another: {
    kicker: 'Toinen suhde',
    title: 'Haluatko tutkia toista suhdetta?',
    body: 'Hanki uusi parin synastria eri syntymätiedoilla ja katso, miten karttasi kohtaa toisen ihmisen kartan.',
    cta: 'Uusi synastria',
  },
};

export default synastryCard;
