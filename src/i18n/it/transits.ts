const transits = {
  upsell: {
    errors: {
      noUrl: 'URL non disponibile',
      checkout: 'Non siamo riusciti ad aprire il pagamento. Riprova tra un istante.',
    },
    ariaActive: 'Transiti del mese attivi',
    ariaInactive: 'Attiva la lettura mensile dei transiti',
    activeBadge: 'Attivi',
    activeTitle: 'Hai i transiti di questo mese',
    validUntil: 'Validi fino al',
    validUntilFallback: 'fine del periodo incluso',
    activeBody:
      'Ti restano fino alla data indicata. Per continuare anche dopo, puoi rinnovare con la lettura mensile, oppure fermarti qui.',
    kicker: 'Transiti del mese',
    title: 'Hai letto il tuo Tema Natale. Adesso puoi leggere il momento presente.',
    body: "La carta natale è la tua struttura, decisa dalla nascita: non cambia. Il cielo, però, si muove ogni giorno. I pianeti ogni giorno si sovrappongono ai punti della tua carta (il tuo Sole, Luna, Ascendente, etc.) e ne attivano certe parti a seconda dell'aspetto che formano.",
    monthlyListTitle: 'Ogni mese ricevi una lettura che ti dice:',
    monthlyList: [
      'Quali aree della tua carta sono in tensione, favorite o sotto pressione, e cosa osservare',
      'I momenti chiave del mese, con date precise, e cosa favorire settimana per settimana',
      'Quanto dura quello che stai attraversando, e cosa arriva dopo',
    ],
    ctaActive: (priceLabel: string) => `Continua con i transiti mensili - ${priceLabel}/mese`,
    ctaInactive: (priceLabel: string) => `Leggi i transiti del mese - ${priceLabel}/mese`,
    renewNoteActive: 'Rinnovo mensile, disdici quando vuoi',
    renewNoteInactive: 'Una nuova lettura ogni mese. Disdici quando vuoi.',
    secureNote: 'Pagamento sicuro - Accesso immediato',
  },
};

export default transits;
