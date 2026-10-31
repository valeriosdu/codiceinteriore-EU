import type { Messages } from '@/i18n';

const quiz: Messages['quiz'] = {
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  birthDateLabel(day: number, month: number, year: number) {
    return `${day} ${(this.months[month - 1] || '').toLowerCase()} ${year}`;
  },
  stepOf: (current: number, total: number) => `${current} of ${total}`,
  steps: {
    intent: {
      question: 'What are you most curious to understand?',
      options: [
        'My relationship and love dynamics',
        'What’s holding me back and where to grow',
        'A general overview of who I am',
      ],
    },
    attachment: {
      question: {
        self: 'When someone pulls away or becomes unclear, you instinctively tend to:',
        other: 'When someone pulls away or becomes unclear, this person instinctively tends to:',
      },
      options: {
        self: [
          'Seek more contact',
          'Withdraw and create distance',
          'Wait for a signal',
        ],
        other: [
          'Seek more contact',
          'Withdraw and create distance',
          'Wait for a signal',
        ],
      },
    },
    symptom: {
      question: 'What do you feel most often when you look at your life today?',
      options: [
        'It feels like I’m missing something that others can see',
        'I know what I should do, but I can’t seem to do it',
        'I keep moving, but it doesn’t feel like I’m headed where I want',
        'Everything feels stuck, and not just inside me',
      ],
    },
    bridge: {
      youAnswered: 'You answered',
      exampleLabel: 'Illustrative example',
      showsLabel: 'Your birth chart can show you:',
      chartIs:
        'A birth chart is a snapshot of the sky at the moment you were born. It doesn’t predict the future: it describes how you’re built, what lights you up, what holds you back and the rhythm you work at.',
      next: 'All you need is your date, time and place of birth. Your opening reading is free.',
      variants: [
        {
          headline: 'You’re not missing something. You’re missing the map.',
          body: 'It’s not that other people see more. They simply perceive things differently from you, and your way has a clear structure that can be read.',
          shows: 'how you perceive things and what you filter out without noticing it.',
          legend: ['Moon', 'Mercury', 'Ascendant'],
        },
        {
          headline: 'It’s not laziness, and it’s not a lack of willpower.',
          body: 'Everyone gets started differently: some people light up right away, others need the right conditions. Knowing yours changes how you judge yourself.',
          shows: 'your way of getting started, what lights you up and what holds you back.',
          legend: ['Mars', 'Saturn', 'Square'],
        },
        {
          headline: 'You’re moving. But where would your own rhythm take you?',
          body: 'Moving forward isn’t enough if circumstances chose the direction. What matters is the one you’re built for, and the point where your path shifted.',
          shows: 'the direction you’re built for and where your path shifted.',
          legend: ['Midheaven', 'Lunar Nodes'],
        },
        {
          headline: 'Sometimes everything stalls at once. Usually it’s a phase, not a permanent state.',
          body: 'When everything feels stuck, you’re often going through a period that has a beginning and an end. You can read when it starts and when it passes.',
          shows: 'your cycles, including when a phase opens and when it closes.',
          legend: ['Saturn', 'Jupiter', 'Phase'],
        },
      ],
    },
    narrative: {
      question: 'When you think about who you could have been, what comes to mind?',
      options: [
        'A freer version of me',
        'A more fulfilled version of me',
        'A more confident version of me, with fewer doubts',
        'A more decisive version of me, less stuck waiting',
      ],
    },
    date: {
      title: { self: 'Your date of birth', other: 'Their date of birth' },
      day: 'Day',
      month: 'Month',
      year: 'Year',
    },
    time: {
      title: { self: 'Your time of birth', other: 'Their time of birth' },
      hour: 'Hour',
      minute: 'Minutes',
      hint: 'If you don’t know it exactly, pick the closest time you can.',
      unknown: {
        label: { self: 'I don’t know my time of birth', other: 'I don’t know their time of birth' },
        note: 'We’ll use midday: your reading stays valid, but the Rising sign and houses will be approximate.',
      },
    },
    place: {
      title: { self: 'Your place of birth', other: 'Their place of birth' },
      label: 'Place of birth',
      placeholder: 'e.g. New York, Chicago, Los Angeles...',
      hint: 'Choose a place from the suggestions for a more precise reading.',
      error: 'We can’t find this place. Please choose a suggestion from the list.',
    },
    focus: {
      question: {
        self: 'Which part of your relationship dynamics do you want to understand better?',
        other: 'Which part of their relationship dynamics do you want to understand better?',
      },
      options: {
        self: ['How you choose', 'What patterns you repeat', 'How you protect yourself', 'What you’re really looking for'],
        other: ['How they choose', 'What patterns they repeat', 'How they protect themselves', 'What they’re really looking for'],
      },
    },
    name: {
      title: { self: 'Your name', other: 'Their name' },
      label: 'Name',
      placeholder: 'e.g. Mary, Emily, James...',
      hint: {
        self: 'We’ll use your name to personalize the reading.',
        other: 'We’ll use their name to personalize the reading.',
      },
    },
  },
  helper: {
    focus: 'Almost there',
    name: 'One more step',
  },
  wheelHint: {
    date: {
      all: 'Swipe or tap the wheels to confirm day, month and year.',
      some: (fields: string) => `Please check: ${fields}.`,
    },
    time: {
      all: 'Swipe or tap the wheels to confirm hour and minutes.',
      some: (fields: string) => `Please check: ${fields}.`,
    },
    fields: {
      day: 'the day',
      month: 'the month',
      year: 'the year',
      hour: 'the hour',
      minute: 'the minutes',
    },
    join: (items: string[]) =>
      items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1] : (items[0] ?? ''),
  },
  cta: {
    continue: 'Continue',
    resolvingPlace: 'Checking place…',
    toPayment: 'Go to payment',
    seeReading: 'See your reading',
  },
  back: 'Go back',
};

export default quiz;
