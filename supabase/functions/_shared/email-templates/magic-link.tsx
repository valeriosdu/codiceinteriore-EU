/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Il tuo link di accesso per {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.contentSection}>
          <Heading style={styles.h1}>Il tuo link di accesso</Heading>

          <Text style={styles.text}>
            Clicca il pulsante qui sotto per accedere a {siteName}. Il link scadrà a breve.
          </Text>

          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={confirmationUrl}>
              Accedi
            </Button>
          </Section>

          <Text style={styles.closingText}>
            Se non hai richiesto questo link, puoi ignorare questa email.
          </Text>
        </Section>

        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
