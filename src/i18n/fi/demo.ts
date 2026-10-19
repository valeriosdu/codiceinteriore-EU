// Demo content shown only in preview (Lovable / ?preview=1), never in
// production. Kept in the catalog for language consistency.

import type { Messages } from '@/i18n';

const demo: Messages['demo'] = {
  userName: 'Elina',
  teaserInsights: [
    {
      title: 'Tapasi astua suhteisiin',
      body: 'Astut suhteisiin intensiteetillä, joka kumpuaa tarpeesta tulla nähdyksi ja ymmärretyksi syvällä tasolla. Se tekee sinusta kykenevän aitoihin siteisiin, mutta myös alttiin pettymyksille, kun toinen ei pysy sinun tunnetahdissasi.',
    },
    {
      title: 'Herkkä kohtasi',
      body: 'On alue, jossa hylätyksi tulemisen pelko limittyy itsenäisyyden kaipuuseen. Kun joku tulee liian lähelle, jokin sinussa vetäytyy, vaikka syvempi osa sinusta kaipaa juuri sitä läheisyyttä.',
    },
    {
      title: 'Toistuva kaavasi',
      body: 'Toistuva kaava liittyy tunneintensiteetin ja todellisen yhteyden sekoittamiseen. Pidät usein sisäistä myrskyä rakkautena ja rauhaa tunteiden puutteena.',
    },
  ],
  fullReport: {
    identity:
      'Syvempi identiteettisi liikkuu kahden asian välillä: vapauden tarpeen ja halun rakentaa jotain vakaata. Aistit maailman suurella herkkyydellä, mutta etsit samalla selkeitä rakenteita, ettet eksyisi omiin tunteisiisi.\n\nTämä raportti on esimerkkiversio, joka on luotu esikatselua varten. Oikea raportti perustuu omiin syntymätietoihisi.',
    emotions:
      'Tunteesi liikkuvat syvinä aaltoina. Opit varhain pidättelemään sitä, mitä tunnet, ettet vaivaisi muita, ja siksi tunnet välillä olevasi etäällä jopa itsestäsi.\n\nEnsimmäinen askel on tunnistaa, että tunteesi eivät ole häiriö vaan kompassi.',
    relationships:
      'Rakkaudessa etsit yhteyttä, joka menee pintaa syvemmälle. Haluat tulla nähdyksi sellaisena kuin todella olet, et vain sen perusteella, mitä näytät.\n\nSiksi panostat joskus paljon muutamaan ihmiseen ja kärsit, kun et saa takaisin samaa intensiteettiä.',
    work:
      'Työssä tarvitset merkityksellisyyden tunnetta. Ei riitä, että teet työsi hyvin: haluat, että sillä, mitä teet, on merkitystä.\n\nKun löydät ympäristön, joka vastaa arvojasi, tuottavuutesi ja luovuutesi vapautuvat yllättävän vahvasti.',
    patterns:
      'Toistat kaavaa, jossa avaudut ensin paljon ja vetäydyt sitten. Se on suojautumisliike, jolla on vanhat juuret.\n\nSen tunnistaminen on jo puoli työtä: kun seuraavan kerran tunnet halua sulkeutua, pysähdy ja kysy itseltäsi, mitä oikeastaan suojelet.',
    blocks:
      'Suurin lukkosi on usein tiedostamaton uskomus, että rakkaus pitää ansaita suorittamalla. Siksi annat paljon ja pyydät vähän.\n\nTämän työstäminen tarkoittaa sen oppimista, että voit ottaa vastaan tuntematta olevasi velkaa.',
    advice:
      '1. Anna itsellesi joka päivä hiljaisia hetkiä, vaikka lyhyitä.\n2. Kun tunnet jännitystä, kysy itseltäsi: ”Mitä minun pitäisi sanoa, mitä en sano?”\n3. Harrasta jotain luovaa ilman tavoitteita.\n4. Muista, että lepääminenkin on tuottavaa.',
    poem:
      'Sinussa on huone,\njota kukaan ei ole koskaan nähnyt.\nEi siksi, että se olisi lukossa,\nvaan siksi, että sinä itse\nolet unohtanut oven.\n\nTänään joku koputtaa.\nSe olet sinä.',
  } as Record<string, string>,
};

export default demo;
