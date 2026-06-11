/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BASE_URL, BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface TransitsRenewalReminderProps {
  name?: string
  renewalDate?: string
}

const formatRenewalDate = (value?: string) => {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
}

const TransitsRenewalReminderEmail = ({ name, renewalDate }: TransitsRenewalReminderProps) => {
  // Lands directly on the subscription section at the bottom of /report
  // (the #transits-upsell anchor scroll is handled in Report.tsx).
  const manageUrl = `${BASE_URL}/report#transits-upsell`
  const formattedDate = formatRenewalDate(renewalDate)

  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>Stanno arrivando i tuoi nuovi transiti del mese</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>Tra poco la tua nuova lettura dei transiti</Heading>

            <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

            <Text style={styles.text}>
              Il tuo nuovo mese di transiti sta per iniziare: una lettura fresca su come i movimenti
              del cielo toccano i punti chiave della tua carta natale, con quattro periodi per
              orientarti settimana dopo settimana.
            </Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={manageUrl}>
                Gestisci abbonamento
              </Button>
            </Section>

            {formattedDate && (
              <Text style={styles.smallText}>
                Il prossimo addebito (9,90 €) è previsto per il {formattedDate}. Non devi fare nulla;
                se vuoi, puoi gestire l'abbonamento quando preferisci.
              </Text>
            )}

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
  component: TransitsRenewalReminderEmail,
  subject: 'Stanno arrivando i tuoi nuovi transiti del mese',
  displayName: 'Promemoria rinnovo transiti',
  previewData: { name: 'Maria', renewalDate: '2026-07-15' },
} satisfies TemplateEntry
