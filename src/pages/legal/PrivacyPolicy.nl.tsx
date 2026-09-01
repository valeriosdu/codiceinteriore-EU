// ⚠️ Vertaalde concepttekst, juridisch na te kijken vóór de lancering.
import { MARKET } from "@/markets";
import { LegalPage, LegalEntityBox, Section, SubSection, MailLink, SiteLink, privacyEmail } from "./LegalLayout";

const PrivacyPolicyNl = () => (
  <LegalPage
    seoTitle={`Privacy- en Cookieverklaring — ${MARKET.siteName}`}
    seoDescription={`Informatie over de verwerking van persoonsgegevens van gebruikers van de site ${MARKET.siteName}.`}
    path="/privacy"
    backAria="Terug"
    heading="Privacy- en Cookieverklaring"
    lastUpdated="Laatst bijgewerkt: 20 augustus 2026"
  >
    <p className="text-base leading-relaxed text-foreground/90 mb-10">
      Deze verklaring beschrijft hoe de persoonsgegevens worden verwerkt van gebruikers die de site <SiteLink /> bezoeken
      en de diensten onder het merk {MARKET.siteName} gebruiken.
    </p>

    <Section title="1. Verwerkingsverantwoordelijke">
      <p>De verwerkingsverantwoordelijke is:</p>
      <LegalEntityBox />
      <p>
        Voor elk verzoek over de verwerking van persoonsgegevens kun je schrijven naar:{" "}
        <MailLink email={privacyEmail} />
      </p>
    </Section>

    <Section title="2. Toepassingsgebied">
      <p>Deze verklaring geldt voor de verwerking van persoonsgegevens via:</p>
      <ul>
        <li>de site {MARKET.siteName}</li>
        <li>de vragenlijst en de pagina's waar gegevens worden verzameld</li>
        <li>het afrekenen en de aankooppagina's</li>
        <li>eventuele contactformulieren</li>
        <li>het versturen van operationele mails, wekelijkse inhoud en marketingberichten</li>
        <li>de persoonlijke omgeving die eventueel aan de dienst is gekoppeld</li>
      </ul>
    </Section>

    <Section title="3. Soorten gegevens die worden verwerkt">
      <p>We kunnen de volgende categorieën persoonsgegevens verwerken:</p>
      <SubSection title="a) Identificatie- en contactgegevens">
        <ul>
          <li>naam</li>
          <li>e-mailadres</li>
        </ul>
      </SubSection>
      <SubSection title="b) Gegevens die je verstrekt voor de levering van de dienst">
        <ul>
          <li>geboortedatum</li>
          <li>geboortetijd</li>
          <li>geboorteplaats</li>
          <li>antwoorden die je in de vragenlijst geeft</li>
          <li>inhoud die je doorgeeft via hulpverzoeken of contactformulieren</li>
        </ul>
      </SubSection>
      <SubSection title="c) Gegevens over aankopen">
        <ul>
          <li>aankoopgeschiedenis</li>
          <li>informatie over de betaalstatus</li>
          <li>transactiekenmerken die de betaalaanbieders doorgeven</li>
        </ul>
        <p className="text-sm text-muted-foreground italic mt-2">
          Let op: de volledige kaartgegevens worden niet door de verwerkingsverantwoordelijke verwerkt, maar door de
          gebruikte betaalaanbieders.
        </p>
      </SubSection>
      <SubSection title="d) Technische en navigatiegegevens">
        <ul>
          <li>IP-adres</li>
          <li>technische logbestanden</li>
          <li>informatie over browser, apparaat en besturingssysteem</li>
          <li>gegevens verzameld via cookies of vergelijkbare technieken</li>
        </ul>
      </SubSection>
      <SubSection title="e) Gegevens over marketing en tracking">
        <ul>
          <li>gegevens verzameld met analysetools</li>
          <li>gegevens verzameld met marketingcookies en -pixels, waaronder remarketingtools</li>
        </ul>
      </SubSection>
    </Section>

    <Section title="4. Doeleinden van de verwerking">
      <p>Persoonsgegevens kunnen worden verwerkt voor de volgende doeleinden:</p>
      <ul>
        <li>het leveren van het persoonlijke astrologische rapport</li>
        <li>het leveren van wekelijkse inhoud, terugkerende diensten of abonnementen</li>
        <li>het beheer van het gebruikersaccount, waar beschikbaar</li>
        <li>het beheer van het afrekenen, de betalingen en de bestelgeschiedenis</li>
        <li>
          het versturen van operationele berichten, zoals bestelbevestigingen, toegang tot de inhoud, hulp en
          servicemeldingen
        </li>
        <li>het afhandelen van verzoeken die je per mail of via het contactformulier stuurt</li>
        <li>het versturen van de nieuwsbrief en promotionele berichten</li>
        <li>statistische analyses over het gebruik van de site</li>
        <li>remarketing, retargeting en het meten van advertentiecampagnes</li>
        <li>het beveiligen van de site, het voorkomen van misbruik en het technische beheer van de systemen</li>
      </ul>
    </Section>

    <Section title="5. Rechtsgrond van de verwerking">
      <p>De verwerking van persoonsgegevens berust, afhankelijk van het geval, op de volgende rechtsgronden:</p>
      <ul>
        <li>
          <strong>uitvoering van een overeenkomst</strong> of van precontractuele maatregelen: voor het leveren van het
          rapport, het verwerken van de vragenlijst voor zover die de gevraagde dienst dient, het accountbeheer, de
          aankopen, de betalingen, het versturen van operationele mails en de klantenhulp
        </li>
        <li>
          <strong>toestemming van de betrokkene</strong>: voor het versturen van de nieuwsbrief en marketingberichten,
          en voor het gebruik van niet-technische cookies en trackingtools waar de toepasselijke regelgeving dat vereist
        </li>
        <li>
          <strong>gerechtvaardigd belang van de verwerkingsverantwoordelijke</strong>: voor informatiebeveiliging, het
          verdedigen van zijn rechten, fraudepreventie, technisch beheer van de site en geaggregeerde analyses van de
          werking van de diensten, binnen de grenzen die de wet toestaat
        </li>
      </ul>
    </Section>

    <Section title="6. Verplicht of vrijwillig verstrekken van gegevens">
      <p>Het verstrekken van de als noodzakelijk gemarkeerde gegevens is verplicht wanneer die gegevens dienen om:</p>
      <ul>
        <li>het gevraagde rapport te maken</li>
        <li>een aankoop af te handelen</li>
        <li>het account aan te maken of te beheren</li>
        <li>hulp te bieden</li>
        <li>operationele berichten te versturen</li>
      </ul>
      <p>Worden die gegevens niet verstrekt, dan kan de dienst mogelijk niet worden geleverd.</p>
      <p>
        Gegevens voor marketingdoeleinden of voor niet-noodzakelijke cookies verstrek je daarentegen vrijwillig. Een
        weigering belemmert het bezoeken van de site of het kopen van de basisdienst niet, behoudens de strikt
        noodzakelijke technische grenzen.
      </p>
    </Section>

    <Section title="7. Wijze van verwerking">
      <p>
        De verwerking gebeurt met digitale en organisatorische middelen die passen bij de aard van de gegevens, volgens
        de beginselen van rechtmatigheid, behoorlijkheid, transparantie, minimalisering en opslagbeperking.
      </p>
    </Section>

    <Section title="8. Ontvangers van de gegevens">
      <p>
        De gegevens kunnen worden gedeeld met of toegankelijk gemaakt voor partijen die, afhankelijk van het geval,
        optreden als verwerker, als zelfstandige verwerkingsverantwoordelijke of als gemachtigde persoon.
      </p>
      <p>In het bijzonder kunnen de gegevens worden verwerkt via de volgende leveranciers of categorieën leveranciers:</p>
      <ul>
        <li>leveranciers van hosting en infrastructuur/frontend</li>
        <li>Supabase voor de database en de applicatie-infrastructuur</li>
        <li>Stripe en PayPal voor de afhandeling van betalingen</li>
        <li>Google voor technologische diensten en, waar van toepassing, verwerking via externe AI-modellen</li>
        <li>FreeAstroAPI voor de verwerking van de astrologische gegevens die de dienst nodig heeft</li>
        <li>Meta voor advertentietools, pixels en remarketing</li>
        <li>Google Analytics voor de statistische analyse van het siteverkeer</li>
        <li>leveranciers van e-mailverzending, technische ondersteuning en operationeel beheer rond de diensten</li>
      </ul>
      <p>Die partijen verwerken de gegevens alleen voor zover dat nodig is om hun diensten te leveren.</p>
    </Section>

    <Section title="9. Verwerking via AI-leveranciers en externe diensten">
      <p>
        Om sommige functies van de dienst te leveren, kunnen de gegevens die je in de vragenlijst invult en de
        informatie die nodig is om de inhoud te maken worden doorgestuurd naar externe technologieleveranciers, waaronder
        AI-diensten van Google en externe astrologische diensten.
      </p>
      <p>
        De verwerkingsverantwoordelijke hanteert het beginsel van minimalisering: naar externe leveranciers gaan alleen
        de gegevens die nodig zijn om de gevraagde inhoud te maken of de voorziene technische functie uit te voeren.
      </p>
    </Section>

    <Section title="10. Doorgifte van gegevens naar landen buiten de EER">
      <p>
        Sommige gebruikte technologieleveranciers kunnen zich buiten de Europese Economische Ruimte bevinden of daar
        gegevens verwerken, waaronder in de Verenigde Staten of andere derde landen.
      </p>
      <p>
        Waar van toepassing gebeuren die doorgiftes met inachtneming van de instrumenten die de geldende regelgeving
        voorschrijft, waaronder eventuele contractuele mechanismen of andere wettelijk vereiste waarborgen.
      </p>
      <p>
        Voor meer informatie over eventuele doorgiftes en de bijbehorende waarborgen kun je schrijven naar{" "}
        <MailLink email={privacyEmail} />.
      </p>
    </Section>

    <Section title="11. Bewaartermijn van de gegevens">
      <p>
        Behoudens andersluidende wettelijke verplichtingen worden persoonsgegevens niet langer bewaard dan nodig is voor
        de doeleinden waarvoor ze zijn verzameld.
      </p>
      <p>In het algemeen geldt:</p>
      <ul>
        <li>
          gegevens over contactverzoeken kunnen worden bewaard zolang dat nodig is om het verzoek af te handelen en
          gedurende een redelijke administratieve periode daarna
        </li>
        <li>
          gegevens over aankopen en over de contractuele relatie kunnen worden bewaard voor de duur van die relatie en
          daarna zolang dat nodig is om te voldoen aan fiscale, administratieve of verdedigingsverplichtingen
        </li>
        <li>
          gegevens die worden gebruikt voor marketingberichten worden bewaard tot je je toestemming intrekt of bezwaar
          maakt
        </li>
        <li>
          technische en loggegevens worden bewaard gedurende de periode die strikt nodig is voor de werking, de
          beveiliging en de analyse van de systemen
        </li>
        <li>
          gegevens die aan analyse en cookies zijn gekoppeld hangen af van de instellingen van de betreffende tool en van
          de voorkeuren die je hebt aangegeven
        </li>
      </ul>
    </Section>

    <Section title="12. Cookieverklaring">
      <p>
        Deze site gebruikt cookies en vergelijkbare technieken om de pagina's goed te laten werken, het verkeer te
        analyseren, de gebruikerservaring te verbeteren en, met voorafgaande toestemming waar dat nodig is,
        advertentiecampagnes te meten en remarketing uit te voeren.
      </p>
      <SubSection title="12.1 Wat cookies zijn">
        <p>
          Cookies zijn kleine tekstbestanden die websites tijdens het bezoek naar je apparaat sturen. Ze kunnen worden
          opgeslagen en bij een volgend bezoek weer naar diezelfde sites worden teruggestuurd.
        </p>
        <p>
          Vergelijkbare technieken, zoals pixels, tags, scripts of identificatiemiddelen, kunnen dezelfde functies
          vervullen bij het verzamelen of doorgeven van informatie.
        </p>
      </SubSection>
      <SubSection title="12.2 Soorten cookies die worden gebruikt">
        <p>De site kan de volgende categorieën cookies gebruiken:</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">a) Technische of strikt noodzakelijke cookies</h4>
        <p>Die zorgen ervoor dat de site werkt en de essentiële functies geleverd worden, bijvoorbeeld:</p>
        <ul>
          <li>navigeren tussen pagina's</li>
          <li>sessiebeheer</li>
          <li>beveiliging van de site</li>
          <li>het onthouden van technische voorkeuren</li>
          <li>de goede werking van het afrekenen of van essentiële onderdelen</li>
        </ul>
        <p>Voor deze cookies is normaal gesproken geen toestemming nodig.</p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">b) Analytische cookies</h4>
        <p>Die verzamelen statistische informatie over het gebruik van de site, bijvoorbeeld:</p>
        <ul>
          <li>aantal bezoekers</li>
          <li>bezochte pagina's</li>
          <li>herkomst van het verkeer</li>
          <li>navigatiegedrag</li>
          <li>prestaties van de pagina's</li>
        </ul>
        <p>
          De site kan analysetools gebruiken zoals Google Analytics. Zijn die tools niet strikt geaggregeerd of
          geanonimiseerd ingesteld volgens de standaarden die de toepasselijke regelgeving vraagt, dan kan het gebruik
          ervan je toestemming vereisen.
        </p>
        <h4 className="font-serif text-lg font-medium mt-5 mb-2">c) Marketing-, profilerings- en remarketingcookies</h4>
        <p>Die dienen om:</p>
        <ul>
          <li>de effectiviteit van advertentiecampagnes te meten</li>
          <li>aangepaste doelgroepen samen te stellen</li>
          <li>advertenties te tonen die aansluiten bij je surfgedrag</li>
          <li>remarketing en retargeting uit te voeren</li>
        </ul>
        <p>
          Deze categorie kan tools omvatten zoals de Meta Pixel en andere advertentiescripts of -tags. Zulke cookies zijn
          niet nodig voor de werking van de site en worden alleen op basis van toestemming gebruikt, waar de
          toepasselijke regelgeving dat vereist.
        </p>
      </SubSection>
      <SubSection title="12.3 Eigen cookies en cookies van derden">
        <p>De site kan gebruiken:</p>
        <ul>
          <li>eigen cookies, die de site zelf plaatst</li>
          <li>
            cookies van derden, geplaatst via diensten van externe partijen zoals Google, Meta, Stripe, PayPal of andere
            technische leveranciers
          </li>
        </ul>
        <p>
          Op de informatie die cookies van derden verzamelen zijn ook de verklaringen van die leveranciers zelf van
          toepassing.
        </p>
      </SubSection>
      <SubSection title="12.4 Rechtsgrond voor het gebruik van cookies">
        <p>Het gebruik van technische cookies berust op de noodzaak de site en de gevraagde diensten te leveren.</p>
        <p>
          Het gebruik van niet strikt technische analytische cookies, marketingcookies, pixels, tags of andere
          trackingtools berust op jouw toestemming, waar de toepasselijke regelgeving dat vereist.
        </p>
      </SubSection>
      <SubSection title="12.5 Beheer van je toestemming">
        <p>Waar dat vereist is, kun je bij je eerste bezoek aan de site:</p>
        <ul>
          <li>alle niet-noodzakelijke cookies accepteren</li>
          <li>niet-noodzakelijke cookies weigeren</li>
          <li>je voorkeuren zelf kiezen</li>
        </ul>
        <p>
          Je kunt je voorkeuren op elk moment wijzigen of intrekken via de middelen die de site daarvoor biedt, als die
          er zijn, of via de instellingen van je browser. Houd er rekening mee dat het blokkeren van sommige cookies de
          werking van een aantal niet-essentiële functies kan beïnvloeden.
        </p>
      </SubSection>
      <SubSection title="12.6 Uitschakelen via de browser">
        <p>
          Je kunt cookies ook beheren of uitschakelen via de instellingen van je browser. Het uitschakelen van technische
          cookies kan de goede werking van de site of van delen daarvan echter in gevaar brengen.
        </p>
      </SubSection>
      <SubSection title="12.7 Bewaartermijn van cookies">
        <p>De levensduur van cookies kan verschillen:</p>
        <ul>
          <li>sommige worden automatisch verwijderd zodra je de browser sluit</li>
          <li>
            andere blijven langer opgeslagen, voor een periode die per leverancier of door de technische instelling van
            de site wordt bepaald
          </li>
        </ul>
        <p>
          De feitelijke duur kan ook afhangen van het beleid van de browser, van jouw voorkeuren en van de gebruikte
          externe leveranciers.
        </p>
      </SubSection>
    </Section>

    <Section title="13. Je rechten als betrokkene">
      <p>In de gevallen die de toepasselijke regelgeving voorziet, kun je de volgende rechten uitoefenen:</p>
      <ul>
        <li>inzage in je persoonsgegevens</li>
        <li>rectificatie van onjuiste gegevens</li>
        <li>verwijdering van je gegevens</li>
        <li>beperking van de verwerking</li>
        <li>bezwaar tegen de verwerking, in de voorziene gevallen</li>
        <li>overdraagbaarheid van je gegevens, waar van toepassing</li>
        <li>
          intrekking van je toestemming op elk moment, zonder dat dit afdoet aan de rechtmatigheid van de verwerking op
          basis van de toestemming die je vóór de intrekking had gegeven
        </li>
        <li>
          het indienen van een klacht bij de bevoegde toezichthouder, in Nederland de Autoriteit Persoonsgegevens
        </li>
      </ul>
      <p>
        Om je rechten uit te oefenen kun je schrijven naar: <MailLink email={privacyEmail} />
      </p>
    </Section>

    <Section title="14. Minderjarigen">
      <p>
        De dienst is niet bestemd voor minderjarigen. De verwerkingsverantwoordelijke vraagt je de site niet te gebruiken
        en geen persoonsgegevens door te geven als je niet meerderjarig bent of, in elk geval, als je niet bevoegd bent
        om volgens de toepasselijke regelgeving geldig toestemming te geven.
      </p>
    </Section>

    <Section title="15. Wijzigingen van deze verklaring">
      <p>
        De verwerkingsverantwoordelijke behoudt zich het recht voor deze verklaring op elk moment bij te werken of te
        wijzigen. De bijgewerkte versie wordt op deze pagina gepubliceerd, met vermelding van de datum van de laatste
        wijziging.
      </p>
    </Section>
  </LegalPage>
);

export default PrivacyPolicyNl;
