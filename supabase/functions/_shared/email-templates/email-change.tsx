/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Conferma il cambio email per {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.contentSection}>
          <Heading style={styles.h1}>Conferma il cambio email</Heading>

          <Text style={styles.text}>
            Hai richiesto di cambiare il tuo indirizzo email per {siteName} da{' '}
            <Link href={`mailto:${email}`} style={styles.link}>
              {email}
            </Link>{' '}
            a{' '}
            <Link href={`mailto:${newEmail}`} style={styles.link}>
              {newEmail}
            </Link>
            .
          </Text>

          <Text style={styles.text}>
            Clicca il pulsante qui sotto per confermare la modifica:
          </Text>

          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={confirmationUrl}>
              Conferma cambio email
            </Button>
          </Section>

          <Text style={styles.closingText}>
            Se non hai richiesto questa modifica, metti in sicurezza il tuo account immediatamente.
          </Text>
        </Section>

        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
