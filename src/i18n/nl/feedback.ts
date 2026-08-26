import type { Messages } from '@/i18n';

const feedback: Messages['feedback'] = {
  title: 'Vertel ons wat je ervan vindt',
  subtitle: 'Jouw mening helpt ons elke duiding preciezer te maken. Een paar seconden is genoeg.',
  ratings: {
    positive: 'Dit ben ik',
    mixed: 'Deels',
    negative: 'Dit ben ik niet',
  },
  reasons: {
    positive: ['Precies', 'Bruikbaar', 'Goed geschreven', 'Verraste me'],
    mixed: ['Sommige delen wel, andere niet', 'Te algemeen', 'Taalgebruik', 'Ik zou meer diepgang willen'],
    negative: ['Ik herken mezelf er niet in', 'Te algemeen', 'Feitelijke fouten', 'Taalgebruik'],
  },
  errors: {
    signInRequired: 'Je moet ingelogd zijn om feedback te sturen.',
    saveRating: (detail) => `We konden je feedback niet opslaan (${detail}).`,
    saveDetails: (detail) => `We konden het niet opslaan (${detail}).`,
    unknown: 'onbekende fout',
  },
  thanksMore: 'Dank je. Wil je er nog iets over kwijt?',
  commentPlaceholder: 'Mis je een functie of wil je iets toevoegen? (optioneel)',
  skip: 'Overslaan',
  send: 'Versturen',
  done: 'Dank je, hier worden we beter van.',
};

export default feedback;
