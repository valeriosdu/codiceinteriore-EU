import type { Messages } from '@/i18n';

const success: Messages['success'] = {
  paypalError:
    'PayPal-maksun vahvistaminen ei onnistunut. Ota meihin yhteyttä, jos summa veloitettiin tililtäsi.',
  titleProblem: 'Jokin meni pieleen',
  titleOk: 'Maksu onnistui',
  bodyPaypalCapturing: 'Vahvistamme PayPal-maksua…',
  bodyVerifying: 'Tarkistamme maksun ja liitämme tulkintasi tiliisi.',
  bodyDefault: 'Luo ensin tili, jotta tulkintasi tallentuu ja löydät sen aina uudelleen.',
  ctaCapturing: 'Vahvistetaan…',
  ctaVerifying: 'Tarkistetaan…',
  ctaContinue: 'Luo tili ja jatka',
};

export default success;
