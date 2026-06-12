import type { Messages } from '@/i18n';

const legal: Messages['legal'] = {
  contact: {
    seoTitle: (siteName) => `Contacto — ${siteName}`,
    seoDescription: (email) =>
      `¿Tienes una pregunta sobre la carta natal, el informe o el acceso a tu área personal? Escríbenos desde el formulario o envía un correo a ${email}.`,
    kicker: 'Contacto',
    title: 'Escríbenos',
    subtitle:
      'Para preguntas, soporte o solicitudes, puedes contactarnos aquí. Te responderemos lo antes posible.',
    intro:
      'Si tienes una duda sobre el informe, sobre el acceso a tu área personal o sobre el funcionamiento del servicio, puedes escribirnos directamente con el formulario de abajo.',
    sent: 'Mensaje enviado.',
    sentSub: 'Te responderemos en cuanto sea posible.',
    sendAnother: 'Enviar otro mensaje',
    nameLabel: 'Nombre *',
    namePlaceholder: 'Tu nombre',
    emailLabel: 'Correo electrónico *',
    emailPlaceholder: 'Tu correo electrónico',
    reasonLabel: 'Motivo del contacto',
    reasonPlaceholder: 'Selecciona un motivo',
    reasons: {
      purchase: 'Soporte de compra',
      report: 'Acceso al informe',
      general: 'Pregunta general',
      collab: 'Colaboraciones',
    },
    messageLabel: 'Mensaje *',
    messagePlaceholder: 'Escribe aquí tu mensaje…',
    error: 'Ha ocurrido un problema. Inténtalo de nuevo en breve.',
    sending: 'Enviando…',
    send: 'Enviar mensaje',
    otherTitle: 'Otros contactos',
    otherSub: 'Si lo prefieres, también puedes contactarnos por correo.',
    privacyNote: 'Tus datos se usarán solo para responder a tu solicitud.',
    validation: {
      name: 'Introduce tu nombre',
      email: 'Introduce un correo válido',
      message: 'Escribe un mensaje',
    },
  },
  notFound: {
    title: 'Página no encontrada',
    body: 'La página que buscas no existe o se ha movido.',
    cta: 'Volver al inicio',
  },
  unsubscribe: {
    verifying: 'Verificando…',
    validTitle: 'Cancelar suscripción',
    validBody: (siteName) => `¿Confirmas que quieres cancelar la suscripción a los correos de ${siteName}?`,
    confirm: 'Confirmar cancelación',
    processing: 'Procesando…',
    doneTitle: 'Suscripción cancelada',
    doneBody: (siteName) => `Ya no recibirás más correos de ${siteName}.`,
    alreadyTitle: 'Ya cancelada',
    alreadyBody: 'Tu suscripción ya se había cancelado anteriormente.',
    errorTitle: 'Enlace no válido',
    errorBody: 'Este enlace de cancelación no es válido o ha caducado.',
  },
};

export default legal;
