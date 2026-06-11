/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BASE_URL, BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface TransitsActivatedProps {
  name?: string
  isRenewal?: boolean
}

const TransitsActivatedEmail = ({ name, isRenewal }: TransitsActivatedProps) => {
  const reportUrl = `${BASE_URL}/report`
  const heading = isRenewal
    ? 'I tuoi nuovi transiti del mese sono pronti'
    : 'I tuoi transiti sono attivi'
  const intro = isRenewal
    ? 'Abbiamo preparato la tua lettura dei transiti per il nuovo mese, basata sui movimenti astrologici reali calcolati sulla tua carta natale, con quattro periodi per orientarti settimana dopo settimana.'
    : 'Hai attivato l\'abbonamento ai transiti mensili (9,90 €/mese). Ogni mese prepariamo una nuova lettura su come i movimenti del cielo toccano i punti chiave della tua carta natale, con quattro periodi per orientarti settimana dopo settimana. Puoi gestire o disdire l\'abbonamento quando vuoi dalla tua area.'

  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>{heading}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>{heading}</Heading>

            <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

            <Text style={styles.text}>{intro}</Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={reportUrl}>
                Apri la tua lettura
              </Button>
            </Section>

            <Text style={styles.smallText}>
              Se il pulsante non funziona, copia e incolla questo link nel browser:
              <br />
              <span style={styles.linkInline}>{reportUrl}</span>
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
  component: TransitsActivatedEmail,
  subject: (data: Record<string, unknown>) =>
    data.isRenewal
      ? 'I tuoi nuovi transiti del mese sono pronti'
      : 'I tuoi transiti sono attivi',
  displayName: 'Transiti attivati',
  previewData: { name: 'Maria', isRenewal: false },
} satisfies TemplateEntry
