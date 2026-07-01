import type { Messages } from '@/i18n';

const coppia: Messages['coppia'] = {
  titles: {
    landing: (siteName) => `Couple Synastry | ${siteName}`,
    quiz: (siteName) => `Couple Synastry - Quiz | ${siteName}`,
    processing: (siteName) => `Synastry - Processing | ${siteName}`,
    teaser: (siteName) => `Synastry - Preview | ${siteName}`,
    success: (siteName) => `Payment received | ${siteName}`,
    activate: (siteName) => `Synastry – Activate your account | ${siteName}`,
    reportProcessing: (siteName) => `Synastry - Generating | ${siteName}`,
    report: (siteName) => `Couple Synastry - Report | ${siteName}`,
  },
  landing: {
    heroLine1: 'Your relationship,',
    heroLine2: 'read by the stars',
    heroSubtitle:
      "Have you ever wondered why you click instantly on some things and keep clashing on others? Synastry is the astrological answer to that question.",
    cta: 'Start the quiz',
    socialProofLine1: '800+ couples have already discovered',
    socialProofLine2: 'their couple synastry',
    discoverKicker: "What you'll discover",
    discoverTitleLine1: 'Not a couple horoscope.',
    discoverTitleLine2: 'A real reading.',
    discoverItems: [
      {
        title: 'The archetype of the couple',
        body: 'What kind of relationship are you? 14 distinct astrological configurations, calculated from your real planets.',
      },
      {
        title: 'Six compatibility scores',
        body: 'Emotional rapport, attraction, communication, stability, growth, tension. Measured, explained, put in context.',
      },
      {
        title: 'Eight reading sections',
        body: 'Couple portrait, chemistry, communication, emotional world, challenges, stability, karmic pattern, direction. In clear English.',
      },
    ],
    howKicker: 'How it works',
    howSteps: [
      'Enter both birth details: date, time (if you know it) and place.',
      'We calculate each birth chart and analyze the overlap: that\'s synastry.',
      'You get the full report: about 10 pages in English.',
    ],
  },
  quiz: {
    stepOf: (current, total) => `Step ${current} of ${total}`,
    personA: 'Person 1 (you)',
    personB: 'Person 2 (partner)',
    date: {
      titleA: 'When you were born',
      titleB: 'When your partner was born',
      hint: 'Scroll to pick day, month and year.',
      day: 'Day',
      month: 'Month',
      year: 'Year',
    },
    time: {
      titleA: 'What time you were born',
      titleB: 'What time your partner was born',
      hint: 'If you don\'t know it exactly, pick the closest time you can, or check "I don\'t know it" below.',
      hour: 'Hour',
      minute: 'Minutes',
      unknownLabel: "I don't know it",
      unknownNote:
        "Without the birth time, the synastry will be partial for this person (no houses or Rising). Go ahead anyway, the rest of the analysis still holds.",
    },
    place: {
      titleA: 'Where you were born',
      titleB: 'Where your partner was born',
      hint: 'City. Start typing and pick from the suggestions.',
      placeholder: 'e.g. New York, Chicago, Los Angeles...',
      suggestionHint: 'Pick a place from the suggestions for a more precise reading.',
      error: "We can't find this place. Please pick a suggestion from the list.",
    },
    name: {
      titleA: 'What is your name',
      titleB: "What is your partner's name",
      hint: "First name only, we'll use it in the report.",
      placeholderA: 'Your name',
      placeholderB: "Partner's name",
    },
    context: {
      title: 'How long have you been together?',
      hint: 'Optional. It helps the reading calibrate to the stage of your relationship.',
      durations: {
        under_1y: 'Less than 1 year',
        '1_to_3y': '1-3 years',
        '3_to_7y': '3-7 years',
        '7_to_15y': '7-15 years',
        over_15y: 'Over 15 years',
        skip: 'I prefer not to say',
      },
      focusLabel: 'Reading focus (optional)',
      focusPlaceholder: 'e.g. understanding the challenges, deciding whether to marry, easing a stuck point...',
    },
    back: 'Back',
    next: 'Next',
    resolving: 'Checking...',
    finalCta: 'Calculate the synastry',
  },
  processing: {
    errorTitle: "Something went wrong",
    errors: {
      createSession: "We couldn't create the session. Please try again in a few seconds.",
      timeout: 'Generation is taking longer than expected. Please try again shortly.',
      failed: 'Generation failed. Please try again.',
    },
    backToQuiz: 'Back to the quiz',
    title: 'Calculating your synastry',
    body: "We're putting together both birth charts and their contacts. A few seconds.",
  },
  teaser: {
    kicker: 'The synastry of',
    personA: 'Person A',
    personB: 'Person B',
    wrongData: "Details aren't right?",
    overallHigh:
      "There's a strong foundation between you. The full reading shows you exactly where this ease comes from and how to protect it over time.",
    overallMedium:
      "Your relationship has both strengths and open questions: it's the profile that gives the richest reading, because there's so much to understand and put to use.",
    overallLow:
      "The numbers aren't a grade: they show where the relationship runs smoothly and where it asks for attention. Couples with complex dynamics are the ones who discover the most in the reading.",
    primaryCta: 'Get the full synastry',
    securePayment: 'Secure, protected payment',
    framing: {
      high: {
        ringLabel: 'Affinity',
        contextLine:
          'A high score signals fertile ground. But even the best charts have blind spots: the report goes through them one by one.',
        domainsSubtitle:
          'In the full reading, every number becomes a page, anchored to your real planets.',
        ctaLabel: 'Read the reading',
        offerSubtitle: 'about your relationship',
        extraBullet: null as string | null,
      },
      medium: {
        ringLabel: 'Dynamic',
        contextLine:
          'A middle score tells of a relationship with more nuance than certainty. The nuances are exactly what make the reading interesting.',
        domainsSubtitle:
          'Every number opens a question. In the full reading, the questions find the context of your real planets.',
        ctaLabel: 'Read the reading',
        offerSubtitle: 'about your relationship',
        extraBullet: 'What works and what needs attention, area by area' as string | null,
      },
      low: {
        ringLabel: 'Complexity',
        contextLine:
          "A low score doesn't describe how much you care for each other: it describes how much there is to understand. Complex relationships are the ones that, read well, give back the most.",
        domainsSubtitle:
          "Low numbers are not verdicts: they're the points where the relationship asks for more attention. The full reading explains why, planet by planet.",
        ctaLabel: 'Understand the dynamic',
        offerSubtitle: 'to understand your relationship',
        extraBullet: 'The astrological reasons behind the harder dynamics' as string | null,
      },
    },
    domains: {
      sintonia_emotiva: {
        label: 'Emotional rapport',
        high: 'You feel at home',
        medium: 'A shelter you build together',
        low: 'Where do you look for safety?',
      },
      attrazione: {
        label: 'Attraction',
        high: 'Chemistry and desire',
        medium: 'A chemistry to decode',
        low: 'What really draws you together?',
      },
      comunicazione: {
        label: 'Communication',
        high: 'The words flow',
        medium: 'Different languages, same intent',
        low: 'Where does the dialogue stall?',
      },
      stabilita: {
        label: 'Stability',
        high: 'Built to last',
        medium: 'Foundations you choose',
        low: 'What does the couple rest on?',
      },
      crescita: {
        label: 'Growth',
        high: 'You move each other forward',
        medium: 'Expansion with friction',
        low: 'What keeps you stuck?',
      },
      tensione: {
        label: 'Tension',
        high: 'Friction that transforms',
        medium: 'Constructive friction',
        low: 'Calm on the surface or for real?',
      },
    },
    excerptCaption: 'Excerpt from the summary of your reading',
    offerBullets: [
      'Eight sections: portrait, chemistry, communication, emotional world, challenges, stability, karmic pattern, direction',
      'Downloadable PDF, permanent access',
      'About 10 pages in clear English',
    ],
    faqTitle: 'Frequently asked questions',
    faqItems: [
      {
        q: 'What is synastry based on?',
        a: "Synastry compares the real planetary positions at the moment each of you was born. We don't use a generic Sun sign: we calculate each full birth chart and analyze the aspects between the two charts.",
      },
      {
        q: 'Can I give the synastry as a gift?',
        a: "Of course. You just need to know both people's birth details. After payment you'll receive the PDF by email: you can forward it or print it as a gift.",
      },
      {
        q: 'How long does it take to get the reading?',
        a: "The reading is generated within a few minutes after payment. You'll get an email with the link to access the PDF and the web version.",
      },
      {
        q: 'Does it work for couples in crisis or who just met?',
        a: "Synastry captures the potential of the relationship, not its current state. It's useful both for understanding the dynamics of an established couple and for exploring a new connection.",
      },
    ],
  },
  offerCard: {
    defaultBullets: [
      'Eight sections: portrait, chemistry, communication, emotional world, challenges, stability, karmic pattern, direction',
      'Downloadable PDF, permanent access',
      'About 10 pages in clear English',
    ],
    kicker: 'The full reading',
    titleLine1: 'A complete astrological reading',
    defaultSubtitle: 'about your relationship',
    defaultCta: 'Get the full synastry',
    loadingCta: 'Opening checkout…',
    secureNote: "Secure, protected payment. You'll get an email to access the reading.",
  },
  success: {
    titleProblem: 'Something went wrong',
    titleOk: 'Thank you, payment received',
    paypalError:
      "We couldn't confirm the PayPal payment. Contact us if the amount was charged.",
    capturing: 'We are confirming the PayPal payment…',
    preparing: 'Setting up your account. One moment…',
  },
  activate: {
    titles: {
      signup: 'Create your account',
      signin: 'Sign in to your account',
      forgot: 'Recover access',
    },
    subtitles: {
      signup: 'To access your synastry report',
      signin: 'Enter your credentials to access your synastry report.',
      forgot: "Enter your email: we'll send you a link to reset your password.",
    },
    toasts: {
      checkEmailReset: {
        title: 'Check your email',
        description: "If the address is registered, you'll receive a link to reset your password.",
      },
      alreadyRegistered: 'An account with this email already exists. Sign in.',
      wrongCredentials: 'Incorrect email or password.',
    },
  },
  reportProcessing: {
    preparing: 'We are preparing your report',
    writing: 'Writing your report. A few minutes...',
    starting: 'Starting to write the report...',
    duration: 'Generating the report takes 1 to 3 minutes.',
    errorTitle: 'Something went wrong',
    errors: {
      sessionNotFound: "We can't find your session. Contact us if the problem persists.",
      failed: 'Generation failed. Contact us if the problem persists.',
      timeout: 'Generation is taking longer than expected. Please try again in a few minutes.',
    },
  },
  report: {
    title: 'Your synastry',
    personA: 'Person A',
    personB: 'Person B',
    yourMap: 'Your map',
    mapLabels: {
      cosa_siete: 'Who you are',
      dove_brillate: 'Where you shine',
      dove_inciampate: 'Where you stumble',
      dove_andate: "Where you're headed",
    },
    sixDomains: 'The six areas of your relationship',
    coupleChart: 'Your couple chart',
    downloading: 'Preparing PDF...',
    downloadPdf: 'Download the PDF',
  },
  radar: {
    sintonia_emotiva: 'Rapport',
    attrazione: 'Attraction',
    comunicazione: 'Communication',
    stabilita: 'Stability',
    crescita: 'Growth',
    tensione: 'Tension',
  },
  ringDefaultLabel: 'Compatibility',
  ringAria: (score) => `Score ${score} out of 100`,
  archetypeLabel: 'Archetype',
  archetypes: {
    soulmates: {
      label: 'Kindred hearts',
      definizione:
        'A rare blend of passion and lasting depth: a strong romantic bond held up by a stable structure.',
    },
    kindred_spirits: {
      label: 'Kindred spirits',
      definizione:
        'Deep emotional understanding with little friction: a rapport that feels natural.',
    },
    opposites_attract: {
      label: 'Opposites attract',
      definizione:
        'Strong romantic intensity fueled by sharp differences: the tension is part of the attraction.',
    },
    karmic_lesson: {
      label: 'Karmic lesson',
      definizione:
        'A demanding dynamic built to evolve: it asks for awareness and gives back transformation.',
    },
    steady_rock: {
      label: 'Steady rock',
      definizione: 'Solid foundations and reliability: a couple to build on over time.',
    },
    intellectual_powerhouse: {
      label: 'Powerful mental rapport',
      definizione: 'An exceptional mental connection: ideas, words and curiosity move with ease.',
    },
    magnetic_attraction: {
      label: 'Magnetic attraction',
      definizione: 'Romantic and physical chemistry leads the way: attraction is the main thread.',
    },
    long_term_anchor: {
      label: 'Long-term anchor',
      definizione: 'A solid base to build a future on: stability before sparkle.',
    },
    mental_synergy: {
      label: 'Mental synergy',
      definizione: 'A great intellectual match: communication and planning are your common ground.',
    },
    volatile_spark: {
      label: 'Volatile spark',
      definizione: 'High energy, intense dynamic: transformative when embraced, draining when endured.',
    },
    catalyst_for_change: {
      label: 'Catalyst for change',
      definizione: "You spur each other's growth: a couple that gets things moving.",
    },
    deep_bond: {
      label: 'Deep bond',
      definizione: 'Deep emotional safety: a couple where you feel seen without explaining.',
    },
    balanced_connection: {
      label: 'Balanced connection',
      definizione: 'A stable mix of different energies: nothing dominates, balance is the key.',
    },
    discordant_layout: {
      label: 'Discordant configuration',
      definizione:
        'Significant friction that calls for conscious effort: the couple works when both choose it.',
    },
  },
};

export default coppia;
