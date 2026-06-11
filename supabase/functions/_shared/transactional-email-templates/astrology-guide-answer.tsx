/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BASE_URL, BrandFooter, BrandHeader, colors, styles } from '../email-theme.tsx'

interface AstrologyGuideAnswerProps {
  name?: string
  question: string
  answer: string
  sectionLabel?: string
  creditsRemaining?: number
  questionId?: string
}

const truncate = (value: string, max: number) =>
  value.length > max ? value.slice(0, max - 1) + '…' : value

const SUPABASE_URL = typeof Deno !== 'undefined'
  ? (Deno.env.get('SUPABASE_URL') || '')
  : ''

const AstrologyGuideAnswerEmail = ({
  name,
  question,
  answer,
  creditsRemaining = 0,
  questionId,
}: AstrologyGuideAnswerProps) => {
  const reportUrl = `${BASE_URL}/report?openGuide=1`
  const feedbackBaseUrl = `${SUPABASE_URL}/functions/v1/astrology-guide-feedback`
  const feedbackUpUrl = questionId ? `${feedbackBaseUrl}?id=${questionId}&f=up` : null
  const feedbackDownUrl = questionId ? `${feedbackBaseUrl}?id=${questionId}&f=down` : null

  return (
    <Html lang="it" dir="ltr">
      <Head />
      <Preview>{truncate(answer, 110)}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <BrandHeader />

          <Section style={styles.contentSection}>
            <Heading style={styles.h1}>La risposta alla tua domanda</Heading>

            <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

            <Text style={styles.text}>
              Ecco l'approfondimento che hai chiesto, basato sulla tua carta natale e sul tuo report.
            </Text>

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
                La tua domanda
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
                  Questa risposta ti è stata utile?
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
              {creditsRemaining > 0
                ? `Hai ancora ${creditsRemaining} ${creditsRemaining === 1 ? 'domanda' : 'domande'} disponibili.`
                : 'Hai usato tutte le tue domande.'}
            </Text>

            <Section style={styles.ctaSection}>
              <Button style={styles.ctaButton} href={reportUrl}>
                Apri la Guida Astrologica
              </Button>
            </Section>

            <Text style={styles.closingText}>
              Se hai bisogno di aiuto, rispondi semplicemente a questa email.
            </Text>
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
    return q ? `Sulla tua domanda: ${truncate(q, 60)}` : 'La tua risposta è pronta'
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
