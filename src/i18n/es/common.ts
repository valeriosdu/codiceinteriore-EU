import type { Messages } from '@/i18n';

const common: Messages['common'] = {
  // "19€", "14,90€" — formato precios al estilo español (símbolo tras el número).
  priceLabel: (eur) =>
    `${eur.toLocaleString('es-ES', {
      minimumFractionDigits: Number.isInteger(eur) ? 0 : 2,
      maximumFractionDigits: 2,
    })} €`,
  header: {
    homeAria: (siteName) => `${siteName} — Inicio`,
    signIn: 'Entrar',
    myReport: 'Mi informe',
  },
  loading: 'Cargando…',
  recommendedChoice: 'Opción recomendada',
  chart: {
    openFullscreen: 'Abrir la carta natal a pantalla completa',
    title: 'Carta natal',
    zoomOut: 'Reducir zoom',
    zoomReset: 'Restablecer zoom',
    zoomIn: 'Aumentar zoom',
  },
  cookieBanner: {
    aria: 'Aviso sobre cookies',
    close: 'Cerrar',
    text: 'Usamos cookies técnicas y de medición para mejorar tu experiencia.',
    moreInfo: 'Más información',
    reject: 'Rechazar',
    accept: 'Aceptar',
  },
  footer: {
    rights: (year, siteName) => `© ${year} ${siteName}. Todos los derechos reservados.`,
    guides: 'Guías',
    glossary: 'Glosario',
    privacy: 'Privacidad',
    terms: 'Términos',
    contact: 'Contacto',
    brandLine: (siteName) => `${siteName} es una marca de`,
    addressLabel: 'Domicilio social:',
    regLabel: 'Número de registro:',
  },
};

export default common;
