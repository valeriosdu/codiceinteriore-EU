import type { Messages } from '@/i18n';

const landing: Messages['landing'] = {
  seo: {
    title: 'Carta Natal en línea, lectura en español',
    description:
      'Lectura de tu carta natal con enfoque psicológico: tu carácter, tu forma de reaccionar y los patrones que repites. En español, personalizada según tus datos de nacimiento. Primera parte gratuita, sin registro.',
  },
  hero: {
    titlePre: 'Tu',
    titleEm: 'Carta Natal',
    titlePost: ' explicada de forma clara',
    subtitle:
      'Descubre qué emerge de tu carácter y de tu forma de ser a partir de tus datos de nacimiento. Gratis y sin registro.',
    cta: 'Empezar el cuestionario',
    microcopy: 'Cuestionario de 2 minutos · No necesitas conocimientos previos',
    socialProof: 'Más de 10.000 personas ya han descubierto su carta natal',
  },
  discover: {
    heading: 'Qué puedes descubrir',
    items: [
      'Cómo funcionas de verdad, bajo la superficie',
      'Dónde puedes crecer en esta etapa',
      'Qué dinámicas tienden a repetirse en tu vida',
      'Qué te motiva de verdad',
    ],
  },
  // Niente lessico spirituale in questa pagina: Meta ha classificato il
  // dominio come "religione" (ottobre 2026). In spagnolo "cielo" e' anche
  // "paradiso", "llamado/a" la vocazione, "lo profundo" l'anima.
  quote: {
    plate: 'Lám. II',
    text: 'Los astros del día en que naciste cuentan algo que nunca has dejado de llevar contigo',
  },
  howItWorks: {
    heading: 'Cómo funciona',
    steps: [
      'Introduce tus datos de nacimiento',
      'Responde a unas pocas preguntas breves',
      'Recibe tu lectura inicial gratis',
    ],
  },
  finalCta: {
    body: 'Empieza por tu lectura inicial. El resto emergerá con más claridad.',
    cta: 'Empezar el cuestionario',
  },
};

export default landing;
