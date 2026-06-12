import type { FunnelCopy, FunnelSlug } from '@/funnels/registry';

const classica: FunnelCopy = {
  teaser: {
    fallbackInsights: [
      {
        title: 'No eliges al azar',
        body: 'Hay una forma precisa en la que te vinculas: algo en tu estructura reconoce un cierto tipo de intensidad antes incluso de que lo pienses. El patrón no es el tipo de persona, es el modo en que te enciendes.',
      },
      {
        title: 'No eres cerrada, te proteges',
        body: 'Cuando el otro se acerca demasiado o se aleja, algo en ti se activa. No es frialdad, no es ambivalencia: es una defensa precisa que tiene una función, no un síntoma que corregir.',
      },
      {
        title: 'Lo que de verdad buscas',
        body: 'Bajo el patrón y la defensa hay un deseo preciso, y tiene una forma más sutil de la que has aprendido a pedir. Reconocerlo no rompe el patrón: cambia el modo en que lo habitas.',
      },
    ],
    offerHeadline: 'Has leído un adelanto de tu lectura.',
    offerSubhead:
      'Los 3 fragmentos que has leído son síntesis breves y densas. La Lectura Completa te ofrece un cuadro único y coherente de todos los aspectos de tu Carta Natal.',
    reportSectionsList: [
      'Identidad profunda',
      'Dinámicas emocionales',
      'Relaciones y amor',
      'Trabajo y dirección',
      'Patrones y bloqueos recurrentes',
      'Consejos prácticos',
    ],
    baseOffer: {
      promise:
        'Para entender con más claridad tu estructura emocional, relacional y personal, y ver qué tiende a repetirse en tu vida.',
      features: [
        'Comprende bloqueos emocionales, defensas y dinámicas recurrentes con un lenguaje humano, no técnico',
        'Ve cómo estos patrones influyen en relaciones, trabajo, dirección personal y decisiones de vida',
        'Recibe pistas prácticas sobre qué observar, favorecer o corregir en tus formas de reaccionar',
        'Profundiza gratis en la lectura con una Guía Astrológica que responde a tus preguntas',
        'Acceso inmediato a tu lectura en línea y por correo electrónico',
      ],
    },
    trustBullets: [
      'Si la lectura te parece genérica o no te toca de verdad, te reembolsamos hasta el último céntimo.',
    ],
    faqItems: [
      {
        q: '¿En qué se diferencia de las lecturas astrológicas gratuitas que hay en línea?',
        a: 'Las lecturas gratuitas que encuentras en línea a menudo lo dividen todo en partes separadas: un significado por cada planeta, uno por cada aspecto, uno por cada casa. Aquí el trabajo es distinto: tu carta se lee como un conjunto vivo, dando más peso a lo que de verdad cuenta y conectando entre sí relaciones, emociones, bloqueos y dirección personal en una lectura única y coherente, sin contradicciones.',
      },
      {
        q: '¿Qué recibo exactamente al comprar la lectura?',
        a: 'Recibes una lectura completa y personalizada de 10 páginas de tu carta natal, escrita en un lenguaje claro y humano. La lectura profundiza en identidad, dinámicas emocionales, relaciones, patrones recurrentes, bloqueos principales y dirección personal. Junto con la lectura recibes también 2 preguntas gratis para la Guía astrológica, donde puedes pedir aclaraciones sobre cualquier parte de tu informe o de tu carta.',
      },
      {
        q: '¿Qué es la Guía astrológica incluida con la lectura?',
        a: 'Después de leer tu informe, puedes hacerle preguntas personales sobre cualquier aspecto de tu carta natal o del momento que estás viviendo. La Guía elabora la respuesta basándose en tus datos de nacimiento y en la lectura que ya has recibido, y te la entrega en las horas siguientes en tu espacio personal y por correo. Con la Lectura Completa se incluyen 2 preguntas gratis, y podrás profundizar aún más con paquetes de preguntas adicionales directamente desde tu informe.',
      },
      {
        q: '¿Cómo se crea la Lectura Completa?',
        a: 'A partir de los datos de nacimiento que has introducido se genera tu carta natal astrológica. Sobre esa base toma forma la lectura completa, que utiliza un sistema de elaboración asistida fundado en un conocimiento astrológico y psicológico amplio y organizado. Esto permite conectar mucha información entre sí y traducirla en una lectura clara, coherente y personal, distinta de los contenidos genéricos y fragmentados que hay en línea.',
      },
      {
        q: '¿Necesito saber ya de astrología para entenderla?',
        a: 'No. La lectura está escrita para ser comprensible aunque nunca hayas estudiado astrología. Los términos astrológicos pueden aparecer, pero siempre se traducen en significados concretos, psicológicos y relacionales.',
      },
      {
        q: '¿Qué diferencia hay entre la lectura completa y la oferta que incluye el primer mes de tránsitos?',
        a: 'La lectura completa profundiza en tu estructura personal de base: emociones, relaciones, decisiones, bloqueos y patrones recurrentes a partir de tu Carta Natal. Es una lectura más estable, ligada a lo que tiende a repetirse en el tiempo. La oferta con el primer mes añade los tránsitos semanales: una lectura de cómo los movimientos astrológicos del periodo pueden activar algunas partes de tu mapa personal y ayudarte a entender mejor el momento que estás viviendo ahora. En resumen: el informe explica tu estructura, los tránsitos muestran cómo esa estructura se mueve en el presente. Incluye también el poema transformador personalizado como regalo.',
      },
      {
        q: '¿Cuándo recibo el acceso a la lectura?',
        a: 'Justo después de la compra. Una vez completado el pago, podrás activar tu acceso personal y leer el informe en tu área reservada y por correo.',
      },
    ],
  },
  report: {
    sections: {
      identity: { label: 'Identidad', title: 'Identidad profunda' },
      emotions: { label: 'Emociones', title: 'Dinámicas emocionales' },
      relationships: { label: 'Relaciones', title: 'Relaciones y amor' },
      work: { label: 'Trabajo', title: 'Trabajo y dirección' },
      patterns_blocks: { label: 'Patrones', title: 'Patrones y bloqueos recurrentes' },
      advice: { label: 'Consejos', title: 'Consejos prácticos' },
      poem: { label: 'Poema', title: 'Poema transformador' },
    },
  },
};

const attivazione: FunnelCopy = {
  teaser: {
    fallbackInsights: [
      {
        title: 'No es pereza',
        body: 'Lo que te bloquea no es falta de voluntad. Es una protección que aprendiste a construir — útil, en su día. Ahora te mantiene quieto, y entender cómo funciona te ayuda a no padecerla más.',
      },
      {
        title: 'No vas con retraso, tienes otro ritmo',
        body: 'Te sientes con retraso porque te comparas con el tiempo de los demás. Pero tu ritmo es distinto: tiene pausas más largas, reinicios inesperados, momentos en los que parece que no pasa nada. Entenderlo cambia cómo te ves.',
      },
      {
        title: 'Qué te desbloquea de verdad',
        body: 'No es una cuestión de motivación. Arrancas cuando a tu alrededor hay ciertas condiciones precisas — las adecuadas para como eres, no las que funcionan para los demás. Tu carta natal te dice cuáles son.',
      },
    ],
    offerHeadline: 'Has leído un adelanto de tu lectura.',
    offerSubhead:
      'Estos 3 puntos son síntesis deliberadamente breves y densas. Tu carta natal es mucho más amplia. La Lectura Completa lo desarrolla todo por extenso y conecta los distintos aspectos entre sí: qué te bloquea de verdad (y qué protege ese bloqueo), en qué condiciones te desbloqueas, y si de verdad vas con retraso o simplemente sigues tus tiempos naturales. Unas 10 páginas en español sencillo, para releer cuando lo necesites.',
    reportSectionsList: [
      'Identidad profunda',
      'Dinámicas emocionales',
      'Bloqueos principales',
      'Patrones recurrentes',
      'Condiciones de activación',
      'Tu ritmo',
    ],
    baseOffer: {
      promise:
        'Para entender por qué no consigues desbloquearte como quisieras, qué te hace arrancar de verdad, y el ritmo profundo que ya estás siguiendo. Escrito con claridad, en español humano.',
      features: [
        'Entiende qué te bloquea, y qué protege ese bloqueo',
        'Reconoce las condiciones en las que te desbloqueas y te pones en marcha de verdad',
        'Ve tu ritmo: cuándo empujar y cuándo detenerte',
        'Profundiza en la lectura con una Guía Astrológica que responde a tus preguntas, 2 consultas incluidas',
        'Acceso inmediato a tu lectura en línea y por correo',
      ],
    },
    trustBullets: [
      'Si la lectura te parece genérica o no te toca de verdad, te reembolsamos hasta el último céntimo.',
      'Una visión coherente que une bloqueos, patrones, activación y dirección personal.',
      'Por eso al final el cuadro te resultará claro y coherente.',
    ],
    faqItems: [
      {
        q: '¿En qué se diferencia de las lecturas astrológicas gratuitas que hay en línea?',
        a: 'Las lecturas gratuitas en línea lo dividen todo en partes separadas: un significado por cada planeta, uno por cada aspecto, uno por cada casa. Aquí el trabajo es distinto: tu carta se lee como un conjunto vivo, dando más peso a lo que de verdad cuenta y conectando entre sí identidad, emociones, bloqueos, patrones y dirección personal en una lectura única y coherente, sin contradicciones.',
      },
      {
        q: '¿Qué recibo exactamente al comprar la lectura?',
        a: 'Recibes una lectura completa y personalizada de 10 páginas de tu carta natal, escrita en un lenguaje claro y humano. La lectura profundiza en identidad, dinámicas emocionales, bloqueos principales, patrones que se repiten, qué te desbloquea de verdad y tu ritmo profundo. Junto con la lectura recibes también 2 preguntas gratis para la Guía astrológica, donde puedes pedir aclaraciones sobre cualquier parte de tu informe o de tu carta.',
      },
      {
        q: '¿Qué es la Guía astrológica incluida con la lectura?',
        a: 'Después de leer tu informe, puedes hacerle preguntas personales sobre cualquier aspecto de tu carta natal o del momento que estás viviendo. La Guía elabora la respuesta basándose en tus datos de nacimiento y en la lectura que ya has recibido, y te la entrega en las horas siguientes en tu espacio personal y por correo. Con la Lectura Completa se incluyen 2 preguntas gratis, y podrás profundizar aún más con paquetes de preguntas adicionales directamente desde tu informe.',
      },
      {
        q: '¿Cómo se crea la Lectura Completa?',
        a: 'A partir de los datos de nacimiento que has introducido se genera tu carta natal astrológica. Sobre esa base toma forma la lectura completa, que utiliza un sistema de elaboración asistida fundado en un conocimiento astrológico y psicológico amplio y organizado. Esto permite conectar mucha información entre sí y traducirla en una lectura clara, coherente y personal, distinta de los contenidos genéricos y fragmentados que hay en línea.',
      },
      {
        q: '¿Necesito saber ya de astrología para entenderla?',
        a: 'No. La lectura está escrita para ser comprensible aunque nunca hayas estudiado astrología. Los términos astrológicos pueden aparecer, pero siempre se traducen en significados concretos y psicológicos.',
      },
      {
        q: '¿Qué diferencia hay entre la lectura completa y la oferta que incluye el primer mes de tránsitos?',
        a: 'La lectura completa profundiza en tu estructura personal de base: emociones, bloqueos, patrones y dirección a partir de tu Carta Natal. Es una lectura más estable, ligada a lo que tiende a repetirse en el tiempo. La oferta con el primer mes añade los tránsitos semanales: una lectura de cómo los movimientos astrológicos del periodo pueden activar algunas partes de tu mapa personal y ayudarte a entender mejor el momento que estás viviendo ahora. En resumen: el informe explica tu estructura, los tránsitos muestran cómo esa estructura se mueve en el presente. Incluye también el poema transformador personalizado como regalo.',
      },
      {
        q: '¿Cuándo recibo el acceso a la lectura?',
        a: 'Justo después de la compra. Una vez completado el pago, podrás activar tu acceso personal y leer el informe en tu área reservada y por correo.',
      },
    ],
  },
  report: {
    sections: {
      identity: { label: 'Identidad', title: 'Identidad profunda' },
      emotions_relationships: { label: 'Dinámicas', title: 'Dinámicas emocionales y relacionales' },
      blocks_patterns: { label: 'Bloqueos', title: 'Bloqueos y patrones recurrentes' },
      work_direction: { label: 'Trabajo', title: 'Trabajo y dirección' },
      advice: { label: 'Consejos', title: 'Consejos prácticos' },
      poem: { label: 'Poema', title: 'Poema transformador' },
    },
  },
};

const funnels: Record<FunnelSlug, FunnelCopy> = {
  classica,
  attivazione,
};

export default funnels;
