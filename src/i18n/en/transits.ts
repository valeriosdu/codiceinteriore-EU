const transits = {
  upsell: {
    errors: {
      noUrl: 'URL not available',
      checkout: "We couldn't open the payment page. Please try again in a moment.",
    },
    ariaActive: 'This month\'s transits active',
    ariaInactive: 'Activate the monthly transits reading',
    activeBadge: 'Active',
    activeTitle: "You have this month's transits",
    validUntil: 'Valid until',
    validUntilFallback: 'the end of the included period',
    activeBody:
      'You have access through the date shown. To keep going afterward, you can renew with the monthly reading, or stop here.',
    kicker: 'This month\'s transits',
    title: 'You\'ve read your Birth Chart. Now you can read the present moment.',
    body: "Your birth chart is your structure, set at birth: it doesn't change. The sky, though, moves every day. Each day the planets pass over the points in your chart (your Sun, Moon, Ascendant, and so on) and activate certain parts of it depending on the aspect they form.",
    monthlyListTitle: 'Each month you get a reading that tells you:',
    monthlyList: [
      'Which areas of your chart are under tension, favored, or under pressure, and what to watch for',
      'The key moments of the month, with exact dates, and what to lean into week by week',
      'How long what you\'re going through will last, and what comes next',
    ],
    ctaActive: (priceLabel: string) => `Continue with monthly transits - ${priceLabel}/month`,
    ctaInactive: (priceLabel: string) => `Read this month's transits - ${priceLabel}/month`,
    renewNoteActive: 'Renews monthly, cancel anytime',
    renewNoteInactive: 'A new reading every month. Cancel anytime.',
    secureNote: 'Secure payment - Instant access',
  },
};

export default transits;
