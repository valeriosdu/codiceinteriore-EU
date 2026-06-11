/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BASE_URL, BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface ReportReadyProps {
  name?: string
  sessionId?: string
}

const buildReportUrl = (sessionId?: string) =>
  sessionId
    ? `${BASE_URL}/activate?session_id=${encodeURIComponent(sessionId)}&intent=signin`
    : `${BASE_URL}/activate?intent=signin`

const ReportReadyEmail = ({ name, sessionId }: ReportReadyProps) => {
  const reportUrl = buildReportUrl(sessionId)
  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>La tua lettura è pronta — Codice Interiore</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>La tua lettura è pronta</Heading>

            <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

            <Text style={styles.text}>
              Dentro trovi una lettura completa della tua mappa personale: non solo ciò che si ripete nelle relazioni, ma anche le dinamiche emotive che ti guidano, i blocchi che contano davvero e la direzione che sta cercando di emergere.
            </Text>

            <Text style={styles.text}>
              Non è una somma di spunti separati, ma una lettura coerente della tua struttura, pensata per aiutarti a riconoscere meglio ciò che vivi, ciò che cerchi e ciò che tende a riportarti sempre negli stessi punti.
            </Text>

            <Text style={styles.text}>
              Può essere un primo passo per leggerti con più chiarezza, e per vedere con più precisione dove sei adesso.
            </Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={reportUrl}>
                Accedi e apri il tuo report
              </Button>
            </Section>

            <Text style={styles.smallText}>
              Se il pulsante non funziona, copia e incolla questo link nel browser:
              <br />
              <span style={styles.linkInline}>{reportUrl}</span>
            </Text>

            <Text style={styles.closingText}>
              Da ora potrai ritrovarlo anche nel tuo spazio personale, ogni volta che vorrai tornarci.
            </Text>
          </Section>

          <BrandFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ReportReadyEmail,
  subject: 'La tua lettura è pronta — accedi al tuo spazio',
  displayName: 'Report pronto',
  previewData: { name: 'Giulia', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
