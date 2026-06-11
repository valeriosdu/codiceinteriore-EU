/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BASE_URL, BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface SynastryClaimProps {
  name?: string
  sessionId: string
}

const buildClaimUrl = (sessionId: string) =>
  `${BASE_URL}/coppia/activate?session_id=${encodeURIComponent(sessionId)}`

const SynastryClaimEmail = ({ name, sessionId }: SynastryClaimProps) => {
  const claimUrl = buildClaimUrl(sessionId)
  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>Il vostro pagamento è confermato — attivate la vostra lettura di coppia</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>Il vostro pagamento è confermato</Heading>

            <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

            <Text style={styles.text}>
              Abbiamo ricevuto correttamente il vostro ordine. Per accedere alla vostra
              sinastria di coppia e ritrovarla ogni volta che vorrete, vi basta creare
              il vostro spazio personale con questa email: la vostra lettura sarà
              collegata in automatico.
            </Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={claimUrl}>
                Attiva e apri la vostra sinastria
              </Button>
            </Section>

            <Text style={styles.smallText}>
              Se il pulsante non funziona, copia e incolla questo link nel browser:
              <br />
              <span style={styles.linkInline}>{claimUrl}</span>
            </Text>

            <Text style={styles.closingText}>
              Se avete bisogno di aiuto, rispondete semplicemente a questa email.
            </Text>
          </Section>

          <BrandFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SynastryClaimEmail,
  subject: 'Il vostro pagamento è confermato — attivate la vostra sinastria di coppia',
  displayName: 'Recupero sinastria (claim)',
  previewData: { name: 'Maria', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
