import type { Messages } from '@/i18n';

const coppia: Messages['coppia'] = {
  titles: {
    landing: (siteName) => `Parin synastria | ${siteName}`,
    quiz: (siteName) => `Parin synastria – kysely | ${siteName}`,
    processing: (siteName) => `Synastria – käsittelyssä | ${siteName}`,
    teaser: (siteName) => `Synastria – esikatselu | ${siteName}`,
    success: (siteName) => `Maksu vastaanotettu | ${siteName}`,
    activate: (siteName) => `Synastria – aktivoi tilisi | ${siteName}`,
    reportProcessing: (siteName) => `Synastria – luodaan | ${siteName}`,
    report: (siteName) => `Parin synastria – raportti | ${siteName}`,
  },
  landing: {
    heroLine1: 'Suhteenne',
    heroLine2: 'tähtien valossa',
    heroSubtitle:
      'Oletteko koskaan miettineet, miksi joissakin asioissa ymmärrätte toisianne heti, mutta toisissa otatte aina yhteen? Synastria on astrologian vastaus tähän kysymykseen.',
    cta: 'Aloita kysely',
    socialProofLine1: 'Yli 800 paria on jo tutustunut',
    socialProofLine2: 'omaan synastriaansa',
    discoverKicker: 'Mitä saatte selville',
    discoverTitleLine1: 'Ei parisuhdehoroskooppi.',
    discoverTitleLine2: 'Oikea tulkinta.',
    discoverItems: [
      {
        title: 'Parin arkkityyppi',
        body: 'Millainen suhde teillä on? 14 erilaista astrologista asetelmaa, laskettuna planeettojenne todellisista asennoista.',
      },
      {
        title: 'Kuusi yhteensopivuuslukua',
        body: 'Tunneyhteys, vetovoima, viestintä, vakaus, kasvu, jännite. Jokainen mitattu, selitetty ja suhteutettu kokonaisuuteen.',
      },
      {
        title: 'Kahdeksan tulkinnan osiota',
        body: 'Parin muotokuva, kemia, viestintä, tunnemaailma, haasteet, vakaus, karmakuvio, suunta. Selkeällä suomella.',
      },
    ],
    howKicker: 'Näin se toimii',
    howSteps: [
      'Antakaa molempien syntymätiedot: päivä, kellonaika (jos tiedätte sen) ja paikka.',
      'Laskemme kummankin syntymäkartan ja katsomme, miten ne asettuvat päällekkäin. Juuri tätä synastria on.',
      'Saatte koko raportin: noin 10 sivua suomeksi.',
    ],
    ctaNote: 'Muutama nopea kysymys · Ilmainen esikatselu, ei rekisteröitymistä',
    plateCaption: 'Taulu I · Synastriakartta',
    quotePlateCaption: 'Taulu II',
    quote:
      'Kahta syntymäkarttaa ei lasketa yhteen, vaan ne asetetaan päällekkäin. Suhde näkyy siinä, missä ne kohtaavat.',
    closingLine: 'Aloittakaa kahdesta kartastanne. Loput tarinasta löytyy niistä.',
    seoDescription:
      'Synastria vertaa kahta syntymäkarttaa ja kertoo, miksi joissakin asioissa ymmärrätte toisianne heti ja toisissa ette. Parin arkkityyppi, kuusi yhteensopivuuslukua ja kahdeksan tulkinnan osiota suomeksi.',
  },
  quiz: {
    date: {
      confirmHint: 'Selaa tai napauta rullia vahvistaaksesi syntymäpäivän.',
      day: 'Päivä',
      month: 'Kuukausi',
      year: 'Vuosi',
    },
    time: {
      hour: 'Tunti',
      minute: 'Minuutit',
      unknownLabel: 'En tiedä',
      unknownNote:
        'Ilman kellonaikaa synastria jää tämän henkilön osalta osittaiseksi (ei huoneita eikä nousevaa merkkiä). Jatka rauhassa, muu analyysi on silti pätevä.',
      confirmHint: 'Napauta rullaa vahvistaaksesi ajan tai valitse ”En tiedä”.',
    },
    place: {
      placeholder: 'esim. Helsinki, Tampere, Turku...',
      suggestionHint: 'Valitse paikka ehdotuksista, niin tulkinta on tarkempi.',
      error: 'Emme löydä tätä paikkaa. Valitse ehdotus listasta.',
    },
    name: {
      placeholderA: 'Nimesi',
      placeholderB: 'Kumppanisi nimi',
    },
    context: {
      title: 'Kuinka kauan olette olleet yhdessä?',
      durations: {
        under_1y: 'Alle 1 vuosi',
        '1_to_3y': '1–3 vuotta',
        '3_to_7y': '3–7 vuotta',
        '7_to_15y': '7–15 vuotta',
        over_15y: 'Yli 15 vuotta',
        skip: 'Jätän vastaamatta',
      },
    },
    firstMove: {
      question: 'Kuka otti ensimmäisen askeleen?',
      options: {
        self: 'Minä',
        partner: 'Kumppanini',
        neither: 'Ei kumpikaan – se vain tapahtui',
      },
    },
    focus: {
      question: 'Mitä haluaisitte ymmärtää paremmin?',
      options: [
        'Miksi otamme aina yhteen samoista asioista',
        'Onko meillä yhteistä tulevaisuutta',
        'Miten me oikeasti toimimme',
        'Missä voimme kasvaa yhdessä',
      ],
      skip: 'Ohita tämä kysymys',
    },
    people: {
      nameLabel: 'Nimi',
      placeLabel: 'Syntymäpaikka',
      titleA: 'Sinun syntymätietosi',
      hintA: 'Nimi, päivä ja paikka. Kellonajan kysymme myöhemmin.',
      titleB: 'Kumppanisi syntymätiedot',
      hintB: 'Samat kolme asiaa.',
    },
    times: {
      title: 'Mihin aikaan synnyitte?',
      hint: 'Kellonajan avulla lasketaan huoneet ja nouseva merkki. Jos ette tiedä sitä, voitte silti jatkaa.',
      you: 'Sinä',
      partner: 'Kumppanisi',
    },
    helper: {
      almostDone: 'Melkein valmista',
      lastStep: 'Viimeinen vaihe',
    },
    missing: {
      date: 'Valitse päivä, kuukausi ja vuosi vahvistaaksesi syntymäpäivän.',
      time: 'Valitse tunti ja minuutit vahvistaaksesi ajan tai valitse ”En tiedä”.',
    },
    back: 'Takaisin',
    next: 'Jatka',
    resolving: 'Tarkistetaan...',
    finalCta: 'Laske synastria',
  },
  processing: {
    errorTitle: 'Jokin meni pieleen',
    errors: {
      createSession: 'Istunnon luominen ei onnistunut. Yritä muutaman sekunnin kuluttua uudelleen.',
      timeout: 'Tämä kestää odotettua kauemmin. Yritä hetken päästä uudelleen.',
      failed: 'Synastrian laskeminen epäonnistui. Yritä uudelleen.',
    },
    backToQuiz: 'Takaisin kyselyyn',
    title: 'Laskemme synastriaanne',
    body: 'Asetamme syntymäkartat päällekkäin ja katsomme, miten ne kohtaavat. Tähän menee vain muutama sekunti.',
  },
  teaser: {
    kicker: 'Parin synastria',
    personA: 'Henkilö A',
    personB: 'Henkilö B',
    wrongData: 'Eivätkö tiedot ole oikein?',
    overallHigh:
      'Teidän välillänne on vahva pohja. Koko tulkinta näyttää tarkasti, mistä tämä sopusointu syntyy ja miten voitte vaalia sitä jatkossakin.',
    overallMedium:
      'Suhteessanne on sekä vahvuuksia että avoimia kysymyksiä. Juuri tällaisesta asetelmasta syntyy rikkain tulkinta, koska ymmärrettävää ja hyödynnettävää on paljon.',
    overallLow:
      'Luvut eivät ole arvosana: ne kertovat, missä suhde sujuu ja missä se kaipaa huomiota. Parit, joiden dynamiikka on monisyinen, saavat tulkinnasta eniten irti.',
    primaryCta: 'Hanki koko synastria',
    securePayment: 'Turvallinen ja suojattu maksu',
    framing: {
      high: {
        ringLabel: 'Sopusointu',
        contextLine:
          'Korkea pistemäärä kertoo hedelmällisestä maaperästä. Parhaillakin kartoilla on kuitenkin sokeita pisteitä: raportti käy ne läpi yksi kerrallaan.',
        domainsSubtitle:
          'Koko tulkinnassa jokaisesta luvusta tulee oma sivunsa, joka nojaa planeettojenne todellisiin asentoihin.',
        ctaLabel: 'Lue tulkinta',
        offerSubtitle: 'suhteestanne',
        extraBullet: null,
      },
      medium: {
        ringLabel: 'Dynamiikka',
        contextLine:
          'Keskitason pistemäärä kertoo suhteesta, jossa on enemmän vivahteita kuin varmuuksia. Juuri vivahteet tekevät tulkinnasta mielenkiintoisen.',
        domainsSubtitle:
          'Jokainen luku herättää kysymyksen. Koko tulkinta vastaa niihin planeettojenne todellisten asentojen pohjalta.',
        ctaLabel: 'Lue tulkinta',
        offerSubtitle: 'suhteestanne',
        extraBullet: 'Mikä toimii ja mikä kaipaa huomiota, alue alueelta',
      },
      low: {
        ringLabel: 'Monimutkaisuus',
        contextLine:
          'Matala pistemäärä ei kerro, kuinka paljon pidätte toisistanne, vaan kuinka paljon on ymmärrettävää. Monimutkaiset suhteet antavat eniten takaisin, kun ne luetaan hyvin.',
        domainsSubtitle:
          'Matalat luvut eivät ole tuomioita vaan kohtia, joissa suhde kaipaa eniten huomiota. Koko tulkinta selittää syyn planeetta planeetalta.',
        ctaLabel: 'Tutustu dynamiikkaan',
        offerSubtitle: 'jotta ymmärrätte suhdettanne',
        extraBullet: 'Vaikeimpien kohtien astrologiset syyt',
      },
    },
    domains: {
      sintonia_emotiva: {
        label: 'Tunneyhteys',
        high: 'Tunnette olevanne kotona',
        medium: 'Turvapaikka, jota rakennetaan',
        low: 'Mistä etsitte turvaa?',
      },
      attrazione: {
        label: 'Vetovoima',
        high: 'Kemia ja halu',
        medium: 'Kemiaa, joka vaatii tulkintaa',
        low: 'Mikä teitä oikeasti vetää yhteen?',
      },
      comunicazione: {
        label: 'Viestintä',
        high: 'Sanat soljuvat',
        medium: 'Eri kielet, sama tarkoitus',
        low: 'Missä keskustelu takkuaa?',
      },
      stabilita: {
        label: 'Vakaus',
        high: 'Kestää ajan hammasta',
        medium: 'Perusta, jonka valitsette itse',
        low: 'Mihin suhde nojaa?',
      },
      crescita: {
        label: 'Kasvu',
        high: 'Saatte toisenne liikkeelle',
        medium: 'Kasvua kitkan kautta',
        low: 'Mikä pitää teidät paikallaan?',
      },
      tensione: {
        label: 'Jännite',
        high: 'Kitkaa, joka muuttaa',
        medium: 'Rakentavaa kitkaa',
        low: 'Näennäinen vai todellinen tyyneys?',
      },
    },
    excerptCaption: 'Ote tulkintanne yhteenvedosta',
    offerBullets: [
      'Kahdeksan osiota: muotokuva, kemia, viestintä, tunnemaailma, haasteet, vakaus, karmakuvio, suunta',
      'Ladattava PDF, pysyvä pääsy',
      'Noin 10 sivua selkeällä suomella',
    ],
    faqTitle: 'Usein kysytyt kysymykset',
    faqItems: [
      {
        q: 'Mihin synastria perustuu?',
        a: 'Synastria vertaa planeettojen todellisia asentoja kummankin syntymähetkellä. Emme tyydy pelkkään aurinkomerkkiin: laskemme kummankin koko syntymäkartan ja tutkimme karttojen välisiä aspekteja.',
      },
      {
        q: 'Voinko antaa synastrian lahjaksi?',
        a: 'Totta kai. Tarvitset vain molempien syntymätiedot. Maksun jälkeen saat PDF:n sähköpostiisi: voit välittää sen eteenpäin tai tulostaa sen lahjaksi.',
      },
      {
        q: 'Kuinka nopeasti saan tulkinnan?',
        a: 'Tulkinta luodaan muutamassa minuutissa maksun jälkeen. Saat sähköpostiviestin, jossa on linkki PDF-tiedostoon ja verkkoversioon.',
      },
      {
        q: 'Toimiiko se myös kriisissä oleville tai vasta tutustuneille pareille?',
        a: 'Synastria kuvaa suhteen mahdollisuuksia, ei sen tämänhetkistä tilaa. Siitä on apua sekä pitkän suhteen dynamiikan ymmärtämisessä että uuden suhteen alussa.',
      },
    ],
  },
  offerCard: {
    defaultBullets: [
      'Kahdeksan osiota: muotokuva, kemia, viestintä, tunnemaailma, haasteet, vakaus, karmakuvio, suunta',
      'Ladattava PDF, pysyvä pääsy',
      'Noin 10 sivua selkeällä suomella',
    ],
    kicker: 'Koko tulkinta',
    titleLine1: 'Kattava astrologinen tulkinta',
    defaultSubtitle: 'suhteestanne',
    defaultCta: 'Hanki koko synastria',
    loadingCta: 'Avataan kassaa…',
    secureNote: 'Turvallinen ja suojattu maksu. Saat sähköpostiisi linkin tulkintaan.',
  },
  success: {
    titleProblem: 'Jokin meni pieleen',
    titleOk: 'Kiitos, maksu on vastaanotettu',
    paypalError:
      'Emme onnistuneet vahvistamaan PayPal-maksua. Ota meihin yhteyttä, jos summa on jo veloitettu.',
    capturing: 'Vahvistamme PayPal-maksua…',
    preparing: 'Valmistelemme tiliäsi. Hetki vain…',
  },
  activate: {
    titles: {
      signup: 'Luo tilisi',
      signin: 'Kirjaudu tilillesi',
      forgot: 'Palauta pääsy',
    },
    subtitles: {
      signup: 'Tilin avulla pääset synastriaraporttiisi.',
      signin: 'Anna tunnuksesi, niin pääset synastriaraporttiisi.',
      forgot: 'Kirjoita sähköpostiosoitteesi, niin lähetämme linkin uuden salasanan asettamiseen.',
    },
    toasts: {
      checkEmailReset: {
        title: 'Tarkista sähköpostisi',
        description: 'Jos osoite on rekisteröity, saat linkin uuden salasanan asettamiseen.',
      },
      alreadyRegistered: 'Tällä sähköpostiosoitteella on jo tili. Kirjaudu sisään.',
      wrongCredentials: 'Sähköpostiosoite tai salasana on väärä.',
    },
  },
  reportProcessing: {
    preparing: 'Valmistelemme raporttianne',
    writing: 'Kirjoitamme raporttianne. Tämä vie muutaman minuutin…',
    starting: 'Aloitamme raportin kirjoittamisen…',
    duration: 'Raportin luominen kestää 1–3 minuuttia.',
    errorTitle: 'Jokin meni pieleen',
    errors: {
      sessionNotFound: 'Istuntoasi ei löydy. Ota meihin yhteyttä, jos ongelma jatkuu.',
      failed: 'Raportin luominen epäonnistui. Ota meihin yhteyttä, jos ongelma jatkuu.',
      timeout: 'Luominen kestää odotettua pidempään. Yritä uudelleen muutaman minuutin kuluttua.',
    },
  },
  report: {
    title: 'Synastrianne',
    personA: 'Henkilö A',
    personB: 'Henkilö B',
    yourMap: 'Suhteenne kartta',
    mapLabels: {
      cosa_siete: 'Keitä te olette',
      dove_brillate: 'Missä loistatte',
      dove_inciampate: 'Missä kompastutte',
      dove_andate: 'Minne olette menossa',
    },
    sixDomains: 'Suhteenne kuusi osa-aluetta',
    coupleChart: 'Parin synastriakartta',
    downloading: 'Valmistellaan PDF:ää...',
    downloadPdf: 'Lataa PDF',
  },
  radar: {
    sintonia_emotiva: 'Tunneyhteys',
    attrazione: 'Vetovoima',
    comunicazione: 'Viestintä',
    stabilita: 'Vakaus',
    crescita: 'Kasvu',
    tensione: 'Jännite',
  },
  ringDefaultLabel: 'Yhteensopivuus',
  ringAria: (score) => `Pistemäärä ${score}/100`,
  archetypeLabel: 'Arkkityyppi',
  archetypes: {
    soulmates: {
      label: 'Elämänkumppanit',
      definizione:
        'Harvinainen yhdistelmä intohimoa ja syvää pysyvyyttä: vahva romanttinen yhteys, jota vakaa rakenne kantaa.',
    },
    kindred_spirits: {
      label: 'Samalla aaltopituudella',
      definizione:
        'Syvä tunneymmärrys ja vain vähän kitkaa: sopusointu, joka tuntuu luontevalta.',
    },
    opposites_attract: {
      label: 'Vastakohdat vetävät toisiaan puoleensa',
      definizione:
        'Voimakas romanttinen veto, jota selvät erot ruokkivat: jännite on osa vetovoimaa.',
    },
    karmic_lesson: {
      label: 'Opettava suhde',
      definizione:
        'Vaativa asetelma, jonka tarkoitus on kasvattaa: se edellyttää tietoista otetta ja palkitsee muutoksella.',
    },
    steady_rock: {
      label: 'Vankka kallio',
      definizione: 'Vankka perusta ja luotettavuus: pari, jonka varaan voi rakentaa pitkäksi aikaa.',
    },
    intellectual_powerhouse: {
      label: 'Vahva ajatusyhteys',
      definizione: 'Poikkeuksellinen älyllinen yhteys: ideat, sanat ja uteliaisuus virtaavat sujuvasti.',
    },
    magnetic_attraction: {
      label: 'Magneettinen vetovoima',
      definizione: 'Romanttinen ja fyysinen kemia hallitsee: vetovoima on suhteen punainen lanka.',
    },
    long_term_anchor: {
      label: 'Pitkän linjan ankkuri',
      definizione: 'Kestävä pohja, jolle tulevaisuuden voi rakentaa: vakaus tulee ennen kuohuntaa.',
    },
    mental_synergy: {
      label: 'Ajatusten yhteispeli',
      definizione: 'Erinomainen älyllinen suhde: viestintä ja suunnittelu ovat yhteistä maaperäänne.',
    },
    volatile_spark: {
      label: 'Leimahtava kipinä',
      definizione: 'Paljon virtaa ja kiivas dynamiikka: muuttava, jos sen ottaa vastaan, uuvuttava, jos sitä vain kestää.',
    },
    catalyst_for_change: {
      label: 'Muutoksen vauhdittajat',
      definizione: 'Vauhditatte toistenne kasvua: pari, joka saa asiat liikkeelle.',
    },
    deep_bond: {
      label: 'Syvä side',
      definizione: 'Syvä tunneturva: pari, jossa kumpikin tulee nähdyksi ilman selityksiä.',
    },
    balanced_connection: {
      label: 'Tasapainoinen yhteys',
      definizione: 'Vakaa sekoitus erilaisia vahvuuksia: mikään yksittäinen teema ei hallitse, vaan tasapaino ratkaisee.',
    },
    discordant_layout: {
      label: 'Kitkainen asetelma',
      definizione:
        'Merkittävää kitkaa, joka vaatii tietoista ponnistelua: pari toimii, kun molemmat valitsevat sen.',
    },
  },
};

export default coppia;
