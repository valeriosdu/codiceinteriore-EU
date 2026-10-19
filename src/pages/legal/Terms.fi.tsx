// ⚠️ Käännetty luonnosteksti, juristin tarkistettava ennen julkaisua.
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, MailLink, SiteLink, infoEmail } from "./LegalLayout";

const TermsFi = () => (
  <LegalPage
    seoTitle={`Käyttöehdot — ${MARKET.siteName}`}
    seoDescription={`Sivuston ${MARKET.siteName} käyttöehdot ja tarjottujen digitaalisten palvelujen ehdot.`}
    path="/kayttoehdot"
    backAria="Takaisin"
    heading="Käyttöehdot"
    lastUpdated="Päivitetty viimeksi: 20. elokuuta 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-4">
      Nämä käyttöehdot koskevat sivuston <SiteLink /> käyttöä sekä tuotemerkin {MARKET.siteName} alla tarjottujen
      digitaalisten palvelujen ostamista.
    </p>
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      Vierailemalla sivustolla tai ostamalla yhden tai useamman palvelun käyttäjä vakuuttaa lukeneensa, ymmärtäneensä
      ja hyväksyneensä nämä käyttöehdot.
    </p>

    <Section title="1. Palvelun tarjoaja">
      <p>Palvelua tarjoaa:</p>
      <LegalEntityBox />
      <p>
        Sivustolla käytettävä kauppanimi: <strong>{MARKET.siteName}</strong>
      </p>
      <p>
        Yhteystiedot: <MailLink email={infoEmail} />
      </p>
    </Section>

    <Section title="2. Palvelun kohde">
      <p>
        {MARKET.siteName} tarjoaa maksullisia digitaalisia palveluja, jotka perustuvat henkilökohtaisiin laskelmiin,
        tulkitsevaan astrologiseen sisältöön ja siihen liittyviin lisätoimintoihin.
      </p>
      <p>Palvelut voivat ostetusta tarjouksesta riippuen sisältää:</p>
      <ul>
        <li>henkilökohtaiset astrologiset raportit</li>
        <li>viikoittaista tai jaksoittaista sisältöä</li>
        <li>pääsyn henkilökohtaiselle käyttäjäalueelle</li>
        <li>mahdollista lisäsisältöä</li>
        <li>mahdollisia muita digitaalisia lisätoimintoja, jotka liittyvät ostettuun palveluun</li>
      </ul>
      <p>
        Jollei toisin mainita, palvelut toimitetaan yksinomaan digitaalisessa muodossa, eikä niihin kuulu fyysisten
        tuotteiden toimitusta.
      </p>
    </Section>

    <Section title="3. Palvelun luonne">
      <p>
        Palvelun, jota {MARKET.siteName} tarjoaa, tarkoitus on tiedottaa, tukea itsetutkiskelua ja viihdyttää
        syvällisemmällä tavalla.
      </p>
      <p>Palvelun sisältö:</p>
      <ul>
        <li>ei ole psykologista, psykiatrista tai lääketieteellistä neuvontaa</li>
        <li>ei ole oikeudellista, verotuksellista tai taloudellista neuvontaa</li>
        <li>ei takaa henkilökohtaisia, ihmissuhteisiin, ammatilliseen elämään tai talouteen liittyviä tuloksia</li>
        <li>ei korvaa käyttäjän omaa harkintaa eikä pätevien ammattilaisten tukea</li>
      </ul>
      <p>Käyttäjä vastaa yksin siitä, miten hän käyttää saamaansa sisältöä.</p>
    </Section>

    <Section title="4. Käyttäjää koskevat vaatimukset">
      <p>Käyttääkseen sivustoa tai ostaakseen palveluja käyttäjä vakuuttaa:</p>
      <ul>
        <li>olevansa täysi-ikäinen tai muutoin oikeudellisesti kelpoinen tekemään sitovan sopimuksen</li>
        <li>antavansa totuudenmukaisia, oikeita ja täydellisiä tietoja</li>
        <li>käyttävänsä sivustoa lainmukaisesti ja näiden ehtojen mukaisesti</li>
      </ul>
      <p>Palvelua ei ole tarkoitettu alaikäisille.</p>
    </Section>

    <Section title="5. Käyttäjän antamat tiedot">
      <p>
        Palvelun toimittamiseksi käyttäjän on ehkä annettava henkilötietoja ja tietoja, joita tarvitaan sisällön
        henkilökohtaistamiseen, esimerkiksi:
      </p>
      <ul>
        <li>nimi</li>
        <li>sähköpostiosoite</li>
        <li>syntymäpäivä</li>
        <li>syntymäaika</li>
        <li>syntymäpaikka</li>
        <li>vastaukset kyselyyn tai muihin lomakkeisiin</li>
      </ul>
      <p>Käyttäjä vastaa syöttämiensä tietojen oikeellisuudesta.</p>
      <p>
        {MARKET.siteName} ei vastaa virheistä, viivästyksistä, virheellisestä sisällöstä tai epäjohdonmukaisista
        tuloksista, jotka johtuvat käyttäjän antamista puutteellisista, virheellisistä tai vanhentuneista tiedoista.
      </p>
    </Section>

    <Section title="6. Ostaminen">
      <p>Osto tehdään sivuston kautta tilaushetkellä käytettävissä olevan kassaprosessin mukaisesti.</p>
      <p>Ennen oston viimeistelyä käyttäjä voi nähdä vähintään seuraavat tiedot:</p>
      <ul>
        <li>ostetun palvelun pääominaisuudet</li>
        <li>kokonaishinta</li>
        <li>mitä tarjoukseen kuuluu</li>
        <li>maksutavat</li>
        <li>olennaiset tiedot peruuttamisesta ja digitaalisesta toimituksesta, soveltuvin osin</li>
      </ul>
      <p>
        Sopimus katsotaan tehdyksi, kun maksu on asianmukaisesti valtuutettu ja järjestelmä tai palveluntarjoaja on
        vahvistanut tilauksen.
      </p>
    </Section>

    <Section title="7. Hinnat ja maksut">
      <p>Kaikki sivustolla ilmoitetut hinnat on ilmoitettu ostosivulla mainitussa valuutassa.</p>
      <p>Maksuja voivat käsitellä kolmannet osapuolet, muun muassa:</p>
      <ul>
        <li>Stripe</li>
        <li>PayPal</li>
      </ul>
      <p>
        {MARKET.siteName} ei käsittele maksukortin täydellisiä tietoja itse. Maksupalveluntarjoajat käsittelevät ne
        omien ehtojensa ja tietosuojaselosteidensa mukaisesti.
      </p>
      <p>
        Palveluntarjoaja pidättää oikeuden muuttaa hintoja, tarjouksia, pakettituotteita tai kaupallisia ehtoja
        milloin tahansa. Muutokset eivät koske jo tehtyjä tilauksia.
      </p>
    </Section>

    <Section title="8. Digitaalisen sisällön toimitus">
      <p>Ostetut palvelut toimitetaan digitaalisesti yhdellä tai useammalla seuraavista tavoista:</p>
      <ul>
        <li>näyttäminen sivulla</li>
        <li>lähettäminen sähköpostitse</li>
        <li>pääsy käyttäjäalueen kautta</li>
        <li>käyttäjän profiiliin liitetyn jaksoittaisen sisällön aktivointi</li>
      </ul>
      <p>
        Toimitusajat voivat vaihdella palvelun luonteen, teknisen kuormituksen, annettujen tietojen oikeellisuuden
        sekä mahdollisen automatisoidun käsittelyn tai kolmansien osapuolten palvelujen kanssa tehtävien
        integraatioiden tarpeen mukaan.
      </p>
      <p>
        Jollei toisin mainita, palveluntarjoaja ei takaa välitöntä reaaliaikaista toimitusta, mutta sitoutuu
        toimittamaan palvelun kohtuullisessa ajassa, joka vastaa tuotteen teknistä rakennetta.
      </p>
    </Section>

    <Section title="9. Käyttäjätili">
      <p>
        Jos palveluun kuuluu tilin luominen, käyttäjä vastaa kirjautumistietojensa luottamuksellisuudesta ja kaikesta
        tilinsä kautta tapahtuvasta toiminnasta.
      </p>
      <p>Käyttäjä sitoutuu:</p>
      <ul>
        <li>olemaan jakamatta kirjautumistietojaan kolmansille</li>
        <li>olemaan käyttämättä muiden tilejä</li>
        <li>ilmoittamaan viipymättä luvattomasta pääsystä tai tietoturvaloukkauksesta</li>
      </ul>
      <p>
        Palveluntarjoaja pidättää oikeuden keskeyttää tai rajoittaa pääsyä väärinkäytön, petosepäilyn, näiden ehtojen
        rikkomisen tai palvelun moitteetonta toimintaa vaarantavan toiminnan yhteydessä.
      </p>
    </Section>

    <Section title="10. Peruuttamisoikeus">
      <p>
        Jos käyttäjä ostaa kuluttajana, hän voi vedota peruuttamisoikeuteen laissa säädetyissä tapauksissa.
      </p>
      <p>
        Etäsopimuksissa peruuttamisoikeus on yleensä 14 päivää. Digitaalisen sisällön osalta, jota ei toimiteta
        aineellisella välineellä, peruuttamisoikeus voi kuitenkin raueta, kun:
      </p>
      <ul>
        <li>palvelun suorittaminen on aloitettu peruuttamisajan kuluessa</li>
        <li>käyttäjä on antanut siihen nimenomaisen ennakkosuostumuksensa</li>
        <li>käyttäjä on vahvistanut menettävänsä peruuttamisoikeutensa</li>
        <li>elinkeinonharjoittaja on antanut sopimuksen vahvistuksen laissa vaaditulla tavalla</li>
      </ul>
      <p>
        Jos käyttäjä siis pyytää tai hyväksyy henkilökohtaisen digitaalisen palvelun välittömän aktivoinnin, raportin
        laatimisen tai digitaalisen sisällön välittömän saataville asettamisen, hän hyväksyy, että suorittaminen alkaa
        ennen peruuttamisajan päättymistä, ja tunnustaa laissa säädetyissä rajoissa voivansa menettää
        peruuttamisoikeutensa heti, kun palvelun suorittaminen on aloitettu. Tämä vastaa kuluttajansuojalain 6 luvun
        säännöksiä.
      </p>
    </Section>

    <Section title="11. Hyvitys">
      <p>
        Lakisääteisen peruuttamisen osalta viitataan edellä olevaan kohtaan 10. Näiden tapausten ulkopuolella ja lain
        säännökset huomioiden jo toimitettuja, aktivoituja, henkilökohtaistettuja tai käyttäjän saataville asetettuja
        digitaalisia palveluja ei pääsääntöisesti hyvitetä.
      </p>
      <p>
        <strong>Kaupallinen tyytyväisyystakuu ”rahat takaisin” (14 päivää).</strong> Laissa säädettyjen oikeuksien
        lisäksi palveluntarjoaja antaa vapaaehtoisen kaupallisen takuun: jos käyttäjä katsoo 14 päivän kuluessa
        raportin toimituksesta, että tulkinta on yleispätevä tai ei vastaa annettuja syntymätietoja, hän voi pyytää
        koko maksetun summan takaisin kirjoittamalla osoitteeseen <MailLink email={infoEmail} /> ostoksessa
        käyttämästään sähköpostiosoitteesta.
      </p>
      <p>
        Hyvitys maksetaan sen jälkeen, kun se on myönnetty, samalle maksutavalle, jota ostossa käytettiin, ilman
        kustannuksia käyttäjälle. Takuu on voimassa kerran asiakasta kohden ja koskee yksinomaan syntymäkartan
        tulkinnan ensimmäistä ostoa (myös versiota, johon sisältyy ensimmäinen kuukausi transiitteja). Transiittitilauksen
        myöhemmät uusiutumiset eivät kuulu takuun piiriin, ja niitä koskee jäljempänä oleva kohta 12.
      </p>
      <p>
        Muut tukipyynnöt tai valitukset voi lähettää samaan osoitteeseen tai sivustolla ilmoitettuihin yhteystietoihin.
        Palveluntarjoaja arvioi vilpittömässä mielessä tekniset häiriöt, kaksoismaksut tai sen, ettei palvelua ole
        todellisuudessa toimitettu.
      </p>
    </Section>

    <Section title="12. Tilaukset ja toistuva sisältö">
      <p>Jos ostettuun palveluun sisältyy jaksoittaista sisältöä, toistuva pääsy tai tilausmuoto, sovelletaan seuraavaa:</p>
      <ul>
        <li>toimitusväli, hinta ja olennaiset ominaisuudet ilmoitetaan kyseisellä tarjoussivulla</li>
        <li>käyttäjä vastaa siitä, että tarkistaa ennen tilauksen vahvistamista, onko osto toistuva</li>
        <li>
          palveluntarjoaja voi keskeyttää tai lopettaa palvelun maksun laiminlyönnin tai myöhemmin ilmenevän teknisen
          mahdottomuuden vuoksi
        </li>
      </ul>
      <p>
        Jos toistuva paketti uusiutuu automaattisesti, tästä on ilmoitettava selkeästi kassalla tai tarjoussivulla
        ennen ostoa.
      </p>
    </Section>

    <Section title="13. Palvelun sallittu käyttö">
      <p>
        Käyttäjä saa käyttää ostettua sisältöä vain henkilökohtaisiin, ei-kaupallisiin tarkoituksiin, ellei kirjallisesti
        toisin sovita.
      </p>
      <p>Kiellettyä on:</p>
      <ul>
        <li>sisällön kopioiminen, jäljentäminen, levittäminen tai edelleen myyminen</li>
        <li>raporttien, aineistojen, tulosten, käyttöpolkujen tai suojattujen alueiden järjestelmällinen julkinen jakaminen</li>
        <li>palvelun käyttäminen laittomiin tai vilpillisiin tarkoituksiin tai kolmansien oikeuksia loukkaaviin tarkoituksiin</li>
        <li>teknisten, tietoturvaan liittyvien tai pääsyä rajoittavien suojausten kiertämisyritykset</li>
      </ul>
    </Section>

    <Section title="14. Immateriaalioikeudet">
      <p>
        Kaikki sivuston sisältö ja palvelun kautta toimitettu sisältö, mukaan lukien tekstit, tuotteen rakenne,
        aineistot, käyttöliittymät, graafiset elementit, logot, kauppanimet, jäsennellyt tulokset, ulkoasu ja
        toimituksellinen sisältö, on varattu palveluntarjoajalle tai kullekin oikeudenhaltijalle.
      </p>
      <p>
        Palvelun ostaminen ei siirrä käyttäjälle mitään immateriaalioikeuksia sivustoon tai sisältöön, lukuun ottamatta
        henkilökohtaista ja rajattua oikeutta käyttää ostettua palvelua.
      </p>
    </Section>

    <Section title="15. Palvelun saatavuus">
      <p>
        Palveluntarjoaja pyrkii pitämään sivuston ja palvelut kohtuullisesti saatavilla, mutta ei takaa, että ne ovat
        aina käytettävissä keskeytyksettä, virheittä, viiveittä tai häiriöittä.
      </p>
      <p>Palvelu voidaan keskeyttää, sitä voidaan rajoittaa tai se voi katketa seuraavista syistä:</p>
      <ul>
        <li>huolto</li>
        <li>tekniset päivitykset</li>
        <li>verkko- tai infrastruktuuriongelmat</li>
        <li>tapahtumat, joihin palveluntarjoaja ei kohtuudella voi vaikuttaa</li>
        <li>keskeisten ulkopuolisten toimittajien palvelujen poissaolo</li>
      </ul>
    </Section>

    <Section title="16. Vastuunrajoitus">
      <p>Lain sallimissa rajoissa palveluntarjoaja ei vastaa:</p>
      <ul>
        <li>
          henkilökohtaisista, ihmissuhteisiin liittyvistä tai ammatillisista päätöksistä, jotka käyttäjä tekee saamansa
          sisällön perusteella
        </li>
        <li>välillisistä vahingoista, menetetyistä mahdollisuuksista tai ennakoimattomista vahingoista</li>
        <li>virheistä, jotka johtuvat käyttäjän antamista virheellisistä tiedoista</li>
        <li>
          keskeytyksistä tai häiriöistä, jotka johtuvat ulkopuolisista toimittajista, ulkopuolisista työkaluista,
          tekoälypalveluista, maksupalveluista tai tietoliikenneverkoista
        </li>
        <li>tilapäisestä yhteensopimattomuudesta käyttäjän laitteiden, selainten tai teknisten asetusten kanssa</li>
      </ul>
      <p>
        Sovellettavan kuluttajansuojasääntelyn mukainen pakottava vastuu säilyy ennallaan.
      </p>
    </Section>

    <Section title="17. Tietosuoja ja henkilötiedot">
      <p>
        Käyttäjän henkilötietojen käsittelyä koskee sivustolla julkaistu{" "}
        <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
          Tietosuojaseloste ja evästekäytäntö
        </a>
        , joka on soveltuvin osin olennainen osa sopimussuhdetta.
      </p>
    </Section>

    <Section title="18. Ehtojen muutokset">
      <p>Palveluntarjoaja voi päivittää tai muuttaa näitä käyttöehtoja milloin tahansa.</p>
      <p>
        Muutokset tulevat voimaan sivustolla julkaisun päivämäärästä, jollei toisin mainita. Jo tehtyihin tilauksiin
        sovelletaan pääsääntöisesti ostohetkellä voimassa olleita ehtoja.
      </p>
    </Section>

    <Section title="19. Sovellettava laki ja toimivaltainen tuomioistuin">
      <p>
        Näihin käyttöehtoihin sovelletaan lakia, joka määräytyy kansainvälisen yksityisoikeuden sääntöjen mukaan, sekä
        soveltuvin osin kuluttajansuojan pakottavia säännöksiä.
      </p>
      <p>
        Jos käyttäjä toimii kuluttajana, ne oikeudet säilyvät ennallaan, jotka hänen vakinaisen asuinmaansa pakottavat
        säännökset mahdollisesti hänelle myöntävät.
      </p>
      <p>
        Kaikissa näiden ehtojen tulkintaa, pätevyyttä tai täytäntöönpanoa koskevissa riidoissa toimivaltainen on, jos
        käyttäjä on kuluttaja, tuomioistuin, jonka sovellettava laki pakottavasti määrää.
      </p>
    </Section>

    <Section title="20. Yhteystiedot">
      <p>
        Näitä ehtoja koskevat tiedustelut, tuki ja viestit: <MailLink email={infoEmail} />
      </p>
    </Section>
  </LegalPage>
);

export default TermsFi;
