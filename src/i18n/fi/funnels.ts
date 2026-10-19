import type { FunnelCopy, FunnelSlug } from '@/funnels/registry';

const classica: FunnelCopy = {
  teaser: {
    fallbackInsights: [
      {
        title: 'Et valitse sattumalta',
        body: 'Kiintymisessäsi on tietty muoto: jokin rakenteessasi tunnistaa tietynlaisen intensiteetin jo ennen kuin ehdit ajatella. Kuvio ei ole ihmistyyppi, vaan tapa, jolla syttyt.',
      },
      {
        title: 'Et ole sulkeutunut, vaan suojaat itseäsi',
        body: 'Kun toinen tulee liian lähelle tai etääntyy, jokin sinussa aktivoituu. Se ei ole kylmyyttä eikä ristiriitaisuutta: se on tarkka puolustus, jolla on tehtävä, ei oire, joka pitäisi korjata.',
      },
      {
        title: 'Mitä oikeasti etsit',
        body: 'Kuvion ja puolustuksen alla on selkeä toive, ja sillä on hienovaraisempi muoto kuin sillä, mitä olet oppinut pyytämään. Sen tunnistaminen ei riko kuviota, vaan muuttaa tapaa, jolla elät sen sisällä.',
      },
    ],
    offerHeadline: 'Olet lukenut esikatselun tulkinnastasi.',
    offerSubhead:
      'Lukemasi 3 katkelmaa ovat lyhyitä ja tiiviitä tiivistelmiä. Koko tulkinta antaa sinulle yhden johdonmukaisen kokonaiskuvan syntymäkartastasi kaikilta osin.',
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
        'Jotta ymmärrät selkeämmin tunne-elämäsi, ihmissuhteesi ja perusrakenteesi ja näet, mikä elämässäsi toistuu.',
      features: [
        'Ymmärrät tunne-esteet, puolustukset ja toistuvat dynamiikat ihmisen kielellä, et ammattisanastolla',
        'Näet, miten nämä kuviot vaikuttavat ihmissuhteisiisi, työhösi, omaan suuntaasi ja elämänvalintoihisi',
        'Saat käytännön vinkkejä siihen, mitä kannattaa tarkkailla, vahvistaa tai muuttaa omissa reaktiotavoissasi',
        'Syvennä tulkintaa ilmaiseksi astrologioppaan avulla, joka vastaa kysymyksiisi',
        'Pääsy tulkintaasi heti verkossa ja sähköpostitse',
      ],
    },
    trustBullets: [
      'Jos tulkinta tuntuu yleiseltä tai ei oikeasti kosketa sinua, palautamme rahasi viimeiseen senttiin asti.',
    ],
    faqItems: [
      {
        q: 'Miten tämä eroaa verkosta löytyvistä ilmaisista astrologisista tulkinnoista?',
        a: 'Verkosta löytämäsi ilmaiset tulkinnat pilkkovat usein kaiken erillisiin osiin: yksi merkitys jokaiselle planeetalle, yksi jokaiselle aspektille, yksi jokaiselle huoneelle. Täällä työ on erilaista: syntymäkarttasi luetaan elävänä kokonaisuutena, jossa painotetaan sitä, mikä todella on tärkeää, ja ihmissuhteet, tunteet, esteet ja oma suunta yhdistetään yhdeksi johdonmukaiseksi tulkinnaksi ilman ristiriitoja.',
      },
      {
        q: 'Mitä saan tarkalleen, kun ostan tulkinnan?',
        a: 'Saat täydellisen ja henkilökohtaisen 10-sivuisen tulkinnan syntymäkartastasi, kirjoitettuna selkeällä ja inhimillisellä kielellä. Tulkinta syventyy identiteettiin, tunnedynamiikkaan, ihmissuhteisiin, toistuviin kuvioihin, tärkeimpiin esteisiin ja omaan suuntaasi. Tulkinnan mukana saat myös 2 ilmaista kysymystä astrologioppaalle, jolta voit pyytää syvennystä mihin tahansa raporttisi tai karttasi osaan.',
      },
      {
        q: 'Mikä on tulkinnan mukana tuleva astrologiopas?',
        a: 'Kun olet lukenut raporttisi, voit esittää oppaalle henkilökohtaisia kysymyksiä mistä tahansa syntymäkarttasi osa-alueesta tai elämäntilanteestasi juuri nyt. Opas muodostaa vastauksen syntymätietojesi ja jo saamasi tulkinnan pohjalta ja toimittaa sen seuraavien tuntien kuluessa henkilökohtaiseen tilaasi ja sähköpostiisi. Koko tulkinnan mukana tulee 2 ilmaista kysymystä, ja voit syventää aihetta lisää ostamalla lisäkysymyspaketteja suoraan raportistasi.',
      },
      {
        q: 'Miten koko tulkinta luodaan?',
        a: 'Antamistasi syntymätiedoista lasketaan astrologinen syntymäkarttasi. Tämän pohjalta muotoutuu koko tulkinta, jossa käytetään tietokoneavusteista käsittelyä, joka perustuu laajaan ja jäsenneltyyn astrologiseen ja psykologiseen tietämykseen. Näin monia tietoja voidaan yhdistää toisiinsa ja muuttaa selkeäksi, johdonmukaiseksi ja henkilökohtaiseksi tulkinnaksi, joka eroaa verkosta löytyvistä yleisistä ja hajanaisista sisällöistä.',
      },
      {
        q: 'Täytyykö minun tuntea astrologiaa ymmärtääkseni tulkintaa?',
        a: 'Ei. Tulkinta on kirjoitettu niin, että sen ymmärtää, vaikka et olisi koskaan opiskellut astrologiaa. Mukana voi olla astrologisia viittauksia, mutta ne käännetään aina konkreettisiksi, psykologisiksi ja ihmissuhteisiin liittyviksi merkityksiksi.',
      },
      {
        q: 'Mikä ero on koko tulkinnalla ja tarjouksella, johon sisältyvät ensimmäisen kuukauden transiitit?',
        a: 'Koko tulkinta syventyy henkilökohtaiseen perusrakenteeseesi: tunteisiin, ihmissuhteisiin, valintoihin, esteisiin ja toistuviin kuvioihin syntymäkartastasi lähtien. Se on pysyvämpi tulkinta, joka liittyy siihen, mikä pyrkii toistumaan ajan mittaan. Ensimmäisen kuukauden sisältävä tarjous lisää viikoittaiset transiitit: tulkinnan siitä, miten kyseisen ajanjakson astrologiset liikkeet voivat aktivoida tiettyjä osia henkilökohtaisesta kartastasi ja auttaa sinua ymmärtämään paremmin hetkeä, jota elät juuri nyt. Lyhyesti: raportti selittää rakenteesi, transiitit näyttävät, miten sama rakenne liikkuu nykyhetkessä. Mukana on myös henkilökohtainen muutosruno lahjana.',
      },
      {
        q: 'Milloin saan pääsyn tulkintaan?',
        a: 'Heti oston jälkeen. Kun maksu on tehty, voit aktivoida henkilökohtaisen pääsysi ja lukea raportin omalla alueellasi ja sähköpostitse.',
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
        body: 'Se, mikä sinua jarruttaa, ei ole tahdon puutetta. Se on suojaus, jonka olet oppinut rakentamaan – aikanaan hyödyllinen. Nyt se pitää sinut paikallasi, ja sen toiminnan ymmärtäminen auttaa sinua lakkaamaan olemasta sen armoilla.',
      },
      {
        title: 'Et ole myöhässä, sinulla on vain toinen rytmi',
        body: 'Tunnet olevasi myöhässä, koska vertaat itseäsi muiden aikatauluun. Mutta sinun rytmisi on erilainen: siinä on pidempiä taukoja, odottamattomia uudelleenkäynnistyksiä ja hetkiä, jolloin mitään ei tunnu tapahtuvan. Sen ymmärtäminen muuttaa tapaa, jolla näet itsesi.',
      },
      {
        title: 'Mikä sinut oikeasti vapauttaa',
        body: 'Kyse ei ole motivaatiosta. Lähdet liikkeelle, kun ympärilläsi on tietyt tarkat olosuhteet – sellaiset, jotka sopivat juuri sinulle, eivät ne, jotka toimivat muille. Syntymäkarttasi kertoo, mitkä ne ovat.',
      },
    ],
    offerHeadline: 'Olet lukenut esikatselun tulkinnastasi.',
    offerSubhead:
      'Nämä 3 kohtaa ovat tarkoituksella lyhyitä ja tiiviitä tiivistelmiä. Syntymäkarttasi on paljon laajempi. Koko tulkinta käy kaiken läpi perusteellisesti ja yhdistää eri puolet toisiinsa: mikä sinua oikeasti estää (ja mitä este suojaa), missä olosuhteissa pääset liikkeelle, ja oletko todella myöhässä vai seuraatko vain omaa luonnollista aikatauluasi. Noin 10 sivua selkeällä suomella, joita voit lukea uudelleen aina tarvittaessa.',
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
        'Jotta ymmärrät, miksi et pääse liikkeelle niin kuin haluaisit, mikä oikeasti saa sinut liikkeelle ja mitä syvää rytmiä jo noudatat. Kirjoitettu selkeästi, ihmisen kielellä.',
      features: [
        'Ymmärrät, mikä sinua estää ja mitä este suojaa',
        'Tunnistat olosuhteet, joissa pääset liikkeelle ja lähdet oikeasti käyntiin',
        'Näet oman rytmisi: milloin kannattaa painaa ja milloin pysähtyä',
        'Syvennä tulkintaa astrologioppaan avulla, joka vastaa kysymyksiisi, 2 syventävää kysymystä mukana',
        'Pääsy tulkintaasi heti verkossa ja sähköpostitse',
      ],
    },
    trustBullets: [
      'Jos tulkinta tuntuu yleiseltä tai ei oikeasti kosketa sinua, palautamme rahasi viimeiseen senttiin asti.',
      'Yksi johdonmukainen kokonaiskuva, joka yhdistää esteet, kuviot, liikkeelle lähdön ja oman suunnan.',
      'Siksi lopussa kokonaiskuva on selkeä ja johdonmukainen.',
    ],
    faqItems: [
      {
        q: 'Miten tämä eroaa verkosta löytyvistä ilmaisista astrologisista tulkinnoista?',
        a: 'Verkon ilmaiset tulkinnat pilkkovat kaiken erillisiin osiin: yksi merkitys jokaiselle planeetalle, yksi jokaiselle aspektille, yksi jokaiselle huoneelle. Täällä työ on erilaista: syntymäkarttasi luetaan elävänä kokonaisuutena, jossa painotetaan sitä, mikä todella on tärkeää, ja identiteetti, tunteet, esteet, kuviot ja oma suunta yhdistetään yhdeksi johdonmukaiseksi tulkinnaksi ilman ristiriitoja.',
      },
      {
        q: 'Mitä saan tarkalleen, kun ostan tulkinnan?',
        a: 'Saat täydellisen ja henkilökohtaisen 10-sivuisen tulkinnan syntymäkartastasi, kirjoitettuna selkeällä ja inhimillisellä kielellä. Tulkinta syventyy identiteettiin, tunnedynamiikkaan, tärkeimpiin esteisiin, toistuviin kuvioihin, siihen, mikä sinut oikeasti vapauttaa, ja syvään rytmiisi. Tulkinnan mukana saat myös 2 ilmaista kysymystä astrologioppaalle, jolta voit pyytää syvennystä mihin tahansa raporttisi tai karttasi osaan.',
      },
      {
        q: 'Mikä on tulkinnan mukana tuleva astrologiopas?',
        a: 'Kun olet lukenut raporttisi, voit esittää oppaalle henkilökohtaisia kysymyksiä mistä tahansa syntymäkarttasi osa-alueesta tai elämäntilanteestasi juuri nyt. Opas muodostaa vastauksen syntymätietojesi ja jo saamasi tulkinnan pohjalta ja toimittaa sen seuraavien tuntien kuluessa henkilökohtaiseen tilaasi ja sähköpostiisi. Koko tulkinnan mukana tulee 2 ilmaista kysymystä, ja voit syventää aihetta lisää ostamalla lisäkysymyspaketteja suoraan raportistasi.',
      },
      {
        q: 'Miten koko tulkinta luodaan?',
        a: 'Antamistasi syntymätiedoista lasketaan astrologinen syntymäkarttasi. Tämän pohjalta muotoutuu koko tulkinta, jossa käytetään tietokoneavusteista käsittelyä, joka perustuu laajaan ja jäsenneltyyn astrologiseen ja psykologiseen tietämykseen. Näin monia tietoja voidaan yhdistää toisiinsa ja muuttaa selkeäksi, johdonmukaiseksi ja henkilökohtaiseksi tulkinnaksi, joka eroaa verkosta löytyvistä yleisistä ja hajanaisista sisällöistä.',
      },
      {
        q: 'Täytyykö minun tuntea astrologiaa ymmärtääkseni tulkintaa?',
        a: 'Ei. Tulkinta on kirjoitettu niin, että sen ymmärtää, vaikka et olisi koskaan opiskellut astrologiaa. Mukana voi olla astrologisia viittauksia, mutta ne käännetään aina konkreettisiksi ja psykologisiksi merkityksiksi.',
      },
      {
        q: 'Mikä ero on koko tulkinnalla ja tarjouksella, johon sisältyvät ensimmäisen kuukauden transiitit?',
        a: 'Koko tulkinta syventyy henkilökohtaiseen perusrakenteeseesi: tunteisiin, esteisiin, kuvioihin ja suuntaan syntymäkartastasi lähtien. Se on pysyvämpi tulkinta, joka liittyy siihen, mikä pyrkii toistumaan ajan mittaan. Ensimmäisen kuukauden sisältävä tarjous lisää viikoittaiset transiitit: tulkinnan siitä, miten kyseisen ajanjakson astrologiset liikkeet voivat aktivoida tiettyjä osia henkilökohtaisesta kartastasi ja auttaa sinua ymmärtämään paremmin hetkeä, jota elät juuri nyt. Lyhyesti: raportti selittää rakenteesi, transiitit näyttävät, miten sama rakenne liikkuu nykyhetkessä. Mukana on myös henkilökohtainen muutosruno lahjana.',
      },
      {
        q: 'Milloin saan pääsyn tulkintaan?',
        a: 'Heti oston jälkeen. Kun maksu on tehty, voit aktivoida henkilökohtaisen pääsysi ja lukea raportin omalla alueellasi ja sähköpostitse.',
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
