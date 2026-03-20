# PropFolio — Client/Server Secret Boundary Audit

**Purpose:** Confirm that only public-safe env values are in the client, no privileged credentials are in app code, and all privileged actions run in Supabase Edge Functions or secure backend.  
**Scope:** expo-app (client), supabase/functions (backend).  
**Last updated:** [DATE]

---

## 1. Executive summary

| Check | Result |
|-------|--------|
| Only public-safe EXPO_PUBLIC_ values in client | **Pass** — All client env reads use EXPO_PUBLIC_*; all are URLs or public API keys (Supabase anon, RevenueCat public, Sentry DSN). |
| No service role or privileged credentials in app code | **Pass** — No SUPABASE_SERVICE_ROLE_KEY, no server API keys (Google, RentCast, OpenAI, Census), no webhook secrets in expo-app. |
| Privileged actions only in Edge Functions / backend | **Pass** — Account deletion and webhook handling use service role only in Edge Functions; third-party API calls occur only in Edge Functions. |
| Production env documented for iOS release | **Pass with gap** — .env.example and this audit document most vars; EXPO_PUBLIC_SUPPORT_URL and EXPO_PUBLIC_BILLING_HELP_URL should be added to .env.example. |

---

## 2. Client (expo-app) — env usage

### 2.1 All process.env / EXPO_PUBLIC_ references

| File | Variable(s) | Purpose |
|------|-------------|---------|
| **src/services/supabase.ts** | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY | Create Supabase client with **anon key only**. Comment in file: "Never use the service role key in the client." |
| **src/config/env.ts** | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY | Validation; same anon-only rule. |
| **src/config/legalUrls.ts** | EXPO_PUBLIC_PRIVACY_POLICY_URL, EXPO_PUBLIC_TERMS_URL, EXPO_PUBLIC_BILLING_HELP_URL, EXPO_PUBLIC_SUPPORT_URL | URLs for legal and support links; all public. |
| **src/config/billing.ts** | EXPO_PUBLIC_REVENUECAT_API_KEY_IOS (and ANDROID name for reference) | RevenueCat **public** app-specific key; designed for client. |
| **app/_layout.tsx** | EXPO_PUBLIC_SENTRY_DSN | Sentry DSN; public endpoint, no secrets. |

**Conclusion:** Every client env read is EXPO_PUBLIC_* and is either a URL or a public/key client-safe identifier. No service role key, no server API keys, no webhook or auth secrets.

### 2.2 Supabase client — anon only

- **supabase.ts** builds the client with `createClient(url, anonKey, ...)`. The anon key is the standard public key that respects RLS; it does not bypass RLS.
- **env.ts** validates only URL and anon key and states: "Service role must never be in client env."
- **No** reference to `SUPABASE_SERVICE_ROLE_KEY` or `service_role` anywhere in expo-app.

---

## 3. Privileged operations — backend only

### 3.1 Account deletion (delete-account Edge Function)

- **Location:** supabase/functions/delete-account/index.ts  
- **Flow:** Request includes `Authorization: Bearer <session_jwt>`. Function uses anon client with that JWT to resolve the user, then uses **SUPABASE_SERVICE_ROLE_KEY** to create an admin client and call `supabaseAdmin.auth.admin.deleteUser(userId)`.  
- **Conclusion:** Deleting auth users requires admin API; that is correctly done only in the Edge Function with the service role key from Deno.env (Supabase-provided), not in the client.

### 3.2 RevenueCat webhook (revenuecat-webhook Edge Function)

- **Location:** supabase/functions/revenuecat-webhook/index.ts  
- **Secrets:** REVENUECAT_WEBHOOK_AUTHORIZATION (validates request), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (to update subscription_status or related tables).  
- **Conclusion:** Webhook secret and service role stay in Edge Function env only; client never sees them.

### 3.3 Third-party API keys (Google, RentCast, OpenAI, Census)

- **Client:** Does not call these APIs directly. Client calls only `supabase.functions.invoke(<name>, { body })` for: geocode-address, places-autocomplete, rent-estimate, openai-summarize, census-data, delete-account.  
- **Edge Functions:** Each function uses `Deno.env.get("...")` for the relevant key (GOOGLE_MAPS_API_KEY, RENTCAST_API_KEY, OPENAI_API_KEY, CENSUS_API_KEY).  
- **Conclusion:** All third-party API keys are used only in Edge Functions; client never has access.

---

## 4. Data flow (no secrets to client)

```
Client (expo-app)
  ├── EXPO_PUBLIC_SUPABASE_* → Supabase client (anon) → auth, RPC, functions.invoke
  ├── EXPO_PUBLIC_REVENUECAT_* → RevenueCat SDK (public key only)
  ├── EXPO_PUBLIC_*_URL / EXPO_PUBLIC_SENTRY_DSN → links and error reporting
  └── supabase.functions.invoke('delete-account', …) → sends session JWT only; server uses service role

Edge Functions (Supabase)
  ├── SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or ANON where appropriate) → from Deno.env
  ├── GOOGLE_MAPS_API_KEY, RENTCAST_API_KEY, OPENAI_API_KEY, CENSUS_API_KEY → from Secrets
  └── REVENUECAT_WEBHOOK_AUTHORIZATION → from Secrets
```

No server secrets are passed to or embedded in the client.

---

## 5. .env.example and repo safety

- **.env.example** states at the top: only EXPO_PUBLIC_* in this file; never server-only secrets; server secrets go in Supabase Dashboard → Edge Functions → Secrets.  
- **.env** is expected to be gitignored; no check of actual .env content was performed (do not commit .env).  
- **Recommendation:** Add EXPO_PUBLIC_SUPPORT_URL and EXPO_PUBLIC_BILLING_HELP_URL to .env.example so production env is fully documented.

---

## 6. Findings summary

| Finding | Severity | Action |
|---------|----------|--------|
| Client uses only EXPO_PUBLIC_* and public-safe values | — | None; boundary is correct. |
| No service role or server API keys in client | — | None; boundary is correct. |
| Privileged actions only in Edge Functions | — | None; design is correct. |
| EXPO_PUBLIC_SUPPORT_URL / BILLING_HELP_URL not in .env.example | Low | Add to .env.example and production_env_matrix.md (done in matrix). |

---

*See production_env_matrix.md and app_store_release_env_checklist.md.*
