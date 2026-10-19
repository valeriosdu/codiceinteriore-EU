import type { Messages } from '@/i18n';

const legal: Messages['legal'] = {
  contact: {
    seoTitle: (siteName) => `Yhteystiedot — ${siteName}`,
    seoDescription: (email) =>
      `Kysyttävää syntymäkartasta, raportista tai pääsystä omalle sivullesi? Kirjoita meille lomakkeella tai sähköpostilla: ${email}.`,
    kicker: 'Yhteystiedot',
    title: 'Kirjoita meille',
    subtitle:
      'Kysymykset, tuki ja pyynnöt: voit ottaa meihin yhteyttä tästä. Vastaamme mahdollisimman pian.',
    intro:
      'Jos sinulla on kysyttävää raportistasi, pääsystäsi omalle sivullesi tai palvelun toiminnasta, voit kirjoittaa meille suoraan alla olevalla lomakkeella.',
    sent: 'Viesti lähetetty.',
    sentSub: 'Vastaamme mahdollisimman pian.',
    sendAnother: 'Lähetä toinen viesti',
    nameLabel: 'Nimi *',
    namePlaceholder: 'Nimesi',
    emailLabel: 'Sähköposti *',
    emailPlaceholder: 'Sähköpostiosoitteesi',
    reasonLabel: 'Yhteydenoton aihe',
    reasonPlaceholder: 'Valitse aihe',
    reasons: {
      purchase: 'Apua ostoksessa',
      report: 'Pääsy raporttiin',
      general: 'Yleinen kysymys',
      collab: 'Yhteistyö',
    },
    messageLabel: 'Viesti *',
    messagePlaceholder: 'Kirjoita viestisi tähän…',
    error: 'Jokin meni pieleen. Yritä hetken kuluttua uudelleen.',
    sending: 'Lähetetään…',
    send: 'Lähetä viesti',
    otherTitle: 'Muut yhteydenottotavat',
    otherSub: 'Jos haluat, voit kirjoittaa meille myös sähköpostilla.',
    privacyNote: 'Käytämme tietojasi vain pyyntösi käsittelyyn.',
    validation: {
      name: 'Kirjoita nimesi',
      email: 'Anna kelvollinen sähköpostiosoite',
      message: 'Kirjoita viesti',
    },
  },
  notFound: {
    title: 'Sivua ei löytynyt',
    body: 'Etsimääsi sivua ei ole olemassa tai se on siirretty.',
    cta: 'Takaisin etusivulle',
  },
  unsubscribe: {
    verifying: 'Tarkistetaan…',
    validTitle: 'Tilauksen peruuttaminen',
    validBody: (siteName) => `Haluatko varmasti, ettet saa enää sähköposteja lähettäjältä ${siteName}?`,
    confirm: 'Vahvista peruutus',
    processing: 'Käsitellään…',
    doneTitle: 'Tilaus peruttu',
    doneBody: (siteName) => `Et saa enää sähköposteja lähettäjältä ${siteName}.`,
    alreadyTitle: 'Jo peruttu',
    alreadyBody: 'Tilauksesi on jo peruttu aiemmin.',
    errorTitle: 'Virheellinen linkki',
    errorBody: 'Tämä peruutuslinkki ei ole voimassa tai se on vanhentunut.',
  },
};

export default legal;
