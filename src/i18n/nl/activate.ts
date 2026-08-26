import type { Messages } from '@/i18n';

const activate: Messages['activate'] = {
  titles: {
    signup: 'Activeer je account',
    signin: 'Log in op je account',
    forgot: 'Herstel de toegang tot je account',
    reset: 'Stel een nieuw wachtwoord in',
  },
  subtitles: {
    signup: 'Maak je inloggegevens aan om bij je rapport te komen en het altijd terug te vinden.',
    signin: 'Vul je inloggegevens in om bij je rapport te komen.',
    forgot:
      'Vul je e-mailadres in: we sturen je een link om in te loggen. Dit werkt ook als je wel hebt betaald maar nog geen account hebt aangemaakt.',
    reset: 'Kies een nieuw wachtwoord voor je account.',
  },
  google: 'Doorgaan met Google',
  or: 'of',
  fields: {
    email: 'E-mailadres',
    emailLoading: 'Laden...',
    emailPlaceholder: 'Je e-mailadres',
    password: 'Wachtwoord',
    newPassword: 'Nieuw wachtwoord',
    passwordPlaceholder: 'Minimaal 6 tekens',
    confirmPassword: 'Wachtwoord bevestigen',
    confirmPasswordPlaceholder: 'Herhaal het wachtwoord',
    phone: 'Telefoonnummer',
    phonePlaceholder: '+31 6 12345678',
  },
  forgotLink: 'Wachtwoord vergeten?',
  toasts: {
    passwordTooShort: 'Het wachtwoord moet minimaal 6 tekens hebben',
    passwordMismatch: 'De wachtwoorden komen niet overeen',
    checkEmailRecovery: {
      title: 'Kijk even in je mail',
      description: 'Is het adres bij ons bekend of gekoppeld aan een aankoop, dan krijg je een link om in te loggen.',
    },
    passwordUpdated: {
      title: 'Wachtwoord bijgewerkt',
      description: 'We brengen je naar je rapport.',
    },
    checkEmailConfirm: {
      title: 'Kijk even in je mail',
      description: 'We hebben je een link gestuurd om je account te bevestigen en meteen bij je rapport te komen.',
    },
    authError: 'Er ging iets mis bij het inloggen',
    welcomeBack: {
      title: 'Fijn dat je er weer bent!',
      description: 'Hier begint je Carta Interior: een paar minuten is genoeg.',
    },
  },
  cta: {
    loading: {
      signup: 'Aanmaken…',
      signin: 'Inloggen…',
      forgot: 'Versturen…',
      reset: 'Opslaan…',
    },
    signup: 'Ga naar je rapport',
    signin: 'Inloggen',
    forgot: 'Stuur de herstellink',
    reset: 'Wachtwoord instellen',
  },
  recoveryBox: {
    question: 'Wel betaald maar geen activatiemail ontvangen?',
    action: 'Herstel de toegang met je e-mailadres',
  },
  toggle: {
    haveAccount: 'Heb je al een account?',
    signIn: 'Inloggen',
    backToLogin: 'Terug naar inloggen',
    noAccount: 'Nog geen account?',
    signUp: 'Aanmelden',
  },
  privacyNote: 'Je gegevens zijn veilig. We delen je e-mailadres nooit met anderen.',
  personalReadingLabel: 'Persoonlijke duiding',
};

export default activate;
