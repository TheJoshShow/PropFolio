# PropFolio — Production Environment Matrix

**Purpose:** Single reference for all environment variables used by the app and backend, and where they must be set for iOS production release.  
**Last updated:** [DATE]

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
| **EXPO_PUBLIC_SENTRY_DSN** | Optional | app/_layout.tsx | Yes | Sentry DSN is public; no secrets. Empty = Sentry disabled. |
| **EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID** | No (iOS-only app) | billing.ts (reference) | Yes | Reserved for future; not used in iOS build. |

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

**Current .env.example** includes: SUPABASE_URL/ANON, PRIVACY/TERMS, Sentry, RevenueCat iOS/Android, and comments that server-only secrets go in Supabase Secrets.

**Gap:** EXPO_PUBLIC_SUPPORT_URL and EXPO_PUBLIC_BILLING_HELP_URL are used by the app (legalUrls.ts) but not listed in .env.example. **Recommendation:** Add to .env.example:

```bash
# Support (optional). App Store Connect Support URL should match.
# EXPO_PUBLIC_SUPPORT_URL=https://propfolio.app/support
# EXPO_PUBLIC_BILLING_HELP_URL=https://yoursite.com/billing-help
```

---

*See secret_boundary_audit.md and app_store_release_env_checklist.md.*
