import type { Messages } from '@/i18n';

const teaser: Messages['teaser'] = {
  loading: {
    title: 'We’re completing your first reading',
    slow: 'This is taking longer than expected. Stay on this page: we’ll try again automatically in a moment.',
    normal: 'We’re checking your birth chart and insights before showing you the offer.',
    complex: 'Your chart is especially rich: we need a couple more minutes. Stay on this page, we’re almost there.',
  },
  failed: {
    title: 'We couldn’t generate the reading',
    body: 'Something isn’t working the way it should. Please try again in a moment.',
    retry: 'Try again',
  },
  toasts: {
    previewPaymentsDisabled: 'Preview: payment is disabled in preview mode.',
    stillCompleting: 'We’re still completing your first reading. Please try again shortly.',
    stillPreparing: 'We’re still preparing your reading. Please try again in a few seconds.',
  },
  hero: {
    title: (name) =>
      name ? `${name}, here’s your first reading` : 'Here’s your first reading',
    subtitle: 'What emerges from a first reading of your birth chart.',
    wrongData: 'Are the details wrong?',
  },
  openFullReport: 'Open the full reading',
  offers: {
    baseName: 'Full Reading of your Birth Chart',
    baseCta: 'Get the Full Reading',
    premiumName: 'Full Reading + 1 Month of Transits',
    premiumPromise:
      'Understand what drives you at a deeper level and read clearly the moment you’re living right now',
    premiumFeatures: [
      'Everything included in the Full Reading',
      '1 month of personalized weekly readings on the transits of the period',
      'Extra help to understand what’s stirring emotionally right now',
      'Free gift: a personal transformative poem',
    ],
    premiumCta: 'Get the Reading + Transits',
  },
  faq: {
    kicker: 'Frequently asked questions',
    heading: 'Here you’ll find answers to the most common questions before buying.',
  },
  bottomCta: 'Get the full reading',
  reassurance: {
    instantAccess: 'Instant access',
    securePayment: 'Secure payment',
    humanLanguage: 'Written in plain, human language',
  },
};

export default teaser;
