/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Img, Section, Text, Hr } from 'npm:@react-email/components@0.0.22'

export const SITE_NAME = 'Codice Interiore'
export const BASE_URL = Deno.env.get('PUBLIC_SITE_URL') || 'https://codiceinteriore.it'
export const LOGO_URL = `${Deno.env.get('SUPABASE_URL') || ''}/storage/v1/object/public/email-assets/logo.png`

export const colors = {
  heading: '#3D2B1F',
  body: '#5C4A3D',
  muted: '#8C7B6F',
  faint: '#B5A89E',
  border: '#E8DDD4',
  accent: '#7A4A2E',
  accentText: '#FAF6F1',
  background: '#ffffff',
} as const

const SERIF = "'Playfair Display', Georgia, serif"
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif"

export const styles = {
  main: { backgroundColor: colors.background, fontFamily: SANS },
  container: { maxWidth: '520px', margin: '0 auto', padding: '40px 24px' },
  contentSection: { padding: '0' },
  h1: {
    fontFamily: SERIF,
    fontSize: '24px',
    fontWeight: '600' as const,
    color: colors.heading,
    margin: '0 0 28px',
    lineHeight: '1.3',
  },
  greeting: {
    fontSize: '15px',
    color: colors.heading,
    lineHeight: '1.6',
    margin: '0 0 20px',
  },
  text: {
    fontSize: '15px',
    color: colors.body,
    lineHeight: '1.7',
    margin: '0 0 18px',
  },
  link: { color: colors.accent, textDecoration: 'underline' as const },
  ctaSection: { textAlign: 'center' as const, padding: '12px 0 28px' },
  ctaButton: {
    backgroundColor: colors.accent,
    color: colors.accentText,
    fontFamily: SANS,
    fontSize: '15px',
    fontWeight: '600' as const,
    padding: '14px 36px',
    borderRadius: '12px',
    textDecoration: 'none',
    display: 'inline-block' as const,
  },
  smallText: {
    fontSize: '13px',
    color: colors.muted,
    lineHeight: '1.6',
    margin: '0 0 18px',
    wordBreak: 'break-all' as const,
  },
  linkInline: { color: colors.accent },
  closingText: {
    fontSize: '14px',
    color: colors.muted,
    lineHeight: '1.6',
    margin: '0 0 8px',
    fontStyle: 'italic' as const,
  },
  divider: { borderColor: colors.border, borderWidth: '1px', margin: '0 0 32px' },
  footer: {
    fontSize: '12px',
    color: colors.faint,
    textAlign: 'center' as const,
    margin: '24px 0 0',
    fontFamily: SERIF,
  },
  code: {
    fontFamily: 'Courier, monospace',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: colors.accent,
    margin: '0 0 28px',
    letterSpacing: '2px',
    textAlign: 'center' as const,
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600' as const,
    color: colors.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '16px 0 4px',
  },
  fieldValue: {
    fontSize: '14px',
    color: colors.heading,
    lineHeight: '1.5',
    margin: '0 0 8px',
  },
}

const brandSection = { textAlign: 'center' as const, padding: '0 0 24px' }
const brandLogo = { margin: '0 auto', display: 'block' as const, maxWidth: '100%' }

export const BrandHeader = () => (
  <>
    <Section style={brandSection}>
      <Img src={LOGO_URL} alt={SITE_NAME} width="200" height="64" style={brandLogo} />
    </Section>
    <Hr style={styles.divider} />
  </>
)

export const BrandFooter = () => (
  <>
    <Hr style={styles.divider} />
    <Text style={styles.footer}>{SITE_NAME}</Text>
  </>
)
