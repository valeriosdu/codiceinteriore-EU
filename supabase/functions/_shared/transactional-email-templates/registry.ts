/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string | ((data: Record<string, any>) => string | undefined)
  replyTo?: string | ((data: Record<string, any>) => string | undefined)
  displayName?: string
  previewData?: Record<string, any>
}

import { template as reportReady } from './report-ready.tsx'
import { template as contactNotification } from './contact-notification.tsx'
import { template as reportClaim } from './report-claim.tsx'
import { template as transitsActivated } from './transits-activated.tsx'
import { template as transitsRenewalReminder } from './transits-renewal-reminder.tsx'
import { template as astrologyGuideAnswer } from './astrology-guide-answer.tsx'
import { template as adminOrphanAlert } from './admin-orphan-alert.tsx'
import { template as synastryClaim } from './synastry-claim.tsx'
import { template as synastryReady } from './synastry-ready.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'report-ready': reportReady,
  'contact-notification': contactNotification,
  'report-claim': reportClaim,
  'transits-activated': transitsActivated,
  'transits-renewal-reminder': transitsRenewalReminder,
  'astrology-guide-answer': astrologyGuideAnswer,
  'admin-orphan-alert': adminOrphanAlert,
  'synastry-claim': synastryClaim,
  'synastry-ready': synastryReady,
}
