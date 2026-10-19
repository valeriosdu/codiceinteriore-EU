import type { Messages } from '@/i18n';

const activate: Messages['activate'] = {
  titles: {
    signup: 'Aktivoi tilisi',
    signin: 'Kirjaudu tilillesi',
    forgot: 'Palauta pääsy tilillesi',
    reset: 'Aseta uusi salasana',
  },
  subtitles: {
    signup: 'Luo tunnukset, niin pääset raporttiisi ja löydät sen aina uudelleen.',
    signin: 'Anna tunnuksesi, niin pääset raporttiisi.',
    forgot:
      'Kirjoita sähköpostiosoitteesi: lähetämme sinulle kirjautumislinkin. Se toimii myös silloin, kun olet maksanut, mutta et ole vielä luonut tiliä.',
    reset: 'Valitse tilillesi uusi salasana.',
  },
  google: 'Jatka Googlella',
  or: 'tai',
  fields: {
    email: 'Sähköposti',
    emailLoading: 'Ladataan...',
    emailPlaceholder: 'Sähköpostiosoitteesi',
    password: 'Salasana',
    newPassword: 'Uusi salasana',
    passwordPlaceholder: 'Vähintään 6 merkkiä',
    confirmPassword: 'Vahvista salasana',
    confirmPasswordPlaceholder: 'Kirjoita salasana uudelleen',
    phone: 'Puhelinnumero',
    phonePlaceholder: '+358 40 123 4567',
  },
  forgotLink: 'Unohditko salasanasi?',
  toasts: {
    passwordTooShort: 'Salasanassa on oltava vähintään 6 merkkiä',
    passwordMismatch: 'Salasanat eivät täsmää',
    checkEmailRecovery: {
      title: 'Tarkista sähköpostisi',
      description: 'Jos osoite on rekisteröity tai liitetty ostokseen, saat kirjautumislinkin.',
    },
    passwordUpdated: {
      title: 'Salasana päivitetty',
      description: 'Viemme sinut raporttiisi.',
    },
    checkEmailConfirm: {
      title: 'Tarkista sähköpostisi',
      description: 'Lähetimme sinulle linkin, jolla vahvistat tilisi ja pääset heti raporttiisi.',
    },
    authError: 'Kirjautumisessa tapahtui virhe',
    wrongCredentials: 'Sähköposti tai salasana on väärin.',
    alreadyRegistered: 'Tällä sähköpostiosoitteella on jo tili. Kirjaudu sisään.',
    passwordSameAsOld: 'Uusi salasana ei saa olla sama kuin edellinen.',
    tooManyAttempts: 'Liian monta yritystä. Odota muutama minuutti ja yritä uudelleen.',
    welcomeBack: {
      title: 'Tervetuloa takaisin!',
      description: 'Aloita tästä oma Carta Interior -tulkintasi: muutama minuutti riittää.',
    },
  },
  cta: {
    loading: {
      signup: 'Luodaan tiliä…',
      signin: 'Kirjaudutaan…',
      forgot: 'Lähetetään…',
      reset: 'Tallennetaan…',
    },
    signup: 'Siirry raporttiisi',
    signin: 'Kirjaudu',
    forgot: 'Lähetä kirjautumislinkki',
    reset: 'Aseta salasana',
  },
  recoveryBox: {
    question: 'Oletko jo maksanut, mutta aktivointiviestiä ei kuulu?',
    action: 'Palauta pääsy sähköpostiosoitteellasi',
  },
  toggle: {
    haveAccount: 'Onko sinulla jo tili?',
    signIn: 'Kirjaudu',
    backToLogin: 'Takaisin kirjautumiseen',
    noAccount: 'Eikö sinulla ole tiliä?',
    signUp: 'Rekisteröidy',
  },
  privacyNote: 'Tietosi ovat turvassa. Emme koskaan jaa sähköpostiosoitettasi muille.',
  personalReadingLabel: 'Henkilökohtainen tulkinta',
};

export default activate;
