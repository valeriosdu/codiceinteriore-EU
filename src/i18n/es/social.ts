import type { Messages } from '@/i18n';

const social: Messages['social'] = {
  testimonials: {
    kicker: 'Testimonios',
    heading: 'Lo que más ha impactado a nuestros clientes',
    items: [
      {
        text: 'Esperaba algo genérico. En cambio hubo varios pasajes que me describieron de una forma casi incómoda de lo precisos que eran.',
        name: 'Lucía',
        age: 31,
      },
      {
        text: 'La diferencia respecto a las lecturas gratuitas en línea se nota. Aquí no encuentras frases sueltas: hay un hilo, una estructura. Al final tienes de verdad una visión más completa de cómo funcionas y de qué hacer',
        name: 'Sara',
        age: 39,
      },
      {
        text: 'Me gustó porque no intenta predecirlo todo. Te ayuda más bien a entender qué se repite, dónde te bloqueas, qué tipo de dinámica estás viviendo ahora y qué hacer.',
        name: 'Valentina',
        age: 33,
      },
      {
        text: 'Tenía miedo de que fuera una lectura hecha para decir cosas bonitas a todos. Pero no: sobre todo en la parte relacional me sentí de verdad vista.',
        name: 'Laura',
        age: 35,
      },
      {
        text: 'El informe completo me ayudó a entender la estructura, que en parte ya intuía pero no con tanta claridad... El resto me hizo conectar todo con lo que estoy viviendo ahora. Recomiendo la compra.',
        name: 'Beatriz',
        age: 24,
      },
    ],
  },
  reportPreview: {
    aria: 'Vista previa del informe completo',
    slideAlts: [
      'Vista previa del Informe Completo Carta Interior',
      'Extracto de la sección Identidad profunda',
      'Extracto de la sección Dinámicas emocionales',
      'Extracto de la sección Relaciones y amor',
      'Extracto de la sección Trabajo y dirección',
      'Extracto de la sección Patrones y bloqueos recurrentes',
      'Extracto de la sección Consejos prácticos',
      'Extracto del Poema transformador',
    ],
    zoomAria: (alt) => `Ampliar: ${alt}`,
    prevSlide: 'Diapositiva anterior',
    nextSlide: 'Diapositiva siguiente',
    goToSlide: (n) => `Ir a la diapositiva ${n}`,
    note: 'Extracto de muestra. El Informe completo que recibirás está personalizado según tus datos de nacimiento, y tiene unas 10 páginas.',
    zoomedAria: 'Vista ampliada',
    closePreview: 'Cerrar vista previa',
    prevImage: 'Imagen anterior',
    nextImage: 'Imagen siguiente',
    escHint: 'Toca fuera o pulsa ESC para cerrar',
  },
};

export default social;
