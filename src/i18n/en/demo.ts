// Demo content shown only in preview (Lovable / ?preview=1), never in
// production. Kept in the catalog for language consistency.

import type { Messages } from '@/i18n';

const demo: Messages['demo'] = {
  userName: 'Anna',
  teaserInsights: [
    {
      title: 'How you enter relationships',
      body: 'You tend to enter relationships with an intensity that comes from needing to feel seen and understood at a deep level. This makes you capable of genuine bonds, but also vulnerable to disappointment when the other person can\'t keep up with your emotional pace.',
    },
    {
      title: 'Your tender spot',
      body: "There's an area where the fear of being abandoned overlaps with the wish for independence. When someone gets too close, something in you pulls back, even though a deeper part of you wants exactly that closeness.",
    },
    {
      title: 'Your recurring pattern',
      body: 'The pattern that repeats is tied to confusing emotional intensity with real connection. You often mistake inner turbulence for love, and calm for an absence of feeling.',
    },
  ],
  fullReport: {
    identity:
      'Your deeper identity moves between needing to feel free and wanting to build something stable. You perceive the world with great sensitivity, yet at the same time look for clear structures so you don\'t get lost in your own emotions.\n\nThis report is a demo version, generated for the preview. The real report is personalized to your birth data.',
    emotions:
      'Your emotions move in deep waves. You learned early to hold in what you feel so as not to bother others, and that sometimes leaves you feeling distant even from yourself.\n\nThe first move is to recognize that your emotions are not a nuisance, but a compass.',
    relationships:
      'In love you look for a connection that goes beyond the surface. You want to be seen for who you really are, not just for what you show.\n\nThis sometimes leads you to invest heavily in a few people, and to ache when you don\'t get the same intensity back.',
    work:
      'At work you need to feel a sense of meaning. Doing the job well isn\'t enough: you want what you do to matter.\n\nWhen you find a setting that fits your values, your productivity and creativity open up in surprising ways.',
    patterns:
      "You tend to repeat a pattern in which you first open up a lot, then withdraw. It's a protective move with old roots.\n\nNoticing it is already half the work: the next time you feel the urge to close off, pause and ask yourself what you're really protecting.",
    blocks:
      'Your main block is the often-unconscious belief that you have to earn love through performance. This leads you to give a great deal and ask for little.\n\nWorking on this means learning to receive without feeling indebted.',
    advice:
      "1. Give yourself moments of quiet every day, even brief ones.\n2. When you feel tension, ask yourself: 'What do I need to say that I'm not saying?'.\n3. Keep up a creative practice with no goals attached.\n4. Remember that resting is productive.",
    poem:
      "There's a room inside you\nthat no one has ever seen.\nNot because it's locked,\nbut because you yourself\nhave forgotten the door.\n\nToday someone knocks.\nIt's you.",
  } as Record<string, string>,
};

export default demo;
