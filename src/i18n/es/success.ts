import type { Messages } from '@/i18n';

const success: Messages['success'] = {
  paypalError:
    'No hemos podido confirmar el pago de PayPal. Escríbenos si se ha cobrado el importe.',
  titleProblem: 'Ha habido un problema',
  titleOk: 'Pago completado',
  bodyPaypalCapturing: 'Estamos confirmando el pago de PayPal…',
  bodyVerifying: 'Estamos verificando el pago y vinculando tu lectura.',
  bodyDefault: 'Antes de acceder, crea tu cuenta para guardar la lectura y recuperarla cuando quieras.',
  ctaCapturing: 'Confirmando…',
  ctaVerifying: 'Verificando…',
  ctaContinue: 'Crear cuenta y continuar',
};

export default success;
