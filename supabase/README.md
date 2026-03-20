# Supabase (backend)

**What belongs here:** Backend schema and serverless functions.

- **migrations/:** SQL migrations (tables, RLS, indexes). Numbered: `00001_description.sql`.
- **functions/:** Edge Functions (e.g. fetch-property, auth webhooks). Deno/TypeScript.
- **config.toml:** Supabase CLI config (if using local dev).

iOS app does not call third-party APIs directly; backend calls them and returns normalized data. See roadmap Phase 7.
