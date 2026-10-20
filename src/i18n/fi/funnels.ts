import type { FunnelCopy, FunnelSlug } from '@/funnels/registry';

const classica: FunnelCopy = {
  teaser: {
    fallbackInsights: [
      {
        title: 'Et valitse sattumalta',
        body: 'Sinulla on oma, tarkka tapasi kiintyä: jokin sinussa tunnistaa tietynlaisen voimakkuuden, jo ennen kuin ehdit ajatella. Kuvio ei ole tietty ihmistyyppi vaan tapa, jolla itse sytyt.',
      },
      {
        title: 'Et ole sulkeutunut, vaan suojaat itseäsi',
        body: 'Kun toinen tulee liian lähelle tai etääntyy, jokin sinussa herää. Se ei ole kylmyyttä eikä ristiriitaisuutta: se on tarkka puolustus, jolla on tehtävä, ei vika, joka pitäisi korjata.',
      },
      {
        title: 'Mitä oikeasti etsit',
        body: 'Kuvion ja puolustuksen alla on selvä toive, joka on hienovaraisempi kuin se, mitä olet oppinut pyytämään. Sen tunnistaminen ei riko kuviota, vaan muuttaa tapaasi elää sen sisällä.',
      },
    ],
    offerHeadline: 'Luit juuri esikatselun tulkinnastasi.',
    offerSubhead:
      'Lukemasi kolme katkelmaa ovat lyhyitä tiivistelmiä. Koko tulkinta kokoaa syntymäkarttasi kaikki osa-alueet yhdeksi johdonmukaiseksi kokonaiskuvaksi.',
    reportSectionsList: [
      'Syvä identiteetti',
      'Tunnedynamiikka',
      'Ihmissuhteet ja rakkaus',
      'Työ ja suunta',
      'Toistuvat kuviot ja esteet',
      'Käytännön neuvot',
    ],
    baseOffer: {
      promise:
        'Ymmärrät selkeämmin tunne-elämääsi, ihmissuhteitasi ja perusrakennettasi ja näet, mikä elämässäsi toistuu.',
      features: [
        'Ymmärrät tunne-elämäsi solmukohdat, puolustuskeinosi ja toistuvat kuviosi arkikielellä, ilman ammattisanastoa',
        'Näet, miten nämä kuviot vaikuttavat ihmissuhteisiisi, työhösi, omaan suuntaasi ja elämänvalintoihisi',
        'Saat käytännön vinkkejä siitä, mitä kannattaa tarkkailla, vahvistaa tai muuttaa omissa reaktiotavoissasi',
        'Voit syventää tulkintaa maksutta astrologioppaan avulla: se vastaa kysymyksiisi',
        'Tulkinta heti luettavissa verkossa ja sähköpostissa',
      ],
    },
    trustBullets: [
      'Jos tulkinta tuntuu ylimalkaiselta tai ei oikeasti kosketa sinua, palautamme rahasi viimeistä senttiä myöten.',
    ],
    faqItems: [
      {
        q: 'Miten tämä eroaa verkosta löytyvistä ilmaisista astrologisista tulkinnoista?',
        a: 'Verkosta löytämäsi ilmaiset tulkinnat pilkkovat usein kaiken erillisiin osiin: yksi merkitys jokaiselle planeetalle, yksi jokaiselle aspektille, yksi jokaiselle huoneelle. Me teemme toisin: syntymäkarttasi luetaan elävänä kokonaisuutena, jossa painotetaan sitä, mikä todella on tärkeää, ja ihmissuhteet, tunteet, esteet ja oma suunta yhdistetään yhdeksi johdonmukaiseksi tulkinnaksi ilman ristiriitoja.',
      },
      {
        q: 'Mitä tarkalleen saan, kun ostan tulkinnan?',
        a: 'Saat syntymäkartastasi kattavan, henkilökohtaisen 10-sivuisen tulkinnan, joka on kirjoitettu selkeällä ja helposti lähestyttävällä kielellä. Tulkinta syventyy identiteettiin, tunnedynamiikkaan, ihmissuhteisiin, toistuviin kuvioihin, tärkeimpiin esteisiin ja omaan suuntaasi. Tulkinnan mukana saat myös 2 ilmaista kysymystä astrologioppaalle, jolta voit pyytää lisäselvitystä mistä tahansa raporttisi tai karttasi kohdasta.',
      },
      {
        q: 'Mikä on tulkinnan mukana tuleva astrologiopas?',
        a: 'Kun olet lukenut raporttisi, voit esittää oppaalle henkilökohtaisia kysymyksiä mistä tahansa syntymäkarttasi osa-alueesta tai elämäntilanteestasi juuri nyt. Opas muodostaa vastauksen syntymätietojesi ja jo saamasi tulkinnan pohjalta ja toimittaa sen muutaman tunnin kuluessa omalle tilillesi ja sähköpostiisi. Koko tulkinnan mukana tulee 2 ilmaista kysymystä, ja voit jatkaa ostamalla lisää kysymyspaketteja suoraan raportistasi.',
      },
      {
        q: 'Miten koko tulkinta luodaan?',
        a: 'Antamistasi syntymätiedoista lasketaan ensin syntymäkarttasi. Sen pohjalta koko tulkinta laaditaan tietokoneavusteisesti, laajaa ja jäsenneltyä astrologista ja psykologista tietämystä hyödyntäen. Näin monet tiedot voidaan yhdistää selkeäksi, johdonmukaiseksi ja henkilökohtaiseksi tulkinnaksi – aivan toisenlaiseksi kuin verkon yleiset ja hajanaiset sisällöt.',
      },
      {
        q: 'Täytyykö minun tuntea astrologiaa ymmärtääkseni tulkintaa?',
        a: 'Ei tarvitse. Tulkinta on kirjoitettu niin, että sen ymmärtää, vaikka et olisi koskaan opiskellut astrologiaa. Mukana voi olla astrologisia viittauksia, mutta ne selitetään aina konkreettisesti: mitä ne tarkoittavat psykologisesti ja ihmissuhteissa.',
      },
      {
        q: 'Mikä ero on koko tulkinnalla ja tarjouksella, johon sisältyvät ensimmäisen kuukauden transiitit?',
        a: 'Koko tulkinta syventyy henkilökohtaiseen perusrakenteeseesi syntymäkarttasi pohjalta: tunteisiin, ihmissuhteisiin, valintoihin, esteisiin ja toistuviin kuvioihin. Se kuvaa sitä, mikä sinussa pysyy ja toistuu ajan mittaan. Transiitit sisältävä tarjous lisää tähän kuukauden viikoittaiset transiittitulkinnat: ne kertovat, miten planeettojen liikkeet juuri nyt herättävät tiettyjä osia kartastasi, ja auttavat sinua ymmärtämään hetkeä, jota elät. Lyhyesti sanottuna: raportti selittää rakenteesi, transiitit näyttävät, miten sama rakenne liikkuu nykyhetkessä. Mukana on myös henkilökohtainen muutosruno lahjana.',
      },
      {
        q: 'Milloin pääsen lukemaan tulkinnan?',
        a: 'Heti oston jälkeen. Kun maksu on mennyt läpi, aktivoit tilisi ja voit lukea raportin omalla tililläsi ja sähköpostista.',
      },
    ],
  },
  report: {
    sections: {
      identity: { label: 'Identiteetti', title: 'Syvä identiteetti' },
      emotions: { label: 'Tunteet', title: 'Tunnedynamiikka' },
      relationships: { label: 'Suhteet', title: 'Ihmissuhteet ja rakkaus' },
      work: { label: 'Työ', title: 'Työ ja suunta' },
      patterns_blocks: { label: 'Kuviot', title: 'Toistuvat kuviot ja esteet' },
      advice: { label: 'Neuvot', title: 'Käytännön neuvot' },
      poem: { label: 'Runo', title: 'Muutosruno' },
    },
  },
};

const attivazione: FunnelCopy = {
  teaser: {
    fallbackInsights: [
      {
        title: 'Kyse ei ole laiskuudesta',
        body: 'Se, mikä sinua jarruttaa, ei ole tahdonvoiman puutetta. Se on suojakeino, jonka opit aikanaan ja joka silloin auttoi. Nyt se pitää sinut paikallasi. Kun ymmärrät, miten se toimii, se ei enää määrää tahtiasi.',
      },
      {
        title: 'Et ole myöhässä, kuljet omaa tahtiasi',
        body: 'Tunnet olevasi myöhässä, koska vertaat itseäsi muiden aikatauluun. Mutta sinun rytmisi on erilainen: siinä on pidempiä taukoja, yllättäviä uusia alkuja ja hetkiä, jolloin mitään ei tunnu tapahtuvan. Sen ymmärtäminen muuttaa tapaa, jolla näet itsesi.',
      },
      {
        title: 'Mikä saa sinut oikeasti liikkeelle',
        body: 'Kyse ei ole motivaatiosta. Lähdet liikkeelle, kun ympärilläsi on tietyt olosuhteet – sellaiset, jotka sopivat juuri sinulle, eivät ne, jotka toimivat muille. Syntymäkarttasi kertoo, mitkä ne ovat.',
      },
    ],
    offerHeadline: 'Luit juuri esikatselun tulkinnastasi.',
    offerSubhead:
      'Nämä kolme kohtaa ovat tarkoituksella lyhyitä tiivistelmiä. Syntymäkarttasi on paljon laajempi. Koko tulkinta käy kaiken läpi perusteellisesti ja yhdistää eri puolet toisiinsa: mikä sinua oikeasti estää (ja mitä este suojaa), missä olosuhteissa pääset liikkeelle ja oletko todella myöhässä vai seuraatko vain omaa luonnollista aikatauluasi. Noin 10 sivua selkeällä suomella – palaa niihin aina, kun tarvitset.',
    reportSectionsList: [
      'Syvä identiteetti',
      'Tunnedynamiikka',
      'Tärkeimmät esteet',
      'Toistuvat kuviot',
      'Liikkeelle lähdön edellytykset',
      'Oma rytmisi',
    ],
    baseOffer: {
      promise:
        'Ymmärrät, miksi et pääse liikkeelle niin kuin haluaisit, mikä sinut oikeasti saa käyntiin ja millaista omaa rytmiä jo seuraat. Selkeästi ja arkikielellä kirjoitettu.',
      features: [
        'Ymmärrät, mikä sinua estää ja mitä este suojaa',
        'Tunnistat olosuhteet, joissa pääset oikeasti käyntiin',
        'Näet oman rytmisi: milloin kannattaa painaa kaasua ja milloin pysähtyä',
        'Voit syventää tulkintaa astrologioppaan avulla: kaksi kysymystä sisältyy hintaan',
        'Tulkinta heti luettavissa verkossa ja sähköpostissa',
      ],
    },
    trustBullets: [
      'Jos tulkinta tuntuu ylimalkaiselta tai ei oikeasti kosketa sinua, palautamme rahasi viimeistä senttiä myöten.',
      'Yksi johdonmukainen kokonaiskuva, joka yhdistää esteet, kuviot, liikkeelle lähdön ja oman suunnan.',
      'Siksi lopputulos on selkeä ja helppo hahmottaa.',
    ],
    faqItems: [
      {
        q: 'Miten tämä eroaa verkosta löytyvistä ilmaisista astrologisista tulkinnoista?',
        a: 'Verkon ilmaiset tulkinnat pilkkovat kaiken erillisiin osiin: yksi merkitys jokaiselle planeetalle, yksi jokaiselle aspektille, yksi jokaiselle huoneelle. Me teemme toisin: syntymäkarttasi luetaan elävänä kokonaisuutena, jossa painotetaan sitä, mikä todella on tärkeää, ja identiteetti, tunteet, esteet, kuviot ja oma suunta yhdistetään yhdeksi johdonmukaiseksi tulkinnaksi ilman ristiriitoja.',
      },
      {
        q: 'Mitä tarkalleen saan, kun ostan tulkinnan?',
        a: 'Saat syntymäkartastasi kattavan, henkilökohtaisen 10-sivuisen tulkinnan, joka on kirjoitettu selkeällä ja helposti lähestyttävällä kielellä. Tulkinta syventyy identiteettiin, tunnedynamiikkaan, tärkeimpiin esteisiin, toistuviin kuvioihin, siihen, mikä saa sinut oikeasti liikkeelle, sekä omaan rytmiisi. Tulkinnan mukana saat myös 2 ilmaista kysymystä astrologioppaalle, jolta voit pyytää lisäselvitystä mistä tahansa raporttisi tai karttasi kohdasta.',
      },
      {
        q: 'Mikä on tulkinnan mukana tuleva astrologiopas?',
        a: 'Kun olet lukenut raporttisi, voit esittää oppaalle henkilökohtaisia kysymyksiä mistä tahansa syntymäkarttasi osa-alueesta tai elämäntilanteestasi juuri nyt. Opas muodostaa vastauksen syntymätietojesi ja jo saamasi tulkinnan pohjalta ja toimittaa sen muutaman tunnin kuluessa omalle tilillesi ja sähköpostiisi. Koko tulkinnan mukana tulee 2 ilmaista kysymystä, ja voit jatkaa ostamalla lisää kysymyspaketteja suoraan raportistasi.',
      },
      {
        q: 'Miten koko tulkinta luodaan?',
        a: 'Antamistasi syntymätiedoista lasketaan ensin syntymäkarttasi. Sen pohjalta koko tulkinta laaditaan tietokoneavusteisesti, laajaa ja jäsenneltyä astrologista ja psykologista tietämystä hyödyntäen. Näin monet tiedot voidaan yhdistää selkeäksi, johdonmukaiseksi ja henkilökohtaiseksi tulkinnaksi – aivan toisenlaiseksi kuin verkon yleiset ja hajanaiset sisällöt.',
      },
      {
        q: 'Täytyykö minun tuntea astrologiaa ymmärtääkseni tulkintaa?',
        a: 'Ei tarvitse. Tulkinta on kirjoitettu niin, että sen ymmärtää, vaikka et olisi koskaan opiskellut astrologiaa. Mukana voi olla astrologisia viittauksia, mutta ne selitetään aina konkreettisesti ja psykologisesti.',
      },
      {
        q: 'Mikä ero on koko tulkinnalla ja tarjouksella, johon sisältyvät ensimmäisen kuukauden transiitit?',
        a: 'Koko tulkinta syventyy henkilökohtaiseen perusrakenteeseesi syntymäkarttasi pohjalta: tunteisiin, esteisiin, kuvioihin ja suuntaan. Se kuvaa sitä, mikä sinussa pysyy ja toistuu ajan mittaan. Transiitit sisältävä tarjous lisää tähän kuukauden viikoittaiset transiittitulkinnat: ne kertovat, miten planeettojen liikkeet juuri nyt herättävät tiettyjä osia kartastasi, ja auttavat sinua ymmärtämään hetkeä, jota elät. Lyhyesti sanottuna: raportti selittää rakenteesi, transiitit näyttävät, miten sama rakenne liikkuu nykyhetkessä. Mukana on myös henkilökohtainen muutosruno lahjana.',
      },
      {
        q: 'Milloin pääsen lukemaan tulkinnan?',
        a: 'Heti oston jälkeen. Kun maksu on mennyt läpi, aktivoit tilisi ja voit lukea raportin omalla tililläsi ja sähköpostista.',
      },
    ],
  },
  report: {
    sections: {
      identity: { label: 'Identiteetti', title: 'Syvä identiteetti' },
      emotions_relationships: { label: 'Dynamiikka', title: 'Tunne- ja ihmissuhdedynamiikka' },
      blocks_patterns: { label: 'Esteet', title: 'Esteet ja toistuvat kuviot' },
      work_direction: { label: 'Työ', title: 'Työ ja suunta' },
      advice: { label: 'Neuvot', title: 'Käytännön neuvot' },
      poem: { label: 'Runo', title: 'Muutosruno' },
    },
  },
};

const funnels: Record<FunnelSlug, FunnelCopy> = {
  classica,
  attivazione,
};

export default funnels;
