const transits = {
  upsell: {
    errors: {
      noUrl: 'URL-osoite ei ole saatavilla',
      checkout: 'Emme onnistuneet avaamaan maksusivua. Yritä hetken kuluttua uudelleen.',
    },
    ariaActive: 'Kuukauden transiitit käytössä',
    ariaInactive: 'Ota käyttöön kuukausittainen transiittitulkinta',
    activeBadge: 'Käytössä',
    activeTitle: 'Sinulla on tämän kuun transiitit',
    validUntil: 'Voimassa',
    validUntilFallback: 'sisältyvän jakson loppuun',
    activeBody:
      'Pääsysi on voimassa näytettyyn päivään asti. Jos haluat jatkaa sen jälkeenkin, voit tilata kuukausittaisen tulkinnan tai jättää sen tähän.',
    ariaExpired: 'Kuukauden transiitit ovat päättyneet',
    expiredBadge: 'Päättynyt',
    expiredTitle: 'Sinulla ei ole tämän kuun transiitteja',
    validUntilExpired: 'Viimeisin tulkinta voimassa',
    expiredBody:
      'Jo saamasi tulkinnat säilyvät täällä, ja voit lukea ne milloin tahansa. Jatkaaksesi kuluvasta kuusta ota kuukausittainen tulkinta uudelleen käyttöön.',
    ctaExpired: (priceLabel: string) => `Jatka kuukauden transiitteja – ${priceLabel}/kk`,
    kicker: 'Kuukauden transiitit',
    title: 'Olet lukenut syntymäkarttasi. Nyt voit lukea tämän hetken.',
    body: 'Syntymäkartta on sinun perusrakenteesi, joka määräytyy syntyessäsi: se ei muutu. Planeetat sen sijaan liikkuvat joka päivä. Päivittäin ne kulkevat syntymäkarttasi pisteiden (esimerkiksi Aurinkosi, Kuusi ja nouseva merkkisi) kohdalta ja aktivoivat kartan tiettyjä osia sen mukaan, minkä aspektin ne muodostavat.',
    monthlyListTitle: 'Joka kuukausi saat tulkinnan, joka kertoo:',
    monthlyList: [
      'Mitkä syntymäkarttasi alueet ovat jännitteisiä, suotuisia tai paineen alla, ja mitä kannattaa tarkkailla',
      'Kuukauden tärkeät hetket tarkkoine päivämäärineen sekä mihin kannattaa panostaa viikko kerrallaan',
      'Kuinka kauan käynnissä oleva vaihe kestää ja mitä tulee sen jälkeen',
    ],
    ctaActive: (priceLabel: string) => `Jatka kuukausittaisilla transiiteilla – ${priceLabel}/kk`,
    ctaInactive: (priceLabel: string) => `Lue tämän kuun transiitit – ${priceLabel}/kk`,
    renewNoteActive: 'Uusiutuu kuukausittain, peruuta milloin tahansa',
    renewNoteInactive: 'Uusi tulkinta joka kuukausi. Peruuta milloin tahansa.',
    secureNote: 'Turvallinen maksu – pääsy heti',
  },
};

export default transits;
