/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, getEmailTheme, resolveEmailLang, styles } from '../email-theme.tsx'

interface SynastryReadyProps {
  name?: string
  sessionId?: string
  lang?: string
  market?: string
}

const COPY = {
  it: {
    preview: (siteName: string) => `La vostra sinastria di coppia è pronta — ${siteName}`,
    h1: 'La vostra sinastria è pronta',
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    p1: "la vostra lettura di coppia è stata completata. Dentro troverete l'archetipo della vostra relazione, i punteggi di compatibilità su sei dimensioni e otto sezioni di analisi: dal ritratto della coppia alla direzione che la relazione sta prendendo.",
    p2: 'Non è un oroscopo generico: è una lettura ancorata ai vostri pianeti reali, scritta in italiano chiaro, da rileggere nel tempo.',
    cta: 'Apri la vostra sinastria',
    fallback: 'Se il pulsante non funziona, copia e incolla questo link nel browser:',
    closing: 'Da ora potrete ritrovarla nel vostro spazio personale, ogni volta che vorrete tornarci.',
    subject: 'La vostra sinastria è pronta — accedete al vostro spazio',
  },
  es: {
    preview: (siteName: string) => `Vuestra sinastría de pareja está lista — ${siteName}`,
    h1: 'Vuestra sinastría está lista',
    greeting: (name?: string) => (name ? `Hola ${name},` : 'Hola,'),
    p1: 'vuestra lectura de pareja se ha completado. Dentro encontraréis el arquetipo de vuestra relación, las puntuaciones de compatibilidad en seis dimensiones y ocho secciones de análisis: desde el retrato de la pareja hasta la dirección que está tomando la relación.',
    p2: 'No es un horóscopo genérico: es una lectura anclada en vuestros planetas reales, escrita en español claro, para releer con el tiempo.',
    cta: 'Abre vuestra sinastría',
    fallback: 'Si el botón no funciona, copia y pega este enlace en el navegador:',
    closing: 'A partir de ahora podréis encontrarla en vuestro espacio personal, cada vez que queráis volver.',
    subject: 'Vuestra sinastría está lista — acceded a vuestro espacio',
  },
  en: {
    preview: (siteName: string) => `Your couple's synastry is ready — ${siteName}`,
    h1: 'Your synastry is ready',
    greeting: (name?: string) => (name ? `Hi ${name},` : 'Hi,'),
    p1: "your couple's reading is complete. Inside, you'll find the archetype of your relationship, compatibility scores across six dimensions, and eight sections of analysis: from a portrait of the two of you to the direction your relationship is heading.",
    p2: "It isn't a generic horoscope: it's a reading grounded in your real planets, written in clear English, to revisit over time.",
    cta: 'Open your synastry',
    fallback: "If the button doesn't work, copy and paste this link into your browser:",
    closing: "From now on, you'll be able to find it in your personal space, whenever you want to come back to it.",
    subject: 'Your synastry is ready — sign in to your space',
  },
  nl: {
    preview: (siteName: string) => `Jullie synastrie voor koppels is klaar — ${siteName}`,
    h1: 'Jullie synastrie is klaar',
    greeting: (name?: string) => (name ? `Hoi ${name},` : 'Hoi,'),
    p1: 'jullie duiding voor koppels is klaar. Binnen vinden jullie het archetype van jullie relatie, compatibiliteitsscores op zes dimensies en acht analysedelen: van het portret van jullie samen tot de richting die de relatie inslaat.',
    p2: 'Het is geen algemene horoscoop: het is een duiding die verankerd is in jullie echte planeten, geschreven in helder Nederlands, om in de loop van de tijd te herlezen.',
    cta: 'Open jullie synastrie',
    fallback: 'Werkt de knop niet, kopieer deze link dan naar je browser:',
    closing: 'Vanaf nu vinden jullie hem terug in jullie persoonlijke ruimte, wanneer jullie er maar op terug willen komen.',
    subject: 'Jullie synastrie is klaar — log in op jullie ruimte',
  },
} as const

const SynastryReadyEmail = ({ name, sessionId, lang, market }: SynastryReadyProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[resolveEmailLang(lang)]
  const reportUrl = sessionId
    ? `${theme.baseUrl}/coppia/activate?session_id=${encodeURIComponent(sessionId)}&intent=signin`
    : `${theme.baseUrl}/coppia/activate?intent=signin`
  return (
    <Html lang={resolveEmailLang(lang)} dir="ltr">
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
  component: SynastryReadyEmail,
  subject: (data: Record<string, any>) => COPY[resolveEmailLang(data?.lang)].subject,
  displayName: 'Sinastria pronta',
  previewData: { name: 'Maria', sessionId: 'cs_live_example' },
} satisfies TemplateEntry
