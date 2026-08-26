/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, resolveEmailLang, styles } from '../email-theme.tsx'

interface ReportClaimProps {
  name?: string
  sessionId: string
  lang?: string
  market?: string
}

const COPY = {
  it: {
    preview: 'Il tuo pagamento è confermato — attiva la tua lettura',
    h1: 'Il tuo pagamento è confermato',
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    body: 'Abbiamo ricevuto correttamente il tuo ordine. Per accedere al tuo report e ritrovarlo ogni volta che vorrai, ti basta creare il tuo spazio personale con questa email: la tua lettura sarà collegata in automatico.',
    cta: 'Attiva e apri il tuo report',
    fallback: 'Se il pulsante non funziona, copia e incolla questo link nel browser:',
    closing: 'Se hai bisogno di aiuto, rispondi semplicemente a questa email.',
    subject: 'Il tuo pagamento è confermato — attiva la tua lettura',
  },
  es: {
    preview: 'Tu pago está confirmado — activa tu lectura',
    h1: 'Tu pago está confirmado',
    greeting: (name?: string) => (name ? `Hola ${name},` : 'Hola,'),
    body: 'Hemos recibido correctamente tu pedido. Para acceder a tu informe y recuperarlo cuando quieras, solo tienes que crear tu espacio personal con este correo: tu lectura se vinculará automáticamente.',
    cta: 'Activa y abre tu informe',
    fallback: 'Si el botón no funciona, copia y pega este enlace en el navegador:',
    closing: 'Si necesitas ayuda, basta con responder a este correo.',
    subject: 'Tu pago está confirmado — activa tu lectura',
  },
  en: {
    preview: 'Your payment is confirmed — activate your reading',
    h1: 'Your payment is confirmed',
    greeting: (name?: string) => (name ? `Hi ${name},` : 'Hi,'),
    body: 'We\'ve received your order. To access your report and find it again whenever you like, just create your personal space with this email: your reading will be linked automatically.',
    cta: 'Activate and open your report',
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    closing: 'If you need any help, simply reply to this email.',
    subject: 'Your payment is confirmed — activate your reading',
  },
  nl: {
    preview: 'Je betaling is bevestigd — activeer je duiding',
    h1: 'Je betaling is bevestigd',
    greeting: (name?: string) => (name ? `Hoi ${name},` : 'Hoi,'),
    body: 'We hebben je bestelling goed ontvangen. Om bij je rapport te komen en het altijd terug te vinden, maak je met dit e-mailadres je persoonlijke ruimte aan: je duiding wordt er automatisch aan gekoppeld.',
    cta: 'Activeer en open je rapport',
    fallback: 'Werkt de knop niet, kopieer deze link dan naar je browser:',
    closing: 'Heb je hulp nodig, antwoord dan gewoon op deze mail.',
    subject: 'Je betaling is bevestigd — activeer je duiding',
  },
} as const

const ReportClaimEmail = ({ name, sessionId, lang, market }: ReportClaimProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[resolveEmailLang(lang)]
  const claimUrl = `${theme.baseUrl}/activate?session_id=${encodeURIComponent(sessionId)}`
  return (
    <Html lang={resolveEmailLang(lang)} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader siteName={theme.siteName} logoUrl={theme.logoUrl} />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>{t.h1}</Heading>

            <Text style={styles.greeting}>{t.greeting(name)}</Text>

            <Text style={styles.text}>{t.body}</Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={claimUrl}>
                {t.cta}
              </Button>
            </Section>

            <Text style={styles.smallText}>
              {t.fallback}
              <br />
              <span style={styles.linkInline}>{claimUrl}</span>
            </Text>

            <Text style={styles.closingText}>{t.closing}</Text>
          </Section>

          <BrandFooter siteName={theme.siteName} />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ReportClaimEmail,
  subject: (data: Record<string, any>) => COPY[resolveEmailLang(data?.lang)].subject,
  displayName: 'Recupero report (claim)',
  previewData: { name: 'Maria', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
