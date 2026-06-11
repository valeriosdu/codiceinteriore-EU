# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React TypeScript app with Supabase back-end code. Front-end source lives in `src/`: pages in `src/pages`, shared components in `src/components`, shadcn/Radix UI primitives in `src/components/ui`, hooks in `src/hooks`, utilities in `src/lib`, integrations in `src/integrations`, and assets in `src/assets`. Public static files are in `public/`.

Supabase code is under `supabase/`: migrations in `supabase/migrations`, edge functions in `supabase/functions`, and shared helpers/templates in `supabase/functions/_shared`. Tests are colocated under `src` and currently use `src/test` for setup and examples.

## Build, Test, and Development Commands

- `npm run dev`: start the local Vite development server.
- `npm run build`: create a production build in `dist`.
- `npm run build:dev`: build with Vite development mode.
- `npm run preview`: preview the built app locally.
- `npm run lint`: run ESLint over the repository.
- `npm run test`: run the Vitest suite once.
- `npm run test:watch`: run Vitest in watch mode.

## Coding Style & Naming Conventions

Use TypeScript and React function components. Keep component files in PascalCase, such as `Header.tsx`, hooks in camelCase beginning with `use`, such as `useAuthReady.ts`, and utility modules in camelCase or kebab-case following nearby files. Prefer the `@/` alias for imports from `src`.

Follow existing formatting: two-space indentation, double quotes, semicolons, and Tailwind utility classes. ESLint uses `@eslint/js`, `typescript-eslint`, `react-hooks`, and `react-refresh`; `@typescript-eslint/no-unused-vars` is disabled, so remove dead code manually.

## Testing Guidelines

Vitest runs in `jsdom` with global test APIs and setup from `src/test/setup.ts`. Name tests `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` under `src`. Prefer focused tests for user-visible behavior, hooks, utilities, and regressions around checkout, reports, routing, and Supabase integrations. Run `npm run test` and `npm run lint` before submitting changes.

## Commit & Pull Request Guidelines

Recent history uses short, descriptive commit subjects, for example `logo on pdfs` and `Fixed transits addon detection`. Keep commits scoped to one change and avoid mixing formatting with behavior changes.

Pull requests should include a brief description, testing performed, linked issue or task when available, and screenshots or recordings for UI changes. Call out any Supabase migrations, edge-function changes, new environment variables, or payment/email workflow impact.

## Security & Configuration Tips

Do not commit real secrets. Keep local values in `.env` and document required keys separately. Treat `supabase/functions`, Stripe/PayPal paths, email hooks, and analytics conversions as sensitive areas; verify webhook behavior and idempotency when editing them.
