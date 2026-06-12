/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, styles } from '../email-theme.tsx'

interface SynastryClaimProps {
  name?: string
  sessionId: string
  lang?: string
  market?: string
}

const COPY = {
  it: {
    preview: 'Il vostro pagamento è confermato — attivate la vostra lettura di coppia',
    h1: 'Il vostro pagamento è confermato',
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    body: 'Abbiamo ricevuto correttamente il vostro ordine. Per accedere alla vostra sinastria di coppia e ritrovarla ogni volta che vorrete, vi basta creare il vostro spazio personale con questa email: la vostra lettura sarà collegata in automatico.',
    cta: 'Attiva e apri la vostra sinastria',
    fallback: 'Se il pulsante non funziona, copia e incolla questo link nel browser:',
    closing: 'Se avete bisogno di aiuto, rispondete semplicemente a questa email.',
    subject: 'Il vostro pagamento è confermato — attivate la vostra sinastria di coppia',
  },
  es: {
    preview: 'Vuestro pago está confirmado — activad vuestra lectura de pareja',
    h1: 'Vuestro pago está confirmado',
    greeting: (name?: string) => (name ? `Hola ${name},` : 'Hola,'),
    body: 'Hemos recibido correctamente vuestro pedido. Para acceder a vuestra sinastría de pareja y recuperarla cuando queráis, solo tenéis que crear vuestro espacio personal con este correo: vuestra lectura se vinculará automáticamente.',
    cta: 'Activa y abre vuestra sinastría',
    fallback: 'Si el botón no funciona, copia y pega este enlace en el navegador:',
    closing: 'Si necesitáis ayuda, basta con responder a este correo.',
    subject: 'Vuestro pago está confirmado — activad vuestra sinastría de pareja',
  },
} as const

const SynastryClaimEmail = ({ name, sessionId, lang, market }: SynastryClaimProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[lang === 'es' ? 'es' : 'it']
  const claimUrl = `${theme.baseUrl}/coppia/activate?session_id=${encodeURIComponent(sessionId)}`
  return (
    <Html lang={lang === 'es' ? 'es' : 'it'} dir="ltr">
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
  component: SynastryClaimEmail,
  subject: (data: Record<string, any>) => COPY[data?.lang === 'es' ? 'es' : 'it'].subject,
  displayName: 'Recupero sinastria (claim)',
  previewData: { name: 'Maria', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
