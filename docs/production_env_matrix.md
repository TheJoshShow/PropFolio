# PropFolio — Production Environment Matrix

**Purpose:** Single reference for all environment variables used by the app and backend, and where they must be set for iOS production release.  
**Last updated:** 2026-03-22

---

## 1. Client (expo-app) — EXPO_PUBLIC_* only

All client-visible values **must** use the `EXPO_PUBLIC_` prefix and are bundled into the app. Only public-safe values belong here (URLs, public API keys designed for client use). **Never** put service role keys, webhook secrets, or third-party API secrets in client env.

| Variable | Required for production | Used in | Public-safe? | Notes |
|----------|---------------------------|--------|---------------|--------|
| **EXPO_PUBLIC_SUPABASE_URL** | Yes (for real auth) | supabase.ts, env.ts | Yes | Supabase project URL; anon key is separate. |
| **EXPO_PUBLIC_SUPABASE_ANON_KEY** | Yes (for real auth) | supabase.ts, env.ts | Yes | Anon (public) key only. **Never** service role key. |
| **EXPO_PUBLIC_REVENUECAT_API_KEY_IOS** | Yes (for IAP) | billing.ts | Yes | RevenueCat **public** app-specific key (iOS). From dashboard → API Keys. |
| **EXPO_PUBLIC_PRIVACY_POLICY_URL** | Recommended | legalUrls.ts | Yes | Defaults to https://propfolio.app/privacy if unset. |
| **EXPO_PUBLIC_TERMS_URL** | Recommended | legalUrls.ts | Yes | Defaults to https://propfolio.app/terms if unset. |
| **EXPO_PUBLIC_SUPPORT_URL** | Recommended (App Store) | legalUrls.ts | Yes | Defaults to https://propfolio.app/support if unset. Match App Store Connect. |
| **EXPO_PUBLIC_BILLING_HELP_URL** | Optional | legalUrls.ts | Yes | Empty = no Billing help link; inline copy only. |

**Crash reporting:** Firebase Crashlytics uses **`GoogleService-Info.plist`** (or EAS file env `GOOGLE_SERVICES_INFO_PLIST`), not `EXPO_PUBLIC_*` keys. See **`expo-app/docs/MONITORING_SETUP.md`** and repo root **`FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`**.

**Where to set for iOS release:** EAS/Expo build (e.g. `eas.json` env or EAS Secrets) or `.env` at build time. Do not commit `.env`; use `.env.example` as template.

---

## 2. Backend (Supabase Edge Functions) — never in client

These are set in **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (or equivalent). They must **never** appear in expo-app `.env` or any client bundle.

| Variable | Set by | Used in | Purpose |
|----------|--------|--------|---------|
| **SUPABASE_URL** | Supabase (auto) | All Edge Functions | Project URL; provided at runtime. |
| **SUPABASE_ANON_KEY** | Supabase (auto) | delete-account | Used with request JWT to resolve user; not for privileged DB. |
| **SUPABASE_SERVICE_ROLE_KEY** | Supabase (auto) | delete-account, revenuecat-webhook | Privileged auth (e.g. delete user); DB with RLS bypass. **Never in client.** |
| **GOOGLE_MAPS_API_KEY** | You (Secrets) | geocode-address, places-autocomplete | Geocoding and Places API. |
| **RENTCAST_API_KEY** | You (Secrets) | rent-estimate | Rent estimate API. |
| **OPENAI_API_KEY** | You (Secrets) | openai-summarize | OpenAI API. |
| **CENSUS_API_KEY** | You (Secrets) | census-data | Census / market data API. |
| **REVENUECAT_WEBHOOK_AUTHORIZATION** | You (Secrets) | revenuecat-webhook | Webhook auth header; validate incoming webhooks. |

---

## 3. Not used in client (confirmed)

The following are **only** referenced in docs or `.env.example` as **backend-only**; they are not read by expo-app code:

- GOOGLE_MAPS_API_KEY  
- RENTCAST_API_KEY  
- OPENAI_API_KEY  
- CENSUS_API_KEY  
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET  
- SUPABASE_SERVICE_ROLE_KEY  
- REVENUECAT_WEBHOOK_AUTHORIZATION  

(RevenueCat **public** key is client; RevenueCat **webhook authorization** is server-only.)

---

## 4. .env.example alignment

**expo-app/.env.example** documents: Supabase `EXPO_PUBLIC_*`, commented server-only keys (never commit real values), RevenueCat iOS/Android, legal/support URLs (`EXPO_PUBLIC_PRIVACY_POLICY_URL`, `TERMS`, `SUPPORT`, `BILLING_HELP`), QA diagnostics, Firebase plist notes, and Crashlytics-vs-Sentry clarification.

**Local `expo-app/.env`:** Keep **only** `EXPO_PUBLIC_*` and any **native build** vars (e.g. `IOS_GOOGLE_MAPS_API_KEY`) for Expo. Server API keys (`GOOGLE_MAPS_API_KEY`, `RENTCAST_API_KEY`, `OPENAI_API_KEY`, `CENSUS_API_KEY`) belong in **Supabase → Edge Functions → Secrets** for production; a copy in `.env` does **not** feed Edge Functions and can confuse onboarding—prefer Dashboard secrets as source of truth.

---

*See secret_boundary_audit.md and app_store_release_env_checklist.md.*
