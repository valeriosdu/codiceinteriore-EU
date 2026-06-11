/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Reimposta la tua password per {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.contentSection}>
          <Heading style={styles.h1}>Reimposta la password</Heading>

          <Text style={styles.text}>
            Abbiamo ricevuto una richiesta di reimpostazione della password per il tuo account su {siteName}. Clicca il pulsante qui sotto per scegliere una nuova password.
          </Text>

          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={confirmationUrl}>
              Reimposta password
            </Button>
          </Section>

          <Text style={styles.closingText}>
            Se non hai richiesto il reset della password, puoi ignorare questa email. La tua password non verrà modificata.
          </Text>
        </Section>

        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
