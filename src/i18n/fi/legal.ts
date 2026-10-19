import type { Messages } from '@/i18n';

const legal: Messages['legal'] = {
  contact: {
    seoTitle: (siteName) => `Contact — ${siteName}`,
    seoDescription: (email) =>
      `Have a question about your natal chart, your report, or signing in to your account? Reach us through the form or send an email to ${email}.`,
    kicker: 'Contact',
    title: 'Get in touch',
    subtitle:
      'For questions, support, or requests, you can reach us here. We\'ll get back to you as soon as we can.',
    intro:
      'If you have a question about your report, about signing in to your account, or about how the service works, you can write to us directly using the form below.',
    sent: 'Message sent.',
    sentSub: 'We\'ll get back to you as soon as we can.',
    sendAnother: 'Send another message',
    nameLabel: 'Name *',
    namePlaceholder: 'Your name',
    emailLabel: 'Email *',
    emailPlaceholder: 'Your email',
    reasonLabel: 'Reason for contact',
    reasonPlaceholder: 'Select a reason',
    reasons: {
      purchase: 'Purchase support',
      report: 'Report access',
      general: 'General question',
      collab: 'Partnerships',
    },
    messageLabel: 'Message *',
    messagePlaceholder: 'Write your message here…',
    error: 'Something went wrong. Please try again shortly.',
    sending: 'Sending…',
    send: 'Send message',
    otherTitle: 'Other ways to reach us',
    otherSub: 'If you prefer, you can also reach us by email.',
    privacyNote: 'Your information will be used only to respond to your request.',
    validation: {
      name: 'Enter your name',
      email: 'Enter a valid email',
      message: 'Write a message',
    },
  },
  notFound: {
    title: 'Page not found',
    body: 'The page you\'re looking for doesn\'t exist or has been moved.',
    cta: 'Back to home',
  },
  unsubscribe: {
    verifying: 'Verifying…',
    validTitle: 'Unsubscribe',
    validBody: (siteName) => `Are you sure you want to unsubscribe from ${siteName} emails?`,
    confirm: 'Confirm unsubscribe',
    processing: 'Processing…',
    doneTitle: 'Unsubscribed',
    doneBody: (siteName) => `You\'ll no longer receive emails from ${siteName}.`,
    alreadyTitle: 'Already unsubscribed',
    alreadyBody: 'Your subscription was already cancelled earlier.',
    errorTitle: 'Invalid link',
    errorBody: 'This unsubscribe link is invalid or has expired.',
  },
};

export default legal;
