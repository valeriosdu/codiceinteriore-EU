import type { Messages } from '@/i18n';

const legal: Messages['legal'] = {
  contact: {
    seoTitle: (siteName) => `Contact — ${siteName}`,
    seoDescription: (email) =>
      `Een vraag over je geboortehoroscoop, je rapport of de toegang tot je persoonlijke omgeving? Schrijf ons via het formulier of stuur een mail naar ${email}.`,
    kicker: 'Contact',
    title: 'Schrijf ons',
    subtitle:
      'Voor vragen, hulp of verzoeken kun je hier terecht. We reageren zo snel als we kunnen.',
    intro:
      'Heb je een vraag over je rapport, over de toegang tot je persoonlijke omgeving of over hoe de dienst werkt, schrijf ons dan gerust via het formulier hieronder.',
    sent: 'Bericht verzonden.',
    sentSub: 'We komen zo snel mogelijk bij je terug.',
    sendAnother: 'Nog een bericht sturen',
    nameLabel: 'Naam *',
    namePlaceholder: 'Je naam',
    emailLabel: 'E-mailadres *',
    emailPlaceholder: 'Je e-mailadres',
    reasonLabel: 'Reden van je bericht',
    reasonPlaceholder: 'Kies een reden',
    reasons: {
      purchase: 'Hulp bij een aankoop',
      report: 'Toegang tot het rapport',
      general: 'Algemene vraag',
      collab: 'Samenwerkingen',
    },
    messageLabel: 'Bericht *',
    messagePlaceholder: 'Schrijf hier je bericht…',
    error: 'Er ging iets mis. Probeer het zo opnieuw.',
    sending: 'Versturen…',
    send: 'Bericht versturen',
    otherTitle: 'Andere contactmogelijkheden',
    otherSub: 'Liever mailen? Dat kan ook.',
    privacyNote: 'We gebruiken je gegevens alleen om je vraag te beantwoorden.',
    validation: {
      name: 'Vul je naam in',
      email: 'Vul een geldig e-mailadres in',
      message: 'Schrijf een bericht',
    },
  },
  notFound: {
    title: 'Pagina niet gevonden',
    body: 'De pagina die je zoekt bestaat niet of is verplaatst.',
    cta: 'Terug naar de startpagina',
  },
  unsubscribe: {
    verifying: 'Controleren…',
    validTitle: 'Afmelden',
    validBody: (siteName) => `Weet je zeker dat je je wilt afmelden voor de mails van ${siteName}?`,
    confirm: 'Afmelding bevestigen',
    processing: 'Bezig…',
    doneTitle: 'Afgemeld',
    doneBody: (siteName) => `Je ontvangt geen mails meer van ${siteName}.`,
    alreadyTitle: 'Al afgemeld',
    alreadyBody: 'Je was al eerder afgemeld.',
    errorTitle: 'Ongeldige link',
    errorBody: 'Deze afmeldlink is niet geldig of is verlopen.',
  },
};

export default legal;
