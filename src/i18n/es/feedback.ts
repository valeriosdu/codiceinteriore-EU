import type { Messages } from '@/i18n';

const feedback: Messages['feedback'] = {
  title: 'Cuéntanos qué te parece',
  subtitle: 'Tu opinión nos ayuda a hacer cada lectura más precisa. Bastan unos segundos.',
  ratings: {
    positive: 'Me refleja',
    mixed: 'En parte',
    negative: 'No me refleja',
  },
  reasons: {
    positive: ['Preciso', 'Útil', 'Bien escrito', 'Me sorprendió'],
    mixed: ['Algunas partes sí, otras no', 'Demasiado genérico', 'Lenguaje', 'Me gustaría más profundidad'],
    negative: ['No me reconozco', 'Demasiado genérico', 'Errores de hecho', 'Lenguaje'],
  },
  errors: {
    signInRequired: 'Debes haber iniciado sesión para enviar una opinión.',
    saveRating: (detail) => `No hemos podido guardar la opinión (${detail}).`,
    saveDetails: (detail) => `No hemos podido guardar (${detail}).`,
    unknown: 'error desconocido',
  },
  thanksMore: 'Gracias. ¿Quieres contarnos más?',
  commentPlaceholder: '¿Te gustaría otra función o quieres añadir algo? (opcional)',
  skip: 'Omitir',
  send: 'Enviar',
  done: 'Gracias, nos ayuda a mejorar.',
};

export default feedback;
