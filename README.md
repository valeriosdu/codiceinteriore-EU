# Codice Interiore

Lettura del Tema Natale personalizzata, in italiano — quiz, report AI, sinastria di coppia e abbonamento transiti.

SPA React 18 + TypeScript (Vite), backend su Supabase (Postgres, Auth, Edge Functions), pagamenti Stripe/PayPal, email transazionali via Brevo, AI via Google Gemini. Deploy frontend su Vercel.

## Sviluppo

```bash
npm install
npm run dev        # http://localhost:8080
npm run build      # build di produzione (dist/)
npm run lint
npm run test       # vitest
```

Variabili d'ambiente frontend (`.env`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Le edge functions girano sul progetto Supabase deployato (nessun emulatore locale): `npx supabase functions deploy <name>`.

Per la guida completa ad architettura, layout del repo, aree sensibili e regole di lavoro vedi [CLAUDE.md](CLAUDE.md).
