/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BASE_URL, BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface SynastryReadyProps {
  name?: string
  sessionId?: string
}

const buildReportUrl = (sessionId?: string) =>
  sessionId
    ? `${BASE_URL}/coppia/activate?session_id=${encodeURIComponent(sessionId)}&intent=signin`
    : `${BASE_URL}/coppia/activate?intent=signin`

const SynastryReadyEmail = ({ name, sessionId }: SynastryReadyProps) => {
  const reportUrl = buildReportUrl(sessionId)
  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>La vostra sinastria di coppia è pronta — Codice Interiore</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>La vostra sinastria è pronta</Heading>

            <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

            <Text style={styles.text}>
              la vostra lettura di coppia è stata completata. Dentro troverete
              l'archetipo della vostra relazione, i punteggi di compatibilità su
              sei dimensioni e otto sezioni di analisi: dal ritratto della coppia
              alla direzione che la relazione sta prendendo.
            </Text>

            <Text style={styles.text}>
              Non è un oroscopo generico: è una lettura ancorata ai vostri
              pianeti reali, scritta in italiano chiaro, da rileggere nel tempo.
            </Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={reportUrl}>
                Apri la vostra sinastria
              </Button>
            </Section>

            <Text style={styles.smallText}>
              Se il pulsante non funziona, copia e incolla questo link nel browser:
              <br />
              <span style={styles.linkInline}>{reportUrl}</span>
            </Text>

            <Text style={styles.closingText}>
              Da ora potrete ritrovarla nel vostro spazio personale, ogni volta
              che vorrete tornarci.
            </Text>
          </Section>

          <BrandFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SynastryReadyEmail,
  subject: 'La vostra sinastria è pronta — accedete al vostro spazio',
  displayName: 'Sinastria pronta',
  previewData: { name: 'Maria', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
