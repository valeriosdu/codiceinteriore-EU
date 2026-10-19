import type { Messages } from '@/i18n';

const quiz: Messages['quiz'] = {
  months: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  birthDateLabel(day: number, month: number, year: number) {
    return `${day} ${(this.months[month - 1] || '').toLowerCase()} ${year}`;
  },
  stepOf: (current: number, total: number) => `${current} de ${total}`,
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
      unknown: {
        label: { self: 'No conozco mi hora de nacimiento', other: 'No conozco su hora de nacimiento' },
        note: 'Usaremos el mediodía: la lectura sigue siendo válida, pero el ascendente y las casas serán orientativos.',
      },
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
  wheelHint: {
    date: {
      all: 'Desliza o toca las ruedas para confirmar día, mes y año.',
      some: (fields: string) => `Por revisar: ${fields}.`,
    },
    time: {
      all: 'Desliza o toca las ruedas para confirmar hora y minutos.',
      some: (fields: string) => `Por revisar: ${fields}.`,
    },
    fields: {
      day: 'el día',
      month: 'el mes',
      year: 'el año',
      hour: 'la hora',
      minute: 'los minutos',
    },
    join: (items: string[]) =>
      items.length > 1 ? items.slice(0, -1).join(', ') + ' y ' + items[items.length - 1] : (items[0] ?? ''),
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
