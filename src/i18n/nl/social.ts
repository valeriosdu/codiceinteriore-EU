import type { Messages } from '@/i18n';

const social: Messages['social'] = {
  testimonials: {
    kicker: 'Ervaringen',
    heading: 'Wat klanten het meest is bijgebleven',
    items: [
      {
        text: 'Ik verwachtte iets algemeens. In plaats daarvan stonden er passages in die me zo precies beschreven dat het bijna ongemakkelijk werd.',
        name: 'Lotte',
        age: 31,
      },
      {
        text: 'Het verschil met de gratis duidingen online voel je meteen. Hier krijg je geen losse zinnen: er zit een lijn in, een structuur. Aan het eind heb je echt een vollediger beeld van hoe je werkt en van wat je ermee kunt.',
        name: 'Sanne',
        age: 39,
      },
      {
        text: 'Wat me beviel is dat het niet alles probeert te voorspellen. Het helpt je vooral begrijpen wat zich herhaalt, waar je vastloopt, in wat voor dynamiek je nu zit en wat je eraan kunt doen.',
        name: 'Fleur',
        age: 33,
      },
      {
        text: 'Ik was bang dat het zo geschreven zou zijn dat iedereen zich er wel in herkent. Maar nee: juist in het relationele deel voelde ik me echt gezien.',
        name: 'Anouk',
        age: 35,
      },
      {
        text: 'Het volledige rapport hielp me de structuur te begrijpen die ik deels al aanvoelde, maar niet zo helder... De rest liet me alles verbinden met wat ik nu meemaak. Een aanrader.',
        name: 'Eva',
        age: 24,
      },
    ],
  },
  reportPreview: {
    aria: 'Voorbeeld van het volledige rapport',
    slideAlts: [
      'Voorbeeld van het Volledige Rapport Carta Interior',
      'Fragment uit het deel Je diepere identiteit',
      'Fragment uit het deel Emotionele dynamiek',
      'Fragment uit het deel Relaties en liefde',
      'Fragment uit het deel Werk en richting',
      'Fragment uit het deel Terugkerende patronen en blokkades',
      'Fragment uit het deel Praktische handvatten',
      'Fragment uit het Transformerend gedicht',
    ],
    zoomAria: (alt) => `Vergroten: ${alt}`,
    prevSlide: 'Vorige dia',
    nextSlide: 'Volgende dia',
    goToSlide: (n) => `Ga naar dia ${n}`,
    note: 'Voorbeeldfragment. Het volledige rapport dat jij krijgt is afgestemd op je geboortegegevens en telt ongeveer 10 pagina\'s.',
    zoomedAria: 'Vergrote weergave',
    closePreview: 'Voorbeeld sluiten',
    prevImage: 'Vorige afbeelding',
    nextImage: 'Volgende afbeelding',
    escHint: 'Tik ernaast of druk op ESC om te sluiten',
  },
};

export default social;
