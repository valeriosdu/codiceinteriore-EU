/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, styles } from '../email-theme.tsx'
import { getMarket } from '../markets.ts'

interface ContactNotificationProps {
  name?: string
  email?: string
  reason?: string
  message?: string
  market?: string
}

const COPY = {
  it: {
    preview: (name: string, siteName: string) => `Nuovo messaggio da ${name} — ${siteName}`,
    h1: 'Nuovo messaggio dal sito',
    name: 'Nome',
    email: 'Email',
    reason: 'Motivo',
    message: 'Messaggio',
    sentVia: (siteName: string) => `Inviato tramite il modulo contatti di ${siteName}`,
    subject: (siteName: string, name?: string) =>
      `Nuovo messaggio dal sito ${siteName}${name ? ` — ${name}` : ''}`,
  },
  es: {
    preview: (name: string, siteName: string) => `Nuevo mensaje de ${name} — ${siteName}`,
    h1: 'Nuevo mensaje desde la web',
    name: 'Nombre',
    email: 'Email',
    reason: 'Motivo',
    message: 'Mensaje',
    sentVia: (siteName: string) => `Enviado a través del formulario de contacto de ${siteName}`,
    subject: (siteName: string, name?: string) =>
      `Nuevo mensaje desde la web ${siteName}${name ? ` — ${name}` : ''}`,
  },
} as const

const langFor = (market?: string) => (market === 'es' ? 'es' : 'it')

const ContactNotificationEmail = ({ name, email, reason, message, market }: ContactNotificationProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[langFor(market)]
  return (
    <Html lang={langFor(market)} dir="ltr">
      <Head />
      <Preview>{t.preview(name || '—', theme.siteName)}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader siteName={theme.siteName} logoUrl={theme.logoUrl} />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>{t.h1}</Heading>

            <Text style={styles.fieldLabel}>{t.name}</Text>
            <Text style={styles.fieldValue}>{name || '—'}</Text>

            <Text style={styles.fieldLabel}>{t.email}</Text>
            <Text style={styles.fieldValue}>{email || '—'}</Text>

            {reason && (
              <>
                <Text style={styles.fieldLabel}>{t.reason}</Text>
                <Text style={styles.fieldValue}>{reason}</Text>
              </>
            )}

            <Text style={styles.fieldLabel}>{t.message}</Text>
            <Text style={styles.fieldValue}>{message || '—'}</Text>

            <Text style={styles.closingText}>{t.sentVia(theme.siteName)}</Text>
          </Section>

          <BrandFooter siteName={theme.siteName} />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) =>
    COPY[langFor(data.market)].subject(getMarket(data.market).siteName, data.name),
  // Destinatario fisso per-mercato: la richiesta dal sito ES arriva su
  // info@cartainterior.com, quella IT su info@codiceinteriore.it.
  to: (data: Record<string, any>) => getMarket(data.market).contactEmail,
  // "Rispondi" dal client di posta scrive direttamente al cliente che ha compilato il form,
  // non a info@ (che riceverebbe altrimenti il proprio reply).
  replyTo: (data: Record<string, any>) => (typeof data.email === 'string' && data.email ? data.email : undefined),
  displayName: 'Contact form notification',
  previewData: { name: 'Marco', email: 'marco@example.com', reason: 'Domanda generale', message: 'Vorrei sapere di più sul servizio.', market: 'it' },
} satisfies TemplateEntry
