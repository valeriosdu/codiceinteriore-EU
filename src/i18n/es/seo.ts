import type { Messages } from '@/i18n';

const seo: Messages['seo'] = {
  product: {
    name: 'Lectura de la Carta Natal',
    description:
      'Lectura personalizada de la carta natal, escrita en español. Informe de unas 10 páginas basado en los datos de nacimiento, con enfoque psicológico en lugar de predictivo.',
    category: 'Astrología psicológica',
    offerBase: 'Lectura Completa',
    offerPremium: 'Lectura + 1 mes de Tránsitos',
  },
  contactPageName: 'Contacto',
  defaultFaqs: [
    {
      question: '¿La astrología no es ciencia, es palabrería?',
      answer:
        'No es una predicción ni una ciencia exacta: es un lenguaje simbólico que usamos como rejilla para leer la estructura interior. El valor viene de la precisión psicológica de la lectura, no de pretensiones predictivas. Garantía de reembolso si la lectura te parece genérica.',
    },
    {
      question: 'Encuentro lecturas gratis en línea, ¿por qué pagar?',
      answer:
        'Las lecturas gratis son fragmentos técnicos (un significado por planeta, uno por casa, uno por aspecto). Aquí leemos la carta como un conjunto coherente, en español humano, en unas 10 páginas. Es lo opuesto a la fragmentación.',
    },
    {
      question: '¿Me dirá qué hacer?',
      answer:
        'No, y lo decimos antes. Describimos cómo estás construido o construida, no damos consejos motivacionales. La credibilidad del producto está en esta modestia.',
    },
    {
      question: '¿Cuán personalizada es de verdad?',
      answer:
        'La lectura se genera sobre tu carta natal específica (fecha, hora y lugar de nacimiento) más las respuestas a 2 preguntas que modulan el tono. Todo deriva del cielo del día en que naciste.',
    },
  ],
};

export default seo;
