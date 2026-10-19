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
    title: (name) => `Tulkinta on valmis – sen saa ${name}`,
    fallbackRecipient: 'hän',
    subtitle: 'Syntymäkartta on laskettu. Valitse vielä, kumpi tulkinta laaditaan.',
    wrongData: 'Eivätkö tiedot ole oikein?',
  },
  offers: {
    baseName: 'Syntymäkartan koko tulkinta',
    basePromise: (name) =>
      `Ymmärrät selkeämmin, millainen ${name} on tunteiltaan, ihmissuhteissaan ja luonteeltaan, ja näet, mikä hänen elämässään toistuu.`,
    baseFeatures: [
      'Ymmärrät tunnelukot, puolustuskeinot ja toistuvat kuviot arkikielellä, ilman ammattitermejä',
      'Näet, miten nämä kuviot vaikuttavat ihmissuhteisiin, työhön, omaan suuntaan ja elämänvalintoihin',
      'Saat käytännön vinkkejä siitä, mitä kannattaa tarkkailla, vahvistaa tai muuttaa',
      'Tulkinta heti luettavissa verkossa ja sähköpostissa',
    ],
    premiumPromise: (name) =>
      `Ymmärrät, mistä käsin ${name} syvimmiltään toimii, ja näet selkeästi myös hetken, jota hän elää juuri nyt.`,
  },
};

export default checkout;
