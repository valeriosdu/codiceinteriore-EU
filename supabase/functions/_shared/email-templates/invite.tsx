/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import { BrandFooter, BrandHeader, styles } from '../email-theme.tsx'

interface InviteEmailProps {
  siteName?: string
  siteUrl?: string
  confirmationUrl: string
  name?: string
}

export const InviteEmail = ({
  confirmationUrl,
  name,
}: InviteEmailProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Un secondo link per entrare direttamente, senza fare login.</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.contentSection}>
          <Heading style={styles.h1}>La tua lettura ti aspetta ancora</Heading>

          <Text style={styles.greeting}>{name ? `Ciao ${name},` : 'Ciao,'}</Text>

          <Text style={styles.text}>
            Hai completato il pagamento per la tua lettura, ma non sei ancora rientrata
            nel tuo spazio. Niente di urgente — volevamo solo lasciarti un secondo link,
            più diretto del primo.
          </Text>

          <Text style={styles.text}>
            Cliccando il pulsante qui sotto entri direttamente nella tua lettura,
            senza fare login. Da lì potrai impostare una password per ritrovarla
            quando vorrai.
          </Text>

          <Section style={styles.ctaSection}>
            <Button style={styles.ctaButton} href={confirmationUrl}>
              Apri la mia lettura
            </Button>
          </Section>

          <Text style={styles.smallText}>
            Se il pulsante non funziona, copia e incolla questo link nel browser:
            <br />
            <span style={styles.linkInline}>{confirmationUrl}</span>
          </Text>

          <Text style={styles.closingText}>
            Se hai bisogno di aiuto, rispondi semplicemente a questa email.
          </Text>
        </Section>

        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export default InviteEmail
