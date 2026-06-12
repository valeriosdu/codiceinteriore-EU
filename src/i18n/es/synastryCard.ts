import type { Messages } from '@/i18n';

const synastryCard: Messages['synastryCard'] = {
  sections: {
    ritratto_coppia: 'El retrato de la pareja',
    attrazione_chimica: 'Atracción y química',
    comunicazione: 'Comunicación',
    mondo_emotivo: 'Mundo emocional',
    sfide: 'Retos como crecimiento',
    pattern_karmico: 'Patrón kármico',
    direzione: 'Dirección',
  },
  pdf: {
    unavailable: 'PDF no disponible',
    error: 'No hemos podido generar el PDF. Inténtalo de nuevo.',
    preparing: 'Preparando...',
    download: 'Descargar PDF',
  },
  card: {
    title: 'Sinastría de pareja',
    personA: 'Persona A',
    personB: 'Persona B',
    inPreparation: 'Tu sinastría se está preparando. Recibirás un aviso cuando esté lista.',
    coupleChart: 'La carta de la pareja',
    yourMap: 'Vuestro mapa',
    mapLabels: {
      cosa_siete: 'Qué sois',
      dove_brillate: 'Dónde brilláis',
      dove_inciampate: 'Dónde tropezáis',
      dove_andate: 'Hacia dónde vais',
    },
  },
  upsell: {
    aria: 'Sinastría de pareja',
    kicker: 'Sinastría de pareja',
    title: 'Descubre qué ocurre cuando tu Cielo se encuentra con otro.',
    body: 'La sinastría de pareja superpone tu carta natal a la de otra persona y analiza cómo dialogan vuestros planetas: dónde hay sintonía natural, dónde fricción, y qué podéis construir juntos.',
    includesTitle: 'La lectura incluye:',
    includes: [
      'El retrato de la pareja: quiénes sois juntos y el arquetipo de vuestra relación',
      'Atracción, comunicación, mundo emocional: dónde funcionáis y dónde os cuesta',
      'Los retos como crecimiento, los patrones kármicos y la dirección de la relación',
    ],
    cta: 'Descubre la Sinastría de Pareja',
    note: 'Pago único. Hacen falta los datos de nacimiento de ambos.',
    secureNote: 'Pago seguro - Acceso inmediato',
  },
  another: {
    kicker: 'Otra relación',
    title: '¿Quieres explorar otra relación?',
    body: 'Compra una nueva sinastría de pareja con datos de nacimiento distintos, para descubrir cómo dialoga tu cielo con otra persona.',
    cta: 'Nueva sinastría',
  },
};

export default synastryCard;
