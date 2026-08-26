/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, resolveEmailLang, styles } from '../email-theme.tsx'

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
  en: {
    headingRenewal: 'Your new transits for the month are ready',
    headingNew: 'Your transits are now active',
    introRenewal: "We've prepared your transit reading for the new month, based on the real astrological movements calculated against your birth chart, with four periods to guide you week by week.",
    introNew: "You've activated the monthly transits subscription ($9.90/month). Each month we prepare a new reading on how the movements of the sky touch the key points of your birth chart, with four periods to guide you week by week. You can manage or cancel the subscription anytime from your account.",
    greeting: (name?: string) => (name ? `Hi ${name},` : 'Hi,'),
    cta: 'Open your reading',
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    closing: 'If you need any help, just reply to this email.',
  },
  nl: {
    headingRenewal: 'Je nieuwe transits van de maand staan klaar',
    headingNew: 'Je transits zijn actief',
    introRenewal: 'We hebben je transitduiding voor de nieuwe maand klaargezet, gebaseerd op de echte astrologische bewegingen berekend op je geboortehoroscoop, met vier periodes om je week na week te oriënteren.',
    introNew: 'Je hebt het maandelijkse transits-abonnement geactiveerd (€ 9,90 per maand). Elke maand maken we een nieuwe duiding over hoe de bewegingen aan de hemel de kernpunten van je geboortehoroscoop raken, met vier periodes om je week na week te oriënteren. Je kunt het abonnement wanneer je wilt beheren of opzeggen vanuit je persoonlijke omgeving.',
    greeting: (name?: string) => (name ? `Hoi ${name},` : 'Hoi,'),
    cta: 'Open je duiding',
    fallback: 'Werkt de knop niet, kopieer deze link dan naar je browser:',
    closing: 'Heb je hulp nodig, antwoord dan gewoon op deze mail.',
  },
} as const

type Lang = keyof typeof COPY
const resolveLang = (lang?: string): Lang => resolveEmailLang(lang)

const TransitsActivatedEmail = ({ name, isRenewal, lang, market }: TransitsActivatedProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[resolveLang(lang)]
  const reportUrl = `${theme.baseUrl}/report`
  const heading = isRenewal ? t.headingRenewal : t.headingNew
  const intro = isRenewal ? t.introRenewal : t.introNew

  return (
    <Html lang={resolveLang(lang)} dir="ltr">
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
    const t = COPY[resolveLang(data?.lang as string | undefined)]
    return data.isRenewal ? t.headingRenewal : t.headingNew
  },
  displayName: 'Transiti attivati',
  previewData: { name: 'Maria', isRenewal: false },
} satisfies TemplateEntry
