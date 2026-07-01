const reportProcessing = {
  messages: [
    'We are retrieving your reading',
    'We are organizing the main areas',
    "We are preparing the parts you haven't seen yet",
    'We are completing your personal map',
    'In a moment you will enter the full version',
    'We are refining the most delicate details',
    'Almost ready — just a little longer',
  ],
  errors: {
    signIn: 'Sign in to your account to complete the reading you purchased.',
    profileNotFound: "We can't find your profile. Sign in again or contact us.",
    paymentMismatch: 'The payment does not match the quiz session to be completed.',
    noSession: "We can't find a quiz session linked to the payment.",
    paymentRequired:
      'Generating a new reading requires a completed payment. If you already have a reading, open it from your personal area.',
    generic:
      'Your reading is being prepared. The payment is recorded correctly, and you will receive everything by email within a few minutes. If nothing arrives after 10 minutes, contact us and we’ll be glad to help.',
  },
  errorScreen: {
    title: 'Reading under review',
    cta: 'Contact us',
  },
  verifying: 'We are verifying your access to the reading…',
  processing: {
    title: 'We are completing your reading',
    body: "You've already seen the opening. Now we are preparing your full reading, with many new elements and a complete view of your Inner Code. Don't close or refresh the page.",
    slowHint:
      "For more complex charts, preparation can take up to 10 minutes. You can stay on this page or close it: you'll receive everything by email as soon as it's ready.",
  },
};

export default reportProcessing;
