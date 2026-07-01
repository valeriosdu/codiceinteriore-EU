/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, styles } from '../email-theme.tsx'

interface TransitsRenewalReminderProps {
  name?: string
  renewalDate?: string
  lang?: string
  market?: string
}

const COPY = {
  it: {
    locale: 'it-IT',
    preview: 'Stanno arrivando i tuoi nuovi transiti del mese',
    h1: 'Tra poco la tua nuova lettura dei transiti',
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    body: 'Il tuo nuovo mese di transiti sta per iniziare: una lettura fresca su come i movimenti del cielo toccano i punti chiave della tua carta natale, con quattro periodi per orientarti settimana dopo settimana.',
    cta: 'Gestisci abbonamento',
    nextCharge: (date: string) => `Il prossimo addebito (9,90 €) è previsto per il ${date}. Non devi fare nulla; se vuoi, puoi gestire l'abbonamento quando preferisci.`,
    closing: 'Se hai bisogno di aiuto, rispondi semplicemente a questa email.',
  },
  es: {
    locale: 'es-ES',
    preview: 'Están llegando tus nuevos tránsitos del mes',
    h1: 'En breve tu nueva lectura de tránsitos',
    greeting: (name?: string) => (name ? `Hola ${name},` : 'Hola,'),
    body: 'Tu nuevo mes de tránsitos está a punto de empezar: una lectura fresca sobre cómo los movimientos del cielo tocan los puntos clave de tu carta natal, con cuatro periodos para orientarte semana a semana.',
    cta: 'Gestionar suscripción',
    nextCharge: (date: string) => `El próximo cargo (9,90 €) está previsto para el ${date}. No tienes que hacer nada; si quieres, puedes gestionar la suscripción cuando prefieras.`,
    closing: 'Si necesitas ayuda, basta con responder a este correo.',
  },
  en: {
    locale: 'en-US',
    preview: 'Your new transits for the month are on the way',
    h1: 'Your new transit reading is almost here',
    greeting: (name?: string) => (name ? `Hi ${name},` : 'Hi,'),
    body: 'Your new month of transits is about to begin: a fresh reading on how the movements of the sky touch the key points of your birth chart, with four periods to guide you week by week.',
    cta: 'Manage subscription',
    nextCharge: (date: string) => `Your next charge ($9.90) is scheduled for ${date}. There's nothing you need to do; if you'd like, you can manage your subscription anytime.`,
    closing: 'If you need any help, just reply to this email.',
  },
} as const

type Lang = keyof typeof COPY
const resolveLang = (lang?: string): Lang =>
  lang === 'es' || lang === 'en' ? lang : 'it'

const TransitsRenewalReminderEmail = ({ name, renewalDate, lang, market }: TransitsRenewalReminderProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[resolveLang(lang)]
  const manageUrl = `${theme.baseUrl}/report#transits-upsell`
  const formattedDate = (() => {
    if (!renewalDate) return null
    const d = new Date(renewalDate)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString(t.locale, { day: 'numeric', month: 'long', year: 'numeric' })
  })()

  return (
    <Html lang={resolveLang(lang)} dir="ltr">
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
              <Button style={styles.ctaButton} href={manageUrl}>
                {t.cta}
              </Button>
            </Section>

            {formattedDate && (
              <Text style={styles.smallText}>{t.nextCharge(formattedDate)}</Text>
            )}

            <Text style={styles.closingText}>{t.closing}</Text>
          </Section>

          <BrandFooter siteName={theme.siteName} />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TransitsRenewalReminderEmail,
  subject: (data: Record<string, any>) => COPY[resolveLang(data?.lang)].preview,
  displayName: 'Promemoria rinnovo transiti',
  previewData: { name: 'Maria', renewalDate: '2026-07-15' },
} satisfies TemplateEntry
