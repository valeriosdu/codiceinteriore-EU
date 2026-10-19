const social = {
  testimonials: {
    kicker: 'Kokemuksia',
    heading: 'Mikä jäi asiakkaillemme eniten mieleen',
    items: [
      {
        text: 'Odotin jotain yleistä. Sen sijaan monessa kohdassa kuvaus osui niin tarkasti, että se oli melkein epämukavaa.',
        name: 'Aino K.',
        age: 31,
      },
      {
        text: 'Eron ilmaisiin tulkintoihin netissä huomaa heti. Täällä ei ole irrallisia lauseita: on punainen lanka ja rakenne. Lopussa sinulla on todella kokonaisvaltaisempi kuva siitä, miten toimit ja mitä kannattaa tehdä.',
        name: 'Sanna M.',
        age: 39,
      },
      {
        text: 'Pidin siitä, koska se ei yritä ennustaa kaikkea. Se auttaa pikemminkin ymmärtämään, mikä toistuu, missä jumiudut, millaisessa kuviossa olet juuri nyt ja mitä voit tehdä.',
        name: 'Johanna H.',
        age: 33,
      },
      {
        text: 'Pelkäsin, että tulkinta on tehty kertomaan kaikille kivoja asioita. Ei se ollut: varsinkin ihmissuhdeosiossa tunsin tulleeni oikeasti nähdyksi.',
        name: 'Satu L.',
        age: 35,
      },
      {
        text: 'Koko raportti auttoi minua ymmärtämään rakenteen, jonka osittain jo aavistin, mutta en näin selkeästi... Loppu sai minut yhdistämään kaiken siihen, mitä elän juuri nyt. Suosittelen ostamaan.',
        name: 'Emilia R.',
        age: 24,
      },
    ],
  },
  // fi shows the English report screenshots (see ReportPreviewCarousel), so
  // slideAlts follow the en order and section list.
  reportPreview: {
    aria: 'Esikatselu koko raportista',
    slideAlts: [
      'Esikatselu koko Carta Interior -raportista',
      'Ote osiosta Syvä identiteetti',
      'Ote osiosta Tunnedynamiikka',
      'Ote osiosta Ihmissuhteet ja rakkaus',
      'Ote osiosta Työ ja suunta',
      'Ote osiosta Toistuvat kuviot ja esteet',
      'Ote osiosta Käytännön neuvot',
      'Ote muutosrunosta',
    ],
    zoomAria: (alt: string) => `Suurenna: ${alt}`,
    prevSlide: 'Edellinen dia',
    nextSlide: 'Seuraava dia',
    goToSlide: (n: number) => `Siirry diaan ${n}`,
    note: 'Englanninkielinen esimerkkiote. Saamasi koko raportti perustuu omiin syntymätietoihisi ja on noin 10 sivun pituinen.',
    zoomedAria: 'Suurennettu esikatselu',
    closePreview: 'Sulje esikatselu',
    prevImage: 'Edellinen kuva',
    nextImage: 'Seuraava kuva',
    escHint: 'Napauta sen ulkopuolelle tai paina ESC sulkeaksesi',
  },
};

export default social;
