/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, colors, getEmailTheme, resolveEmailLang, styles } from '../email-theme.tsx'

interface AstrologyGuideAnswerProps {
  name?: string
  question: string
  answer: string
  sectionLabel?: string
  creditsRemaining?: number
  questionId?: string
  lang?: string
  market?: string
}

const truncate = (value: string, max: number) =>
  value.length > max ? value.slice(0, max - 1) + '…' : value

const SUPABASE_URL = typeof Deno !== 'undefined'
  ? (Deno.env.get('SUPABASE_URL') || '')
  : ''

const COPY = {
  it: {
    h1: 'La risposta alla tua domanda',
    greeting: (name?: string) => (name ? `Ciao ${name},` : 'Ciao,'),
    intro: "Ecco l'approfondimento che hai chiesto, basato sulla tua carta natale e sul tuo report.",
    yourQuestion: 'La tua domanda',
    usefulQuestion: 'Questa risposta ti è stata utile?',
    creditsLeft: (n: number) => `Hai ancora ${n} ${n === 1 ? 'domanda' : 'domande'} disponibili.`,
    noCredits: 'Hai usato tutte le tue domande.',
    cta: 'Apri la Guida Astrologica',
    closing: 'Se hai bisogno di aiuto, rispondi semplicemente a questa email.',
    subject: (q: string) => (q ? `Sulla tua domanda: ${truncate(q, 60)}` : 'La tua risposta è pronta'),
  },
  es: {
    h1: 'La respuesta a tu pregunta',
    greeting: (name?: string) => (name ? `Hola ${name},` : 'Hola,'),
    intro: 'Aquí tienes la aclaración que pediste, basada en tu carta natal y en tu informe.',
    yourQuestion: 'Tu pregunta',
    usefulQuestion: '¿Te ha sido útil esta respuesta?',
    creditsLeft: (n: number) => `Aún tienes ${n} ${n === 1 ? 'pregunta' : 'preguntas'} disponibles.`,
    noCredits: 'Has usado todas tus preguntas.',
    cta: 'Abre la Guía Astrológica',
    closing: 'Si necesitas ayuda, basta con responder a este correo.',
    subject: (q: string) => (q ? `Sobre tu pregunta: ${truncate(q, 60)}` : 'Tu respuesta está lista'),
  },
  en: {
    h1: 'The answer to your question',
    greeting: (name?: string) => (name ? `Hi ${name},` : 'Hi,'),
    intro: 'Here is the deeper look you asked for, based on your birth chart and your report.',
    yourQuestion: 'Your question',
    usefulQuestion: 'Was this answer helpful?',
    creditsLeft: (n: number) => `You still have ${n} ${n === 1 ? 'question' : 'questions'} available.`,
    noCredits: "You've used all of your questions.",
    cta: 'Open the Astrology Guide',
    closing: 'If you need any help, just reply to this email.',
    subject: (q: string) => (q ? `About your question: ${truncate(q, 60)}` : 'Your answer is ready'),
  },
  nl: {
    h1: 'Het antwoord op je vraag',
    greeting: (name?: string) => (name ? `Hoi ${name},` : 'Hoi,'),
    intro: 'Hier is de verdieping waar je om vroeg, gebaseerd op je geboortehoroscoop en je rapport.',
    yourQuestion: 'Je vraag',
    usefulQuestion: 'Had je iets aan dit antwoord?',
    creditsLeft: (n: number) => `Je hebt nog ${n} ${n === 1 ? 'vraag' : 'vragen'} beschikbaar.`,
    noCredits: 'Je hebt al je vragen gebruikt.',
    cta: 'Open de Astrologiegids',
    closing: 'Heb je hulp nodig, antwoord dan gewoon op deze mail.',
    subject: (q: string) => (q ? `Over je vraag: ${truncate(q, 60)}` : 'Je antwoord staat klaar'),
  },
} as const

type Lang = keyof typeof COPY
const resolveLang = (lang?: string): Lang => resolveEmailLang(lang)

const AstrologyGuideAnswerEmail = ({
  name,
  question,
  answer,
  creditsRemaining = 0,
  questionId,
  lang,
  market,
}: AstrologyGuideAnswerProps) => {
  const theme = getEmailTheme(market)
  const t = COPY[resolveLang(lang)]
  const reportUrl = `${theme.baseUrl}/report?openGuide=1`
  const feedbackBaseUrl = `${SUPABASE_URL}/functions/v1/astrology-guide-feedback`
  const feedbackUpUrl = questionId ? `${feedbackBaseUrl}?id=${questionId}&f=up` : null
  const feedbackDownUrl = questionId ? `${feedbackBaseUrl}?id=${questionId}&f=down` : null

  return (
    <Html lang={resolveLang(lang)} dir="ltr">
      <Head />
      <Preview>{truncate(answer, 110)}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader siteName={theme.siteName} logoUrl={theme.logoUrl} />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>{t.h1}</Heading>

            <Text style={styles.greeting}>{t.greeting(name)}</Text>

            <Text style={styles.text}>{t.intro}</Text>

            <Section
              style={{
                backgroundColor: '#FAF6F1',
                borderRadius: '12px',
                padding: '16px 20px',
                margin: '0 0 22px',
              }}
            >
              <Text
                style={{
                  fontSize: '12px',
                  fontWeight: '600' as const,
                  color: colors.muted,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.5px',
                  margin: '0 0 6px',
                }}
              >
                {t.yourQuestion}
              </Text>
              <Text style={{ ...styles.text, margin: 0, fontStyle: 'italic' as const }}>
                {question}
              </Text>
            </Section>

            {answer.split('\n\n').map((p, i) => (
              <Text key={i} style={styles.text}>
                {p}
              </Text>
            ))}

            {feedbackUpUrl && feedbackDownUrl && (
              <Section style={{ textAlign: 'center' as const, margin: '8px 0 20px' }}>
                <Text style={{ fontSize: '13px', color: colors.muted, margin: '0 0 10px' }}>
                  {t.usefulQuestion}
                </Text>
                <a
                  href={feedbackUpUrl}
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    fontSize: '18px',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                    marginRight: '8px',
                  }}
                >
                  &#128077;
                </a>
                <a
                  href={feedbackDownUrl}
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    fontSize: '18px',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  &#128078;
                </a>
              </Section>
            )}

            <Hr style={styles.divider} />

            <Text style={styles.smallText}>
              {creditsRemaining > 0 ? t.creditsLeft(creditsRemaining) : t.noCredits}
            </Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={reportUrl}>
                {t.cta}
              </Button>
            </Section>

            <Text style={styles.closingText}>{t.closing}</Text>
          </Section>

          <BrandFooter />
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: AstrologyGuideAnswerEmail,
  subject: (data: Record<string, unknown>) => {
    const q = typeof data.question === 'string' ? data.question : ''
    return COPY[resolveLang(data?.lang as string | undefined)].subject(q)
  },
  displayName: 'Guida astrologica – risposta',
  previewData: {
    name: 'Maria',
    question:
      'Cosa significa avere Plutone in 8a casa per le mie relazioni?',
    answer:
      'Plutone in 8a casa segna un modo intenso di vivere l\'intimità: ogni legame importante porta con sé una soglia da attraversare, una zona della tua interiorità che chiede di essere vista senza maschere.\n\nNon sei una persona che si accontenta di legami superficiali — anche quando ci provi, qualcosa dentro di te cerca un livello più profondo. Questo può essere bellissimo e faticoso allo stesso tempo.',
    sectionLabel: 'emotions_relationships',
    creditsRemaining: 7,
    questionId: '00000000-0000-0000-0000-000000000000',
  },
} satisfies TemplateEntry
