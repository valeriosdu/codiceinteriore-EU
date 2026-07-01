const activate = {
  titles: {
    signup: 'Activate your account',
    signin: 'Sign in to your account',
    forgot: 'Recover access to your account',
    reset: 'Set a new password',
  },
  subtitles: {
    signup: 'Create your credentials to access the report and find it again whenever you like.',
    signin: 'Enter your credentials to access your report.',
    forgot:
      "Enter your email: we'll send you a link to get in. This works even if you paid but haven't created an account yet.",
    reset: 'Choose a new password for your account.',
  },
  google: 'Continue with Google',
  or: 'or',
  fields: {
    email: 'Email',
    emailLoading: 'Loading...',
    emailPlaceholder: 'Your email',
    password: 'Password',
    newPassword: 'New password',
    passwordPlaceholder: 'At least 6 characters',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Repeat the password',
    phone: 'Phone number',
    phonePlaceholder: '+1 555 123 4567',
  },
  forgotLink: 'Forgot password?',
  toasts: {
    passwordTooShort: 'The password must be at least 6 characters',
    passwordMismatch: 'The passwords do not match',
    checkEmailRecovery: {
      title: 'Check your email',
      description: "If the address is registered or linked to a purchase, you'll receive a link to sign in.",
    },
    passwordUpdated: {
      title: 'Password updated',
      description: 'We are taking you to your report.',
    },
    checkEmailConfirm: {
      title: 'Check your email',
      description: 'We sent you a link to confirm your account and access your report right away.',
    },
    authError: 'Authentication error',
    welcomeBack: {
      title: 'Welcome back!',
      description: 'Start your Inner Code here: it only takes a few minutes.',
    },
  },
  cta: {
    loading: {
      signup: 'Creating…',
      signin: 'Signing in…',
      forgot: 'Sending…',
      reset: 'Saving…',
    },
    signup: 'Access your report',
    signin: 'Sign in',
    forgot: 'Send reset link',
    reset: 'Set password',
  },
  recoveryBox: {
    question: "Already paid but can't receive the activation email?",
    action: 'Recover access with your email',
  },
  toggle: {
    haveAccount: 'Already have an account?',
    signIn: 'Sign in',
    backToLogin: 'Back to login',
    noAccount: "Don't have an account?",
    signUp: 'Sign up',
  },
  privacyNote: "Your data is safe. We'll never share your email.",
  personalReadingLabel: 'Personal reading',
};

export default activate;
