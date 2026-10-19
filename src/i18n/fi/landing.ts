import type { Messages } from '@/i18n';

const landing: Messages['landing'] = {
  seo: {
    title: 'Syntymäkartta verkossa, tulkinta suomeksi',
    description:
      'Syntymäkartan tulkinta suomeksi, laadittu syntymätietojesi pohjalta. Ensimmäinen osa on ilmainen, rekisteröitymistä ei tarvita.',
  },
  hero: {
    titlePre: 'Oma',
    titleEm: 'syntymäkarttasi',
    titlePost: ' selkeästi selitettynä',
    subtitle:
      'Selvitä, mitä syntymätietosi kertovat sisäisestä rakenteestasi. Ilmaiseksi ja ilman rekisteröitymistä.',
    cta: 'Aloita kysely',
    microcopy: '2 minuutin kysely · Esitietoja ei tarvita',
    socialProof: 'Yli 10 000 ihmistä on jo tutustunut syntymäkarttaansa',
  },
  discover: {
    heading: 'Mitä voit saada selville',
    items: [
      'Miten toimit oikeasti, pinnan alla',
      'Missä sinulla on kasvun paikka tässä elämänvaiheessa',
      'Mitkä kuviot toistuvat elämässäsi',
      'Mikä sinua syvimmiltään liikuttaa',
    ],
  },
  quote: {
    plate: 'Taulu II',
    text: 'Planeettojen asento syntymäpäivänäsi kertoo jostakin, mitä olet kantanut mukanasi koko ikäsi',
  },
  howItWorks: {
    heading: 'Näin se toimii',
    steps: [
      'Kirjoita syntymätietosi',
      'Vastaa muutamaan lyhyeen kysymykseen',
      'Saat ensimmäisen tulkintasi ilmaiseksi',
    ],
  },
  finalCta: {
    body: 'Aloita ensimmäisestä tulkinnastasi. Loppu selkenee sen myötä.',
    cta: 'Aloita kysely',
  },
};

export default landing;
