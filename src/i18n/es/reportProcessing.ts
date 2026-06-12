import type { Messages } from '@/i18n';

const reportProcessing: Messages['reportProcessing'] = {
  messages: [
    'Estamos recuperando tu lectura',
    'Estamos organizando las áreas principales',
    'Estamos preparando las partes que aún no has visto',
    'Estamos completando tu mapa personal',
    'En breve entrarás en la versión completa',
    'Estamos puliendo los detalles más delicados',
    'Casi listos — falta muy poco',
  ],
  errors: {
    signIn: 'Entra en tu cuenta para completar la lectura comprada.',
    profileNotFound: 'No encontramos tu perfil. Vuelve a entrar o escríbenos.',
    paymentMismatch: 'El pago no corresponde a la sesión de cuestionario que hay que completar.',
    noSession: 'No encontramos una sesión de cuestionario vinculada al pago.',
    paymentRequired:
      'Para generar una nueva lectura hace falta un pago completado. Si ya tienes una lectura, ábrela desde tu área personal.',
    generic:
      'Tu lectura está en preparación. El pago está registrado correctamente y recibirás todo por correo en pocos minutos. Si pasados 10 minutos no recibes nada, escríbenos y estaremos encantados de ayudarte.',
  },
  errorScreen: {
    title: 'Lectura en verificación',
    cta: 'Escríbenos',
  },
  verifying: 'Estamos verificando tu acceso a la lectura…',
  processing: {
    title: 'Estamos completando tu lectura',
    body: 'Ya has visto el comienzo. Ahora estamos preparando tu lectura completa, con muchos elementos nuevos y una visión completa de tu Carta Interior. No cierres ni actualices la página.',
    slowHint:
      'Para las cartas más complejas la preparación puede tardar hasta 10 minutos. Puedes quedarte en esta página o cerrarla: recibirás todo por correo en cuanto esté listo.',
  },
};

export default reportProcessing;
