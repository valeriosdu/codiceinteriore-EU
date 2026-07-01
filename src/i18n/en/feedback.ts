import type { Messages } from '@/i18n';

const feedback: Messages['feedback'] = {
  title: 'Tell us what you think',
  subtitle: 'Your feedback helps us make every reading sharper. It only takes a few seconds.',
  ratings: {
    positive: 'This is me',
    mixed: 'Partly',
    negative: 'Not really me',
  },
  reasons: {
    positive: ['Accurate', 'Useful', 'Well written', 'It surprised me'],
    mixed: ['Some of it, not all', 'Too generic', 'The wording', 'I wanted more depth'],
    negative: ["I don't recognize myself", 'Too generic', 'Factual errors', 'The wording'],
  },
  errors: {
    signInRequired: 'You need to be signed in to leave feedback.',
    saveRating: (detail: string) => `We couldn't save your feedback (${detail}).`,
    saveDetails: (detail: string) => `We couldn't save that (${detail}).`,
    unknown: 'unknown error',
  },
  thanksMore: 'Thank you. Want to tell us more?',
  commentPlaceholder: 'Is there a feature you wish we had, or anything else to add? (optional)',
  skip: 'Skip',
  send: 'Send',
  done: 'Thank you, this helps us improve.',
};

export default feedback;
