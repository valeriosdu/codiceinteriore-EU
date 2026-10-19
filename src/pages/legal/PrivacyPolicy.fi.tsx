// ⚠️ Käännetty luonnosteksti, juristin tarkistettava ennen julkaisua.
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, SubSection, MailLink, SiteLink, privacyEmail } from "./LegalLayout";

const PrivacyPolicyFi = () => (
  <LegalPage
    seoTitle={`Tietosuojaseloste ja evästekäytäntö — ${MARKET.siteName}`}
    seoDescription={`Tietoa siitä, miten ${MARKET.siteName} -sivuston käyttäjien henkilötietoja käsitellään.`}
    path="/privacy"
    backAria="Takaisin"
    heading="Tietosuojaseloste ja evästekäytäntö"
    lastUpdated="Päivitetty viimeksi: 20. elokuuta 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      Tässä selosteessa kerrotaan, miten käsittelemme niiden käyttäjien henkilötietoja, jotka vierailevat sivustolla{" "}
      <SiteLink /> ja käyttävät {MARKET.siteName} -tuotemerkillä tarjottavia palveluja.
    </p>

    <Section title="1. Rekisterinpitäjä">
      <p>Rekisterinpitäjä on:</p>
      <LegalEntityBox />
      <p>
        Kaikissa henkilötietojen käsittelyä koskevissa asioissa voit ottaa yhteyttä osoitteeseen:{" "}
        <MailLink email={privacyEmail} />
      </p>
    </Section>

    <Section title="2. Soveltamisala">
      <p>Tätä selostetta sovelletaan henkilötietojen käsittelyyn seuraavissa yhteyksissä:</p>
      <ul>
        <li>sivusto {MARKET.siteName}</li>
        <li>kysely ja sivut, joilla tietoja kerätään</li>
        <li>kassa ja ostosivut</li>
        <li>mahdolliset yhteydenottolomakkeet</li>
        <li>palveluun liittyvien sähköpostien, viikoittaisen sisällön ja markkinointiviestien lähettäminen</li>
        <li>palveluun mahdollisesti liittyvä oma tili</li>
      </ul>
    </Section>

    <Section title="3. Käsiteltävät tietoryhmät">
      <p>Voimme käsitellä seuraavia henkilötietoryhmiä:</p>
      <SubSection title="a) Tunniste- ja yhteystiedot">
        <ul>
          <li>nimi</li>
          <li>sähköpostiosoite</li>
        </ul>
      </SubSection>
      <SubSection title="b) Palvelun toimittamista varten antamasi tiedot">
        <ul>
          <li>syntymäpäivä</li>
          <li>syntymäaika</li>
          <li>syntymäpaikka</li>
          <li>kyselyssä antamasi vastaukset</li>
          <li>tukipyyntöjen tai yhteydenottolomakkeiden kautta lähettämäsi sisältö</li>
        </ul>
      </SubSection>
      <SubSection title="c) Ostotiedot">
        <ul>
          <li>ostohistoria</li>
          <li>maksun tilaa koskevat tiedot</li>
          <li>maksupalveluntarjoajien välittämät tapahtumatunnisteet</li>
        </ul>
        <p className="text-sm text-muted-foreground italic mt-2">
          Huomaa: rekisterinpitäjä ei itse käsittele maksukorttien täydellisiä tietoja. Niitä käsittelevät käytetyt
          maksupalveluntarjoajat.
        </p>
      </SubSection>
      <SubSection title="d) Tekniset ja selaustiedot">
        <ul>
          <li>IP-osoite</li>
          <li>tekniset lokitiedot</li>
          <li>selaimen, laitteen ja käyttöjärjestelmän tiedot</li>
          <li>evästeiden tai vastaavien tekniikoiden avulla kerätyt tiedot</li>
        </ul>
      </SubSection>
      <SubSection title="e) Markkinointi- ja seurantatiedot">
        <ul>
          <li>analytiikkatyökaluilla kerätyt tiedot</li>
          <li>markkinointievästeiden ja -pikselien, myös uudelleenmarkkinointityökalujen, avulla kerätyt tiedot</li>
        </ul>
      </SubSection>
    </Section>

    <Section title="4. Käsittelyn tarkoitukset">
      <p>Henkilötietoja voidaan käsitellä seuraaviin tarkoituksiin:</p>
      <ul>
        <li>henkilökohtaisen astrologisen raportin toimittaminen</li>
        <li>viikoittaisen sisällön, toistuvien palvelujen tai tilausten toimittaminen</li>
        <li>käyttäjätilin hallinta, jos tili on käytettävissä</li>
        <li>kassan, maksujen ja tilaushistorian hallinta</li>
        <li>
          palveluviestien lähettäminen, esimerkiksi tilausvahvistukset, sisällön avaamiseen liittyvät viestit,
          tukiviestit ja palveluilmoitukset
        </li>
        <li>sähköpostitse tai yhteydenottolomakkeella lähettämiesi pyyntöjen käsittely</li>
        <li>uutiskirjeen ja mainosviestien lähettäminen</li>
        <li>sivuston käyttöä koskevat tilastolliset analyysit</li>
        <li>uudelleenmarkkinointi, uudelleenkohdentaminen ja mainoskampanjoiden mittaaminen</li>
        <li>sivuston turvaaminen, väärinkäytösten estäminen ja järjestelmien tekninen hallinta</li>
      </ul>
    </Section>

    <Section title="5. Käsittelyn oikeusperuste">
      <p>Henkilötietojen käsittely perustuu tapauksesta riippuen seuraaviin oikeusperusteisiin:</p>
      <ul>
        <li>
          <strong>sopimuksen täytäntöönpano</strong> tai sopimuksen tekemistä edeltävät toimenpiteet: raportin
          toimittamiseen, kyselyn käsittelyyn siltä osin kuin se on tarpeen pyydetyn palvelun kannalta, tilin
          hallintaan, ostoihin, maksuihin, palveluviestien lähettämiseen ja asiakastukeen
        </li>
        <li>
          <strong>rekisteröidyn suostumus</strong>: uutiskirjeen ja markkinointiviestien lähettämiseen sekä muiden
          kuin teknisten evästeiden ja seurantatyökalujen käyttöön, silloin kun sovellettava sääntely sitä edellyttää
        </li>
        <li>
          <strong>rekisterinpitäjän oikeutettu etu</strong>: tietoturvaan, rekisterinpitäjän oikeuksien
          puolustamiseen, petosten ehkäisyyn, sivuston tekniseen hallintaan ja palvelujen toimintaa koskeviin,
          koostetietoihin perustuviin analyyseihin lain sallimissa rajoissa
        </li>
      </ul>
    </Section>

    <Section title="6. Tietojen antaminen: pakollista vai vapaaehtoista">
      <p>Pakollisiksi merkityt tiedot on annettava, kun niitä tarvitaan:</p>
      <ul>
        <li>pyydetyn raportin laatimiseen</li>
        <li>oston käsittelyyn</li>
        <li>tilin luomiseen tai hallintaan</li>
        <li>tuen antamiseen</li>
        <li>palveluviestien lähettämiseen</li>
      </ul>
      <p>Jos näitä tietoja ei anneta, palvelua ei välttämättä voida toimittaa.</p>
      <p>
        Markkinointia tai muita kuin välttämättömiä evästeitä varten annettavat tiedot ovat sen sijaan
        vapaaehtoisia. Kieltäytyminen ei estä sivuston selaamista eikä peruspalvelun ostamista, lukuun ottamatta
        teknisesti välttämättömiä rajoituksia.
      </p>
    </Section>

    <Section title="7. Käsittelytavat">
      <p>
        Tietoja käsitellään niiden luonteeseen sopivin sähköisin välinein ja organisatorisin toimenpitein
        lainmukaisuuden, kohtuullisuuden, läpinäkyvyyden, tietojen minimoinnin ja säilytyksen rajoittamisen
        periaatteiden mukaisesti.
      </p>
    </Section>

    <Section title="8. Tietojen vastaanottajat">
      <p>
        Tietoja voidaan luovuttaa tai antaa käsiteltäväksi tahoille, jotka toimivat tapauksesta riippuen
        henkilötietojen käsittelijöinä, itsenäisinä rekisterinpitäjinä tai rekisterinpitäjän valtuuttamina
        henkilöinä.
      </p>
      <p>Tietoja voidaan käsitellä erityisesti seuraavien toimittajien tai toimittajaryhmien kautta:</p>
      <ul>
        <li>hosting-, infrastruktuuri- ja käyttöliittymäpalvelujen toimittajat</li>
        <li>Supabase (tietokanta ja sovellusinfrastruktuuri)</li>
        <li>Stripe ja PayPal (maksujen käsittely)</li>
        <li>Google (teknologiapalvelut ja tarvittaessa käsittely ulkoisilla tekoälymalleilla)</li>
        <li>FreeAstroAPI (palvelun tarvitsemien astrologisten tietojen käsittely)</li>
        <li>Meta (mainostyökalut, pikselit ja uudelleenmarkkinointi)</li>
        <li>Google Analytics (sivuston liikenteen tilastollinen analyysi)</li>
        <li>
          mahdolliset sähköpostin toimituksen, teknisen tuen ja palveluihin liittyvän operatiivisen hallinnan
          toimittajat
        </li>
      </ul>
      <p>Nämä tahot käsittelevät tietoja vain siinä määrin kuin niiden palvelujen tuottaminen edellyttää.</p>
    </Section>

    <Section title="9. Käsittely tekoälytoimittajien ja ulkoisten palvelujen kautta">
      <p>
        Joidenkin palvelun toimintojen toteuttamiseksi kyselyssä antamasi tiedot ja sisällön laatimiseen tarvittavat
        tiedot voidaan lähettää ulkoisille teknologiatoimittajille, mukaan lukien Googlen tekoälypalvelut ja ulkoiset
        astrologiset palvelut.
      </p>
      <p>
        Rekisterinpitäjä noudattaa minimoinnin periaatetta: ulkoisille toimittajille välitetään vain ne tiedot, jotka
        tarvitaan pyydetyn sisällön luomiseen tai kyseisen teknisen toiminnon suorittamiseen.
      </p>
    </Section>

    <Section title="10. Tietojen siirto Euroopan talousalueen ulkopuolelle">
      <p>
        Jotkin käytetyistä teknologiatoimittajista voivat sijaita Euroopan talousalueen ulkopuolella tai käsitellä
        tietoja sen ulkopuolella, myös Yhdysvalloissa tai muissa kolmansissa maissa.
      </p>
      <p>
        Tällaiset siirrot tehdään voimassa olevan lainsäädännön edellyttämällä tavalla, esimerkiksi
        sopimusperusteisin järjestelyin tai muin laissa edellytetyin suojatoimin.
      </p>
      <p>
        Lisätietoja mahdollisista siirroista ja niihin liittyvistä suojatoimista saat kirjoittamalla osoitteeseen{" "}
        <MailLink email={privacyEmail} />.
      </p>
    </Section>

    <Section title="11. Tietojen säilytysaika">
      <p>
        Jollei laissa toisin vaadita, henkilötietoja ei säilytetä pidempään kuin on tarpeen niiden tarkoitusten
        toteuttamiseksi, joita varten ne on kerätty.
      </p>
      <p>Yleisesti:</p>
      <ul>
        <li>
          yhteydenottopyyntöjä koskevia tietoja voidaan säilyttää niin kauan kuin pyynnön käsittely vaatii ja sen
          jälkeen kohtuullisen hallinnollisen ajan
        </li>
        <li>
          ostoja ja sopimussuhdetta koskevia tietoja voidaan säilyttää sopimussuhteen ajan ja sen jälkeen niin kauan
          kuin verotuksellisten ja hallinnollisten velvoitteiden täyttäminen tai oikeuksien puolustaminen edellyttää
        </li>
        <li>
          markkinointiviestinnässä käytettäviä tietoja säilytetään, kunnes peruutat suostumuksesi tai vastustat
          käsittelyä
        </li>
        <li>
          teknisiä tietoja ja lokitietoja säilytetään vain niin kauan kuin järjestelmien toiminta, turvallisuus ja
          analysointi ehdottomasti edellyttävät
        </li>
        <li>
          analytiikkaan ja evästeisiin liittyvien tietojen säilytysaika riippuu kyseisen työkalun asetuksista ja
          tekemistäsi valinnoista
        </li>
      </ul>
    </Section>

    <Section title="12. Evästekäytäntö">
      <p>
        Tämä sivusto käyttää evästeitä ja vastaavia tekniikoita, jotta sivut toimivat oikein, liikennettä voidaan
        analysoida, käyttökokemusta voidaan parantaa ja – tarvittaessa ennalta annetulla suostumuksella – mainoskampanjoita
        voidaan mitata ja uudelleenmarkkinointia toteuttaa.
      </p>
      <SubSection title="12.1 Mitä evästeet ovat">
        <p>
          Evästeet ovat pieniä tekstitiedostoja, joita verkkosivustot lähettävät laitteellesi vierailun aikana. Ne
          voidaan tallentaa ja lähettää takaisin samoille sivustoille seuraavalla vierailulla.
        </p>
        <p>
          Vastaavat tekniikat, kuten pikselit, tagit, skriptit tai tunnisteet, voivat hoitaa samoja tehtäviä
          tietojen keräämisessä tai välittämisessä.
        </p>
      </SubSection>
      <SubSection title="12.2 Käytettävät evästetyypit">
        <p>Sivusto voi käyttää seuraavia evästeluokkia:</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">a) Tekniset tai ehdottoman välttämättömät evästeet</h4>
        <p>Niiden avulla sivusto toimii ja keskeiset toiminnot ovat käytettävissä, esimerkiksi:</p>
        <ul>
          <li>navigointi sivujen välillä</li>
          <li>istunnonhallinta</li>
          <li>sivuston tietoturva</li>
          <li>teknisten asetusten muistaminen</li>
          <li>kassan tai keskeisten osien moitteeton toiminta</li>
        </ul>
        <p>Näihin evästeisiin ei yleensä tarvita suostumusta.</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">b) Analytiikkaevästeet</h4>
        <p>Niillä kerätään tilastotietoa sivuston käytöstä, esimerkiksi:</p>
        <ul>
          <li>kävijämäärä</li>
          <li>katsotut sivut</li>
          <li>liikenteen lähde</li>
          <li>selauskäyttäytyminen</li>
          <li>sivujen suorituskyky</li>
        </ul>
        <p>
          Sivusto voi käyttää analytiikkatyökaluja, kuten Google Analyticsia. Jos näitä työkaluja ei ole määritetty
          keräämään tietoja pelkästään koostetusti tai anonymisoidusti sovellettavan sääntelyn edellyttämällä tavalla,
          niiden käyttö voi edellyttää suostumustasi.
        </p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">c) Markkinointi-, profilointi- ja uudelleenmarkkinointievästeet</h4>
        <p>Niiden tarkoituksena on:</p>
        <ul>
          <li>mitata mainoskampanjoiden tehokkuutta</li>
          <li>luoda mukautettuja kohderyhmiä</li>
          <li>näyttää selauskäyttäytymiseesi sopivia mainoksia</li>
          <li>toteuttaa uudelleenmarkkinointia ja uudelleenkohdentamista</li>
        </ul>
        <p>
          Tähän ryhmään voi kuulua työkaluja, kuten Meta Pixel, sekä muita mainontaan liittyviä skriptejä tai
          tageja. Tällaiset evästeet eivät ole tarpeen sivuston toiminnalle, ja niitä käytetään vain suostumuksen
          perusteella silloin, kun sovellettava sääntely sitä edellyttää.
        </p>
      </SubSection>
      <SubSection title="12.3 Ensimmäisen ja kolmannen osapuolen evästeet">
        <p>Sivusto voi käyttää:</p>
        <ul>
          <li>ensimmäisen osapuolen evästeitä, jotka sivusto itse asettaa</li>
          <li>
            kolmannen osapuolen evästeitä, jotka asetetaan ulkopuolisten tahojen, kuten Googlen, Metan, Stripen,
            PayPalin tai muiden teknisten toimittajien, palvelujen kautta
          </li>
        </ul>
        <p>
          Kolmannen osapuolen evästeiden keräämiin tietoihin sovelletaan myös kyseisten toimittajien omia
          tietosuojaselosteita.
        </p>
      </SubSection>
      <SubSection title="12.4 Evästeiden käytön oikeusperuste">
        <p>Teknisten evästeiden käyttö perustuu tarpeeseen tarjota sivusto ja pyydetyt palvelut.</p>
        <p>
          Sellaisten analytiikkaevästeiden, jotka eivät ole teknisesti välttämättömiä, sekä markkinointievästeiden,
          pikselien, tagien ja muiden seurantatyökalujen käyttö perustuu suostumukseesi silloin, kun sovellettava
          sääntely sitä edellyttää.
        </p>
      </SubSection>
      <SubSection title="12.5 Suostumuksen hallinta">
        <p>Jos suostumus vaaditaan, voit ensimmäisellä vierailullasi sivustolla:</p>
        <ul>
          <li>hyväksyä kaikki muut kuin välttämättömät evästeet</li>
          <li>hylätä muut kuin välttämättömät evästeet</li>
          <li>valita omat asetuksesi</li>
        </ul>
        <p>
          Voit milloin tahansa muuttaa tai peruuttaa valintasi sivuston tarjoamilla keinoilla, jos sellaisia on, tai
          selaimen asetuksista. Huomaa, että joidenkin evästeiden estäminen voi vaikuttaa joihinkin muihin kuin
          välttämättömiin toimintoihin.
        </p>
      </SubSection>
      <SubSection title="12.6 Käytöstä poistaminen selaimessa">
        <p>
          Voit hallita evästeitä tai poistaa ne käytöstä myös selaimesi asetuksista. Teknisten evästeiden poistaminen
          käytöstä voi kuitenkin haitata sivuston tai sen osien moitteetonta toimintaa.
        </p>
      </SubSection>
      <SubSection title="12.7 Evästeiden säilytysaika">
        <p>Evästeiden voimassaoloaika vaihtelee:</p>
        <ul>
          <li>jotkin poistuvat automaattisesti, kun suljet selaimen</li>
          <li>
            toiset säilyvät pidempään, ja ajan määrää kukin toimittaja tai sivuston tekninen määritys
          </li>
        </ul>
        <p>
          Todelliseen kestoon voivat vaikuttaa myös selaimen käytännöt, valintasi ja käytetyt ulkopuoliset toimittajat.
        </p>
      </SubSection>
    </Section>

    <Section title="13. Rekisteröidyn oikeudet">
      <p>Sovellettavan sääntelyn tarkoittamissa tapauksissa voit käyttää seuraavia oikeuksia:</p>
      <ul>
        <li>pääsy henkilötietoihisi</li>
        <li>virheellisten tietojen oikaiseminen</li>
        <li>tietojesi poistaminen</li>
        <li>käsittelyn rajoittaminen</li>
        <li>käsittelyn vastustaminen säädetyissä tapauksissa</li>
        <li>tietojesi siirtäminen toiseen järjestelmään, soveltuvin osin</li>
        <li>
          suostumuksesi peruuttaminen milloin tahansa niin, että se ei vaikuta ennen peruuttamista annetun
          suostumuksen perusteella tehdyn käsittelyn lainmukaisuuteen
        </li>
        <li>
          valituksen tekeminen toimivaltaiselle valvontaviranomaiselle, Suomessa Tietosuojavaltuutetun toimistolle
          (tietosuoja.fi)
        </li>
      </ul>
      <p>
        Oikeuksiesi käyttämiseksi voit kirjoittaa osoitteeseen: <MailLink email={privacyEmail} />
      </p>
    </Section>

    <Section title="14. Alaikäiset">
      <p>
        Palvelua ei ole tarkoitettu alaikäisille. Rekisterinpitäjä pyytää, ettet käytä sivustoa etkä anna
        henkilötietojasi, jos et ole täysi-ikäinen tai jos sinulla ei muutoin ole sovellettavan sääntelyn mukaan
        kelpoisuutta antaa pätevää suostumusta.
      </p>
    </Section>

    <Section title="15. Tämän selosteen muutokset">
      <p>
        Rekisterinpitäjä pidättää oikeuden päivittää tai muuttaa tätä selostetta milloin tahansa. Päivitetty versio
        julkaistaan tällä sivulla, ja siinä mainitaan viimeisimmän muutoksen päivämäärä.
      </p>
    </Section>
  </LegalPage>
);

export default PrivacyPolicyFi;
