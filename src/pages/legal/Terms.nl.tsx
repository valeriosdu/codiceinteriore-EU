// ⚠️ Vertaalde concepttekst, juridisch na te kijken vóór de lancering.
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, MailLink, SiteLink, infoEmail } from "./LegalLayout";

const TermsNl = () => (
  <LegalPage
    seoTitle={`Algemene Voorwaarden — ${MARKET.siteName}`}
    seoDescription={`Algemene Voorwaarden voor het gebruik van de site ${MARKET.siteName} en de aangeboden digitale diensten.`}
    path="/voorwaarden"
    backAria="Terug"
    heading="Algemene Voorwaarden"
    lastUpdated="Laatst bijgewerkt: 20 augustus 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-4">
      Deze Algemene Voorwaarden regelen de toegang tot en het gebruik van de site <SiteLink /> en de aankoop van de
      digitale diensten die onder het merk {MARKET.siteName} worden aangeboden.
    </p>
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      Door de site te bezoeken of een of meer diensten te kopen, verklaart de gebruiker deze Algemene Voorwaarden te
      hebben gelezen, begrepen en aanvaard.
    </p>

    <Section title="1. Aanbieder van de dienst">
      <p>De dienst wordt aangeboden door:</p>
      <LegalEntityBox />
      <p>
        Handelsmerk dat op de site wordt gebruikt: <strong>{MARKET.siteName}</strong>
      </p>
      <p>
        Contact: <MailLink email={infoEmail} />
      </p>
    </Section>

    <Section title="2. Voorwerp van de dienst">
      <p>
        {MARKET.siteName} biedt betaalde digitale diensten aan op basis van persoonlijke verwerkingen, interpretatieve
        astrologische inhoud en daarmee samenhangende aanvullende functies.
      </p>
      <p>De diensten kunnen, afhankelijk van het gekochte aanbod, het volgende omvatten:</p>
      <ul>
        <li>persoonlijke astrologische rapporten</li>
        <li>wekelijkse of periodieke inhoud</li>
        <li>toegang tot een persoonlijke omgeving</li>
        <li>eventuele extra inhoud</li>
        <li>eventuele aanvullende digitale functies die aan de gekochte dienst verbonden zijn</li>
      </ul>
      <p>
        Tenzij anders vermeld worden de diensten uitsluitend in digitale vorm geleverd en is er geen levering van
        materiële goederen.
      </p>
    </Section>

    <Section title="3. Aard van de dienst">
      <p>
        De dienst van {MARKET.siteName} heeft een informatief, introspectief en ontspannend doel in verdiepte vorm.
      </p>
      <p>De geleverde inhoud:</p>
      <ul>
        <li>vormt geen psychologisch, psychiatrisch of medisch advies</li>
        <li>vormt geen juridisch, fiscaal of financieel advies</li>
        <li>garandeert geen persoonlijke, relationele, professionele of financiële resultaten</li>
        <li>vervangt niet het eigen oordeel van de gebruiker of de begeleiding van gekwalificeerde professionals</li>
      </ul>
      <p>De gebruiker is als enige verantwoordelijk voor het gebruik dat hij van de ontvangen inhoud maakt.</p>
    </Section>

    <Section title="4. Vereisten voor de gebruiker">
      <p>Om de site te gebruiken of de diensten te kopen, verklaart de gebruiker:</p>
      <ul>
        <li>meerderjarig te zijn of in elk geval wettelijk bevoegd om een bindende overeenkomst te sluiten</li>
        <li>waarheidsgetrouwe, juiste en volledige gegevens te verstrekken</li>
        <li>de site rechtmatig te gebruiken en in overeenstemming met deze Voorwaarden</li>
      </ul>
      <p>De dienst is niet bestemd voor minderjarigen.</p>
    </Section>

    <Section title="5. Door de gebruiker verstrekte gegevens">
      <p>
        Voor de levering van de dienst kan de gebruiker persoonsgegevens en informatie moeten verstrekken die nodig zijn
        om de inhoud persoonlijk te maken, bij wijze van voorbeeld:
      </p>
      <ul>
        <li>naam</li>
        <li>e-mailadres</li>
        <li>geboortedatum</li>
        <li>geboortetijd</li>
        <li>geboorteplaats</li>
        <li>antwoorden op de vragenlijst of op andere formulieren</li>
      </ul>
      <p>De gebruiker is verantwoordelijk voor de juistheid van de ingevoerde gegevens.</p>
      <p>
        {MARKET.siteName} is niet aansprakelijk voor fouten, vertragingen, onjuiste inhoud of niet-passende resultaten
        die voortkomen uit onvolledige, onjuiste of niet-bijgewerkte gegevens die de gebruiker heeft verstrekt.
      </p>
    </Section>

    <Section title="6. Wijze van aankoop">
      <p>De aankoop verloopt via de site, volgens het afrekenproces dat op het moment van bestellen beschikbaar is.</p>
      <p>Voordat de aankoop wordt afgerond, kan de gebruiker ten minste het volgende zien:</p>
      <ul>
        <li>de belangrijkste kenmerken van de gekochte dienst</li>
        <li>de totaalprijs</li>
        <li>wat er in het aanbod is inbegrepen</li>
        <li>de betaalmogelijkheden</li>
        <li>de essentiële informatie over herroeping en digitale levering, voor zover van toepassing</li>
      </ul>
      <p>
        De overeenkomst komt tot stand zodra de betaling correct is geautoriseerd en de bestelling door het systeem of
        door de aanbieder is bevestigd.
      </p>
    </Section>

    <Section title="7. Prijzen en betalingen">
      <p>Alle op de site vermelde prijzen zijn uitgedrukt in de valuta die op de aankooppagina wordt aangegeven.</p>
      <p>Betalingen kunnen worden afgehandeld door derde aanbieders, waaronder:</p>
      <ul>
        <li>Stripe</li>
        <li>PayPal</li>
      </ul>
      <p>
        {MARKET.siteName} verwerkt de volledige kaartgegevens niet zelf. Die gegevens worden verwerkt door de
        betaalaanbieders volgens hun eigen voorwaarden en privacyverklaringen.
      </p>
      <p>
        De aanbieder behoudt zich het recht voor prijzen, aanbiedingen, pakketten of commerciële voorwaarden op elk
        moment te wijzigen. Wijzigingen gelden niet voor reeds afgeronde bestellingen.
      </p>
    </Section>

    <Section title="8. Levering van de digitale inhoud">
      <p>De gekochte diensten worden digitaal geleverd, via een of meer van de volgende wegen:</p>
      <ul>
        <li>weergave op de pagina</li>
        <li>verzending per e-mail</li>
        <li>toegang via de persoonlijke omgeving</li>
        <li>activering van periodieke inhoud die aan het profiel van de gebruiker is gekoppeld</li>
      </ul>
      <p>
        De levertijden kunnen variëren afhankelijk van de aard van de dienst, de technische belasting, de juistheid van
        de verstrekte gegevens en de eventuele noodzaak van geautomatiseerde verwerkingen of koppelingen met diensten van
        derden.
      </p>
      <p>
        Tenzij anders vermeld garandeert de aanbieder geen onmiddellijke levering in realtime, maar verbindt hij zich
        ertoe de dienst te leveren binnen een redelijke termijn die past bij de technische opzet van het product.
      </p>
    </Section>

    <Section title="9. Gebruikersaccount">
      <p>
        Voorziet de dienst in het aanmaken van een account, dan is de gebruiker verantwoordelijk voor de
        vertrouwelijkheid van zijn inloggegevens en voor alle activiteit die via zijn account plaatsvindt.
      </p>
      <p>De gebruiker verbindt zich ertoe:</p>
      <ul>
        <li>zijn inloggegevens niet met derden te delen</li>
        <li>geen accounts van anderen te gebruiken</li>
        <li>elke ongeautoriseerde toegang of beveiligingsinbreuk onmiddellijk te melden</li>
      </ul>
      <p>
        De aanbieder behoudt zich het recht voor de toegang op te schorten of te beperken bij oneigenlijk gebruik,
        vermoeden van fraude, schending van deze Voorwaarden of gedrag dat de goede werking van de dienst in gevaar kan
        brengen.
      </p>
    </Section>

    <Section title="10. Herroepingsrecht">
      <p>
        Koopt de gebruiker als consument, dan kan hij zich beroepen op het herroepingsrecht in de gevallen die de wet
        voorziet.
      </p>
      <p>
        In het algemeen geldt bij overeenkomsten op afstand een herroepingsrecht van 14 dagen. Voor digitale inhoud die
        niet op een materiële drager wordt geleverd, kan het herroepingsrecht echter vervallen wanneer:
      </p>
      <ul>
        <li>de uitvoering tijdens de herroepingstermijn is begonnen</li>
        <li>de gebruiker daarvoor uitdrukkelijk voorafgaande toestemming heeft gegeven</li>
        <li>de gebruiker heeft erkend zijn herroepingsrecht daarmee te verliezen</li>
        <li>de handelaar de bevestiging van de overeenkomst heeft verstrekt op de door de wet vereiste wijze</li>
      </ul>
      <p>
        Vraagt of aanvaardt de gebruiker dus de onmiddellijke activering van de persoonlijke digitale dienst, van het
        maken van het rapport of van de onmiddellijke terbeschikkingstelling van de digitale inhoud, dan stemt de
        gebruiker ermee in dat de uitvoering begint vóór het verstrijken van de herroepingstermijn en erkent hij, binnen
        de wettelijke grenzen, dat hij dat recht kan verliezen zodra de uitvoering van de dienst is begonnen. Dit stemt
        overeen met artikel 6:230p van het Burgerlijk Wetboek.
      </p>
    </Section>

    <Section title="11. Terugbetaling">
      <p>
        Voor de gevallen van wettelijke herroeping verwijzen we naar Deel 10 hierboven. Buiten die gevallen en behoudens
        wat de wet bepaalt, zijn digitale diensten die al zijn geleverd, geactiveerd, gepersonaliseerd of ter beschikking
        gesteld in de regel niet terugbetaalbaar.
      </p>
      <p>
        <strong>Commerciële garantie "niet tevreden, geld terug" (14 dagen).</strong> Naast de rechten die de wet
        toekent, biedt de aanbieder een vrijwillige commerciële garantie: vindt de gebruiker binnen 14 dagen na levering
        van het rapport dat de duiding algemeen is of niet overeenkomt met de opgegeven geboortegegevens, dan kan hij het
        volledige betaalde bedrag terugvragen door te mailen naar <MailLink email={infoEmail} /> vanaf het e-mailadres
        dat bij de aankoop is gebruikt.
      </p>
      <p>
        De terugbetaling wordt, zodra ze is toegekend, gedaan via dezelfde betaalmethode als bij de aankoop, zonder
        kosten voor de gebruiker. De garantie geldt één keer per klant en uitsluitend voor de eerste aankoop van de
        Duiding van de Geboortehoroscoop (ook in de variant met de eerste maand Transits). Latere verlengingen van het
        Transits-abonnement vallen niet onder de garantie en worden geregeld in Deel 12 hierna.
      </p>
      <p>
        Elk ander verzoek om hulp of elke klacht kan naar hetzelfde adres worden gestuurd of naar de contactgegevens die
        op de site staan. De aanbieder beoordeelt technische storingen, dubbele betalingen of het uitblijven van de
        feitelijke levering van de dienst te goeder trouw.
      </p>
    </Section>

    <Section title="12. Abonnementen en terugkerende inhoud">
      <p>Bevat de gekochte dienst periodieke inhoud, terugkerende toegang of een abonnementsvorm, dan geldt:</p>
      <ul>
        <li>de frequentie, de prijs en de belangrijkste kenmerken worden op de betreffende aanbodpagina vermeld</li>
        <li>de gebruiker is verantwoordelijk om vóór het bevestigen van de bestelling na te gaan of de aankoop terugkerend is</li>
        <li>
          de aanbieder kan de dienst opschorten of stopzetten bij uitblijvende betaling of bij een technische
          onmogelijkheid die later ontstaat
        </li>
      </ul>
      <p>
        Wordt een terugkerend plan automatisch verlengd, dan moet dat duidelijk worden vermeld bij het afrekenen of op de
        aanbodpagina, vóór de aankoop.
      </p>
    </Section>

    <Section title="13. Toegestaan gebruik van de dienst">
      <p>
        De gebruiker mag de gekochte inhoud alleen voor persoonlijke, niet-commerciële doeleinden gebruiken, tenzij
        schriftelijk anders is afgesproken.
      </p>
      <p>Het is verboden om:</p>
      <ul>
        <li>de inhoud te kopiëren, te verveelvoudigen, te verspreiden of door te verkopen</li>
        <li>rapporten, materialen, resultaten, flows of afgeschermde omgevingen stelselmatig openbaar te delen</li>
        <li>de dienst te gebruiken voor onrechtmatige of frauduleuze doeleinden of om rechten van derden te schenden</li>
        <li>te proberen technische, beveiligings- of toegangsbeperkingen te omzeilen</li>
      </ul>
    </Section>

    <Section title="14. Intellectuele eigendom">
      <p>
        Alle inhoud op de site en alle inhoud die via de dienst wordt geleverd, waaronder teksten, de opzet van het
        product, materialen, interfaces, grafische elementen, logo's, handelsnamen, geordende resultaten, vormgeving en
        redactionele inhoud, is voorbehouden aan de aanbieder of aan de respectieve rechthebbenden.
      </p>
      <p>
        Met de aankoop van de dienst gaan er geen intellectuele-eigendomsrechten op de site of op de inhoud over op de
        gebruiker, behalve het persoonlijke en beperkte recht om de gekochte dienst te gebruiken.
      </p>
    </Section>

    <Section title="15. Beschikbaarheid van de dienst">
      <p>
        De aanbieder spant zich in om de site en de diensten redelijkerwijs beschikbaar te houden, maar garandeert niet
        dat ze altijd zonder onderbreking, fouten, vertraging of storing bereikbaar zijn.
      </p>
      <p>De dienst kan worden opgeschort, beperkt of onderbroken door:</p>
      <ul>
        <li>onderhoud</li>
        <li>technische updates</li>
        <li>netwerk- of infrastructuurproblemen</li>
        <li>gebeurtenissen buiten de redelijke controle van de aanbieder</li>
        <li>onbeschikbaarheid van essentiële externe leveranciers</li>
      </ul>
    </Section>

    <Section title="16. Beperking van aansprakelijkheid">
      <p>Voor zover de wet dat toestaat, is de aanbieder niet aansprakelijk voor:</p>
      <ul>
        <li>persoonlijke, relationele of professionele beslissingen die de gebruiker neemt op basis van de ontvangen inhoud</li>
        <li>indirecte schade, gemiste kansen of onvoorzienbare schade</li>
        <li>fouten die voortkomen uit onjuiste gegevens die de gebruiker heeft verstrekt</li>
        <li>
          onderbrekingen of storingen die te wijten zijn aan externe leveranciers, externe tools, AI-diensten,
          betaaldiensten of telecommunicatienetwerken
        </li>
        <li>tijdelijke incompatibiliteit met apparaten, browsers of technische instellingen van de gebruiker</li>
      </ul>
      <p>
        Eventuele dwingende aansprakelijkheid op grond van het toepasselijke consumentenrecht blijft onverlet.
      </p>
    </Section>

    <Section title="17. Privacy en persoonsgegevens">
      <p>
        De verwerking van de persoonsgegevens van de gebruiker wordt geregeld door de{" "}
        <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
          Privacy- en Cookieverklaring
        </a>{" "}
        die op de site is gepubliceerd en die, voor zover verenigbaar, integraal deel uitmaakt van de contractuele
        relatie.
      </p>
    </Section>

    <Section title="18. Wijzigingen van de Voorwaarden">
      <p>De aanbieder kan deze Algemene Voorwaarden op elk moment bijwerken of wijzigen.</p>
      <p>
        Wijzigingen gaan in vanaf de datum van publicatie op de site, tenzij anders vermeld. Voor reeds afgeronde
        bestellingen blijven in de regel de voorwaarden gelden die op het moment van aankoop van kracht waren.
      </p>
    </Section>

    <Section title="19. Toepasselijk recht en bevoegde rechter">
      <p>
        Op deze Algemene Voorwaarden is het recht van toepassing dat volgt uit de regels van internationaal privaatrecht
        en, waar van toepassing, uit de dwingende regels van consumentenbescherming.
      </p>
      <p>
        Handelt de gebruiker als consument, dan blijven de rechten onverlet die de dwingende regels van het land van zijn
        gewone verblijfplaats hem eventueel toekennen.
      </p>
      <p>
        Voor elk geschil over de uitleg, de geldigheid of de uitvoering van deze Voorwaarden is, als de gebruiker
        consument is, de rechter bevoegd die het toepasselijke recht dwingend aanwijst.
      </p>
    </Section>

    <Section title="20. Contact">
      <p>
        Voor informatie, hulp of berichten over deze Voorwaarden: <MailLink email={infoEmail} />
      </p>
    </Section>
  </LegalPage>
);

export default TermsNl;
