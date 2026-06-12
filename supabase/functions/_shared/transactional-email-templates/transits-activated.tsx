/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, styles } from '../email-theme.tsx'

interface TransitsActivatedProps {
  name?: string
  isRenewal?: boolean
  lang?: string
  market?: string
}

const COPY = {
  it: {
    headingRenewal: 'I tuoi nuovi transiti del mese sono pronti',
    headingNew: 'I tuoi transiti sono attivi',
    introRenewal: 'Abbiamo preparato la tua lettura dei transiti per il nuovo mese, basata sui movimenti astrologici reali calcolati sulla tua carta natale, con quattro periodi per orientarti settimana dopo settimana.',
    introNew: "Hai attivato l'abbonamento ai transiti mensili (9,90 €/mese). Ogni mese prepariamo una nuova lettura su come i movimenti del cielo toccano i punti chiave della tua carta natale, con quattro periodi per orientarti settimana dopo settimana. Puoi gestire o disdire l'abbonamento quando vuoi dalla tua area.",
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    cta: 'Apri la tua lettura',
    fallback: 'Se il pulsante non funziona, copia e incolla questo link nel browser:',
    closing: 'Se hai bisogno di aiuto, rispondi semplicemente a questa email.',
  },
  es: {
    headingRenewal: 'Tus nuevos tránsitos del mes están listos',
    headingNew: 'Tus tránsitos están activos',
    introRenewal: 'Hemos preparado tu lectura de tránsitos para el nuevo mes, basada en los movimientos astrológicos reales calculados sobre tu carta natal, con cuatro periodos para orientarte semana a semana.',
    introNew: 'Has activado la suscripción a los tránsitos mensuales (9,90 €/mes). Cada mes preparamos una nueva lectura sobre cómo los movimientos del cielo tocan los puntos clave de tu carta natal, con cuatro periodos para orientarte semana a semana. Puedes gestionar o cancelar la suscripción cuando quieras desde tu área.',
    greeting: (name?: string) => (name ? `Hola ${name},` : 'Hola,'),
    cta: 'Abre tu lectura',
    fallback: 'Si el botón no funciona, copia y pega este enlace en el navegador:',
    closing: 'Si necesitas ayuda, basta con responder a este correo.',
  },
} as const

const TransitsActivatedEmail = ({ name, isRenewal, lang, market }: TransitsActivatedProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[lang === 'es' ? 'es' : 'it']
  const reportUrl = `${theme.baseUrl}/report`
  const heading = isRenewal ? t.headingRenewal : t.headingNew
  const intro = isRenewal ? t.introRenewal : t.introNew

  return (
    <Html lang={lang === 'es' ? 'es' : 'it'} dir="ltr">
      <Head />
      <Preview>{heading}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader siteName={theme.siteName} logoUrl={theme.logoUrl} />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>{heading}</Heading>

            <Text style={styles.greeting}>{t.greeting(name)}</Text>

            <Text style={styles.text}>{intro}</Text>

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
  component: TransitsActivatedEmail,
  subject: (data: Record<string, unknown>) => {
    const t = COPY[data?.lang === 'es' ? 'es' : 'it']
    return data.isRenewal ? t.headingRenewal : t.headingNew
  },
  displayName: 'Transiti attivati',
  previewData: { name: 'Maria', isRenewal: false },
} satisfies TemplateEntry
