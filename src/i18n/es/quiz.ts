import type { Messages } from '@/i18n';

const quiz: Messages['quiz'] = {
  months: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  steps: {
    intent: {
      question: '¿Qué te interesa entender más?',
      options: [
        'Mis dinámicas de pareja y de amor',
        'Qué me frena y dónde crecer',
        'Una visión general de mí',
      ],
    },
    attachment: {
      question: {
        self: 'Cuando alguien se aleja o se vuelve ambiguo, tiendes instintivamente a:',
        other: 'Cuando alguien se aleja o se vuelve ambiguo, esta persona tiende instintivamente a:',
      },
      options: {
        self: [
          'Buscar más contacto',
          'Cerrarte y tomar distancia',
          'Quedarte a la espera de una señal',
        ],
        other: [
          'Buscar más contacto',
          'Cerrarse y tomar distancia',
          'Quedarse a la espera de una señal',
        ],
      },
    },
    symptom: {
      question: 'Cuando miras tu vida hoy, ¿qué sientes con más frecuencia?',
      options: [
        'Siento que se me escapa algo que los demás ven',
        'Sé lo que debería hacer, pero no lo consigo',
        'Avanzo, pero no siento que vaya donde quiero',
        'Todo parece detenido, no solo dentro de mí',
      ],
    },
    narrative: {
      question: 'Cuando piensas en quién podrías haber sido, ¿qué te viene a la mente?',
      options: [
        'Una versión de mí más libre',
        'Una versión de mí más realizada',
        'Una versión de mí más segura, con menos dudas',
        'Una versión de mí más decidida, menos a la espera',
      ],
    },
    date: {
      title: { self: 'Tu fecha de nacimiento', other: 'Su fecha de nacimiento' },
      day: 'Día',
      month: 'Mes',
      year: 'Año',
    },
    time: {
      title: { self: 'Tu hora de nacimiento', other: 'Su hora de nacimiento' },
      hour: 'Hora',
      minute: 'Minutos',
      hint: 'Si no la conoces con precisión, elige la hora más cercana posible.',
    },
    place: {
      title: { self: 'Tu lugar de nacimiento', other: 'Su lugar de nacimiento' },
      label: 'Lugar de nacimiento',
      placeholder: 'p. ej. Madrid, Barcelona, Sevilla...',
      hint: 'Elige un lugar de las sugerencias para una lectura más precisa.',
      error: 'No encontramos este lugar. Elige una sugerencia de la lista.',
    },
    focus: {
      question: {
        self: '¿Qué parte de tus dinámicas de pareja quieres entender mejor?',
        other: '¿Qué parte de sus dinámicas de pareja quieres entender mejor?',
      },
      options: {
        self: ['Cómo eliges', 'Qué patrones repites', 'Cómo te defiendes', 'Qué buscas de verdad'],
        other: ['Cómo elige', 'Qué patrones repite', 'Cómo se defiende', 'Qué busca de verdad'],
      },
    },
    name: {
      title: { self: 'Tu nombre', other: 'Su nombre' },
      label: 'Nombre',
      placeholder: 'p. ej. María, Lucía, Carlos...',
      hint: {
        self: 'Usaremos tu nombre para personalizar la lectura.',
        other: 'Usaremos su nombre para personalizar la lectura.',
      },
    },
  },
  helper: {
    focus: 'Ya casi está',
    name: 'Un paso más',
  },
  cta: {
    continue: 'Continuar',
    resolvingPlace: 'Verificando lugar…',
    toPayment: 'Ir al pago',
    seeReading: 'Ver tu lectura',
  },
  back: 'Volver atrás',
};

export default quiz;
