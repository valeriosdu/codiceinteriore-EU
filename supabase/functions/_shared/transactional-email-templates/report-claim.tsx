/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BASE_URL, BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface ReportClaimProps {
  name?: string
  sessionId: string
}

const buildClaimUrl = (sessionId: string) =>
  `${BASE_URL}/activate?session_id=${encodeURIComponent(sessionId)}`

const ReportClaimEmail = ({ name, sessionId }: ReportClaimProps) => {
  const claimUrl = buildClaimUrl(sessionId)
  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>Il tuo pagamento è confermato — attiva la tua lettura</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>Il tuo pagamento è confermato</Heading>

            <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

            <Text style={styles.text}>
              Abbiamo ricevuto correttamente il tuo ordine. Per accedere al tuo report e
              ritrovarlo ogni volta che vorrai, ti basta creare il tuo spazio personale
              con questa email: la tua lettura sarà collegata in automatico.
            </Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={claimUrl}>
                Attiva e apri il tuo report
              </Button>
            </Section>

            <Text style={styles.smallText}>
              Se il pulsante non funziona, copia e incolla questo link nel browser:
              <br />
              <span style={styles.linkInline}>{claimUrl}</span>
            </Text>

            <Text style={styles.closingText}>
              Se hai bisogno di aiuto, rispondi semplicemente a questa email.
            </Text>
          </Section>

          <BrandFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ReportClaimEmail,
  subject: 'Il tuo pagamento è confermato — attiva la tua lettura',
  displayName: 'Recupero report (claim)',
  previewData: { name: 'Maria', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
