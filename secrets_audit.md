# PropFolio — Secrets & Release-Safety Audit

**Scope:** Full repo (expo-app client, Supabase Edge Functions).  
**Focus:** API keys, tokens, credentials, env usage, client vs server boundary.

---

## Executive summary

- **Client (expo-app):** Uses only **public-safe** values: Supabase URL + anon key, RevenueCat public API key, Sentry DSN, and optional legal/support URLs. No service role, no backend API keys, no test credentials in production paths.
- **Server (Supabase Edge Functions):** All privileged keys (service role, Google, RentCast, OpenAI, Census, RevenueCat webhook secret) are read via `Deno.env.get()` in functions only. Never exposed to the client.
- **Boundary:** Client calls backend only via `supabase.functions.invoke(name, { body })`; no secrets are passed in request body. Session JWT is sent in `Authorization` by Supabase client (by design).
- **Actions taken:** `.env.example` clarified; comments added in client code to enforce “anon only” and “demo user only when unconfigured.”

---

## 1. API keys, tokens, and secrets found

### Client (expo-app) — all public-safe

| Location | What | How used | Safe? |
|----------|------|----------|--------|
| `src/services/supabase.ts` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Create Supabase client (anon only) | ✅ Yes. Anon key is designed for client; RLS and auth enforce security. |
| `src/config/billing.ts` | `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` (and Android) | RevenueCat SDK `configure({ apiKey })` | ✅ Yes. Public app-specific key from RevenueCat; safe for client. |
| `app/_layout.tsx` | `EXPO_PUBLIC_SENTRY_DSN` | Sentry.init() | ✅ Yes. DSN is public; only allows sending events. |
| `src/config/legalUrls.ts` | `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `TERMS_URL`, `BILLING_HELP_URL`, `SUPPORT_URL` | In-app links | ✅ Yes. URLs only; no secrets. |
| `src/contexts/AuthContext.tsx` | `access_token`, `refresh_token` from OAuth callback URL | Parsed from URL fragment; passed to `setSession()` | ✅ Yes. User’s own session tokens; not hardcoded. |
| `src/contexts/AuthContext.tsx` | `DEMO_USER` (`id: 'demo', email: 'demo@propfolio.app'`) | Used only when `getSupabase() === null` (no env) | ✅ Yes. Demo mode only; never used when Supabase env is set. |

### Server (Supabase Edge Functions) — privileged, env-only

| Function | Env vars | Purpose |
|----------|----------|---------|
| `delete-account` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Anon + JWT to resolve user; service role to delete user. |
| `revenuecat-webhook` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REVENUECAT_WEBHOOK_AUTHORIZATION` | Verify webhook; write subscription state. |
| `geocode-address` | `GOOGLE_MAPS_API_KEY` | Google Geocoding API. |
| `places-autocomplete` | `GOOGLE_MAPS_API_KEY` | Google Places API. |
| `rent-estimate` | `RENTCAST_API_KEY` | RentCast API. |
| `openai-summarize` | `OPENAI_API_KEY` | OpenAI API. |
| `census-data` | `CENSUS_API_KEY` | Census API. |

None of these server env vars are read in the client. No `EXPO_PUBLIC_` in `supabase/functions`.

---

## 2. Test credentials and local URLs

- **Test credentials:** No hardcoded test email/password in app code. `DEMO_USER` is a synthetic identity used only when Supabase is not configured (`getSupabase() === null`); with production env set, it is never used.
- **Local URLs:** No `localhost` or `127.0.0.1` in expo-app or supabase function code. Supabase URL comes from env (`EXPO_PUBLIC_SUPABASE_URL` or function env `SUPABASE_URL`).
- **Fallback URLs:** `legalUrls.ts` uses `https://propfolio.app/privacy`, `/terms`, `/support` when env is unset. These are public URLs, not secrets; must be replaced with real URLs for production.

---

## 3. Hardcoded environment assumptions

- **Client:** Assumes Supabase and RevenueCat are optional: if env is missing, app runs in demo mode or with subscriptions disabled. No assumption that a specific backend URL or key is present.
- **Server:** Each function checks for its required env (e.g. `GOOGLE_MAPS_API_KEY`) and returns 503 with a generic message if missing; no key or URL is hardcoded.

---

## 4. Privileged calls

- **User deletion:** Client calls Edge Function `delete-account` with no body; function uses `Authorization: Bearer <user_jwt>`, then service role only on the server to delete the user. ✅
- **Subscription sync:** RevenueCat webhook calls `revenuecat-webhook` with shared secret; function uses `SUPABASE_SERVICE_ROLE_KEY` to update DB. Client never sees webhook secret or service role. ✅
- **Geocode, places, rent, OpenAI, Census:** Client only calls `supabase.functions.invoke('geocode-address', { body })` etc. API keys stay in Edge Function env. ✅

---

## 5. .env and .gitignore

- **expo-app/.env** and **expo-app/.env*.local** are in `expo-app/.gitignore`. Root `.gitignore` includes `.env` and `.env.local`.
- **expo-app/.env.example** documents only variable names and placeholder values; no real secrets. It now explicitly states that server-only secrets must never be in client env.

---

## 6. Release-safety checklist

- [x] No service role or backend API keys in client code or client env.
- [x] No `EXPO_PUBLIC_` usage for server secrets.
- [x] No hardcoded test credentials used when production env is set.
- [x] No localhost/local URLs in production code paths.
- [x] Session tokens only from auth flow (OAuth callback or Supabase auth); not hardcoded.
- [x] Demo user only when Supabase is unconfigured; documented and commented in code.
- [x] Edge Functions use `Deno.env.get()` only; no secrets from request body or client.

---

**Related docs:** `env_matrix.md` (all env vars), `client_vs_server_secret_boundary.md` (boundary rules and diagram).

*Audit date: [DATE]. Re-run when adding new env vars, new services, or new client call paths.*
