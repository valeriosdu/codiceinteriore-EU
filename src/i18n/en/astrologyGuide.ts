import type { Messages } from '@/i18n';

const astrologyGuide: Messages['astrologyGuide'] = {
  name: 'Astrology guide',
  openAria: 'Open the Astrology guide',
  closeAria: 'Close',
  freeBadge: (n) => `${n} free`,
  questionsCount: (n) => `${n} ${n === 1 ? 'question' : 'questions'}`,
  freeInline: (n) => `· ${n} free`,
  empty: {
    exhaustedTitle: "You've used up your questions",
    exhaustedBody: (packCredits) =>
      `Add a new pack of ${packCredits} questions to keep exploring your chart.`,
    introTitle: 'Your personal astrology guide',
    introBody:
      'Ask questions about your birth chart and, if you bought the couple synastry or the monthly transits, about those too: the answers are always personalized to your astrological data.',
    howTitle: 'How it works',
    howSteps: [
      'Ask a question below, freely or starting from the suggestions.',
      'The answer arrives within a few hours during business hours.',
      'You read it here and in your email.',
    ],
    firstQuestions: 'First 2 questions',
    free: 'Free ✦',
    additional: 'Additional questions',
    additionalValue: (packCredits, priceLabel) =>
      `${packCredits} extra questions for ${priceLabel}`,
  },
  composer: {
    genericChips: [
      'What relationship pattern am I carrying from childhood?',
      "What part of myself am I avoiding looking at right now?",
    ],
    sectionChips: {
      identity: [
        'Which side of my identity runs deepest and is least visible to others?',
        'What in my chart explains my need to feel different from everyone else?',
      ],
      emotions: [
        'Why do some emotions overwhelm me while I barely feel others?',
        'What does my tendency to shut down when I truly hurt actually hide?',
      ],
      emotions_relationships: [
        'Which emotional wound keeps getting triggered in my close relationships?',
        'Why do I tend to want the people who keep me at a distance?',
      ],
      relationships: [
        'Which relationship pattern repeats across my most important stories?',
        'What am I really looking for in a partner, beyond what I say?',
      ],
      blocks_patterns: [
        'Which pattern stops me right when I\'m about to really change?',
        'What am I protecting when I shut down or sabotage myself?',
      ],
      blocks: [
        'What does my tendency to stop right at the best moment hide?',
        'Which buried fear keeps me from taking a stand?',
      ],
      patterns: [
        'Which pattern do I recognize but still can\'t untangle?',
        'Where does my difficulty asking for what I need come from?',
      ],
      work: [
        'Which kind of work truly reflects me, beyond money and security?',
        'Why do I tend to feel drained even when I do things I love?',
      ],
      work_direction: [
        'What am I avoiding looking at in my professional path?',
        'Which direction reflects me, even if it scares me?',
      ],
      advice: [
        'What do I need to let go of now to make room for something new?',
        'Which part of myself should I focus on over the coming months?',
      ],
    } as Record<string, string[]>,
    placeholder: 'Write your question…',
    send: 'Send',
    remaining: (n) => `You have ${n} ${n === 1 ? 'question' : 'questions'} left.`,
  },
  message: {
    answerUseful: 'Helpful answer',
    answerNotUseful: 'Unhelpful answer',
    commentPlaceholder: "What didn't you like?",
    commentSend: 'Send',
    thanksFeedback: 'Thanks for the feedback.',
    pending: 'Your answer will arrive in the next few hours.',
    pendingEmail: "We'll also notify you by email.",
    failed: "We couldn't generate the answer. Your question has been credited back, you can try again.",
  },
  buyMore: {
    exhaustedHeadline: "You've used all your questions",
    nearEndHeadline: "You're about to run out of questions",
    exhaustedSub: (packCredits) =>
      `Buy ${packCredits} new questions to keep exploring your chart.`,
    nearEndSub: (packCredits) =>
      `Add another ${packCredits} questions so you don't stop right at the best part.`,
    balance: (n) => `Current balance: ${n} ${n === 1 ? 'question' : 'questions'}.`,
    buyCta: (packCredits, priceLabel) =>
      `Buy ${packCredits} questions · ${priceLabel}`,
  },
  askButton: {
    deepen: (label) => `Go deeper: ${label}`,
    deepenGeneric: 'Go deeper on this section',
    free: 'free',
  },
  toasts: {
    packActivated: (added) =>
      `Pack activated. You have ${added} ${added === 1 ? 'new question' : 'new questions'}.`,
    paymentProcessing: 'Your payment is processing. Refresh in a few seconds to see the new questions.',
    sendError: 'Something went wrong while sending.',
    noCredits: (packCredits, priceLabel) =>
      `You've used up your questions. Buy ${packCredits} more for ${priceLabel}.`,
    duplicate: "You already asked this question recently. The answer is in the thread (or on its way).",
    submitError: "We couldn't send the question. Please try again.",
    noUrl: 'URL unavailable',
    checkoutError: "We couldn't open the payment. Please try again in a moment.",
  },
};

export default astrologyGuide;
