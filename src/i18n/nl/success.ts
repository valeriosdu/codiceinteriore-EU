import type { Messages } from '@/i18n';

const success: Messages['success'] = {
  paypalError:
    'We konden de PayPal-betaling niet bevestigen. Laat het ons weten als het bedrag toch is afgeschreven.',
  titleProblem: 'Er ging iets mis',
  titleOk: 'Betaling voltooid',
  bodyPaypalCapturing: 'We bevestigen de PayPal-betaling…',
  bodyVerifying: 'We controleren de betaling en koppelen je duiding.',
  bodyDefault: 'Maak eerst je account aan, zodat je duiding bewaard blijft en je hem altijd terugvindt.',
  ctaCapturing: 'Bevestigen…',
  ctaVerifying: 'Controleren…',
  ctaContinue: 'Account aanmaken en doorgaan',
};

export default success;
