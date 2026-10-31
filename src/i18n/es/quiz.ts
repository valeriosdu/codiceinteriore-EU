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
    bridge: {
      youAnswered: 'Has respondido',
      exampleLabel: 'Ejemplo ilustrativo',
      showsLabel: 'La carta natal puede mostrarte:',
      chartIs:
        'La carta natal es la fotografía del cielo en el momento en que naciste. No predice el futuro: describe cómo eres, qué te enciende, qué te frena y a qué ritmo funcionas.',
      next: 'Solo necesitas tu fecha, hora y lugar de nacimiento. Tu lectura inicial es gratuita.',
      variants: [
        {
          headline: 'No te falta algo. Te falta el mapa.',
          body: 'No es que los demás vean más: perciben de una forma distinta a la tuya. Y tu forma tiene una estructura precisa, que se puede leer.',
          shows: 'cómo percibes y qué filtras sin darte cuenta.',
          legend: ['Luna', 'Mercurio', 'Ascendente'],
        },
        {
          headline: 'No es pereza ni falta de voluntad.',
          body: 'La forma de arrancar es personal: hay quien se enciende enseguida y quien necesita condiciones precisas. Conocer las tuyas cambia cómo te juzgas.',
          shows: 'tu forma de arrancar: qué te enciende y qué te frena.',
          legend: ['Marte', 'Saturno', 'Cuadratura'],
        },
        {
          headline: 'Te estás moviendo. Pero ¿hacia dónde te lleva tu ritmo?',
          body: 'Avanzar no basta si la dirección la han elegido las circunstancias. Importa la que encaja con tu manera de ser, y el punto en el que tu camino se desvió.',
          shows: 'la dirección que encaja con tu manera de ser y dónde se desvió tu camino.',
          legend: ['Medio Cielo', 'Nodos Lunares'],
        },
        {
          headline: 'A veces todo se detiene a la vez. Normalmente es una fase, no un estado.',
          body: 'Cuando todo parece detenido, a menudo estás atravesando un periodo que tiene un principio y un final. Se puede leer cuándo empieza y cuándo pasa.',
          shows: 'tus ciclos: cuándo se abre una fase y cuándo se cierra.',
          legend: ['Saturno', 'Júpiter', 'Fase'],
        },
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
