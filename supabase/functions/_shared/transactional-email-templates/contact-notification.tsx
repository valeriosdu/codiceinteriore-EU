/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, SITE_NAME, styles } from '../email-theme.tsx'

interface ContactNotificationProps {
  name?: string
  email?: string
  reason?: string
  message?: string
}

const ContactNotificationEmail = ({ name, email, reason, message }: ContactNotificationProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Nuovo messaggio da {name || 'un visitatore'} — {SITE_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.contentSection}>
          <Heading style={styles.h1}>Nuovo messaggio dal sito</Heading>

          <Text style={styles.fieldLabel}>Nome</Text>
          <Text style={styles.fieldValue}>{name || '—'}</Text>

          <Text style={styles.fieldLabel}>Email</Text>
          <Text style={styles.fieldValue}>{email || '—'}</Text>

          {reason && (
            <>
              <Text style={styles.fieldLabel}>Motivo</Text>
              <Text style={styles.fieldValue}>{reason}</Text>
            </>
          )}

          <Text style={styles.fieldLabel}>Messaggio</Text>
          <Text style={styles.fieldValue}>{message || '—'}</Text>

          <Text style={styles.closingText}>
            Inviato tramite il modulo contatti di {SITE_NAME}
          </Text>
        </Section>

        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ContactNotificationEmail,
  subject: (data: Record<string, any>) => `La tua richiesta a Codice Interiore${data.name ? ` — ${data.name}` : ''}`,
  to: 'info@codiceinteriore.it',
  // "Rispondi" dal client di posta scrive direttamente al cliente che ha compilato il form,
  // non a info@ (che riceverebbe altrimenti il proprio reply).
  replyTo: (data: Record<string, any>) => (typeof data.email === 'string' && data.email ? data.email : undefined),
  displayName: 'Contact form notification',
  previewData: { name: 'Marco', email: 'marco@example.com', reason: 'Domanda generale', message: 'Vorrei sapere di più sul servizio.' },
} satisfies TemplateEntry
