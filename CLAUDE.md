# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Guidance for Claude Code when working in this repo. The owner has a Python/R/data-science background, not a frontend specialist — explanations should be plain and grounded in file paths.

`AGENTS.md` exists with overlapping guidance for other tools; **this file is authoritative** when they conflict.

## Stack

- **Frontend**: React 18 + TypeScript, built with Vite 5 (SPA, no SSR)
- **Routing**: `react-router-dom` v6, all routes declared in [src/App.tsx](src/App.tsx)
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives in `src/components/ui/`)
- **Data/forms**: TanStack Query, React Hook Form + Zod
- **Backend**: Supabase (Postgres + Auth + Edge Functions in `supabase/functions/`, migrations in `supabase/migrations/`)
- **Payments**: Stripe (primary), PayPal (secondary)
- **AI**: Google Gemini 3.1 Pro Preview via Lovable's AI gateway (`https://ai.gateway.lovable.dev`)
- **Language of UI/content**: Italian

## Commands

From the repo root:

```bash
npm run dev        # Vite dev server (default http://localhost:5173)
npm run build      # production build
npm run build:dev  # build with development mode
npm run preview    # serve the production build locally
npm run lint       # eslint
npm run test       # vitest run (one-shot)
npm run test:watch # vitest watch mode
```

There is no edge-function emulator wired into the project — edge functions run against the deployed Supabase project. To list/deploy them use the Supabase CLI (`npx supabase functions list`, `npx supabase functions deploy <name>`).

**Lockfiles**: `package-lock.json` is canonical — use `npm install`. The `bun.lock` / `bun.lockb` files at the repo root are vestigial from Lovable scaffolding; do not run `bun install` (it will drift the npm lockfile).

## Repo layout (the parts that matter)

```
src/
  pages/                  # one file per route
  components/             # reusable UI; ui/ = shadcn primitives (don't hand-edit)
  context/QuizContext.tsx # quiz state across pages
  hooks/                  # custom React hooks
  integrations/supabase/  # client + auto-generated DB types (don't hand-edit types.ts)
  integrations/lovable/   # Lovable auth wrapper
  lib/                    # utilities (analytics.ts, utils.ts)
  App.tsx                 # route table
supabase/
  functions/              # edge functions (the "API")
  migrations/             # SQL — schema, RLS, indexes
```

**Path alias**: `@/` resolves to `./src` (configured in [vite.config.ts](vite.config.ts) and [vitest.config.ts](vitest.config.ts)). Prefer `@/components/...` over relative `../../` imports.

Funnel through the app: `/` → `/quiz` → `/processing` → `/teaser` → Stripe → `/success` → `/activate` → `/report-processing` → `/report`. Admin tools at `/admin/dashboard`, `/admin/clienti` (vista CRM, 1 riga = 1 email), `/admin/clienti/:emailEncoded` (scheda cliente con tab Anagrafica/Report/Pagamenti/Transiti/Feedback), `/admin/astrology-guide`. La vecchia `/admin/reports` redirige a `/admin/clienti`. Other routes: `/lp/classica` (alt landing), `/offer` (alias of `/teaser`), `/unsubscribe`, plus static legal pages (`/contatti`, `/privacy`, `/termini`). A parallel **sinastria/coppia** funnel mirrors this under `/coppia/*` (pages in `src/pages/coppia/`, state in `SynastryContext.tsx`); `/lp/attivazione` is an alt landing whose report uses a different section-key scheme.

### Edge function clusters

Functions in [supabase/functions/](supabase/functions/) group by purpose:
- **Payments**: `stripe-webhook`, `stripe-subscription-webhook`, `create-checkout`, `create-paypal-order`, `capture-paypal-order`, `sync-checkout-session`
- **Report pipeline**: `generate-report`, `generate-report-pdf`, `astrology-chart`, `process-session-insights`, `recover-pending-reports`, `geo-lookup`
- **Email (Brevo)**: `send-transactional-email`, `process-email-queue`, `sync-brevo-contact`, `auth-email-hook`, `handle-email-suppression`, `handle-email-unsubscribe`, `notify-contact-submission`, `preview-transactional-email`
- **Admin** (gated by `ADMIN_SECRET`): `admin-dashboard`, `admin-customers-list`, `admin-customer-detail`, `admin-regenerate-report`, `admin-delete-report`, `admin-download-report`, `admin-recover-orphan-checkout`, `admin-create-quiz-session`, `admin-update-quiz-session`, `admin-backfill-brevo`, `admin-backfill-claim-emails`, `admin-trigger-transit-cycle`, `admin-recover-transit-subscription`. La lista cliente CRM (`admin-customers-list`) chiama la RPC Postgres `admin_customers_search` definita in [supabase/migrations/20260521120000_admin_customer_index.sql](supabase/migrations/20260521120000_admin_customer_index.sql); la scheda cliente chiama la RPC `admin_customer_detail` definita nella stessa migration — il feedback dei clienti è uno dei tab della scheda.
- **Transit subscription add-on**: `create-transit-checkout`, `create-transit-portal-session`, `process-transit-cycle`, `generate-transit-pdf`
- **Synastry / coppia** (parallel to the report pipeline): `generate-synastry-report`, `generate-synastry-report-pdf`, `synastry-chart`, `process-synastry-insights`, `admin-create-synastry-session`, `admin-regenerate-synastry-report`, `admin-download-synastry-report`, `admin-delete-synastry-report`; shared PDF builder `_shared/synastry-pdf.ts`.
- **Other**: `meta-conversions`, `get-checkout-email`

## Environment variables

**Browser (`.env`, `VITE_`-prefixed, public)**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key)
- `VITE_SUPABASE_PROJECT_ID`

**Edge function secrets (Supabase Function secrets — never commit, never put in `.env`)**:
- `SUPABASE_SERVICE_ROLE_KEY` — full DB admin
- `STRIPE_SECRET_KEY`, `STRIPE_SECRET_KEY_TEST`
- `STRIPE_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET_TEST`
- `LOVABLE_API_KEY` — Gemini gateway
- `ADMIN_SECRET` — gates admin bypass endpoints
- PayPal client/secret

If a secret is missing, edge functions tend to fail silently — check function logs in the Supabase dashboard before assuming the code is broken.

## Sensitive areas — read before editing

These are the pieces where a small mistake is expensive (lost payments, leaked PII, runaway LLM cost). Treat them as read-only unless the task is explicitly about them.

1. **`supabase/functions/stripe-webhook/index.ts` + `_shared/stripe-reconcile.ts`** — payment source of truth, idempotency lives here. Test with the Stripe CLI before deploying.
2. **`supabase/functions/generate-report/index.ts`** — the auth block (~lines 49–89) has three modes (user JWT / service role / `x-admin-secret`); easy to widen the bypass accidentally. Also the place LLM cost accumulates.
3. **`supabase/functions/admin-regenerate-report/index.ts`** — bypasses payment check; protected by `ADMIN_SECRET` only.
4. **RLS policies on `quiz_sessions` and `checkout_sessions`** — currently broad (`USING (true)` for SELECT on `quiz_sessions`, migration `20260410094032`). Birth data and natal charts are readable by any authenticated user. Tightening is its own project; don't loosen further.
5. **Stripe API version** is pinned to `2025-08-27.basil` in the edge functions. Bumping the SDK without updating this string (or vice versa) silently breaks payment verification.
6. **Italian system prompt inside `generate-report`** — concatenates user fields (`userName`, `focusArea`, `attachmentResponse`) without sanitization. Be aware when editing.
7. **Race conditions in report generation** — webhook + `/report-processing` polling can both trigger Gemini. The `.is("full_report", null)` guard helps but isn't a true lock.
8. **Funnel idempotency (`/processing`)** — `Processing.tsx` skips creating a new `quiz_sessions` row when `getFunnelStage()` is `'teaser' | 'offer'`, to avoid burning another freeastroapi + Gemini cycle when the user navigates back from `/teaser`. Any flow that legitimately needs a fresh session (e.g. the "I dati non sono giusti?" edit button on the teaser) must call `clearFunnelStorage()` before navigating to `/quiz`, otherwise the guard would trap the user on stale data. Invariant lives across `Processing.tsx`, `TeaserResult.tsx`, and `QuizContext.tsx`.

### Recurring pitfalls (from past fixes)

- **A report renders in three aligned surfaces.** The on-screen page (`src/pages/Report.tsx`), the shared PDF builder (`_shared/report-pdf.ts`), and the admin download — the builder feeds both `generate-report-pdf` (user) and `admin-download-report` (admin). So: (a) section content/keys are hand-duplicated between the page and the builder (Deno can't import the frontend — `SECTIONS` + `SECTION_FALLBACKS` live in both, edit together); (b) the PDF is cached in the `report-pdfs` bucket keyed by `PDF_VERSION`, so any layout/font/chart/section change must bump `PDF_VERSION` or both downloads serve a stale file (admin `?force=1` bypasses). PDF gen is CPU-bound (Edge 2s limit) — hence the cache and CDN-loaded fonts; don't add heavy synchronous work. Coppia/transit mirror this (`synastry-pdf.ts`/`SYNASTRY_PDF_VERSION`, `transit-pdf.ts`/`TRANSIT_PDF_VERSION`).
- **Admin (re)generation must pass `skipEmail: true`** to `generate-report` / `generate-synastry-report`, or the customer gets a spurious report-ready/claim email.
- **Admin email lookups must resolve cross-email** via `_shared/resolve-profile.ts` (`resolveProfileByEmail`) or the `resolve_email_key` RPC — a customer can register with email A and pay with email B (PayPal); never match raw `profiles.email`.

## Auto-generated / vendored — do not hand-edit

- `src/integrations/supabase/types.ts` — regenerated from migrations
- `src/components/ui/*` — shadcn primitives, regenerated by the shadcn CLI
- `.lovable/` — Lovable platform metadata
- `package-lock.json` — change only via `npm install`

## Workflow rules

- **Default to small, scoped changes.** Don't bundle refactors with feature work or vice versa.
- **Edit existing files in preference to creating new ones.** Italian copy lives next to the code that uses it; don't introduce an i18n layer without asking.
- **No new dependencies without approval** — the stack is already chosen; reach for what's installed first.
- **No comments unless the *why* is non-obvious.** Identifiers should explain *what*.
- **Never commit unless the user asks.** When asked, write a real commit message (not "Changes" — recent history has too many of those already).
- **Never push, force-push, or open PRs without explicit confirmation.**
- **Never run destructive git commands** (`reset --hard`, `clean -f`, `branch -D`, force push) without explicit confirmation.
- **No `--no-verify`, `--no-gpg-sign`, or other hook-bypassing flags.** If a hook fails, fix the cause.
- **Edge functions deploy independently** — frontend and backend can drift. After changing an edge function, mention that it needs `supabase functions deploy <name>`.
- **For UI changes, actually open the page** in `npm run dev` and verify before claiming it works. If you can't run the browser, say so explicitly.
- **Tests**: `npm run test` exists (vitest). Run it after non-trivial changes. Don't add mocks for Supabase or Stripe in integration tests without discussing — mock/prod divergence is exactly the class of bug that's hard to catch later. Tests are colocated under `src/` as `*.test.ts(x)` or `*.spec.ts(x)`; jsdom environment, setup at [src/test/setup.ts](src/test/setup.ts).

## What requires approval before touching

Don't modify these without the owner's explicit go-ahead, even if the task seems to require it:

- Anything under `supabase/migrations/` (new migrations OK; editing existing ones is not — they may already be applied in production)
- RLS policies on any table
- `stripe-webhook`, `_shared/stripe-reconcile.ts`, `generate-report`, `admin-regenerate-report`
- The Stripe API version string or Stripe price IDs (`price_1TKeKb…`, `price_1TKeKz…`)
- Anything that reads or writes `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_SECRET`
- Auth flow code (`integrations/lovable/`, `integrations/supabase/client.ts`, `auth-email-hook`)
- Anything that changes pricing, tier definitions, or what's included in `base` vs `premium`

When in doubt: explain what you'd change and why, and ask before editing.
