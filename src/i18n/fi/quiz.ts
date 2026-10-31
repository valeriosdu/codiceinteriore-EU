import type { Messages } from '@/i18n';

const quiz: Messages['quiz'] = {
  months: [
    'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
    'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu',
  ],
  birthDateLabel: (day: number, month: number, year: number) => `${day}.${month}.${year}`,
  stepOf: (current: number, total: number) => `${current} / ${total}`,
  steps: {
    intent: {
      question: 'Mitä haluaisit ymmärtää eniten?',
      options: [
        'Miten toimin rakkaudessa ja suhteissa',
        'Mikä minua jarruttaa ja missä voin kasvaa',
        'Kokonaiskuva itsestäni',
      ],
    },
    attachment: {
      question: {
        self: 'Miten reagoit vaistomaisesti, kun joku etääntyy tai alkaa olla epämääräinen?',
        other: 'Miten hän reagoi vaistomaisesti, kun joku etääntyy tai alkaa olla epämääräinen?',
      },
      options: {
        self: [
          'Haen lisää yhteyttä',
          'Vetäydyn ja otan etäisyyttä',
          'Jään odottamaan merkkiä',
        ],
        other: [
          'Hakee lisää yhteyttä',
          'Vetäytyy ja ottaa etäisyyttä',
          'Jää odottamaan merkkiä',
        ],
      },
    },
    symptom: {
      question: 'Mitä tunnet useimmin, kun katsot elämääsi nyt?',
      options: [
        'Tuntuu, että minulta jää huomaamatta jotain, minkä muut näkevät',
        'Tiedän, mitä pitäisi tehdä, mutta en saa sitä tehtyä',
        'Etenen, mutta en sinne, minne haluaisin',
        'Kaikki tuntuu pysähtyneeltä, ei vain sisälläni',
      ],
    },
    bridge: {
      youAnswered: 'Vastasit',
      exampleLabel: 'Havainnollistava esimerkki',
      showsLabel: 'Syntymäkartta voi näyttää sinulle:',
      chartIs:
        'Syntymäkartta on tilannekuva planeettojen asemista syntymähetkelläsi. Se ei ennusta tulevaa, vaan kuvaa perusrakennettasi: mikä sinua sytyttää, mikä jarruttaa ja missä rytmissä toimit.',
      next: 'Tarvitset vain syntymäpäivän, kellonajan ja syntymäpaikan. Ensimmäinen tulkintasi on ilmainen.',
      variants: [
        {
          headline: 'Sinulta ei puutu mitään. Sinulta puuttuu kartta.',
          body: 'Muut eivät näe enempää: he havaitsevat asiat eri tavalla kuin sinä. Sinun havaintotavallasi on selkeä rakenne, ja sen voi lukea.',
          shows: 'miten havainnoit asioita ja mitä suodatat pois huomaamattasi.',
          legend: ['Kuu', 'Merkurius', 'Nouseva merkki'],
        },
        {
          headline: 'Kyse ei ole laiskuudesta eikä tahdonvoiman puutteesta.',
          body: 'Jokaisella on oma tapansa lähteä liikkeelle: toiset syttyvät heti, toiset tarvitsevat ensin tiettyjä olosuhteita. Kun tiedät, mitä itse tarvitset, suhtaudut itseesi toisin.',
          shows: 'oman tapasi lähteä liikkeelle eli sen, mikä sinua sytyttää ja mikä jarruttaa.',
          legend: ['Mars', 'Saturnus', 'Neliö'],
        },
        {
          headline: 'Etenet kyllä. Mutta minne oma rytmisi sinut veisi?',
          body: 'Eteneminen ei riitä, jos suunnan ovat valinneet olosuhteet. Tärkeää on suunta, joka sopii luontoosi, ja kohta, jossa polkusi on poikennut.',
          shows: 'suunnan, joka sopii luontoosi, ja kohdan, jossa polkusi on poikennut.',
          legend: ['MC', 'Kuun solmut'],
        },
        {
          headline: 'Joskus kaikki pysähtyy yhtä aikaa. Yleensä se on vaihe, ei pysyvä tila.',
          body: 'Kun kaikki tuntuu pysähtyneeltä, käyt usein läpi vaihetta, jolla on alku ja loppu. Voit lukea, milloin se alkaa ja milloin se menee ohi.',
          shows: 'omat jaksosi eli milloin vaihe alkaa ja milloin se päättyy.',
          legend: ['Saturnus', 'Jupiter', 'Vaihe'],
        },
      ],
    },
    narrative: {
      question: 'Kun mietit, kuka olisit voinut olla, mitä sinulle tulee mieleen?',
      options: [
        'Vapaampi versio minusta',
        'Täydemmin elävä versio minusta',
        'Varmempi versio minusta, vähemmän epäröivä',
        'Päättäväisempi versio minusta, joka ei jää odottamaan',
      ],
    },
    date: {
      title: { self: 'Syntymäpäiväsi', other: 'Hänen syntymäpäivänsä' },
      day: 'Päivä',
      month: 'Kuukausi',
      year: 'Vuosi',
    },
    time: {
      title: { self: 'Syntymäsi kellonaika', other: 'Hänen syntymänsä kellonaika' },
      hour: 'Tunti',
      minute: 'Minuutit',
      hint: 'Jos et tiedä tarkkaa aikaa, valitse lähin arvio.',
      unknown: {
        label: { self: 'En tiedä syntymäaikaani', other: 'En tiedä hänen syntymäaikaansa' },
        note: 'Käytämme kellonaikaa 12.00: tulkinta pätee silti, mutta nouseva merkki ja huoneet ovat vain suuntaa antavia.',
      },
    },
    place: {
      title: { self: 'Syntymäpaikkasi', other: 'Hänen syntymäpaikkansa' },
      label: 'Syntymäpaikka',
      placeholder: 'esim. Helsinki, Tampere, Turku...',
      hint: 'Valitse paikka ehdotuksista, niin tulkinta on tarkempi.',
      error: 'Emme löytäneet tätä paikkaa. Valitse ehdotus listasta.',
    },
    focus: {
      question: {
        self: 'Mitä ihmissuhdekuvioissasi haluat ymmärtää paremmin?',
        other: 'Mitä hänen ihmissuhdekuvioissaan haluat ymmärtää paremmin?',
      },
      options: {
        self: ['Miten valitset', 'Mitä kuvioita toistat', 'Miten suojaudut', 'Mitä todella etsit'],
        other: ['Miten hän valitsee', 'Mitä kuvioita hän toistaa', 'Miten hän suojautuu', 'Mitä hän todella etsii'],
      },
    },
    name: {
      title: { self: 'Nimesi', other: 'Hänen nimensä' },
      label: 'Nimi',
      placeholder: 'esim. Aino, Eero, Mikko...',
      hint: {
        self: 'Käytämme nimeäsi, jotta tulkinta on henkilökohtainen.',
        other: 'Käytämme hänen nimeään, jotta tulkinta on henkilökohtainen.',
      },
    },
  },
  helper: {
    focus: 'Melkein valmista',
    name: 'Vielä yksi vaihe',
  },
  wheelHint: {
    date: {
      all: 'Selaa tai napauta rullia vahvistaaksesi päivän, kuukauden ja vuoden.',
      some: (fields: string) => `Tarkista vielä: ${fields}.`,
    },
    time: {
      all: 'Selaa tai napauta rullia vahvistaaksesi tunnin ja minuutit.',
      some: (fields: string) => `Tarkista vielä: ${fields}.`,
    },
    fields: {
      day: 'päivä',
      month: 'kuukausi',
      year: 'vuosi',
      hour: 'tunti',
      minute: 'minuutit',
    },
    join: (items: string[]) =>
      items.length > 1 ? items.slice(0, -1).join(', ') + ' ja ' + items[items.length - 1] : (items[0] ?? ''),
  },
  cta: {
    continue: 'Jatka',
    resolvingPlace: 'Tarkistetaan paikkaa…',
    toPayment: 'Siirry maksamaan',
    seeReading: 'Katso tulkintasi',
  },
  back: 'Takaisin',
};

export default quiz;
