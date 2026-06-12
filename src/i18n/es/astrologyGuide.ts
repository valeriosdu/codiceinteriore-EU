import type { Messages } from '@/i18n';

const astrologyGuide: Messages['astrologyGuide'] = {
  name: 'Guía astrológica',
  openAria: 'Abrir la Guía astrológica',
  closeAria: 'Cerrar',
  freeBadge: (n) => `${n} gratis`,
  questionsCount: (n) => `${n} ${n === 1 ? 'pregunta' : 'preguntas'}`,
  freeInline: (n) => `· ${n} gratis`,
  empty: {
    exhaustedTitle: 'Has agotado tus preguntas',
    exhaustedBody: (packCredits) =>
      `Añade un nuevo paquete de ${packCredits} preguntas para seguir profundizando en tu carta.`,
    introTitle: 'Tu guía astrológica personal',
    introBody:
      'Haz preguntas sobre tu carta natal y, si has comprado la sinastría de pareja o los tránsitos del mes, también sobre ellos: las respuestas siempre están personalizadas según tus datos astrológicos.',
    howTitle: 'Cómo funciona',
    howSteps: [
      'Haz una pregunta aquí abajo, libre o partiendo de las sugerencias.',
      'La respuesta llega en unas horas en horario laboral.',
      'La lees aquí y en tu correo.',
    ],
    firstQuestions: 'Primeras 2 preguntas',
    free: 'Gratuitas ✦',
    additional: 'Preguntas adicionales',
    additionalValue: (packCredits, priceLabel) =>
      `${packCredits} preguntas extra por ${priceLabel}`,
  },
  composer: {
    genericChips: [
      '¿Qué patrón afectivo arrastro desde la infancia?',
      '¿Qué parte de mí estoy evitando mirar en este momento?',
    ],
    sectionChips: {
      identity: [
        '¿Qué aspecto de mi identidad es más subterráneo y menos visible para los demás?',
        '¿Qué hay en mi carta que explique mi necesidad de sentirme distinto/a de los demás?',
      ],
      emotions: [
        '¿Por qué ciertas emociones me arrasan y otras apenas las siento?',
        '¿Qué esconde mi tendencia a cerrarme cuando sufro de verdad?',
      ],
      emotions_relationships: [
        '¿Qué herida emocional se reactiva siempre en mis relaciones íntimas?',
        '¿Por qué tiendo a desear a quien me mantiene a distancia?',
      ],
      relationships: [
        '¿Qué patrón afectivo se repite en mis historias más importantes?',
        '¿Qué busco de verdad en una pareja, más allá de lo que digo?',
      ],
      blocks_patterns: [
        '¿Qué patrón me bloquea justo cuando estoy a punto de cambiar de verdad?',
        '¿Qué estoy protegiendo cuando me cierro o me saboteo?',
      ],
      blocks: [
        '¿Qué esconde mi tendencia a detenerme justo en lo mejor?',
        '¿Qué miedo subterráneo me impide tomar postura?',
      ],
      patterns: [
        '¿Qué patrón reconozco pero aún no consigo deshacer?',
        '¿De dónde viene mi dificultad para pedir lo que necesito?',
      ],
      work: [
        '¿Qué trabajo me refleja de verdad, más allá del dinero y la seguridad?',
        '¿Por qué tiendo a sentirme agotado/a incluso cuando hago cosas que amo?',
      ],
      work_direction: [
        '¿Qué estoy evitando mirar en mi trayectoria profesional?',
        '¿Qué dirección me refleja, aunque me asuste?',
      ],
      advice: [
        '¿Qué debo soltar ahora para hacer espacio a algo nuevo?',
        '¿En qué parte de mí debería centrarme en los próximos meses?',
      ],
    },
    placeholder: 'Escribe tu pregunta…',
    send: 'Enviar',
    remaining: (n) => `Te quedan ${n} ${n === 1 ? 'pregunta' : 'preguntas'}.`,
  },
  message: {
    answerUseful: 'Respuesta útil',
    answerNotUseful: 'Respuesta no útil',
    commentPlaceholder: '¿Qué no te ha gustado?',
    commentSend: 'Enviar',
    thanksFeedback: 'Gracias por tu opinión.',
    pending: 'Respuesta en camino en las próximas horas.',
    pendingEmail: 'Te avisaremos también por correo.',
    failed: 'No hemos podido generar la respuesta. Tu pregunta se ha vuelto a acreditar, puedes reintentarlo.',
  },
  buyMore: {
    exhaustedHeadline: 'Has usado todas tus preguntas',
    nearEndHeadline: 'Estás por agotar las preguntas',
    exhaustedSub: (packCredits) =>
      `Compra ${packCredits} nuevas preguntas para seguir profundizando en tu carta.`,
    nearEndSub: (packCredits) =>
      `Añade otras ${packCredits} preguntas para no detenerte justo en lo mejor.`,
    balance: (n) => `Saldo actual: ${n} ${n === 1 ? 'pregunta' : 'preguntas'}.`,
    buyCta: (packCredits, priceLabel) => `Compra ${packCredits} preguntas · ${priceLabel}`,
  },
  askButton: {
    deepen: (label) => `Profundiza: ${label}`,
    deepenGeneric: 'Profundiza en esta sección',
    free: 'gratis',
  },
  toasts: {
    packActivated: (added) =>
      `Paquete activado. Tienes ${added} ${added === 1 ? 'nueva pregunta' : 'nuevas preguntas'}.`,
    paymentProcessing: 'El pago se está procesando. Recarga en unos segundos para ver las nuevas preguntas.',
    sendError: 'Error al enviar.',
    noCredits: (packCredits, priceLabel) =>
      `Has agotado tus preguntas. Compra otras ${packCredits} por ${priceLabel}.`,
    duplicate: 'Ya has hecho esta pregunta hace poco. La respuesta está en el hilo (o está llegando).',
    submitError: 'No hemos podido enviar la pregunta. Inténtalo de nuevo.',
    noUrl: 'URL no disponible',
    checkoutError: 'No hemos podido abrir el pago. Inténtalo de nuevo en un instante.',
  },
};

export default astrologyGuide;
