import type { Messages } from '@/i18n';

const quiz: Messages['quiz'] = {
  months: [
    'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
    'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
  ],
  steps: {
    intent: {
      question: 'Wat wil je het liefst beter begrijpen?',
      options: [
        'Mijn dynamiek in liefde en relaties',
        'Wat me tegenhoudt en waar ik kan groeien',
        'Een totaalbeeld van mezelf',
      ],
    },
    attachment: {
      question: {
        self: 'Als iemand afstand neemt of vaag wordt, neig jij instinctief naar:',
        other: 'Als iemand afstand neemt of vaag wordt, neigt deze persoon instinctief naar:',
      },
      options: {
        self: [
          'Meer contact zoeken',
          'Dichtklappen en afstand nemen',
          'Afwachten tot er een teken komt',
        ],
        other: [
          'Meer contact zoeken',
          'Dichtklappen en afstand nemen',
          'Afwachten tot er een teken komt',
        ],
      },
    },
    symptom: {
      question: 'Als je nu naar je leven kijkt, wat voel je dan het vaakst?',
      options: [
        'Ik heb het gevoel dat mij iets ontgaat wat anderen wel zien',
        'Ik weet wat ik zou moeten doen, maar het lukt me niet',
        'Ik kom vooruit, maar niet in de richting die ik wil',
        'Alles lijkt stil te staan, en niet alleen vanbinnen',
      ],
    },
    narrative: {
      question: 'Als je denkt aan wie je had kunnen zijn, wat komt er dan bij je op?',
      options: [
        'Een vrijere versie van mezelf',
        'Een meer vervulde versie van mezelf',
        'Een zekerdere versie van mezelf, met minder twijfel',
        'Een beslistere versie van mezelf, minder afwachtend',
      ],
    },
    date: {
      title: { self: 'Je geboortedatum', other: 'De geboortedatum van de ander' },
      day: 'Dag',
      month: 'Maand',
      year: 'Jaar',
    },
    time: {
      title: { self: 'Je geboortetijd', other: 'De geboortetijd van de ander' },
      hour: 'Uur',
      minute: 'Minuten',
      hint: 'Weet je het niet precies, kies dan de tijd die er het dichtst bij komt.',
    },
    place: {
      title: { self: 'Je geboorteplaats', other: 'De geboorteplaats van de ander' },
      label: 'Geboorteplaats',
      placeholder: 'bijv. Amsterdam, Rotterdam, Utrecht...',
      hint: 'Kies een plaats uit de suggesties voor een preciezere duiding.',
      error: 'We konden deze plaats niet vinden. Kies een suggestie uit de lijst.',
    },
    focus: {
      question: {
        self: 'Welk deel van je relatiedynamiek wil je beter begrijpen?',
        other: 'Welk deel van de relatiedynamiek van de ander wil je beter begrijpen?',
      },
      options: {
        self: ['Hoe je kiest', 'Welke patronen je herhaalt', 'Hoe je jezelf beschermt', 'Wat je echt zoekt'],
        other: [
          'Hoe die persoon kiest',
          'Welke patronen die persoon herhaalt',
          'Hoe die persoon zich beschermt',
          'Wat die persoon echt zoekt',
        ],
      },
    },
    name: {
      title: { self: 'Je naam', other: 'De naam van de ander' },
      label: 'Naam',
      placeholder: 'bijv. Sanne, Lotte, Daan...',
      hint: {
        self: 'We gebruiken je naam om de duiding persoonlijk te maken.',
        other: 'We gebruiken de naam om de duiding persoonlijk te maken.',
      },
    },
  },
  helper: {
    focus: 'Bijna klaar',
    name: 'Nog één stap',
  },
  cta: {
    continue: 'Doorgaan',
    resolvingPlace: 'Plaats controleren…',
    toPayment: 'Naar de betaling',
    seeReading: 'Bekijk je duiding',
  },
  back: 'Terug',
};

export default quiz;
