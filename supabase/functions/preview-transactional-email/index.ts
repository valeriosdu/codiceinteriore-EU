import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

// Renders all registered templates with their previewData.
// Gated by ADMIN_SECRET — admin tooling only.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('ADMIN_SECRET')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Verify the caller is authorized with ADMIN_SECRET
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (token !== apiKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Optional ?lang=es&market=es to preview the localized variant of every
  // template. Merged into each template's static previewData so the per-lang
  // COPY maps and per-market theme/sender resolve to the requested locale.
  const url = new URL(req.url)
  const langParam = url.searchParams.get('lang')
  const previewLang =
    langParam === 'es' ? 'es' : langParam === 'en' ? 'en' : undefined
  const marketParam = url.searchParams.get('market')
  const previewMarket =
    marketParam === 'es' ? 'es' : marketParam === 'us' ? 'us' : undefined

  const templateNames = Object.keys(TEMPLATES)
  const results: Array<{
    templateName: string
    displayName: string
    subject: string
    html: string
    status: 'ready' | 'preview_data_required' | 'render_failed'
    errorMessage?: string
  }> = []

  for (const name of templateNames) {
    const entry = TEMPLATES[name]
    const displayName = entry.displayName || name

    if (!entry.previewData) {
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'preview_data_required',
      })
      continue
    }

    try {
      const previewData = {
        ...entry.previewData,
        ...(previewLang ? { lang: previewLang } : {}),
        ...(previewMarket ? { market: previewMarket } : {}),
      }
      const html = await renderAsync(
        React.createElement(entry.component, previewData)
      )
      const resolvedSubject =
        typeof entry.subject === 'function'
          ? entry.subject(previewData)
          : entry.subject

      results.push({
        templateName: name,
        displayName,
        subject: resolvedSubject,
        html,
        status: 'ready',
      })
    } catch (err) {
      console.error('Failed to render template for preview', {
        template: name,
        error: err,
      })
      results.push({
        templateName: name,
        displayName,
        subject: '',
        html: '',
        status: 'render_failed',
        errorMessage: err instanceof Error ? err.message : String(err),
      })
    }
  }

  return new Response(JSON.stringify({ templates: results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
