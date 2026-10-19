const checkout = {
  failed: {
    title: "We couldn't prepare the reading",
    body: 'Something is not working as it should. Try again in a few moments.',
    retry: 'Try again',
  },
  loading: {
    title: 'We are preparing the reading',
    slow: "This is taking longer than expected. Stay on this page: we'll try again automatically in a moment.",
    normal: 'We are calculating the birth chart before showing you the offer.',
  },
  toasts: {
    stillPreparingShort: 'We are still preparing the reading. Try again shortly.',
    stillPreparingRetry: 'We are still preparing the reading. Try again in a few seconds.',
  },
  hero: {
    title: (name: string) => `The reading for ${name} is ready`,
    fallbackRecipient: 'them',
    subtitle: 'We have calculated the birth chart. Choose the format to generate the full reading.',
    wrongData: 'Details not quite right?',
  },
  offers: {
    baseName: 'Full Birth Chart Reading',
    basePromise: (name: string) =>
      `To understand the emotional, relational, and personal makeup of ${name} more clearly, and see what tends to repeat in their life.`,
    baseFeatures: [
      'Understand emotional blocks, defenses, and recurring patterns in plain, human language, not technical jargon',
      'See how these patterns shape relationships, work, personal direction, and life choices',
      'Get practical pointers on what to watch for, encourage, or adjust',
      'Instant access to the reading online and by email',
    ],
    premiumPromise: (name: string) =>
      `Understand what drives ${name} at a deep level, and read the moment they are living through right now with clarity.`,
  },
};

export default checkout;
