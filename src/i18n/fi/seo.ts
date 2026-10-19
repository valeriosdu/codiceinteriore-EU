import type { Messages } from '@/i18n';

const seo: Messages['seo'] = {
  product: {
    name: 'Natal Chart Reading',
    description:
      'A personalized natal chart reading, written in English. A report of roughly 10 pages built from your birth data, with a psychological rather than predictive focus.',
    category: 'Psychological astrology',
    offerBase: 'Full Reading',
    offerPremium: 'Reading + 1 month of Transits',
  },
  contactPageName: 'Contact',
  defaultFaqs: [
    {
      question: "Astrology isn't science, isn't it nonsense?",
      answer:
        "It's not a prediction or an exact science: it's a symbolic language we use as a grid to read your inner structure. The value comes from the psychological precision of the reading, not from predictive claims. Money-back guarantee if the reading feels generic.",
    },
    {
      question: 'There are free readings online, why pay?',
      answer:
        'Free readings are technical fragments (one meaning per planet, one per house, one per aspect). Here we read the chart as one coherent whole, in plain human English, across roughly 10 pages. It is the opposite of fragmentation.',
    },
    {
      question: 'Will it tell me what to do?',
      answer:
        "No, and we say so up front. We describe how you're put together; we don't hand out motivational advice. The credibility of the product lives in that restraint.",
    },
    {
      question: 'How personalized is it really?',
      answer:
        'The reading is generated from your specific natal chart (date, time, and place of birth) plus your answers to 2 intake questions that shape the tone. Everything comes from the sky on the day you were born.',
    },
  ],
};

export default seo;
