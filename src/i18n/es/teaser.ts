import type { Messages } from '@/i18n';

const teaser: Messages['teaser'] = {
  loading: {
    title: 'Estamos completando tu lectura inicial',
    slow: 'Está tardando más de lo previsto. Quédate en esta página: lo reintentaremos automáticamente en breve.',
    normal: 'Estamos verificando la carta natal y las ideas antes de mostrarte la oferta.',
  },
  failed: {
    title: 'No hemos podido generar la lectura',
    body: 'Algo no está funcionando como debería. Inténtalo de nuevo en unos instantes.',
    retry: 'Reintentar',
  },
  toasts: {
    previewPaymentsDisabled: 'Vista previa: el pago está desactivado en la preview.',
    stillCompleting: 'Aún estamos completando tu lectura inicial. Inténtalo de nuevo en breve.',
    stillPreparing: 'Aún estamos preparando tu lectura. Inténtalo de nuevo en unos segundos.',
  },
  hero: {
    title: (name) => (name ? `${name}, aquí tienes tu lectura inicial` : 'Aquí tienes tu lectura inicial'),
    subtitle: 'Lo que emerge de una primera lectura de tu Carta Natal.',
    wrongData: '¿Los datos no son correctos?',
  },
  openFullReport: 'Abrir la lectura completa',
  offers: {
    baseName: 'Lectura Completa de tu Carta Natal',
    baseCta: 'Consigue la Lectura Completa',
    premiumName: 'Lectura Completa + 1 Mes de Tránsitos',
    premiumPromise:
      'Entender qué te guía en profundidad y leer con claridad también el momento que estás viviendo ahora',
    premiumFeatures: [
      'Todo lo que incluye la Lectura Completa',
      '1 mes de lecturas semanales personalizadas sobre los tránsitos del periodo',
      'Una ayuda extra para entender qué se está activando emocionalmente ahora',
      'Regalo: poema transformador personal',
    ],
    premiumCta: 'Consigue la Lectura + Tránsitos',
  },
  faq: {
    kicker: 'Preguntas frecuentes',
    heading: 'Aquí encuentras las respuestas a las dudas más comunes antes de comprar.',
  },
  bottomCta: 'Consigue la lectura completa',
  reassurance: {
    instantAccess: 'Acceso inmediato',
    securePayment: 'Pago seguro',
    humanLanguage: 'Lectura escrita en lenguaje humano',
  },
};

export default teaser;
