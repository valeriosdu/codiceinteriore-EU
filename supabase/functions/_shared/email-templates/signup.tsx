/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma il tuo indirizzo email per {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.contentSection}>
          <Heading style={styles.h1}>Conferma la tua email</Heading>

          <Text style={styles.text}>
            Grazie per esserti registrato su{' '}
            <Link href={siteUrl} style={styles.link}>
              <strong>{siteName}</strong>
            </Link>
            .
          </Text>

          <Text style={styles.text}>
            Conferma il tuo indirizzo email (
            <Link href={`mailto:${recipient}`} style={styles.link}>
              {recipient}
            </Link>
            ) cliccando il pulsante qui sotto:
          </Text>

          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={confirmationUrl}>
              Conferma email
            </Button>
          </Section>

          <Text style={styles.closingText}>
            Se non hai creato un account, puoi ignorare questa email.
          </Text>
        </Section>

        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
