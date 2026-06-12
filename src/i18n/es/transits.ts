import type { Messages } from '@/i18n';

const transits: Messages['transits'] = {
  upsell: {
    errors: {
      noUrl: 'URL no disponible',
      checkout: 'No hemos podido abrir el pago. Inténtalo de nuevo en un instante.',
    },
    ariaActive: 'Tránsitos del mes activos',
    ariaInactive: 'Activa la lectura mensual de tránsitos',
    activeBadge: 'Activos',
    activeTitle: 'Tienes los tránsitos de este mes',
    validUntil: 'Válidos hasta el',
    validUntilFallback: 'final del periodo incluido',
    activeBody:
      'Te quedan hasta la fecha indicada. Para continuar también después, puedes renovar con la lectura mensual, o detenerte aquí.',
    kicker: 'Tránsitos del mes',
    title: 'Has leído tu Carta Natal. Ahora puedes leer el momento presente.',
    body: 'La carta natal es tu estructura, fijada al nacer: no cambia. El cielo, en cambio, se mueve cada día. Los planetas se superponen cada día a los puntos de tu carta (tu Sol, Luna, Ascendente, etc.) y activan ciertas partes según el aspecto que forman.',
    monthlyListTitle: 'Cada mes recibes una lectura que te dice:',
    monthlyList: [
      'Qué áreas de tu carta están en tensión, favorecidas o bajo presión, y qué observar',
      'Los momentos clave del mes, con fechas precisas, y qué favorecer semana a semana',
      'Cuánto dura lo que estás atravesando, y qué llega después',
    ],
    ctaActive: (priceLabel) => `Continúa con los tránsitos mensuales - ${priceLabel}/mes`,
    ctaInactive: (priceLabel) => `Lee los tránsitos del mes - ${priceLabel}/mes`,
    renewNoteActive: 'Renovación mensual, cancela cuando quieras',
    renewNoteInactive: 'Una nueva lectura cada mes. Cancela cuando quieras.',
    secureNote: 'Pago seguro - Acceso inmediato',
  },
};

export default transits;
