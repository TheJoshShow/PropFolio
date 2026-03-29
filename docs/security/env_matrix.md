# PropFolio — Environment Variable Matrix

Every env var used in the repo, where it is read, and whether it is client-safe.

---

## Legend

| Symbol | Meaning |
|--------|--------|
| **Client** | Read in expo-app (bundled into iOS/client). |
| **Server** | Read in Supabase Edge Functions (Deno.env.get). |
| **Safe for client** | OK to expose in client bundle (public anon key, public API key, DSN, URLs). |
| **Server-only** | Must never be in client env or code; use only in Edge Functions. |

---

## Matrix

| Variable | Where read | Client / Server | Safe for client? | Notes |
|----------|------------|-----------------|-------------------|--------|
| **EXPO_PUBLIC_SUPABASE_URL** | expo-app: supabase.ts, env.ts | Client | ✅ Yes | Supabase project URL. Required for auth/API when set. |
| **EXPO_PUBLIC_SUPABASE_ANON_KEY** | expo-app: supabase.ts, env.ts | Client | ✅ Yes | Anon key only. RLS + auth protect data. Never use service role in client. |
| **EXPO_PUBLIC_REVENUECAT_API_KEY_IOS** | expo-app: billing.ts, revenueCat.ts | Client | ✅ Yes | RevenueCat public app-specific key (iOS). |
| **EXPO_PUBLIC_PRIVACY_POLICY_URL** | expo-app: legalUrls.ts | Client | ✅ Yes | Optional; fallback https://prop-folio.vercel.app/privacy. |
| **EXPO_PUBLIC_TERMS_URL** | expo-app: legalUrls.ts | Client | ✅ Yes | Optional; fallback https://prop-folio.vercel.app/terms. |
| **EXPO_PUBLIC_SUPPORT_URL** | expo-app: legalUrls.ts | Client | ✅ Yes | Optional; fallback https://prop-folio.vercel.app/support. |
| **EXPO_PUBLIC_BILLING_HELP_URL** | expo-app: legalUrls.ts | Client | ✅ Yes | Optional; empty = no link. |
| **SUPABASE_URL** | supabase/functions: delete-account, revenuecat-webhook | Server | ❌ N/A | Injected by Supabase for Edge Functions. |
| **SUPABASE_ANON_KEY** | supabase/functions: delete-account | Server | ❌ N/A | Used with user JWT in delete-account to resolve user. |
| **SUPABASE_SERVICE_ROLE_KEY** | supabase/functions: delete-account, revenuecat-webhook | Server | ❌ **Never** | Admin bypass; must only exist in function env. |
| **REVENUECAT_WEBHOOK_AUTHORIZATION** | supabase/functions: revenuecat-webhook | Server | ❌ **Never** | Webhook auth header; server-only. |
| **GOOGLE_MAPS_API_KEY** | supabase/functions: geocode-address, places-autocomplete | Server | ❌ **Never** | Backend only; set in Supabase Edge Function secrets. |
| **RENTCAST_API_KEY** | supabase/functions: rent-estimate | Server | ❌ **Never** | Backend only. |
| **OPENAI_API_KEY** | supabase/functions: openai-summarize | Server | ❌ **Never** | Backend only. |
| **CENSUS_API_KEY** | supabase/functions: census-data | Server | ❌ **Never** | Backend only. |

---

## Where to set values

| Context | Where to set |
|---------|----------------|
| **Client (expo-app)** | expo-app `.env` (never commit). Use `EXPO_PUBLIC_*` only for URL, anon key, RevenueCat public key, legal URLs. |
| **Edge Functions** | Supabase Dashboard → Project → Edge Functions → Secrets (or CLI). Never put service role or API keys in expo-app `.env`. |

---

## Rules

1. **Never** use `EXPO_PUBLIC_` for service role, webhook secrets, or any backend API key (Google, RentCast, OpenAI, Census).
2. **Never** add `SUPABASE_SERVICE_ROLE_KEY` (or similar) to expo-app `.env` or any client bundle.
3. Client may only use: Supabase URL + anon key, RevenueCat iOS public key, and legal/support URLs (plus any future `EXPO_PUBLIC_*` you add intentionally).
4. All privileged operations (user delete, subscription write, geocode, rent, OpenAI, Census) happen in Edge Functions with server env only.

---

*Update this matrix when adding new env vars or new services.*
