/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { BrandFooter, BrandHeader, SITE_NAME, styles } from '../email-theme.tsx'

interface AdminOrphanAlertProps {
  customerEmail?: string
  userName?: string
  stripeSessionId?: string
  productCode?: string
  amountEur?: number | null
  paymentCompletedAt?: string
  inviteCount?: number
}

const formatAmount = (amount?: number | null) =>
  typeof amount === 'number' && Number.isFinite(amount)
    ? `€ ${amount.toFixed(2)}`
    : '—'

const AdminOrphanAlertEmail = ({
  customerEmail,
  userName,
  stripeSessionId,
  productCode,
  amountEur,
  paymentCompletedAt,
  inviteCount,
}: AdminOrphanAlertProps) => (
  <Html lang="it" dir="ltr">
    <Head />
    <Preview>Checkout orfano dopo {inviteCount || 2} inviti — {SITE_NAME}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <BrandHeader />

        <Section style={styles.contentSection}>
          <Heading style={styles.h1}>Checkout pagato ancora non collegato</Heading>

          <Text style={styles.text}>
            Il cliente ha pagato ma, dopo {inviteCount || 2} tentativi automatici
            di invito, non ha ancora attivato l'account. Probabile mismatch tra
            l'email usata in Stripe e quella con cui prova ad accedere. Valuta
            un contatto manuale o un merge dell'account.
          </Text>

          <Text style={styles.fieldLabel}>Email cliente (Stripe)</Text>
          <Text style={styles.fieldValue}>{customerEmail || '—'}</Text>

          <Text style={styles.fieldLabel}>Nome (dal quiz)</Text>
          <Text style={styles.fieldValue}>{userName || '—'}</Text>

          <Text style={styles.fieldLabel}>Prodotto</Text>
          <Text style={styles.fieldValue}>{productCode || '—'}</Text>

          <Text style={styles.fieldLabel}>Importo</Text>
          <Text style={styles.fieldValue}>{formatAmount(amountEur)}</Text>

          <Text style={styles.fieldLabel}>Data pagamento</Text>
          <Text style={styles.fieldValue}>{paymentCompletedAt || '—'}</Text>

          <Text style={styles.fieldLabel}>Stripe session ID</Text>
          <Text style={styles.fieldValue}>{stripeSessionId || '—'}</Text>

          <Text style={styles.closingText}>
            Notifica generata automaticamente dal cron orphan-recovery di {SITE_NAME}.
          </Text>
        </Section>

        <BrandFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AdminOrphanAlertEmail,
  subject: (data: Record<string, any>) =>
    `Checkout orfano da contattare manualmente${data.customerEmail ? `: ${data.customerEmail}` : ''}`,
  to: 'info@codiceinteriore.it',
  displayName: 'Admin orphan checkout alert',
  previewData: {
    customerEmail: 'cliente@example.com',
    userName: 'Marco',
    stripeSessionId: 'cs_live_example',
    productCode: 'natal_report_base',
    amountEur: 19.0,
    paymentCompletedAt: '2026-05-14T10:30:00Z',
    inviteCount: 2,
  },
} satisfies TemplateEntry
