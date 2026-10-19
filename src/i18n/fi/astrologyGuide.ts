import type { Messages } from '@/i18n';

const astrologyGuide: Messages['astrologyGuide'] = {
  name: 'Astrologiopas',
  openAria: 'Avaa astrologiopas',
  closeAria: 'Sulje',
  freeBadge: (n) => `${n} ${n === 1 ? 'ilmainen' : 'ilmaista'}`,
  questionsCount: (n) => `${n} ${n === 1 ? 'kysymys' : 'kysymystä'}`,
  freeInline: (n) => `· ${n} ${n === 1 ? 'ilmainen' : 'ilmaista'}`,
  empty: {
    exhaustedTitle: 'Kysymyksesi ovat loppuneet',
    exhaustedBody: (packCredits) =>
      `Lisää uusi paketti (${packCredits} kysymystä), niin voit jatkaa syntymäkarttasi tutkimista.`,
    introTitle: 'Henkilökohtainen astrologiopasi',
    introBody:
      'Esitä kysymyksiä syntymäkartastasi. Jos olet ostanut parin synastrian tai kuukauden transiitit, voit kysyä myös niistä: vastaukset perustuvat aina sinun omiin astrologisiin tietoihisi.',
    howTitle: 'Näin se toimii',
    howSteps: [
      'Kirjoita kysymys alle vapaasti tai ehdotusten pohjalta.',
      'Vastaus tulee muutaman tunnin sisällä työaikoina.',
      'Luet sen täältä ja sähköpostistasi.',
    ],
    firstQuestions: 'Ensimmäiset 2 kysymystä',
    free: 'Ilmaisia ✦',
    additional: 'Lisäkysymykset',
    additionalValue: (packCredits, priceLabel) =>
      `${packCredits} lisäkysymystä hintaan ${priceLabel}`,
  },
  composer: {
    genericChips: [
      'Minkälaisen kiintymysmallin olen kantanut mukanani lapsuudesta asti?',
      'Mitä osaa itsestäni vältän katsomasta juuri nyt?',
    ],
    sectionChips: {
      identity: [
        'Mikä puoli identiteetissäni on syvimmällä ja vähiten muiden nähtävissä?',
        'Mikä syntymäkartassani selittää tarpeeni tuntea olevani erilainen kuin muut?',
      ],
      emotions: [
        'Miksi jotkin tunteet vyöryvät ylitseni, vaikka toisia tuskin tunnen?',
        'Mitä piilee taipumukseni takana vetäytyä kuoreeni, kun minulla on oikeasti paha olla?',
      ],
      emotions_relationships: [
        'Mikä tunnehaava aktivoituu yhä uudelleen läheisissä ihmissuhteissani?',
        'Miksi kaipaan usein sitä, joka pitää minut etäällä?',
      ],
      relationships: [
        'Mikä kiintymysmalli toistuu tärkeimmissä suhteissani?',
        'Mitä todella etsin kumppanista sen lisäksi, mitä sanon etsiväni?',
      ],
      blocks_patterns: [
        'Mikä toimintamalli pysäyttää minut juuri kun olen muuttumassa oikeasti?',
        'Mitä suojelen, kun vetäydyn tai sabotoin itseäni?',
      ],
      blocks: [
        'Mitä piilee taipumukseni takana pysähtyä juuri kun asiat alkavat sujua?',
        'Mikä pohjalla piilevä pelko estää minua ottamasta kantaa?',
      ],
      patterns: [
        'Minkä toimintamallin tunnistan, mutta en vielä osaa purkaa?',
        'Mistä tulee vaikeuteni pyytää sitä, mitä tarvitsen?',
      ],
      work: [
        'Millainen työ todella sopii minulle, rahasta ja turvallisuudesta riippumatta?',
        'Miksi tunnen itseni usein uupuneeksi, vaikka teen asioita, joista pidän?',
      ],
      work_direction: [
        'Mitä vältän katsomasta urapolullani?',
        'Mikä suunta sopii minulle, vaikka se pelottaa minua?',
      ],
      advice: [
        'Mistä minun pitäisi päästää irti nyt, jotta uudelle tulee tilaa?',
        'Mihin osaan itsessäni minun kannattaisi keskittyä seuraavina kuukausina?',
      ],
    } as Record<string, string[]>,
    placeholder: 'Kirjoita kysymyksesi…',
    send: 'Lähetä',
    remaining: (n) => `Sinulla on ${n} ${n === 1 ? 'kysymys' : 'kysymystä'} jäljellä.`,
  },
  message: {
    answerUseful: 'Hyödyllinen vastaus',
    answerNotUseful: 'Vastaus ei ollut hyödyllinen',
    commentPlaceholder: 'Mikä ei miellyttänyt?',
    commentSend: 'Lähetä',
    thanksFeedback: 'Kiitos palautteestasi.',
    pending: 'Vastaus tulee seuraavien tuntien aikana.',
    pendingEmail: 'Ilmoitamme siitä myös sähköpostilla.',
    failed: 'Emme onnistuneet luomaan vastausta. Kysymyksesi palautettiin saldoosi, joten voit yrittää uudelleen.',
  },
  buyMore: {
    exhaustedHeadline: 'Olet käyttänyt kaikki kysymyksesi',
    nearEndHeadline: 'Kysymyksesi alkavat loppua',
    exhaustedSub: (packCredits) =>
      `Osta ${packCredits} uutta kysymystä, niin voit jatkaa syntymäkarttasi tutkimista.`,
    nearEndSub: (packCredits) =>
      `Lisää vielä ${packCredits} kysymystä, ettei sinun tarvitse pysähtyä juuri kun pääset vauhtiin.`,
    addHeadline: 'Lisää kysymyksiä oppaaseesi',
    addSub: (packCredits) =>
      `Vielä ${packCredits} kysymystä käytettäväksi milloin haluat, ilman vanhenemisaikaa.`,
    menuItem: (packCredits) => `Osta ${packCredits} kysymystä`,
    balance: (n) => `Nykyinen saldo: ${n} ${n === 1 ? 'kysymys' : 'kysymystä'}.`,
    buyCta: (packCredits, priceLabel) =>
      `Osta ${packCredits} kysymystä · ${priceLabel}`,
  },
  askButton: {
    deepen: (label) => `Syvenny: ${label}`,
    deepenGeneric: 'Syvenny tähän osioon',
    free: 'ilmainen',
  },
  toasts: {
    packActivated: (added) =>
      `Paketti aktivoitu. Sinulla on ${added} ${added === 1 ? 'uusi kysymys' : 'uutta kysymystä'}.`,
    paymentProcessing: 'Maksua käsitellään. Lataa sivu uudelleen muutaman sekunnin kuluttua nähdäksesi uudet kysymyksesi.',
    sendError: 'Lähetyksessä tapahtui virhe.',
    noCredits: (packCredits, priceLabel) =>
      `Kysymyksesi ovat loppuneet. Osta ${packCredits} lisää hintaan ${priceLabel}.`,
    duplicate: 'Olet jo esittänyt tämän kysymyksen äskettäin. Vastaus on keskustelussa (tai tulossa).',
    submitError: 'Emme onnistuneet lähettämään kysymystä. Yritä uudelleen.',
    noUrl: 'URL-osoite ei ole saatavilla',
    checkoutError: 'Emme onnistuneet avaamaan maksusivua. Yritä hetken kuluttua uudelleen.',
    sessionExpired: 'Istuntosi on vanhentunut. Kirjaudu uudelleen sisään ja yritä uudelleen.',
    notAllowed: 'Tämä opas kuuluu toiseen raporttiin. Avaa oikea raportti ja yritä uudelleen.',
    questionTooLong: 'Kysymyksen pituuden on oltava 1–250 merkkiä.',
  },
};

export default astrologyGuide;
