import type { Messages } from '@/i18n';

const checkout: Messages['checkout'] = {
  failed: {
    title: 'No hemos podido preparar la lectura',
    body: 'Algo no está funcionando como debería. Inténtalo de nuevo en unos instantes.',
    retry: 'Reintentar',
  },
  loading: {
    title: 'Estamos preparando la lectura',
    slow: 'Está tardando más de lo previsto. Quédate en esta página: lo reintentaremos automáticamente en breve.',
    normal: 'Calculamos la carta natal antes de mostrarte la oferta.',
  },
  toasts: {
    stillPreparingShort: 'Aún estamos preparando la lectura. Inténtalo de nuevo en breve.',
    stillPreparingRetry: 'Aún estamos preparando la lectura. Inténtalo de nuevo en unos segundos.',
  },
  hero: {
    title: (name) => `La lectura para ${name} está lista`,
    fallbackRecipient: 'él/ella',
    subtitle: 'Hemos calculado la carta natal. Elige el formato para generar la lectura completa.',
    wrongData: '¿Los datos no son correctos?',
  },
  offers: {
    baseName: 'Lectura Completa de la Carta Natal',
    basePromise: (name) =>
      `Para entender con más claridad la estructura emocional, relacional y personal de ${name}, y ver qué tiende a repetirse en su vida.`,
    baseFeatures: [
      'Comprende bloqueos emocionales, defensas y dinámicas recurrentes con un lenguaje humano, no técnico',
      'Ve cómo estos patrones influyen en relaciones, trabajo, dirección personal y decisiones de vida',
      'Recibe pistas prácticas sobre qué observar, favorecer o corregir',
      'Acceso inmediato a la lectura en línea y por correo electrónico',
    ],
    premiumPromise: (name) =>
      `Entender qué guía a ${name} en profundidad y leer con claridad también el momento que está viviendo ahora.`,
  },
};

export default checkout;
