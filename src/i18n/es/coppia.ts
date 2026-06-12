import type { Messages } from '@/i18n';

const coppia: Messages['coppia'] = {
  titles: {
    landing: (siteName) => `Sinastría de Pareja | ${siteName}`,
    quiz: (siteName) => `Sinastría de Pareja - Cuestionario | ${siteName}`,
    processing: (siteName) => `Sinastría - Procesando | ${siteName}`,
    teaser: (siteName) => `Sinastría - Vista previa | ${siteName}`,
    success: (siteName) => `Pago recibido | ${siteName}`,
    activate: (siteName) => `Sinastría – Activa tu cuenta | ${siteName}`,
    reportProcessing: (siteName) => `Sinastría - Generación | ${siteName}`,
    report: (siteName) => `Sinastría de Pareja - Informe | ${siteName}`,
  },
  landing: {
    heroLine1: 'Vuestra relación,',
    heroLine2: 'leída por las estrellas',
    heroSubtitle:
      '¿Os habéis preguntado alguna vez por qué en ciertas cosas os entendéis al vuelo, y en otras chocáis siempre? La sinastría es la respuesta astrológica a esa pregunta.',
    cta: 'Empezar el cuestionario',
    socialProofLine1: 'Ya más de 800 parejas han descubierto',
    socialProofLine2: 'su sinastría de pareja',
    discoverKicker: 'Qué descubriréis',
    discoverTitleLine1: 'No un horóscopo de pareja.',
    discoverTitleLine2: 'Una lectura de verdad.',
    discoverItems: [
      {
        title: 'El arquetipo de la pareja',
        body: '¿Qué tipo de relación sois? 14 configuraciones astrológicas distintas, calculadas a partir de vuestros planetas reales.',
      },
      {
        title: 'Seis puntuaciones de compatibilidad',
        body: 'Sintonía emocional, atracción, comunicación, estabilidad, crecimiento, tensión. Medidas, explicadas, contextualizadas.',
      },
      {
        title: 'Ocho secciones de lectura',
        body: 'Retrato de la pareja, química, comunicación, mundo emocional, retos, estabilidad, patrón kármico, dirección. En español claro.',
      },
    ],
    howKicker: 'Cómo funciona',
    howSteps: [
      'Introducid los datos de nacimiento de ambos: fecha, hora (si la conocéis) y lugar.',
      'Calculamos la carta natal de cada uno y analizamos la superposición: es la sinastría.',
      'Recibís el informe completo: unas 10 páginas en español.',
    ],
  },
  quiz: {
    stepOf: (current, total) => `Paso ${current} de ${total}`,
    personA: 'Persona 1 (tú)',
    personB: 'Persona 2 (pareja)',
    date: {
      titleA: 'Cuándo naciste',
      titleB: 'Cuándo nació tu pareja',
      hint: 'Desliza para elegir día, mes y año.',
      day: 'Día',
      month: 'Mes',
      year: 'Año',
    },
    time: {
      titleA: 'A qué hora naciste',
      titleB: 'A qué hora nació tu pareja',
      hint: 'Si no la conoces con precisión, indica la hora más cercana posible, o marca "no la conozco" aquí abajo.',
      hour: 'Hora',
      minute: 'Minutos',
      unknownLabel: 'No la conozco',
      unknownNote:
        'Sin la hora la sinastría será parcial para esta persona (sin casas ni ascendente). Continúa tranquilamente, el resto del análisis sigue siendo válido.',
    },
    place: {
      titleA: 'Dónde naciste',
      titleB: 'Dónde nació tu pareja',
      hint: 'Ciudad. Empieza a escribir y elige de las sugerencias.',
      placeholder: 'p. ej. Madrid, Barcelona, Sevilla...',
      suggestionHint: 'Elige un lugar de las sugerencias para una lectura más precisa.',
      error: 'No encontramos este lugar. Elige una sugerencia de la lista.',
    },
    name: {
      titleA: 'Cómo te llamas',
      titleB: 'Cómo se llama tu pareja',
      hint: 'Solo el nombre de pila, lo usaremos en el informe.',
      placeholderA: 'Tu nombre',
      placeholderB: 'Nombre de tu pareja',
    },
    context: {
      title: '¿Cuánto tiempo lleváis juntos?',
      hint: 'Opcional. Ayuda a la lectura a calibrarse según la fase de la relación.',
      durations: {
        under_1y: 'Menos de 1 año',
        '1_to_3y': '1-3 años',
        '3_to_7y': '3-7 años',
        '7_to_15y': '7-15 años',
        over_15y: 'Más de 15 años',
        skip: 'Prefiero no responder',
      },
      focusLabel: 'Foco de la lectura (opcional)',
      focusPlaceholder: 'P. ej. entender los retos, decidir si casarnos, deshacer un bloqueo...',
    },
    back: 'Atrás',
    next: 'Siguiente',
    resolving: 'Verificando...',
    finalCta: 'Calcular la sinastría',
  },
  processing: {
    errorTitle: 'Hay un problema',
    errors: {
      createSession: 'No he podido crear la sesión. Inténtalo de nuevo en unos segundos.',
      timeout: 'La generación está tardando más de lo previsto. Inténtalo de nuevo en breve.',
      failed: 'Generación fallida. Inténtalo de nuevo.',
    },
    backToQuiz: 'Volver al cuestionario',
    title: 'Estoy calculando vuestra sinastría',
    body: 'Estoy componiendo las dos cartas natales y sus contactos. Unos segundos.',
  },
  teaser: {
    kicker: 'La sinastría de',
    personA: 'Persona A',
    personB: 'Persona B',
    wrongData: '¿Los datos no son correctos?',
    overallHigh:
      'Hay una base fuerte entre vosotros. La lectura completa os muestra exactamente dónde nace esa sintonía y cómo protegerla en el tiempo.',
    overallMedium:
      'Vuestra relación tiene recursos y puntos abiertos: es el perfil que devuelve la lectura más rica, porque hay mucho que entender y aprovechar.',
    overallLow:
      'Los números no son una nota: cuentan dónde fluye la relación y dónde pide atención. Las parejas con dinámicas complejas son las que, en la lectura, más descubren.',
    primaryCta: 'Consigue la sinastría completa',
    securePayment: 'Pago seguro y protegido',
    framing: {
      high: {
        ringLabel: 'Afinidad',
        contextLine:
          'Una puntuación alta señala terreno fértil. Pero hasta las mejores cartas tienen ángulos ciegos: el informe los recorre uno a uno.',
        domainsSubtitle:
          'En la lectura completa, cada número se convierte en una página, anclada a vuestros planetas reales.',
        ctaLabel: 'Leer la lectura',
        offerSubtitle: 'sobre vuestra relación',
        extraBullet: null,
      },
      medium: {
        ringLabel: 'Dinámica',
        contextLine:
          'Una puntuación intermedia cuenta una relación con más matices que certezas. Son precisamente los matices los que hacen la lectura interesante.',
        domainsSubtitle:
          'Cada número abre una pregunta. En la lectura completa, las preguntas encuentran el contexto de vuestros planetas reales.',
        ctaLabel: 'Leer la lectura',
        offerSubtitle: 'sobre vuestra relación',
        extraBullet: 'Qué funciona y qué pide atención, dominio por dominio',
      },
      low: {
        ringLabel: 'Complejidad',
        contextLine:
          'Una puntuación baja no describe cuánto os queréis: describe cuánto hay que entender. Las relaciones complejas son las que, bien leídas, devuelven más.',
        domainsSubtitle:
          'Los números bajos no son sentencias: son los puntos donde la relación pide más atención. La lectura completa explica el porqué, planeta por planeta.',
        ctaLabel: 'Entender la dinámica',
        offerSubtitle: 'para entender vuestra relación',
        extraBullet: 'Las razones astrológicas detrás de las dinámicas más difíciles',
      },
    },
    domains: {
      sintonia_emotiva: {
        label: 'Sintonía emocional',
        high: 'Os sentís en casa',
        medium: 'Un refugio que se construye',
        low: '¿Dónde buscáis seguridad?',
      },
      attrazione: {
        label: 'Atracción',
        high: 'Química y deseo',
        medium: 'Una química por descifrar',
        low: '¿Qué os acerca de verdad?',
      },
      comunicazione: {
        label: 'Comunicación',
        high: 'Las palabras fluyen',
        medium: 'Lenguas distintas, misma intención',
        low: '¿Dónde se atasca el diálogo?',
      },
      stabilita: {
        label: 'Estabilidad',
        high: 'Solidez en el tiempo',
        medium: 'Los cimientos se eligen',
        low: '¿Sobre qué se apoya la pareja?',
      },
      crescita: {
        label: 'Crecimiento',
        high: 'Os hacéis mover',
        medium: 'Expansión con fricción',
        low: '¿Qué os mantiene quietos?',
      },
      tensione: {
        label: 'Tensión',
        high: 'Fricción que transforma',
        medium: 'Roce constructivo',
        low: '¿Calma aparente o real?',
      },
    },
    excerptCaption: 'Extracto del resumen de vuestra lectura',
    offerBullets: [
      'Ocho secciones: retrato, química, comunicación, mundo emocional, retos, estabilidad, patrón kármico, dirección',
      'PDF descargable, acceso permanente',
      'Unas 10 páginas en español claro',
    ],
    faqTitle: 'Preguntas frecuentes',
    faqItems: [
      {
        q: '¿En qué se basa la sinastría?',
        a: 'La sinastría compara las posiciones planetarias reales en el momento del nacimiento de ambos. No usamos el signo solar genérico: calculamos la carta natal completa de cada uno y analizamos los aspectos entre las dos cartas.',
      },
      {
        q: '¿Puedo regalar la sinastría a alguien?',
        a: 'Claro. Solo necesitas conocer los datos de nacimiento de ambas personas. Tras el pago recibirás el PDF por correo: puedes reenviarlo o imprimirlo como regalo.',
      },
      {
        q: '¿Cuánto tarda en llegar la lectura?',
        a: 'La lectura se genera en pocos minutos tras el pago. Recibirás un correo con el enlace para acceder al PDF y a la versión web.',
      },
      {
        q: '¿Funciona también para parejas en crisis o que acaban de conocerse?',
        a: 'La sinastría retrata el potencial de la relación, no su estado actual. Sirve tanto para entender las dinámicas de una pareja consolidada como para explorar una conexión nueva.',
      },
    ],
  },
  offerCard: {
    defaultBullets: [
      'Ocho secciones: retrato, química, comunicación, mundo emocional, retos, estabilidad, patrón kármico, dirección',
      'PDF descargable, acceso permanente',
      'Unas 10 páginas en español claro',
    ],
    kicker: 'La lectura completa',
    titleLine1: 'Una lectura astrológica completa',
    defaultSubtitle: 'sobre vuestra relación',
    defaultCta: 'Consigue la sinastría completa',
    loadingCta: 'Abriendo el pago…',
    secureNote: 'Pago seguro y protegido. Recibirás un correo para acceder a la lectura.',
  },
  success: {
    titleProblem: 'Ha habido un problema',
    titleOk: 'Gracias, pago recibido',
    paypalError:
      'No hemos podido confirmar el pago de PayPal. Escríbenos si se ha cobrado el importe.',
    capturing: 'Estamos confirmando el pago de PayPal…',
    preparing: 'Estoy preparando tu cuenta. Un momento…',
  },
  activate: {
    titles: {
      signup: 'Crea tu cuenta',
      signin: 'Entra en tu cuenta',
      forgot: 'Recupera el acceso',
    },
    subtitles: {
      signup: 'Para acceder a tu informe de sinastría',
      signin: 'Introduce tus credenciales para acceder a tu informe de sinastría.',
      forgot: 'Introduce tu correo: te enviaremos un enlace para restablecer la contraseña.',
    },
    toasts: {
      checkEmailReset: {
        title: 'Revisa tu correo',
        description: 'Si la dirección está registrada, recibirás un enlace para restablecer la contraseña.',
      },
      alreadyRegistered: 'Ya existe una cuenta con este correo. Inicia sesión.',
      wrongCredentials: 'Correo o contraseña incorrectos.',
    },
  },
  reportProcessing: {
    preparing: 'Estamos preparando vuestro informe',
    writing: 'Estoy escribiendo vuestro informe. Unos minutos...',
    starting: 'Estoy iniciando la redacción del informe...',
    duration: 'La generación del informe tarda de 1 a 3 minutos.',
    errorTitle: 'Hay un problema',
    errors: {
      sessionNotFound: 'No encuentro tu sesión. Escríbenos si el problema persiste.',
      failed: 'Generación fallida. Escríbenos si el problema persiste.',
      timeout: 'La generación está tardando más de lo previsto. Inténtalo de nuevo en unos minutos.',
    },
  },
  report: {
    title: 'Vuestra sinastría',
    personA: 'Persona A',
    personB: 'Persona B',
    yourMap: 'Vuestro mapa',
    mapLabels: {
      cosa_siete: 'Qué sois',
      dove_brillate: 'Dónde brilláis',
      dove_inciampate: 'Dónde tropezáis',
      dove_andate: 'Hacia dónde vais',
    },
    sixDomains: 'Los seis dominios de vuestra relación',
    coupleChart: 'La carta de la pareja',
    downloading: 'Preparando PDF...',
    downloadPdf: 'Descargar el PDF',
  },
  radar: {
    sintonia_emotiva: 'Sintonía',
    attrazione: 'Atracción',
    comunicazione: 'Comunicación',
    stabilita: 'Estabilidad',
    crescita: 'Crecimiento',
    tensione: 'Tensión',
  },
  ringDefaultLabel: 'Compatibilidad',
  ringAria: (score) => `Puntuación ${score} sobre 100`,
  archetypeLabel: 'Arquetipo',
  archetypes: {
    soulmates: {
      label: 'Almas afines',
      definizione:
        'Rara combinación de pasión y duración profunda: fuerte sintonía romántica sostenida por una estructura estable.',
    },
    kindred_spirits: {
      label: 'Espíritus afines',
      definizione:
        'Comprensión emocional profunda con poca fricción: una sintonía que se percibe natural.',
    },
    opposites_attract: {
      label: 'Opuestos que se atraen',
      definizione:
        'Fuerte intensidad romántica alimentada por diferencias marcadas: la tensión es parte de la atracción.',
    },
    karmic_lesson: {
      label: 'Lección kármica',
      definizione:
        'Dinámica exigente nacida para evolucionar: pide conciencia, devuelve transformación.',
    },
    steady_rock: {
      label: 'Roca estable',
      definizione: 'Cimientos sólidos y fiabilidad: una pareja sobre la que construir en el tiempo.',
    },
    intellectual_powerhouse: {
      label: 'Sintonía mental potente',
      definizione: 'Conexión mental excepcional: ideas, palabras y curiosidad fluyen con soltura.',
    },
    magnetic_attraction: {
      label: 'Atracción magnética',
      definizione: 'Química romántica y física dominante: la atracción es el hilo principal.',
    },
    long_term_anchor: {
      label: 'Ancla de largo plazo',
      definizione: 'Una base sólida sobre la que construir el futuro: estabilidad antes que efervescencia.',
    },
    mental_synergy: {
      label: 'Sinergia mental',
      definizione: 'Excelente relación intelectual: comunicación y proyectos son vuestro terreno común.',
    },
    volatile_spark: {
      label: 'Chispa volátil',
      definizione: 'Energía alta, dinámica intensa: transformadora si se acoge, agotadora si se padece.',
    },
    catalyst_for_change: {
      label: 'Catalizador de cambio',
      definizione: 'Estimuláis la expansión el uno del otro: una pareja que hace mover.',
    },
    deep_bond: {
      label: 'Vínculo profundo',
      definizione: 'Seguridad emocional profunda: una pareja en la que uno se siente visto sin explicaciones.',
    },
    balanced_connection: {
      label: 'Conexión equilibrada',
      definizione: 'Una mezcla estable de energías distintas: ningún tema domina, el equilibrio es la clave.',
    },
    discordant_layout: {
      label: 'Configuración disonante',
      definizione:
        'Fricción significativa que requiere un esfuerzo consciente: la pareja funciona cuando ambos lo eligen.',
    },
  },
};

export default coppia;
