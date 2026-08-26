import type { Messages } from '@/i18n';

const checkout: Messages['checkout'] = {
  failed: {
    title: 'We konden de duiding niet klaarzetten',
    body: 'Er gaat iets niet zoals het hoort. Probeer het over een paar tellen opnieuw.',
    retry: 'Opnieuw proberen',
  },
  loading: {
    title: 'We maken de duiding klaar',
    slow: 'Het duurt langer dan verwacht. Blijf op deze pagina: we proberen het zo automatisch opnieuw.',
    normal: 'We berekenen de geboortehoroscoop voordat we je het aanbod laten zien.',
  },
  toasts: {
    stillPreparingShort: 'We zijn de duiding nog aan het klaarmaken. Probeer het zo opnieuw.',
    stillPreparingRetry: 'We zijn de duiding nog aan het klaarmaken. Probeer het over een paar seconden opnieuw.',
  },
  hero: {
    title: (name) => `De duiding voor ${name} staat klaar`,
    fallbackRecipient: 'hem of haar',
    subtitle: 'We hebben de geboortehoroscoop berekend. Kies de vorm waarin we de volledige duiding maken.',
    wrongData: 'Kloppen de gegevens niet?',
  },
  offers: {
    baseName: 'Volledige Duiding van de Geboortehoroscoop',
    basePromise: (name) =>
      `Om de emotionele, relationele en persoonlijke structuur van ${name} helderder te begrijpen, en te zien wat zich in het leven blijft herhalen.`,
    baseFeatures: [
      'Begrijp emotionele blokkades, afweer en terugkerende dynamiek in menselijke taal, niet in vaktermen',
      'Zie hoe die patronen doorwerken in relaties, werk, persoonlijke richting en levenskeuzes',
      'Krijg praktische aanwijzingen over wat je kunt opmerken, versterken of bijsturen',
      'Direct toegang tot de duiding online en per mail',
    ],
    premiumPromise: (name) =>
      `Begrijpen wat ${name} diep vanbinnen stuurt, en ook het moment van nu helder lezen.`,
  },
};

export default checkout;
