import type { Messages } from '@/i18n';

const checkout: Messages['checkout'] = {
  failed: {
    title: 'Tulkinnan valmistelu ei onnistunut',
    body: 'Jokin ei toimi niin kuin pitäisi. Yritä hetken kuluttua uudelleen.',
    retry: 'Yritä uudelleen',
  },
  loading: {
    title: 'Valmistelemme tulkintaa',
    slow: 'Tämä vie odotettua pidempään. Pysy tällä sivulla: yritämme automaattisesti uudelleen hetken kuluttua.',
    normal: 'Laskemme syntymäkartan, ennen kuin näytämme tarjouksen.',
  },
  toasts: {
    stillPreparingShort: 'Valmistelemme vielä tulkintaa. Yritä hetken kuluttua uudelleen.',
    stillPreparingRetry: 'Valmistelemme vielä tulkintaa. Yritä muutaman sekunnin kuluttua uudelleen.',
  },
  hero: {
    title: (name) => `Tulkinta on valmis: ${name}`,
    fallbackRecipient: 'hän',
    subtitle: 'Olemme laskeneet syntymäkartan. Valitse muoto, jossa koko tulkinta tehdään.',
    wrongData: 'Eivätkö tiedot ole oikein?',
  },
  offers: {
    baseName: 'Syntymäkartan koko tulkinta',
    basePromise: (name) =>
      `Jotta ymmärrät selkeämmin, millainen ihminen ${name} on tunteiltaan, ihmissuhteissaan ja luonteeltaan, ja mikä hänen elämässään toistuu.`,
    baseFeatures: [
      'Ymmärrä tunnelukkoja, puolustuskeinoja ja toistuvia kaavoja ihmisen kielellä, ei ammattitermein',
      'Näe, miten nämä mallit vaikuttavat ihmissuhteisiin, työhön, omaan suuntaan ja elämänvalintoihin',
      'Saat käytännön vinkkejä siitä, mitä kannattaa tarkkailla, vahvistaa tai muuttaa',
      'Pääsy heti tulkintaan verkossa ja sähköpostitse',
    ],
    premiumPromise: (name) =>
      `Ymmärrä, mikä ohjaa ihmistä syvällä, ja lue selkeästi myös hetki, jota ${name} elää juuri nyt.`,
  },
};

export default checkout;
