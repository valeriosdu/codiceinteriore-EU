import type { Messages } from '@/i18n';

const coppia: Messages['coppia'] = {
  titles: {
    landing: (siteName) => `Synastrie voor Koppels | ${siteName}`,
    quiz: (siteName) => `Synastrie voor Koppels - Vragenlijst | ${siteName}`,
    processing: (siteName) => `Synastrie - Bezig | ${siteName}`,
    teaser: (siteName) => `Synastrie - Voorbeeld | ${siteName}`,
    success: (siteName) => `Betaling ontvangen | ${siteName}`,
    activate: (siteName) => `Synastrie – Activeer je account | ${siteName}`,
    reportProcessing: (siteName) => `Synastrie - Maken | ${siteName}`,
    report: (siteName) => `Synastrie voor Koppels - Rapport | ${siteName}`,
  },
  landing: {
    heroLine1: 'Jullie relatie,',
    heroLine2: 'gelezen door de sterren',
    heroSubtitle:
      'Hebben jullie je weleens afgevraagd waarom je elkaar in sommige dingen meteen aanvoelt, en in andere altijd botst? De synastrie is het astrologische antwoord op die vraag.',
    cta: 'Start de vragenlijst',
    socialProofLine1: 'Ruim 800 stellen ontdekten al',
    socialProofLine2: 'hun synastrie voor koppels',
    discoverKicker: 'Wat jullie ontdekken',
    discoverTitleLine1: 'Geen horoscoop voor koppels.',
    discoverTitleLine2: 'Een echte duiding.',
    discoverItems: [
      {
        title: 'Het archetype van het koppel',
        body: 'Wat voor soort relatie zijn jullie? 14 verschillende astrologische configuraties, berekend op jullie echte planeten.',
      },
      {
        title: 'Zes compatibiliteitsscores',
        body: 'Emotionele afstemming, aantrekking, communicatie, stabiliteit, groei, spanning. Gemeten, uitgelegd, in context geplaatst.',
      },
      {
        title: 'Acht delen duiding',
        body: 'Portret van het koppel, chemie, communicatie, emotionele wereld, uitdagingen, stabiliteit, karmisch patroon, richting. In helder Nederlands.',
      },
    ],
    howKicker: 'Hoe het werkt',
    howSteps: [
      'Vul de geboortegegevens van allebei in: datum, tijd (als je die kent) en plaats.',
      'We berekenen ieders geboortehoroscoop en analyseren hoe ze over elkaar heen liggen: dat is de synastrie.',
      'Jullie krijgen het volledige rapport: ongeveer 10 pagina\'s in het Nederlands.',
    ],
  },
  quiz: {
    stepOf: (current, total) => `Stap ${current} van ${total}`,
    personA: 'Persoon 1 (jij)',
    personB: 'Persoon 2 (je partner)',
    date: {
      titleA: 'Wanneer ben jij geboren',
      titleB: 'Wanneer is je partner geboren',
      hint: 'Veeg om dag, maand en jaar te kiezen.',
      day: 'Dag',
      month: 'Maand',
      year: 'Jaar',
    },
    time: {
      titleA: 'Hoe laat ben jij geboren',
      titleB: 'Hoe laat is je partner geboren',
      hint: 'Weet je het niet precies, kies dan de tijd die er het dichtst bij komt, of vink hieronder "weet ik niet" aan.',
      hour: 'Uur',
      minute: 'Minuten',
      unknownLabel: 'Weet ik niet',
      unknownNote:
        'Zonder geboortetijd wordt de synastrie voor deze persoon gedeeltelijk (geen huizen, geen ascendant). Ga gerust verder, de rest van de analyse blijft geldig.',
    },
    place: {
      titleA: 'Waar ben jij geboren',
      titleB: 'Waar is je partner geboren',
      hint: 'Stad. Begin te typen en kies uit de suggesties.',
      placeholder: 'bijv. Amsterdam, Rotterdam, Utrecht...',
      suggestionHint: 'Kies een plaats uit de suggesties voor een preciezere duiding.',
      error: 'We konden deze plaats niet vinden. Kies een suggestie uit de lijst.',
    },
    name: {
      titleA: 'Hoe heet jij',
      titleB: 'Hoe heet je partner',
      hint: 'Alleen de voornaam, die gebruiken we in het rapport.',
      placeholderA: 'Je naam',
      placeholderB: 'Naam van je partner',
    },
    context: {
      title: 'Hoe lang zijn jullie al samen?',
      hint: 'Optioneel. Het helpt de duiding af te stemmen op de fase van jullie relatie.',
      durations: {
        under_1y: 'Minder dan 1 jaar',
        '1_to_3y': '1-3 jaar',
        '3_to_7y': '3-7 jaar',
        '7_to_15y': '7-15 jaar',
        over_15y: 'Meer dan 15 jaar',
        skip: 'Zeg ik liever niet',
      },
      focusLabel: 'Focus van de duiding (optioneel)',
      focusPlaceholder: 'Bijv. de uitdagingen begrijpen, beslissen of we gaan trouwen, een blokkade losmaken...',
    },
    back: 'Terug',
    next: 'Volgende',
    resolving: 'Controleren...',
    finalCta: 'Bereken de synastrie',
  },
  processing: {
    errorTitle: 'Er is een probleem',
    errors: {
      createSession: 'Ik kon de sessie niet aanmaken. Probeer het over een paar seconden opnieuw.',
      timeout: 'Het maken duurt langer dan verwacht. Probeer het zo opnieuw.',
      failed: 'Het maken is mislukt. Probeer het opnieuw.',
    },
    backToQuiz: 'Terug naar de vragenlijst',
    title: 'Ik bereken jullie synastrie',
    body: 'Ik leg de twee geboortehoroscopen naast elkaar en kijk naar hun contacten. Nog een paar seconden.',
  },
  teaser: {
    kicker: 'De synastrie van',
    personA: 'Persoon A',
    personB: 'Persoon B',
    wrongData: 'Kloppen de gegevens niet?',
    overallHigh:
      'Er is een sterke basis tussen jullie. De volledige duiding laat precies zien waar die afstemming vandaan komt en hoe je haar door de tijd heen beschermt.',
    overallMedium:
      'Jullie relatie heeft zowel middelen als open punten: dat is het profiel dat de rijkste duiding oplevert, want er valt veel te begrijpen en te benutten.',
    overallLow:
      'De cijfers zijn geen rapportcijfer: ze vertellen waar de relatie stroomt en waar ze aandacht vraagt. Stellen met een complexe dynamiek zijn juist degenen die in de duiding het meeste ontdekken.',
    primaryCta: 'Haal de volledige synastrie',
    securePayment: 'Veilig en beschermd betalen',
    framing: {
      high: {
        ringLabel: 'Affiniteit',
        contextLine:
          'Een hoge score wijst op vruchtbare grond. Maar ook de beste horoscopen hebben blinde hoeken: het rapport loopt ze een voor een langs.',
        domainsSubtitle:
          'In de volledige duiding wordt elk cijfer een pagina, verankerd in jullie echte planeten.',
        ctaLabel: 'Lees de duiding',
        offerSubtitle: 'over jullie relatie',
        extraBullet: null,
      },
      medium: {
        ringLabel: 'Dynamiek',
        contextLine:
          'Een middenscore vertelt over een relatie met meer nuances dan zekerheden. En juist die nuances maken de duiding interessant.',
        domainsSubtitle:
          'Elk cijfer opent een vraag. In de volledige duiding krijgen die vragen de context van jullie echte planeten.',
        ctaLabel: 'Lees de duiding',
        offerSubtitle: 'over jullie relatie',
        extraBullet: 'Wat werkt en wat aandacht vraagt, domein voor domein',
      },
      low: {
        ringLabel: 'Complexiteit',
        contextLine:
          'Een lage score beschrijft niet hoeveel jullie van elkaar houden: hij beschrijft hoeveel er te begrijpen valt. Complexe relaties zijn, als je ze goed leest, juist de relaties die het meeste teruggeven.',
        domainsSubtitle:
          'Lage cijfers zijn geen vonnis: het zijn de punten waar de relatie de meeste aandacht vraagt. De volledige duiding legt uit waarom, planeet voor planeet.',
        ctaLabel: 'Begrijp de dynamiek',
        offerSubtitle: 'om jullie relatie te begrijpen',
        extraBullet: 'De astrologische redenen achter de moeilijkste dynamiek',
      },
    },
    domains: {
      sintonia_emotiva: {
        label: 'Emotionele afstemming',
        high: 'Jullie voelen je thuis',
        medium: 'Een thuis dat je samen bouwt',
        low: 'Waar zoeken jullie veiligheid?',
      },
      attrazione: {
        label: 'Aantrekking',
        high: 'Chemie en verlangen',
        medium: 'Een chemie die om ontcijfering vraagt',
        low: 'Wat brengt jullie werkelijk dichterbij?',
      },
      comunicazione: {
        label: 'Communicatie',
        high: 'De woorden stromen',
        medium: 'Verschillende talen, dezelfde bedoeling',
        low: 'Waar loopt het gesprek vast?',
      },
      stabilita: {
        label: 'Stabiliteit',
        high: 'Stevigheid door de tijd heen',
        medium: 'Het fundament kies je zelf',
        low: 'Waar rust het koppel op?',
      },
      crescita: {
        label: 'Groei',
        high: 'Jullie brengen elkaar in beweging',
        medium: 'Groei met wrijving',
        low: 'Wat houdt jullie stil?',
      },
      tensione: {
        label: 'Spanning',
        high: 'Wrijving die transformeert',
        medium: 'Opbouwende schuring',
        low: 'Schijnbare of echte rust?',
      },
    },
    excerptCaption: 'Fragment uit de samenvatting van jullie duiding',
    offerBullets: [
      'Acht delen: portret, chemie, communicatie, emotionele wereld, uitdagingen, stabiliteit, karmisch patroon, richting',
      'Downloadbare pdf, blijvende toegang',
      'Ongeveer 10 pagina\'s in helder Nederlands',
    ],
    faqTitle: 'Veelgestelde vragen',
    faqItems: [
      {
        q: 'Waar is de synastrie op gebaseerd?',
        a: 'De synastrie vergelijkt de echte planeetposities op het geboortemoment van allebei. We gebruiken niet het algemene zonneteken: we berekenen ieders volledige geboortehoroscoop en analyseren de aspecten tussen de twee horoscopen.',
      },
      {
        q: 'Kan ik de synastrie cadeau doen?',
        a: 'Zeker. Je hebt alleen de geboortegegevens van beide personen nodig. Na de betaling krijg je de pdf per mail: die kun je doorsturen of uitprinten als cadeau.',
      },
      {
        q: 'Hoe lang duurt het voor de duiding er is?',
        a: 'De duiding wordt binnen een paar minuten na de betaling gemaakt. Je krijgt een mail met de link naar de pdf en de webversie.',
      },
      {
        q: 'Werkt het ook voor stellen in crisis of die elkaar net kennen?',
        a: 'De synastrie schetst het potentieel van de relatie, niet de huidige stand van zaken. Ze helpt zowel om de dynamiek van een langdurige relatie te begrijpen als om een nieuwe verbinding te verkennen.',
      },
    ],
  },
  offerCard: {
    defaultBullets: [
      'Acht delen: portret, chemie, communicatie, emotionele wereld, uitdagingen, stabiliteit, karmisch patroon, richting',
      'Downloadbare pdf, blijvende toegang',
      'Ongeveer 10 pagina\'s in helder Nederlands',
    ],
    kicker: 'De volledige duiding',
    titleLine1: 'Een volledige astrologische duiding',
    defaultSubtitle: 'over jullie relatie',
    defaultCta: 'Haal de volledige synastrie',
    loadingCta: 'Betaling openen…',
    secureNote: 'Veilig en beschermd betalen. Je krijgt een mail om bij de duiding te komen.',
  },
  success: {
    titleProblem: 'Er ging iets mis',
    titleOk: 'Dank je, betaling ontvangen',
    paypalError:
      'We konden de PayPal-betaling niet bevestigen. Laat het ons weten als het bedrag toch is afgeschreven.',
    capturing: 'We bevestigen de PayPal-betaling…',
    preparing: 'Ik maak je account klaar. Een moment…',
  },
  activate: {
    titles: {
      signup: 'Maak je account aan',
      signin: 'Log in op je account',
      forgot: 'Herstel de toegang',
    },
    subtitles: {
      signup: 'Om bij jullie synastrierapport te komen',
      signin: 'Vul je inloggegevens in om bij jullie synastrierapport te komen.',
      forgot: 'Vul je e-mailadres in: we sturen je een link om je wachtwoord opnieuw in te stellen.',
    },
    toasts: {
      checkEmailReset: {
        title: 'Kijk even in je mail',
        description: 'Is het adres bij ons bekend, dan krijg je een link om je wachtwoord opnieuw in te stellen.',
      },
      alreadyRegistered: 'Er bestaat al een account met dit e-mailadres. Log in.',
      wrongCredentials: 'E-mailadres of wachtwoord klopt niet.',
    },
  },
  reportProcessing: {
    preparing: 'We maken jullie rapport klaar',
    writing: 'Ik schrijf jullie rapport. Nog een paar minuten...',
    starting: 'Ik begin met het schrijven van het rapport...',
    duration: 'Het maken van het rapport duurt 1 tot 3 minuten.',
    errorTitle: 'Er is een probleem',
    errors: {
      sessionNotFound: 'Ik kan je sessie niet vinden. Schrijf ons als het probleem blijft.',
      failed: 'Het maken is mislukt. Schrijf ons als het probleem blijft.',
      timeout: 'Het maken duurt langer dan verwacht. Probeer het over een paar minuten opnieuw.',
    },
  },
  report: {
    title: 'Jullie synastrie',
    personA: 'Persoon A',
    personB: 'Persoon B',
    yourMap: 'Jullie kaart',
    mapLabels: {
      cosa_siete: 'Wat jullie zijn',
      dove_brillate: 'Waar jullie schitteren',
      dove_inciampate: 'Waar jullie struikelen',
      dove_andate: 'Waar jullie heen gaan',
    },
    sixDomains: 'De zes domeinen van jullie relatie',
    coupleChart: 'De horoscoop van het koppel',
    downloading: 'Pdf klaarmaken...',
    downloadPdf: 'Download de pdf',
  },
  radar: {
    sintonia_emotiva: 'Afstemming',
    attrazione: 'Aantrekking',
    comunicazione: 'Communicatie',
    stabilita: 'Stabiliteit',
    crescita: 'Groei',
    tensione: 'Spanning',
  },
  ringDefaultLabel: 'Compatibiliteit',
  ringAria: (score) => `Score ${score} van de 100`,
  archetypeLabel: 'Archetype',
  archetypes: {
    soulmates: {
      label: 'Zielsverwanten',
      definizione:
        'Zeldzame combinatie van passie en diepe duurzaamheid: sterke romantische afstemming, gedragen door een stabiele structuur.',
    },
    kindred_spirits: {
      label: 'Verwante zielen',
      definizione:
        'Diep emotioneel begrip met weinig wrijving: een afstemming die vanzelfsprekend aanvoelt.',
    },
    opposites_attract: {
      label: 'Tegenpolen die aantrekken',
      definizione:
        'Sterke romantische intensiteit, gevoed door uitgesproken verschillen: de spanning hoort bij de aantrekking.',
    },
    karmic_lesson: {
      label: 'Karmische les',
      definizione:
        'Veeleisende dynamiek die er is om te laten groeien: ze vraagt bewustzijn en geeft transformatie terug.',
    },
    steady_rock: {
      label: 'Vaste rots',
      definizione: 'Stevig fundament en betrouwbaarheid: een koppel om op te bouwen door de tijd heen.',
    },
    intellectual_powerhouse: {
      label: 'Sterke mentale afstemming',
      definizione: 'Uitzonderlijke mentale verbinding: ideeën, woorden en nieuwsgierigheid stromen moeiteloos.',
    },
    magnetic_attraction: {
      label: 'Magnetische aantrekking',
      definizione: 'Romantische en fysieke chemie voert de boventoon: de aantrekking is de rode draad.',
    },
    long_term_anchor: {
      label: 'Anker voor de lange termijn',
      definizione: 'Een stevige basis om de toekomst op te bouwen: stabiliteit gaat voor bruis.',
    },
    mental_synergy: {
      label: 'Mentale synergie',
      definizione: 'Uitstekende intellectuele band: communicatie en plannen zijn jullie gemeenschappelijke terrein.',
    },
    volatile_spark: {
      label: 'Vluchtige vonk',
      definizione: 'Hoge energie, intense dynamiek: transformerend als je haar toelaat, uitputtend als je haar ondergaat.',
    },
    catalyst_for_change: {
      label: 'Katalysator voor verandering',
      definizione: 'Jullie prikkelen elkaars groei: een koppel dat in beweging brengt.',
    },
    deep_bond: {
      label: 'Diepe band',
      definizione: 'Diepe emotionele veiligheid: een koppel waarin je je gezien voelt zonder uitleg.',
    },
    balanced_connection: {
      label: 'Evenwichtige verbinding',
      definizione: 'Een stabiele mix van verschillende energieën: geen enkel thema domineert, het evenwicht is de sleutel.',
    },
    discordant_layout: {
      label: 'Dissonante configuratie',
      definizione:
        'Aanzienlijke wrijving die bewuste inzet vraagt: het koppel werkt wanneer allebei ervoor kiezen.',
    },
  },
};

export default coppia;
