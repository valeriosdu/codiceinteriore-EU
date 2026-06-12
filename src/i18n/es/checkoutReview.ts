import type { Messages } from '@/i18n';

const checkoutReview: Messages['checkoutReview'] = {
  products: {
    base: {
      name: 'Lectura Completa de la Carta Natal',
      bullets: ['Lectura completa de 10 páginas', 'Acceso inmediato en línea y por correo'],
    },
    premium: {
      name: 'Lectura Completa + 1 Mes de Tránsitos',
      bullets: [
        'Lectura completa de 10 páginas',
        '1 mes de lecturas semanales sobre los tránsitos',
        'Regalo: poema transformador personal',
      ],
    },
    synastry: {
      name: 'Sinastría de Pareja',
      bullets: [
        'Ocho secciones sobre vuestra relación',
        'PDF descargable, acceso permanente',
        'Unas 10 páginas en español claro',
      ],
    },
    synastry_launch: {
      name: 'Sinastría de Pareja',
      bullets: [
        'Ocho secciones sobre vuestra relación',
        'PDF descargable, acceso permanente',
        'Unas 10 páginas en español claro',
      ],
    },
  },
  title: 'Resumen del pedido',
  subtitle: 'Revisa los detalles de tu pedido.',
  instantAccess: 'Acceso inmediato',
  total: 'Total',
  howToPay: '¿Cómo prefieres pagar?',
  cardLabel: 'Tarjeta de crédito o débito',
  paypalNote: 'Rápido y seguro con tu cuenta',
  securePayment: 'Pago seguro',
  moneyBack: 'Satisfecho o reembolsado',
  noSubscription: 'Sin suscripción',
  errors: {
    noSession: 'Sesión no disponible. Recarga la página e inténtalo de nuevo.',
    payment: 'Error durante el pago. Inténtalo de nuevo.',
  },
};

export default checkoutReview;
