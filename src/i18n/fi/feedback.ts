import type { Messages } from '@/i18n';

const feedback: Messages['feedback'] = {
  title: 'Kerro meille, mitä mieltä olet',
  subtitle: 'Palautteesi auttaa meitä tekemään jokaisesta tulkinnasta tarkemman. Se vie vain muutaman sekunnin.',
  ratings: {
    positive: 'Tunnistan itseni',
    mixed: 'Osittain',
    negative: 'En tunnista itseäni',
  },
  reasons: {
    positive: ['Tarkka', 'Hyödyllinen', 'Hyvin kirjoitettu', 'Yllätti minut'],
    mixed: ['Osa kyllä, osa ei', 'Liian yleinen', 'Kieli', 'Kaipaan lisää syvyyttä'],
    negative: ['En tunnista itseäni', 'Liian yleinen', 'Asiavirheitä', 'Kieli'],
  },
  errors: {
    signInRequired: 'Sinun täytyy olla kirjautuneena, jotta voit lähettää palautetta.',
    saveRating: (detail) => `Palautteen tallennus ei onnistunut (${detail}).`,
    saveDetails: (detail) => `Tallennus ei onnistunut (${detail}).`,
    unknown: 'tuntematon virhe',
  },
  thanksMore: 'Kiitos. Haluatko kertoa lisää?',
  commentPlaceholder: 'Kaipaatko jotain toimintoa tai haluatko lisätä jotain? (valinnainen)',
  skip: 'Ohita',
  send: 'Lähetä',
  done: 'Kiitos, tämä auttaa meitä kehittymään.',
};

export default feedback;
