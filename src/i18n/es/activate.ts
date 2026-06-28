import type { Messages } from '@/i18n';

const activate: Messages['activate'] = {
  titles: {
    signup: 'Activa tu cuenta',
    signin: 'Entra en tu cuenta',
    forgot: 'Recupera el acceso a tu cuenta',
    reset: 'Establece una nueva contraseña',
  },
  subtitles: {
    signup: 'Crea tus credenciales para acceder al informe y recuperarlo cuando quieras.',
    signin: 'Introduce tus credenciales para acceder a tu informe.',
    forgot:
      'Introduce tu correo: te enviaremos un enlace para entrar. Funciona también si has pagado pero aún no has creado la cuenta.',
    reset: 'Elige una nueva contraseña para tu cuenta.',
  },
  google: 'Continuar con Google',
  or: 'o',
  fields: {
    email: 'Correo electrónico',
    emailLoading: 'Cargando...',
    emailPlaceholder: 'Tu correo electrónico',
    password: 'Contraseña',
    newPassword: 'Nueva contraseña',
    passwordPlaceholder: 'Al menos 6 caracteres',
    confirmPassword: 'Confirmar contraseña',
    confirmPasswordPlaceholder: 'Repite la contraseña',
    phone: 'Número de teléfono',
    phonePlaceholder: '+34 600 123 456',
  },
  forgotLink: '¿Has olvidado la contraseña?',
  toasts: {
    passwordTooShort: 'La contraseña debe tener al menos 6 caracteres',
    passwordMismatch: 'Las contraseñas no coinciden',
    checkEmailRecovery: {
      title: 'Revisa tu correo',
      description: 'Si la dirección está registrada o asociada a una compra, recibirás un enlace para acceder.',
    },
    passwordUpdated: {
      title: 'Contraseña actualizada',
      description: 'Te llevamos a tu informe.',
    },
    checkEmailConfirm: {
      title: 'Revisa tu correo',
      description: 'Te hemos enviado un enlace para confirmar tu cuenta y acceder enseguida a tu informe.',
    },
    authError: 'Error de autenticación',
    welcomeBack: {
      title: '¡Bienvenido de nuevo!',
      description: 'Empieza aquí tu Carta Interior: bastan unos minutos.',
    },
  },
  cta: {
    loading: {
      signup: 'Creando…',
      signin: 'Entrando…',
      forgot: 'Enviando…',
      reset: 'Guardando…',
    },
    signup: 'Accede a tu informe',
    signin: 'Entrar',
    forgot: 'Enviar enlace de recuperación',
    reset: 'Establecer contraseña',
  },
  recoveryBox: {
    question: '¿Has pagado pero no consigues recibir el correo de activación?',
    action: 'Recupera el acceso con tu correo',
  },
  toggle: {
    haveAccount: '¿Ya tienes una cuenta?',
    signIn: 'Entrar',
    backToLogin: 'Volver al inicio de sesión',
    noAccount: '¿No tienes una cuenta?',
    signUp: 'Regístrate',
  },
  privacyNote: 'Tus datos están seguros. Nunca compartiremos tu correo.',
  personalReadingLabel: 'Lectura personal',
};

export default activate;
