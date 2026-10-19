import type { Messages } from '@/i18n';

const seo: Messages['seo'] = {
  product: {
    name: 'Syntymäkartan tulkinta',
    description:
      'Henkilökohtainen syntymäkartan tulkinta suomeksi. Noin 10 sivun raportti syntymätietojesi pohjalta, psykologinen eikä ennustava.',
    category: 'Psykologinen astrologia',
    offerBase: 'Koko tulkinta',
    offerPremium: 'Tulkinta + 1 kuukausi transiitteja',
  },
  contactPageName: 'Yhteystiedot',
  defaultFaqs: [
    {
      question: 'Astrologia ei ole tiedettä – eikö se ole pelkkää huuhaata?',
      answer:
        'Se ei ole ennustus eikä tarkka tiede: se on symbolinen kieli, jota käytämme viitekehyksenä sisäisen rakenteen lukemiseen. Arvo syntyy tulkinnan psykologisesta tarkkuudesta, ei ennustamisesta. Rahat takaisin, jos tulkinta tuntuu liian yleiseltä.',
    },
    {
      question: 'Netissä on ilmaisia tulkintoja, miksi maksaisin?',
      answer:
        'Ilmaiset tulkinnat ovat teknisiä katkelmia (yksi merkitys planeettaa, huonetta ja aspektia kohden). Täällä kartta luetaan yhtenä johdonmukaisena kokonaisuutena, selkeällä suomella, noin 10 sivulla. Ei irrallisia palasia.',
    },
    {
      question: 'Kertooko tulkinta, mitä minun pitäisi tehdä?',
      answer:
        'Ei kerro, ja sanomme sen suoraan. Kuvaamme, millainen olet – emme jaa neuvoja tai motivaatiopuheita. Uskottavuutemme perustuu juuri siihen, ettemme lupaa liikoja.',
    },
    {
      question: 'Kuinka henkilökohtainen tulkinta oikeasti on?',
      answer:
        'Tulkinta tehdään juuri sinun syntymäkartastasi (syntymäpäivä, kellonaika ja paikka) sekä kahden alkukysymyksen vastauksista, jotka säätävät sävyä. Kaikki perustuu planeettojen asentoon syntymäpäivänäsi.',
    },
  ],
};

export default seo;
