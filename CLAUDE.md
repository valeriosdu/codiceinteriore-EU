# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the **single source of truth** for repo conventions.

The owner has a Python/R/data-science background, not a frontend specialist — explanations should be plain and grounded in file paths.

## Stack

- **Frontend**: React 18 + TypeScript, built with Vite 5 (SPA, no SSR)
- **Routing**: `react-router-dom` v6, all routes declared in [src/App.tsx](src/App.tsx)
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives in `src/components/ui/`)
- **Data/forms**: TanStack Query, React Hook Form + Zod
- **Backend**: Supabase (Postgres + Auth + Edge Functions in `supabase/functions/`, migrations in `supabase/migrations/`). Project ref `sefjuhxxbiehqjewoqpp`.
- **Auth**: Supabase Auth, Google OAuth only; transactional/auth email via Brevo (`auth-email-hook` is the optional per-user localized path)
- **Payments**: Stripe (primary), PayPal (secondary)
- **AI**: Google Gemini (`gemini-3.1-pro-preview`) called directly at `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` (OpenAI-compat endpoint), secret `GEMINI_API_KEY`. Prompts are per-language in `supabase/functions/_shared/prompts/`.
- **Markets / languages**: multi-market app — `it` (default) and `es`, designed to add more. **`market` ≠ `language`** (see below). UI/content is localized via typed TS catalogs (`src/i18n/`), no i18n dependency.

## Multi-market architecture (read this first)

The app serves several markets from **one** Supabase backend. A *market* is a business unit (domain, company, payment accounts, analytics, contact email, currency); a *language* is a content catalog (UI, prompts, email, PDF). A future market can reuse an existing language.

**The flow of truth:**
```
VITE_MARKET=es (Vercel env, build-time)
  → frontend market config (src/markets/, export `MARKET`, `resolveMarket()`)
  → session creation sends { market:'es', language:'es' }  (columns on quiz_sessions / synastry_sessions)
  → backend reads market FROM THE DB ROW, never from the request body (anti-spoofing of prices)
  → per-market Stripe/PayPal creds + price IDs via secret indirection; metadata.market on the session
  → webhooks registered per-market with ?market=es to pick the signing secret
  → checkout_sessions.market persisted
  → report / email / PDF / transits / Q&A read language+market from the row, never a global env
```

- **Column default is `'it'`** so any un-migrated path produces Italian; the `es` frontend passes `'es'` explicitly.
- **Per-market secret convention `<NAME>__ES`** (e.g. `STRIPE_SECRET_KEY__ES`). Market `it` uses the unsuffixed names. For a new market, a **missing payment secret is an explicit error — never a silent fallback** to another market's account.
- **Expandable by design**: adding a market = a new entry in `supabase/functions/_shared/markets.ts` (backend) + `src/markets/` (frontend) + catalogs in `src/i18n/`. Helpers `getMarket / getStripeKey / getStripePrice / getPayPalCreds / brandSlug / docNoun` (in `markets.ts`) avoid hard-coded `es ? … : it` branches — `brandSlug` derives from `siteName`, `docNoun` is keyed by `Language`. Don't add binary market branches; route through these helpers.
- Backend config: [supabase/functions/_shared/markets.ts](supabase/functions/_shared/markets.ts). Frontend: [src/markets/index.ts](src/markets/index.ts). Language catalogs: `src/i18n/{it,es}/` (it is the source of the `Messages` type — a missing `es` key is a compile error), provider [src/i18n/I18nProvider.tsx](src/i18n/I18nProvider.tsx).

## Commands

From the repo root:

```bash
npm run dev        # Vite dev server (default http://localhost:5173, configured 8080)
npm run build      # production build (also type-checks)
npm run build:dev  # build with development mode
npm run preview    # serve the production build locally
npm run lint       # eslint
npm run test       # vitest run (one-shot)
npm run test:watch # vitest watch mode
```

**Lockfiles**: `package-lock.json` is canonical — use `npm install`.

## Tooling & deploy (how work actually happens here)

Claude operates directly on the infra via the **Supabase MCP** (`deploy_edge_function`, `execute_sql`, `get_logs`, `get_advisors`, …) and via **Management/REST APIs** (Supabase `api.supabase.com`, Vercel, Stripe, PayPal, Brevo) — so deploying, querying the DB, and setting config can be done directly rather than only described.

- **`npx` / the npm registry fail on this machine** (TLS interception → `UNABLE_TO_VERIFY_LEAF_SIGNATURE`); `curl.exe` fails too (exit 35). Use the **standalone `supabase` CLI** (installed, v2.x — it bundles function deps and reads `config.toml`) or the MCP. For HTTP APIs use PowerShell `Invoke-RestMethod` (UTF-8 body bytes for non-ASCII).
- **Edge functions deploy independently** from the frontend. After changing one, deploy it (`supabase functions deploy <name>` or MCP). Changing a `_shared/*` file means **every function importing it (transitively)** must be redeployed.
- **`verify_jwt` ↔ `config.toml` trap**: a function **absent** from [supabase/config.toml](supabase/config.toml) is reset to `verify_jwt = true` on every CLI deploy. Webhooks (`stripe-webhook`, `paypal-webhook`, …), admin endpoints (`x-admin-secret`), and public GET endpoints need `verify_jwt = false` — keep them listed in `config.toml`. Before a broad deploy, check the real per-function `verify_jwt` via the Management API and confirm `config.toml` matches.
- **Deploy does NOT type-check.** `ReferenceError`/type bugs surface only at runtime — after deploying, verify with a real call (e.g. hit the function, check logs/DB).
- **Frontend (Vercel) builds from GitHub** — a `src/` change only goes live after commit + push. Each market is a separate Vercel project (its own `VITE_MARKET` + domain).
- **Credentials/tokens are managed outside the repo** (never in this file, never committed).

## Repo layout (the parts that matter)

```
src/
  pages/                  # one file per route
  components/             # reusable UI; ui/ = shadcn primitives (don't hand-edit)
  context/QuizContext.tsx # quiz state across pages
  context/SynastryContext.tsx # coppia/sinastria state
  markets/                # per-market frontend config; export MARKET, resolveMarket()
  i18n/                   # typed message catalogs {it,es}/ + I18nProvider (it = source of type)
  funnels/registry.ts     # funnel structure (section ids/type/order — the backend contract; ids NOT translated)
  hooks/                  # custom React hooks
  integrations/supabase/  # client + auto-generated DB types (don't hand-edit types.ts)
  lib/                    # utilities (analytics.ts, utils.ts, preview-mode.ts, seo-jsonld.ts)
  App.tsx                 # route table
supabase/
  functions/              # edge functions (the "API"); _shared/ = helpers, prompts/, pdf builders, email templates
  migrations/             # SQL — schema, RLS, indexes
  config.toml             # per-function verify_jwt (see trap above)
```

**Path alias**: `@/` resolves to `./src` (configured in [vite.config.ts](vite.config.ts) and [vitest.config.ts](vitest.config.ts)). Prefer `@/components/...` over relative `../../` imports.

Funnel through the app: `/` → `/quiz` → `/processing` → `/teaser` → Stripe → `/success` → `/activate` → `/report-processing` → `/report`. Admin tools at `/admin/dashboard`, `/admin/clienti` (vista CRM, 1 riga = 1 email), `/admin/clienti/:emailEncoded` (scheda cliente con tab Anagrafica/Report/Pagamenti/Transiti/Feedback), `/admin/astrology-guide`. La vecchia `/admin/reports` redirige a `/admin/clienti`. Other routes: `/lp/classica` (alt landing), `/offer` (alias of `/teaser`), `/unsubscribe`, plus static legal pages (`/contatti`, `/privacy`, `/termini`). A parallel **sinastria/coppia** funnel mirrors this under `/coppia/*` (pages in `src/pages/coppia/`, state in `SynastryContext.tsx`); `/lp/attivazione` is an alt landing whose report uses a different section-key scheme.

### Edge function clusters

Functions in [supabase/functions/](supabase/functions/) group by purpose:
- **Payments**: `stripe-webhook`, `stripe-subscription-webhook`, `create-checkout`, `create-paypal-order`, `capture-paypal-order`, `paypal-webhook`, `sync-checkout-session`
- **Report pipeline**: `generate-report`, `generate-report-pdf`, `astrology-chart`, `process-session-insights`, `recover-pending-reports`, `geo-lookup`
- **Email (Brevo)**: `send-transactional-email`, `process-email-queue`, `sync-brevo-contact`, `auth-email-hook`, `handle-email-suppression`, `handle-email-unsubscribe`, `notify-contact-submission`, `preview-transactional-email`
- **Admin** (gated by `ADMIN_SECRET`): `admin-dashboard`, `admin-customers-list`, `admin-customer-detail`, `admin-regenerate-report`, `admin-delete-report`, `admin-download-report`, `admin-recover-orphan-checkout`, `admin-update-user-auth`, `admin-create-quiz-session`, `admin-update-quiz-session`, `admin-backfill-brevo`, `admin-backfill-claim-emails`, `admin-trigger-transit-cycle`, `admin-recover-transit-subscription`. La lista cliente CRM (`admin-customers-list`) chiama la RPC Postgres `admin_customers_search` definita in [supabase/migrations/20260521120000_admin_customer_index.sql](supabase/migrations/20260521120000_admin_customer_index.sql); la scheda cliente chiama la RPC `admin_customer_detail` definita nella stessa migration — il feedback dei clienti è uno dei tab della scheda.
- **Transit subscription add-on**: `create-transit-checkout`, `create-transit-portal-session`, `process-transit-cycle`, `generate-transit-pdf`
- **Synastry / coppia** (parallel to the report pipeline): `generate-synastry-report`, `generate-synastry-report-pdf`, `synastry-chart`, `process-synastry-insights`, `admin-create-synastry-session`, `admin-regenerate-synastry-report`, `admin-download-synastry-report`, `admin-delete-synastry-report`; shared PDF builder `_shared/synastry-pdf.ts`.
- **Astrology guide (Q&A pack)**: `submit-astrology-question`, `process-astrology-questions`, `create-astrology-pack-checkout`, `astrology-guide-feedback`
- **Other**: `meta-conversions`, `get-checkout-email`

Many of these are market-aware: they read `market` from the session/checkout row and resolve creds/prompt/brand via `markets.ts`. The webhooks pick their signing secret from `?market=` on the URL.

## Environment variables

**Browser (`.env`, `VITE_`-prefixed, public — overridden per project in Vercel)**:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key), `VITE_SUPABASE_PROJECT_ID`
- `VITE_MARKET` (`it`|`es`) — selects market at build time
- `VITE_LANG`, `VITE_LOCALE`, `VITE_SITE_NAME`, `VITE_SITE_URL`, `VITE_DEFAULT_TITLE`, `VITE_SITE_DESCRIPTION`, `VITE_CONTACT_EMAIL`, `VITE_ORG_LANGUAGE` — injected into `index.html` (`%VITE_*%`) at build; must match the chosen market
- Analytics (empty disables the tag): `VITE_GA4_ID`, `VITE_META_PIXEL_ID`, `VITE_CLARITY_ID` — **per-market**; note the committed `.env` holds the IT values, so a non-IT Vercel project must override them (else it fires into IT properties)

**Edge function secrets (Supabase Function secrets — never commit, never put in `.env`)**:
- `SUPABASE_SERVICE_ROLE_KEY` — full DB admin
- `GEMINI_API_KEY` — Google AI
- `BREVO_API_KEY` — transactional email
- `STRIPE_SECRET_KEY`(+`_TEST`), `STRIPE_WEBHOOK_SECRET`(+`_TEST`), `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET`, `STRIPE_PRICE_*`
- PayPal: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `PAYPAL_ENV`
- `META_PIXEL_ID`, `META_CONVERSIONS_API_TOKEN`
- `ADMIN_SECRET` — gates admin bypass endpoints
- **Per-market variants** with `__ES` suffix exist for everything market-specific: `STRIPE_SECRET_KEY__ES`, `STRIPE_WEBHOOK_SECRET__ES`, `STRIPE_SUBSCRIPTION_WEBHOOK_SECRET__ES`, `STRIPE_PRICE_{BASE,PREMIUM,SYNASTRY,SYNASTRY_LAUNCH,TRANSIT_ONE_TIME,TRANSIT_SUBSCRIPTION,ASTRO_PACK}__ES`, `PAYPAL_*__ES`, `BREVO_API_KEY__ES`, `META_PIXEL_ID__ES`, `META_CONVERSIONS_API_TOKEN__ES`.

If a secret is missing, edge functions tend to fail silently — check function logs (MCP `get_logs` or the dashboard) before assuming the code is broken.

## Sensitive areas — read before editing

These are the pieces where a small mistake is expensive (lost payments, leaked PII, runaway LLM cost). Treat them as read-only unless the task is explicitly about them.

1. **`supabase/functions/stripe-webhook/index.ts` + `_shared/stripe-reconcile.ts`** — payment source of truth, idempotency lives here. Test before deploying.
2. **`supabase/functions/generate-report/index.ts`** — the auth block has three modes (user JWT / service role / `x-admin-secret`); easy to widen the bypass accidentally. Also the place LLM cost accumulates.
3. **`supabase/functions/admin-regenerate-report/index.ts`** — bypasses payment check; protected by `ADMIN_SECRET` only.
4. **RLS on `quiz_sessions` and `synastry_sessions`** — **locked down** in [supabase/migrations/20260610120100_lockdown_session_rls.sql](supabase/migrations/20260610120100_lockdown_session_rls.sql): the old broad `USING (true)` SELECT/UPDATE policies were dropped. Sessions are now created via the SECURITY DEFINER RPCs `create_quiz_session` / `create_synastry_session` (explicit column whitelist; `language`/`market` validated against an allowlist inside the function). Don't loosen this; changing these RPCs is auth-adjacent.
5. **Stripe API version** is pinned to `2025-08-27.basil` in the edge functions. Bumping the SDK without updating this string (or vice versa) silently breaks payment verification.
6. **System prompts inside `generate-report` / `_shared/prompts/`** — per-language (it/es); they concatenate user fields (`userName`, `focusArea`, `attachmentResponse`) without sanitization. Be aware when editing.
7. **Race conditions in report generation** — webhook + `/report-processing` polling can both trigger Gemini. The `.is("full_report", null)` guard helps but isn't a true lock.
8. **Funnel idempotency (`/processing`)** — `Processing.tsx` skips creating a new `quiz_sessions` row when `getFunnelStage()` is `'teaser' | 'offer'`, to avoid burning another freeastroapi + Gemini cycle when the user navigates back from `/teaser`. Any flow that legitimately needs a fresh session (e.g. the "I dati non sono giusti?" edit button on the teaser) must call `clearFunnelStorage()` before navigating to `/quiz`. Invariant lives across `Processing.tsx`, `TeaserResult.tsx`, and `QuizContext.tsx`.

### Recurring pitfalls (from past fixes)

- **A report renders in three aligned surfaces.** The on-screen page (`src/pages/Report.tsx`), the shared PDF builder (`_shared/report-pdf.ts`), and the admin download — the builder feeds both `generate-report-pdf` (user) and `admin-download-report` (admin). So: (a) section content/keys are hand-duplicated between the page and the builder (Deno can't import the frontend — `SECTIONS` + `SECTION_FALLBACKS` live in both, now **×2 languages**, edit together); (b) the PDF is cached in the `report-pdfs` bucket keyed by `PDF_VERSION` **and language in the storage path**, so any layout/font/chart/section change must bump `PDF_VERSION` or downloads serve a stale file (admin `?force=1` bypasses). PDF gen is CPU-bound (Edge limit) — hence the cache and CDN-loaded fonts; don't add heavy synchronous work. Coppia/transit mirror this (`synastry-pdf.ts`/`SYNASTRY_PDF_VERSION`, `transit-pdf.ts`/`TRANSIT_PDF_VERSION`).
- **PDF/email brand is per-market.** Download filenames use `brandSlug(getMarket(row.market))` (+ `docNoun(lang,…)` for coppia/transiti); PDF/email logos and links come from the market (`market.siteUrl`, `getEmailTheme(market)`, `decodeLogoPng(market.id)`). Don't hard-code `codiceinteriore.it` or `codice-interiore`.
- **Admin (re)generation must pass `skipEmail: true`** to `generate-report` / `generate-synastry-report`, or the customer gets a spurious report-ready/claim email.
- **Admin email lookups must resolve cross-email** via `_shared/resolve-profile.ts` (`resolveProfileByEmail`) or the `resolve_email_key` RPC — a customer can register with email A and pay with email B (PayPal); never match raw `profiles.email`.

## Auto-generated / vendored — do not hand-edit

- `src/integrations/supabase/types.ts` — regenerated from migrations
- `src/components/ui/*` — shadcn primitives, regenerated by the shadcn CLI
- `package-lock.json` — change only via `npm install`

## Workflow rules

- **Default to small, scoped changes.** Don't bundle refactors with feature work or vice versa.
- **Edit existing files in preference to creating new ones.** Localized copy lives in `src/i18n/{it,es}/` (it = source of the type); add new strings there, never inline a hard-coded string in a component.
- **No new dependencies without approval** — the stack is already chosen; reach for what's installed first.
- **No comments unless the *why* is non-obvious.** Identifiers should explain *what*.
- **Never commit unless the user asks.** When asked, write a real commit message (not "Changes" — recent history has too many of those already). End commit messages with the Co-Authored-By trailer.
- **Never push, force-push, or open PRs without explicit confirmation.**
- **Never run destructive git commands** (`reset --hard`, `clean -f`, `branch -D`, force push) without explicit confirmation.
- **No `--no-verify`, `--no-gpg-sign`, or other hook-bypassing flags.** If a hook fails, fix the cause.
- **For UI changes, actually open the page** in `npm run dev` and verify before claiming it works. If you can't, say so explicitly.
- **Tests**: `npm run test` (vitest). Run it after non-trivial changes. Don't add mocks for Supabase or Stripe in integration tests without discussing — mock/prod divergence is exactly the class of bug that's hard to catch later. Tests are colocated under `src/` as `*.test.ts(x)`/`*.spec.ts(x)`; jsdom, setup at [src/test/setup.ts](src/test/setup.ts).

## What requires approval before touching

Don't modify these without the owner's explicit go-ahead, even if the task seems to require it:

- Anything under `supabase/migrations/` (new migrations OK; editing existing ones is not — they may already be applied in production)
- RLS policies on any table, and the SECURITY DEFINER session RPCs (`create_quiz_session`, `create_synastry_session`)
- `stripe-webhook`, `_shared/stripe-reconcile.ts`, `generate-report`, `admin-regenerate-report`
- The Stripe API version string or any Stripe price IDs (IT defaults hardcoded as `price_1TKeKb…`/`price_1TKeKz…`; ES via `STRIPE_PRICE_*__ES`)
- Anything that reads or writes `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_SECRET`
- Auth flow code (`integrations/supabase/client.ts`, `auth-email-hook`, Supabase Auth config / Google OAuth)
- Anything that changes pricing, tier definitions, or what's included in `base` vs `premium`

When in doubt: explain what you'd change and why, and ask before editing.
