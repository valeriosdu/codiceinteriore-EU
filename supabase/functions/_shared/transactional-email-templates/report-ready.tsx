/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, styles } from '../email-theme.tsx'

interface ReportReadyProps {
  name?: string
  sessionId?: string
  lang?: string
  market?: string
}

const COPY = {
  it: {
    preview: (siteName: string) => `La tua lettura è pronta — ${siteName}`,
    h1: 'La tua lettura è pronta',
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    p1: 'Dentro trovi una lettura completa della tua mappa personale: non solo ciò che si ripete nelle relazioni, ma anche le dinamiche emotive che ti guidano, i blocchi che contano davvero e la direzione che sta cercando di emergere.',
    p2: 'Non è una somma di spunti separati, ma una lettura coerente della tua struttura, pensata per aiutarti a riconoscere meglio ciò che vivi, ciò che cerchi e ciò che tende a riportarti sempre negli stessi punti.',
    p3: 'Può essere un primo passo per leggerti con più chiarezza, e per vedere con più precisione dove sei adesso.',
    cta: 'Accedi e apri il tuo report',
    fallback: 'Se il pulsante non funziona, copia e incolla questo link nel browser:',
    closing: 'Da ora potrai ritrovarlo anche nel tuo spazio personale, ogni volta che vorrai tornarci.',
  },
  es: {
    preview: (siteName: string) => `Tu lectura está lista — ${siteName}`,
    h1: 'Tu lectura está lista',
    greeting: (name?: string) => (name ? `Hola ${name},` : 'Hola,'),
    p1: 'Dentro encontrarás una lectura completa de tu mapa personal: no solo lo que se repite en las relaciones, sino también las dinámicas emocionales que te guían, los bloqueos que de verdad cuentan y la dirección que intenta emerger.',
    p2: 'No es una suma de ideas sueltas, sino una lectura coherente de tu estructura, pensada para ayudarte a reconocer mejor lo que vives, lo que buscas y lo que tiende a llevarte siempre a los mismos puntos.',
    p3: 'Puede ser un primer paso para leerte con más claridad y ver con más precisión dónde estás ahora.',
    cta: 'Entra y abre tu informe',
    fallback: 'Si el botón no funciona, copia y pega este enlace en el navegador:',
    closing: 'A partir de ahora podrás encontrarlo también en tu espacio personal, cada vez que quieras volver.',
  },
} as const

const ReportReadyEmail = ({ name, sessionId, lang, market }: ReportReadyProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[lang === 'es' ? 'es' : 'it']
  const htmlLang = lang === 'es' ? 'es' : 'it'
  const reportUrl = sessionId
    ? `${theme.baseUrl}/activate?session_id=${encodeURIComponent(sessionId)}&intent=signin`
    : `${theme.baseUrl}/activate?intent=signin`
  return (
    <Html lang={htmlLang} dir="ltr">
      <Head />
      <Preview>{t.preview(theme.siteName)}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader siteName={theme.siteName} logoUrl={theme.logoUrl} />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>{t.h1}</Heading>

            <Text style={styles.greeting}>{t.greeting(name)}</Text>

            <Text style={styles.text}>{t.p1}</Text>
            <Text style={styles.text}>{t.p2}</Text>
            <Text style={styles.text}>{t.p3}</Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={reportUrl}>
                {t.cta}
              </Button>
            </Section>

            <Text style={styles.smallText}>
              {t.fallback}
              <br />
              <span style={styles.linkInline}>{reportUrl}</span>
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
  component: ReportReadyEmail,
  subject: (data: Record<string, any>) =>
    data?.lang === 'es'
      ? 'Tu lectura está lista — entra en tu espacio'
      : 'La tua lettura è pronta — accedi al tuo spazio',
  displayName: 'Report pronto',
  previewData: { name: 'Giulia', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
